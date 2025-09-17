import { AppError } from '@/lib/errors/AppError';
import { messageService } from '@/services/MessageService';
import type { MessageFilter } from '@/types/database';
import { NextRequest } from 'next/server';
import { BaseController } from './BaseController';

export class MessageController extends BaseController {
  // Obtenir les messages reçus
  async getReceivedMessages(request: NextRequest) {
    return this.handleAuthenticatedRequest(request, async (authContext) => {
      const pagination = this.getPaginationParams(request);
      const { searchParams } = new URL(request.url);

      const includeRead = searchParams.get('includeRead') !== 'false';

      const result = await messageService.getReceivedMessages(
        authContext.user.id,
        pagination,
        includeRead
      );

      // Formater les messages pour l'affichage
      const formattedMessages = result.items.map((message) => ({
        id: message.id,
        sender: {
          id: message.sender!.id,
          name:
            message.sender!.firstName && message.sender!.lastName
              ? `${message.sender!.firstName} ${message.sender!.lastName}`
              : message.sender!.email,
          email: message.sender!.email,
        },
        subject:
          message.content.substring(0, 50) +
          (message.content.length > 50 ? '...' : ''),
        preview:
          message.content.substring(0, 100) +
          (message.content.length > 100 ? '...' : ''),
        isRead: message.isRead,
        sentAt: message.createdAt,
      }));

      return {
        success: true,
        messages: formattedMessages,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        message: 'Messages récupérés avec succès',
      };
    });
  }

  // Obtenir les messages envoyés
  async getSentMessages(request: NextRequest) {
    return this.handleAuthenticatedRequest(request, async (authContext) => {
      const pagination = this.getPaginationParams(request);

      const result = await messageService.getSentMessages(
        authContext.user.id,
        pagination
      );

      return {
        success: true,
        data: result,
        message: 'Messages envoyés récupérés avec succès',
      };
    });
  }

  // Obtenir un message spécifique
  async getMessageById(request: NextRequest, params: { id: string }) {
    return this.handleAuthenticatedRequest(request, async (authContext) => {
      const messageId = this.extractId(params);

      const message = await messageService.getMessageById(
        messageId,
        authContext.user.id
      );

      // Formater le message pour l'affichage
      const formattedMessage = {
        id: message.id,
        content: message.content,
        sender: {
          id: message.sender!.id,
          name:
            message.sender!.firstName && message.sender!.lastName
              ? `${message.sender!.firstName} ${message.sender!.lastName}`
              : message.sender!.email,
          email: message.sender!.email,
        },
        isRead: message.isRead,
        sentAt: message.createdAt,
      };

      return {
        success: true,
        message: formattedMessage,
        messageText: 'Message récupéré avec succès',
      };
    });
  }

  // Envoyer un nouveau message
  async sendMessage(request: NextRequest) {
    return this.handleAuthenticatedRequest(request, async (authContext) => {
      const { receiverEmail, content } = await this.parseRequestBody<{
        receiverEmail: string;
        content: string;
      }>(request);

      if (!receiverEmail || !content) {
        throw AppError.badRequest('Email du destinataire et contenu requis');
      }

      const message = await messageService.sendMessage(
        authContext.user.id,
        receiverEmail,
        content
      );

      return {
        success: true,
        data: {
          id: message.id,
          content: message.content,
          sentAt: message.createdAt,
          receiver: {
            id: message.receiver!.id,
            name:
              message.receiver!.firstName && message.receiver!.lastName
                ? `${message.receiver!.firstName} ${message.receiver!.lastName}`
                : message.receiver!.email,
          },
        },
        message: 'Message envoyé avec succès',
      };
    });
  }

  // Marquer un message comme lu
  async markMessageAsRead(request: NextRequest, params: { id: string }) {
    return this.handleAuthenticatedRequest(request, async (authContext) => {
      const messageId = this.extractId(params);

      const message = await messageService.markMessageAsRead(
        messageId,
        authContext.user.id
      );

      return {
        success: true,
        data: message,
        message: 'Message marqué comme lu',
      };
    });
  }

  // Obtenir le nombre de messages non lus
  async getUnreadCount(request: NextRequest) {
    return this.handleAuthenticatedRequest(request, async (authContext) => {
      const count = await messageService.getUnreadCount(authContext.user.id);

      return {
        success: true,
        count: count,
        message: 'Compteur récupéré avec succès',
      };
    });
  }

  // Marquer tous les messages comme lus
  async markAllAsRead(request: NextRequest) {
    return this.handleAuthenticatedRequest(request, async (authContext) => {
      const count = await messageService.markAllAsRead(authContext.user.id);

      return {
        success: true,
        data: { markedCount: count },
        message: `${count} message(s) marqué(s) comme lu(s)`,
      };
    });
  }

  // Obtenir une conversation avec un autre utilisateur
  async getConversation(request: NextRequest) {
    return this.handleAuthenticatedRequest(request, async (authContext) => {
      const pagination = this.getPaginationParams(request);
      const { searchParams } = new URL(request.url);
      const otherUserEmail = searchParams.get('with');

      if (!otherUserEmail) {
        throw AppError.badRequest("Email de l'autre utilisateur requis");
      }

      const result = await messageService.getConversation(
        authContext.user.id,
        otherUserEmail,
        pagination
      );

      return {
        success: true,
        data: result,
        message: 'Conversation récupérée avec succès',
      };
    });
  }

  // Rechercher des messages
  async searchMessages(request: NextRequest) {
    return this.handleAuthenticatedRequest(request, async (authContext) => {
      const pagination = this.getPaginationParams(request);
      const { searchParams } = new URL(request.url);

      const filter: MessageFilter = {
        content: searchParams.get('content') || undefined,
        isRead: searchParams.get('isRead')
          ? searchParams.get('isRead') === 'true'
          : undefined,
      };

      // Filtrer seulement les messages de l'utilisateur actuel
      filter.receiverId = authContext.user.id;

      const result = await messageService.searchMessages(filter, pagination);

      return {
        success: true,
        data: result,
        message: 'Recherche effectuée avec succès',
      };
    });
  }

  // Supprimer un message
  async deleteMessage(request: NextRequest, params: { id: string }) {
    return this.handleAuthenticatedRequest(request, async (authContext) => {
      const messageId = this.extractId(params);

      await messageService.deleteMessage(messageId, authContext.user.id);

      return {
        success: true,
        message: 'Message supprimé avec succès',
      };
    });
  }

  // Supprimer une conversation
  async deleteConversation(request: NextRequest) {
    return this.handleAuthenticatedRequest(request, async (authContext) => {
      const { otherUserEmail } = await this.parseRequestBody<{
        otherUserEmail: string;
      }>(request);

      if (!otherUserEmail) {
        throw AppError.badRequest("Email de l'autre utilisateur requis");
      }

      const deletedCount = await messageService.deleteConversation(
        authContext.user.id,
        otherUserEmail
      );

      return {
        success: true,
        data: { deletedCount },
        message: `${deletedCount} message(s) supprimé(s) de la conversation`,
      };
    });
  }

  // Obtenir les statistiques des messages
  async getMessageStats(request: NextRequest) {
    return this.handleAuthenticatedRequest(request, async (authContext) => {
      const stats = await messageService.getMessageStats(authContext.user.id);

      return {
        success: true,
        data: stats,
        message: 'Statistiques récupérées avec succès',
      };
    });
  }
}

// Export singleton instance
export const messageController = new MessageController();
