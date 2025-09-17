import { PrismaClient } from '@/generated/prisma';
import type { PaginatedResponse, PaginationParams } from '@/types/api';
import { AppError, ResourceNotFoundError } from '../errors/AppError';
import { prisma } from './client';

// Repository de base avec opérations CRUD génériques
export abstract class BaseRepository<
  TModel,
  TCreateInput,
  TUpdateInput,
  TWhereInput = any,
  TInclude = any,
> {
  protected readonly prisma: PrismaClient;
  protected abstract readonly modelName: string;
  protected abstract readonly model: any;

  constructor() {
    this.prisma = prisma;
  }

  // Créer une nouvelle entité
  async create(data: TCreateInput, include?: TInclude): Promise<TModel> {
    try {
      const result = await this.model.create({
        data,
        ...(include && { include }),
      });
      return result;
    } catch (error) {
      console.error(`Database error creating ${this.modelName}:`, error);
      throw new AppError(
        `Erreur lors de la création de ${this.modelName}`,
        500
      );
    }
  }

  // Trouver par ID
  async findById(id: string, include?: TInclude): Promise<TModel> {
    const result = await this.model.findUnique({
      where: { id },
      ...(include && { include }),
    });

    if (!result) {
      throw new ResourceNotFoundError(this.modelName, id);
    }

    return result;
  }

  // Trouver par ID (nullable)
  async findByIdOrNull(id: string, include?: TInclude): Promise<TModel | null> {
    return await this.model.findUnique({
      where: { id },
      ...(include && { include }),
    });
  }

  // Trouver le premier qui correspond
  async findFirst(
    where: TWhereInput,
    include?: TInclude
  ): Promise<TModel | null> {
    return await this.model.findFirst({
      where,
      ...(include && { include }),
    });
  }

  // Trouver plusieurs avec pagination
  async findMany(
    where?: TWhereInput,
    include?: TInclude,
    orderBy?: any,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<TModel>> {
    const page = pagination?.page || 1;
    const limit = Math.min(pagination?.limit || 20, 100); // Max 100 items
    const skip = (page - 1) * limit;

    // Compter le total
    const total = await this.model.count({ where });

    // Récupérer les données
    const items = await this.model.findMany({
      where,
      ...(include && { include }),
      ...(orderBy && { orderBy }),
      skip,
      take: limit,
    });

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

  // Mettre à jour par ID
  async updateById(
    id: string,
    data: TUpdateInput,
    include?: TInclude
  ): Promise<TModel> {
    const exists = await this.findByIdOrNull(id);
    if (!exists) {
      throw new ResourceNotFoundError(this.modelName, id);
    }

    try {
      console.log(`[updateById] data sent to Prisma:`, data);
      return await this.model.update({
        where: { id },
        data,
        ...(include && { include }),
      });
    } catch (error) {
      console.error(`Database error updating ${this.modelName}:`, error);
      console.error('Full error object:', error);
      if (error instanceof Error) {
        console.error('Prisma error message:', error.message);
        if ('code' in error) {
          console.error('Prisma error code:', error.code);
        }
        if ('meta' in error) {
          console.error('Prisma error meta:', error.meta);
        }
      }
      throw new AppError(
        `Erreur lors de la mise à jour de ${this.modelName}`,
        500
      );
    }
  }

  // Supprimer par ID
  async deleteById(id: string): Promise<void> {
    const exists = await this.findByIdOrNull(id);
    if (!exists) {
      throw new ResourceNotFoundError(this.modelName, id);
    }

    try {
      await this.model.delete({ where: { id } });
    } catch (error) {
      console.error(`Database error deleting ${this.modelName}:`, error);
      throw new AppError(
        `Erreur lors de la suppression de ${this.modelName}`,
        500
      );
    }
  }

  // Compter les entités
  async count(where?: TWhereInput): Promise<number> {
    return await this.model.count({ where });
  }

  // Vérifier l'existence
  async exists(where: TWhereInput): Promise<boolean> {
    const count = await this.model.count({ where, take: 1 });
    return count > 0;
  }

  // Opération batch - créer plusieurs
  async createMany(data: TCreateInput[]): Promise<{ count: number }> {
    try {
      return await this.model.createMany({ data });
    } catch (error) {
      console.error(`Database error batch creating ${this.modelName}:`, error);
      throw new AppError(
        `Erreur lors de la création batch de ${this.modelName}`,
        500
      );
    }
  }

  // Transaction wrapper
  async transaction<T>(
    callback: (
      tx: Omit<
        PrismaClient,
        '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
      >
    ) => Promise<T>
  ): Promise<T> {
    return await this.prisma.$transaction(callback);
  }
}
