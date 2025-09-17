import { messageRepository } from '@/lib/database/repositories/MessageRepository';
import { userRepository } from '@/lib/database/repositories/UserRepository';
import {
  AppError,
  ResourceNotFoundError,
  ValidationError,
} from '@/lib/errors/AppError';
import type { PaginatedResponse, PaginationParams } from '@/types/api';
import type {
  CreateMessageData,
  MessageFilter,
  MessageWithUsers,
} from '@/types/database';

export class MessageService {
  // Envoyer un nouveau message
  async sendMessage(
    senderId: string,
    receiverEmail: string,
    content: string
  ): Promise<MessageWithUsers> {
    // Valider le contenu
    this.validateMessageContent(content);

    // Trouver le destinataire par email
    const receiver = await userRepository.findByEmail(receiverEmail);
    if (!receiver) {
      throw new ResourceNotFoundError('Utilisateur', receiverEmail);
    }

    // Vérifier que l'utilisateur n'envoie pas un message à lui-même
    if (senderId === receiver.id) {
      throw new ValidationError(
        'Vous ne pouvez pas vous envoyer un message à vous-même',
        {
          receiver: "Le destinataire ne peut pas être l'expéditeur",
        }
      );
    }

    // Créer le message
    const messageData: CreateMessageData = {
      senderId,
      receiverId: receiver.id,
      content: content.trim(),
    };

    return await messageRepository.create(messageData, {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      receiver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    });
  }

  // Obtenir les messages reçus par un utilisateur
  async getReceivedMessages(
    userId: string,
    pagination: PaginationParams,
    includeRead: boolean = true
  ): Promise<PaginatedResponse<MessageWithUsers>> {
    return await messageRepository.getReceivedMessages(
      userId,
      pagination,
      includeRead
    );
  }

  // Obtenir les messages envoyés par un utilisateur
  async getSentMessages(
    userId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<MessageWithUsers>> {
    return await messageRepository.getSentMessages(userId, pagination);
  }

  // Obtenir un message spécifique avec vérification des permissions
  async getMessageById(
    messageId: string,
    userId: string
  ): Promise<MessageWithUsers> {
    const message = await messageRepository.getMessageForUser(
      messageId,
      userId
    );

    // Si l'utilisateur est le destinataire et que le message n'est pas lu, le marquer comme lu
    if (message.receiverId === userId && !message.isRead) {
      return await this.markMessageAsRead(messageId, userId);
    }

    return message;
  }

  // Marquer un message comme lu
  async markMessageAsRead(
    messageId: string,
    userId: string
  ): Promise<MessageWithUsers> {
    try {
      return await messageRepository.markAsRead(messageId, userId);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Message non trouvé')
      ) {
        throw new ResourceNotFoundError('Message', messageId);
      }
      if (error instanceof Error && error.message.includes('destinataire')) {
        throw new AppError(
          "Vous n'êtes pas autorisé à marquer ce message comme lu",
          403
        );
      }
      throw error;
    }
  }

  // Compter les messages non lus pour un utilisateur
  async getUnreadCount(userId: string): Promise<number> {
    return await messageRepository.countUnreadForUser(userId);
  }

  // Marquer tous les messages d'un utilisateur comme lus
  async markAllAsRead(userId: string): Promise<number> {
    return await messageRepository.markAllAsReadForUser(userId);
  }

  // Obtenir une conversation entre deux utilisateurs
  async getConversation(
    currentUserId: string,
    otherUserEmail: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<MessageWithUsers>> {
    // Trouver l'autre utilisateur
    const otherUser = await userRepository.findByEmail(otherUserEmail);
    if (!otherUser) {
      throw new ResourceNotFoundError('Utilisateur', otherUserEmail);
    }

    return await messageRepository.getConversation(
      currentUserId,
      otherUser.id,
      pagination
    );
  }

  // Rechercher des messages
  async searchMessages(
    filter: MessageFilter,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<MessageWithUsers>> {
    return await messageRepository.search(filter, pagination);
  }

  // Supprimer un message (seulement par l'expéditeur)
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await messageRepository.findByIdOrNull(messageId);

    if (!message) {
      throw new ResourceNotFoundError('Message', messageId);
    }

    // Seul l'expéditeur peut supprimer un message
    if (message.senderId !== userId) {
      throw new AppError(
        'Vous ne pouvez supprimer que vos propres messages',
        403
      );
    }

    await messageRepository.deleteById(messageId);
  }

  // Supprimer une conversation entière
  async deleteConversation(
    currentUserId: string,
    otherUserEmail: string
  ): Promise<number> {
    const otherUser = await userRepository.findByEmail(otherUserEmail);
    if (!otherUser) {
      throw new ResourceNotFoundError('Utilisateur', otherUserEmail);
    }

    return await messageRepository.deleteConversation(
      currentUserId,
      otherUser.id
    );
  }

  // Obtenir les statistiques des messages pour un utilisateur
  async getMessageStats(userId: string) {
    const [receivedCount, sentCount, unreadCount] = await Promise.all([
      messageRepository.count({ receiverId: userId }),
      messageRepository.count({ senderId: userId }),
      messageRepository.countUnreadForUser(userId),
    ]);

    return {
      receivedCount,
      sentCount,
      unreadCount,
      totalCount: receivedCount + sentCount,
    };
  }

  // Validation privée du contenu du message
  private validateMessageContent(content: string): void {
    const errors: Record<string, string> = {};

    if (!content || content.trim().length === 0) {
      errors.content = 'Le contenu du message ne peut pas être vide';
    } else if (content.trim().length > 1000) {
      errors.content = 'Le message ne peut pas dépasser 1000 caractères';
    } else if (content.trim().length < 1) {
      errors.content = 'Le message doit contenir au moins 1 caractère';
    }

    // Vérifier les caractères interdits ou spam
    if (content.trim().length > 0) {
      const suspiciousPatterns = [
        /(.)\1{10,}/g, // Caractère répété plus de 10 fois
        /(https?:\/\/[^\s]+){5,}/g, // Plus de 5 liens
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(content)) {
          errors.content = 'Le message contient du contenu suspect';
          break;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Contenu du message invalide', errors);
    }
  }
}

// Export singleton instance
export const messageService = new MessageService();
