import type { Book, Rental, RentalStatus, User } from '@/generated/prisma';
import { prisma } from '@/lib/database/client';
import type { PaginationParams } from '@/types/api';

export interface RentalWithDetails extends Rental {
  book: Pick<Book, 'id' | 'title' | 'author' | 'imgUrl' | 'price'>;
  renter: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>;
}

export interface CreateRentalData {
  bookId: string;
  renterId: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  comment?: string;
}

export interface UpdateRentalData {
  returnDate?: Date;
  status?: RentalStatus;
  comment?: string;
}

export interface RentalFilter {
  status?: RentalStatus;
  bookId?: string;
  renterId?: string;
  search?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
}

class RentalRepository {
  async create(data: CreateRentalData): Promise<RentalWithDetails> {
    return await prisma.rental.create({
      data,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            imgUrl: true,
            price: true,
          },
        },
        renter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findById(id: string): Promise<RentalWithDetails | null> {
    return await prisma.rental.findUnique({
      where: { id },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            imgUrl: true,
            price: true,
          },
        },
        renter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findMany(
    filters: RentalFilter = {},
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<{
    items: RentalWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.bookId) {
      where.bookId = filters.bookId;
    }

    if (filters.renterId) {
      where.renterId = filters.renterId;
    }

    if (filters.startDateFrom || filters.startDateTo) {
      where.startDate = {};
      if (filters.startDateFrom) where.startDate.gte = filters.startDateFrom;
      if (filters.startDateTo) where.startDate.lte = filters.startDateTo;
    }

    if (filters.endDateFrom || filters.endDateTo) {
      where.endDate = {};
      if (filters.endDateFrom) where.endDate.gte = filters.endDateFrom;
      if (filters.endDateTo) where.endDate.lte = filters.endDateTo;
    }

    if (filters.search) {
      where.OR = [
        {
          book: {
            title: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        },
        {
          book: {
            author: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        },
        {
          renter: {
            firstName: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        },
        {
          renter: {
            lastName: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        },
        {
          renter: {
            email: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.rental.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              imgUrl: true,
              price: true,
            },
          },
          renter: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.rental.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, data: UpdateRentalData): Promise<RentalWithDetails> {
    return await prisma.rental.update({
      where: { id },
      data,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            imgUrl: true,
            price: true,
          },
        },
        renter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.rental.delete({
      where: { id },
    });
  }

  async findActiveRentalByBookId(
    bookId: string
  ): Promise<RentalWithDetails | null> {
    return await prisma.rental.findFirst({
      where: {
        bookId,
        status: 'ACTIVE',
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            imgUrl: true,
            price: true,
          },
        },
        renter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findByUserId(userId: string): Promise<RentalWithDetails[]> {
    return await prisma.rental.findMany({
      where: {
        renterId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            imgUrl: true,
            price: true,
          },
        },
        renter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getStats(): Promise<{
    totalRentals: number;
    activeRentals: number;
    completedRentals: number;
    cancelledRentals: number;
    averageDuration: number;
  }> {
    const [
      totalRentals,
      activeRentals,
      completedRentals,
      cancelledRentals,
      avgDurationResult,
    ] = await Promise.all([
      prisma.rental.count(),
      prisma.rental.count({ where: { status: 'ACTIVE' } }),
      prisma.rental.count({ where: { status: 'COMPLETED' } }),
      prisma.rental.count({ where: { status: 'CANCELLED' } }),
      prisma.rental.aggregate({
        _avg: {
          duration: true,
        },
      }),
    ]);

    return {
      totalRentals,
      activeRentals,
      completedRentals,
      cancelledRentals,
      averageDuration: avgDurationResult._avg.duration || 0,
    };
  }
}

export const rentalRepository = new RentalRepository();
