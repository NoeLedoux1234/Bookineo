import type { Prisma } from '@/generated/prisma';
import type {
  CreateMessageData,
  MessageFilter,
  MessageWithUsers,
  UpdateMessageData,
} from '@/types/database';
import { BaseRepository } from '../BaseRepository';

const MESSAGE_INCLUDES = {
  basic: {
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
  },
  senderOnly: {
    sender: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    },
  },
  receiverOnly: {
    receiver: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    },
  },
} as const;

export class MessageRepository extends BaseRepository<
  MessageWithUsers,
  CreateMessageData,
  UpdateMessageData,
  Prisma.MessageWhereInput,
  (typeof MESSAGE_INCLUDES)[keyof typeof MESSAGE_INCLUDES]
> {
  protected readonly modelName = 'Message';
  protected readonly model = this.prisma.message;

  // Récupérer les messages reçus par un utilisateur
  async getReceivedMessages(
    userId: string,
    pagination?: any,
    includeRead: boolean = true
  ) {
    const where: Prisma.MessageWhereInput = {
      receiverId: userId,
    };

    if (!includeRead) {
      where.isRead = false;
    }

    return await this.findMany(
      where,
      MESSAGE_INCLUDES.senderOnly,
      { createdAt: 'desc' },
      pagination
    );
  }

  // Récupérer les messages envoyés par un utilisateur
  async getSentMessages(userId: string, pagination?: any) {
    return await this.findMany(
      { senderId: userId },
      MESSAGE_INCLUDES.receiverOnly,
      { createdAt: 'desc' },
      pagination
    );
  }

  // Récupérer un message avec vérification des permissions
  async getMessageForUser(
    messageId: string,
    userId: string
  ): Promise<MessageWithUsers> {
    const message = await this.model.findFirst({
      where: {
        id: messageId,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: MESSAGE_INCLUDES.basic,
    });

    if (!message) {
      throw new Error('Message non trouvé ou accès non autorisé');
    }

    return message;
  }

  // Marquer un message comme lu
  async markAsRead(
    messageId: string,
    userId: string
  ): Promise<MessageWithUsers> {
    // Vérifier que l'utilisateur est bien le destinataire
    const message = await this.model.findFirst({
      where: {
        id: messageId,
        receiverId: userId,
      },
    });

    if (!message) {
      throw new Error("Message non trouvé ou vous n'êtes pas le destinataire");
    }

    if (message.isRead) {
      // Déjà lu, retourner le message avec les relations
      return await this.findById(messageId, MESSAGE_INCLUDES.basic);
    }

    return await this.updateById(
      messageId,
      { isRead: true },
      MESSAGE_INCLUDES.basic
    );
  }

  // Compter les messages non lus pour un utilisateur
  async countUnreadForUser(userId: string): Promise<number> {
    return await this.count({
      receiverId: userId,
      isRead: false,
    });
  }

  // Recherche de messages avec filtres
  async search(filter: MessageFilter, pagination?: any) {
    const where: Prisma.MessageWhereInput = {};

    if (filter.senderId) {
      where.senderId = filter.senderId;
    }

    if (filter.receiverId) {
      where.receiverId = filter.receiverId;
    }

    if (filter.isRead !== undefined) {
      where.isRead = filter.isRead;
    }

    if (filter.content) {
      where.content = {
        contains: filter.content,
        mode: 'insensitive',
      };
    }

    return await this.findMany(
      where,
      MESSAGE_INCLUDES.basic,
      { createdAt: 'desc' },
      pagination
    );
  }

  // Conversation entre deux utilisateurs
  async getConversation(user1Id: string, user2Id: string, pagination?: any) {
    const where: Prisma.MessageWhereInput = {
      OR: [
        { senderId: user1Id, receiverId: user2Id },
        { senderId: user2Id, receiverId: user1Id },
      ],
    };

    return await this.findMany(
      where,
      MESSAGE_INCLUDES.basic,
      { createdAt: 'asc' },
      pagination
    );
  }

  // Supprimer les messages d'une conversation
  async deleteConversation(user1Id: string, user2Id: string): Promise<number> {
    const result = await this.model.deleteMany({
      where: {
        OR: [
          { senderId: user1Id, receiverId: user2Id },
          { senderId: user2Id, receiverId: user1Id },
        ],
      },
    });

    return result.count;
  }

  // Marquer tous les messages d'un utilisateur comme lus
  async markAllAsReadForUser(userId: string): Promise<number> {
    const result = await this.model.updateMany({
      where: {
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return result.count;
  }
}

export const messageRepository = new MessageRepository();
