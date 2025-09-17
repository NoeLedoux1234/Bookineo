import type { Prisma } from '@/generated/prisma';
import type {
  CreateUserData,
  UpdateUserData,
  UserFilter,
  UserWithRelations,
} from '@/types/database';
import { DuplicateResourceError } from '../../errors/AppError';
import { BaseRepository } from '../BaseRepository';

// Include options pour User
const USER_INCLUDES = {
  basic: undefined,
  withBooks: {
    ownedBooks: {
      select: {
        id: true,
        title: true,
        author: true,
        status: true,
      },
    },
  },
  withMessages: {
    sentMessages: {
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    },
    receivedMessages: {
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        isRead: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    },
  },
  full: {
    ownedBooks: true,
    rentals: {
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
          },
        },
      },
    },
    sentMessages: {
      include: {
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    },
    receivedMessages: {
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    },
  },
} as const;

export class UserRepository extends BaseRepository<
  UserWithRelations,
  CreateUserData,
  UpdateUserData,
  Prisma.UserWhereInput,
  (typeof USER_INCLUDES)[keyof typeof USER_INCLUDES]
> {
  protected readonly modelName = 'Utilisateur';
  protected readonly model = this.prisma.user;

  // Trouver par email
  async findByEmail(email: string): Promise<UserWithRelations | null> {
    return await this.model.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  // Créer un utilisateur avec vérification d'unicité
  async create(data: CreateUserData): Promise<UserWithRelations> {
    // Vérifier si l'email existe déjà
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new DuplicateResourceError('Utilisateur', 'email', data.email);
    }

    return await super.create({
      ...data,
      email: data.email.toLowerCase(),
    });
  }

  // Mettre à jour avec vérification d'email unique
  async updateById(
    id: string,
    data: UpdateUserData
  ): Promise<UserWithRelations> {
    if (data.email) {
      const existingUser = await this.findByEmail(data.email);
      if (existingUser && existingUser.id !== id) {
        throw new DuplicateResourceError('Utilisateur', 'email', data.email);
      }
      data.email = data.email.toLowerCase();
    }

    return await super.updateById(id, data);
  }

  // Recherche avec filtres
  async search(filter: UserFilter, pagination?: any) {
    const where: Prisma.UserWhereInput = {};

    if (filter.email) {
      where.email = {
        contains: filter.email.toLowerCase(),
        mode: 'insensitive',
      };
    }

    if (filter.firstName) {
      where.firstName = {
        contains: filter.firstName,
        mode: 'insensitive',
      };
    }

    if (filter.lastName) {
      where.lastName = {
        contains: filter.lastName,
        mode: 'insensitive',
      };
    }

    if (filter.createdAt) {
      where.createdAt = {};
      if (filter.createdAt.from) {
        where.createdAt.gte = filter.createdAt.from;
      }
      if (filter.createdAt.to) {
        where.createdAt.lte = filter.createdAt.to;
      }
    }

    return await this.findMany(
      where,
      USER_INCLUDES.basic,
      { createdAt: 'desc' },
      pagination
    );
  }

  // Compter les messages non lus pour un utilisateur
  async getUnreadMessageCount(userId: string): Promise<number> {
    return await this.prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });
  }

  // Obtenir les statistiques utilisateur
  async getUserStats(userId: string) {
    const [ownedBooksCount, activeRentalsCount, unreadMessagesCount] =
      await Promise.all([
        this.prisma.book.count({ where: { ownerId: userId } }),
        this.prisma.rental.count({
          where: {
            renterId: userId,
            status: 'ACTIVE',
          },
        }),
        this.getUnreadMessageCount(userId),
      ]);

    return {
      ownedBooksCount,
      activeRentalsCount,
      unreadMessagesCount,
    };
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
