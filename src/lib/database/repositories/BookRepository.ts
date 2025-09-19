import type { Book, BookStatus, Prisma } from '@/generated/prisma';
import type { PaginatedResponse, PaginationParams } from '@/types/api';
import { BaseRepository } from '../BaseRepository';

export interface BookFilter {
  search?: string;
  status?: BookStatus;
  category?: string;
  author?: string;
  priceMin?: number;
  priceMax?: number;
  year?: number;
  hasOwner?: boolean;
  ownerId?: string;
}

export interface BookWithOwner extends Book {
  owner: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

export interface BookWithDetails extends BookWithOwner {
  rentals: {
    id: string;
    startDate: Date;
    endDate: Date;
    returnDate: Date | null;
    duration: number;
    status: string;
    renter: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  }[];
}

export class BookRepository extends BaseRepository<
  Book,
  Prisma.BookCreateInput,
  Prisma.BookUpdateInput,
  Prisma.BookWhereInput,
  Prisma.BookInclude
> {
  protected readonly modelName = 'Book';
  protected readonly model = this.prisma.book;

  /**
   * Recherche et filtre les livres avec pagination
   */
  async findBooksWithFilters(
    filters: BookFilter = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<BookWithOwner>> {
    const page = pagination.page || 1;
    const limit = Math.min(pagination.limit || 20, 100);
    const skip = (page - 1) * limit;

    // Construction de la clause WHERE
    const where: Prisma.BookWhereInput = {
      AND: [
        // Recherche textuelle
        filters.search
          ? {
              OR: [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { author: { contains: filters.search, mode: 'insensitive' } },
                // Note: description field doesn't exist in current schema
              ],
            }
          : {},

        // Filtres spécifiques
        filters.status ? { status: filters.status } : {},
        filters.category
          ? {
              categoryName: { contains: filters.category, mode: 'insensitive' },
            }
          : {},
        filters.author
          ? { author: { contains: filters.author, mode: 'insensitive' } }
          : {},
        // Note: year field doesn't exist in current schema
        filters.hasOwner !== undefined
          ? filters.hasOwner
            ? { ownerId: { not: null } }
            : { ownerId: null }
          : {},
        filters.ownerId ? { ownerId: filters.ownerId } : {},

        // Filtres de prix
        filters.priceMin ? { price: { gte: filters.priceMin } } : {},
        filters.priceMax ? { price: { lte: filters.priceMax } } : {},
      ],
    };

    // Tri
    const orderBy: Prisma.BookOrderByWithRelationInput = pagination.sortBy
      ? { [pagination.sortBy]: pagination.sortOrder || 'asc' }
      : { updatedAt: 'desc' };

    // Compter le total
    const total = await this.model.count({ where });

    // Récupérer les données
    const items = (await this.model.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })) as BookWithOwner[];

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Récupère un livre avec tous ses détails et historique des locations
   */
  async findBookWithDetails(id: string): Promise<BookWithDetails | null> {
    return (await this.model.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        rentals: {
          include: {
            renter: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { startDate: 'desc' },
        },
      },
    })) as BookWithDetails | null;
  }

  /**
   * Récupère toutes les catégories uniques
   */
  async getUniqueCategories(): Promise<string[]> {
    const categories = await this.model.findMany({
      select: { categoryName: true },
      distinct: ['categoryName'],
      orderBy: { categoryName: 'asc' },
    });

    return categories
      .map((cat) => cat.categoryName)
      .filter((name): name is string => Boolean(name));
  }

  /**
   * Recherche d'auteurs avec autocomplétion
   */
  async searchAuthors(query: string, limit: number = 10): Promise<string[]> {
    const authors = await this.model.findMany({
      where: {
        author: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: { author: true },
      distinct: ['author'],
      take: limit,
      orderBy: { author: 'asc' },
    });

    return authors.map((author) => author.author);
  }

  /**
   * Statistiques générales des livres
   */
  async getBookStats(): Promise<{
    total: number;
    available: number;
    rented: number;
    withOwner: number;
    withoutOwner: number;
    categoriesCount: number;
    authorsCount: number;
  }> {
    const [
      total,
      available,
      rented,
      withOwner,
      withoutOwner,
      categoriesCount,
      authorsCount,
    ] = await Promise.all([
      this.model.count(),
      this.model.count({ where: { status: 'AVAILABLE' } }),
      this.model.count({ where: { status: 'RENTED' } }),
      this.model.count({ where: { ownerId: { not: null } } }),
      this.model.count({ where: { ownerId: null } }),
      this.model
        .groupBy({ by: ['categoryName'], _count: true })
        .then((results) => results.length),
      this.model
        .groupBy({ by: ['author'], _count: true })
        .then((results) => results.length),
    ]);

    return {
      total,
      available,
      rented,
      withOwner,
      withoutOwner,
      categoriesCount,
      authorsCount,
    };
  }

  /**
   * Export des livres pour CSV
   */
  async exportBooks(filters: BookFilter = {}): Promise<BookWithOwner[]> {
    const where: Prisma.BookWhereInput = {
      AND: [
        filters.search
          ? {
              OR: [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { author: { contains: filters.search, mode: 'insensitive' } },
                // Note: description field doesn't exist in current schema
              ],
            }
          : {},
        filters.status ? { status: filters.status } : {},
        filters.category
          ? {
              categoryName: { contains: filters.category, mode: 'insensitive' },
            }
          : {},
        filters.author
          ? { author: { contains: filters.author, mode: 'insensitive' } }
          : {},
        // Note: year field doesn't exist in current schema
        filters.hasOwner !== undefined
          ? filters.hasOwner
            ? { ownerId: { not: null } }
            : { ownerId: null }
          : {},
        filters.ownerId ? { ownerId: filters.ownerId } : {},
        filters.priceMin ? { price: { gte: filters.priceMin } } : {},
        filters.priceMax ? { price: { lte: filters.priceMax } } : {},
      ],
    };

    return (await this.model.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { title: 'asc' },
    })) as BookWithOwner[];
  }

  /**
   * Assigner un propriétaire à un livre
   */
  async assignOwner(bookId: string, ownerId: string): Promise<Book> {
    return await this.model.update({
      where: { id: bookId },
      data: { ownerId },
    });
  }

  /**
   * Retirer le propriétaire d'un livre
   */
  async removeOwner(bookId: string): Promise<Book> {
    return await this.model.update({
      where: { id: bookId },
      data: { ownerId: null },
    });
  }

  /**
   * Mettre à jour le statut d'un livre
   */
  async updateStatus(bookId: string, status: BookStatus): Promise<Book> {
    return await this.model.update({
      where: { id: bookId },
      data: { status },
    });
  }
}

// Instance singleton
export const bookRepository = new BookRepository();
