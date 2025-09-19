import type { RentalStatus } from '@/generated/prisma';
import { bookRepository } from '@/lib/database/repositories/BookRepository';
import {
  rentalRepository,
  type CreateRentalData,
  type RentalFilter,
  type RentalWithDetails,
} from '@/lib/database/repositories/RentalRepository';
import { userRepository } from '@/lib/database/repositories/UserRepository';
import {
  AppError,
  ResourceNotFoundError,
  ValidationError,
} from '@/lib/errors/AppError';
import type { PaginatedResponse, PaginationParams } from '@/types/api';

export interface CreateRentalInput {
  bookId: string;
  renterId: string;
  duration: number;
  comment?: string;
  startDate?: Date;
}

export interface UpdateRentalInput {
  returnDate?: Date;
  status?: RentalStatus;
  comment?: string;
}

class RentalService {
  async createRental(data: CreateRentalInput): Promise<RentalWithDetails> {
    const {
      bookId,
      renterId,
      duration,
      comment,
      startDate = new Date(),
    } = data;

    // Validation de la durée
    if (duration < 1 || duration > 365) {
      throw new ValidationError(
        'La durée doit être comprise entre 1 et 365 jours',
        { duration: ['La durée doit être comprise entre 1 et 365 jours'] }
      );
    }

    // Vérifier que le livre existe
    const book = await bookRepository.findById(bookId);
    if (!book) {
      throw new ResourceNotFoundError('Livre non trouvé');
    }

    // Vérifier que le livre est disponible
    if (book.status !== 'AVAILABLE') {
      throw AppError.conflict("Ce livre n'est pas disponible pour la location");
    }

    // Vérifier qu'il n'y a pas déjà une location active pour ce livre
    const existingRental =
      await rentalRepository.findActiveRentalByBookId(bookId);
    if (existingRental) {
      throw AppError.conflict('Ce livre est déjà en cours de location');
    }

    // Vérifier que le locataire existe
    const renter = await userRepository.findById(renterId);
    if (!renter) {
      throw new ResourceNotFoundError('Utilisateur non trouvé');
    }

    // Calculer la date de fin
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);

    // Créer la location
    const rentalData: CreateRentalData = {
      bookId,
      renterId,
      startDate,
      endDate,
      duration,
      comment,
    };

    const rental = await rentalRepository.create(rentalData);

    // Mettre à jour le statut du livre à "RENTED"
    await bookRepository.updateStatus(bookId, 'RENTED');

    return rental;
  }

  async getRentals(
    filters: RentalFilter = {},
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<PaginatedResponse<RentalWithDetails>> {
    const result = await rentalRepository.findMany(filters, pagination);

    return {
      items: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasNext: result.page < result.totalPages,
      hasPrev: result.page > 1,
    };
  }

  async getRentalById(id: string): Promise<RentalWithDetails> {
    if (!id) {
      throw new ValidationError('ID de location requis', {
        id: ['ID de location requis'],
      });
    }

    const rental = await rentalRepository.findById(id);
    if (!rental) {
      throw new ResourceNotFoundError('Location non trouvée');
    }

    return rental;
  }

  async updateRental(
    id: string,
    data: UpdateRentalInput
  ): Promise<RentalWithDetails> {
    if (!id) {
      throw new ValidationError('ID de location requis', {
        id: ['ID de location requis'],
      });
    }

    // Vérifier que la location existe
    const existingRental = await rentalRepository.findById(id);
    if (!existingRental) {
      throw new ResourceNotFoundError('Location non trouvée');
    }

    // Si on marque la location comme terminée, libérer le livre
    if (data.status === 'COMPLETED' && existingRental.status !== 'COMPLETED') {
      await bookRepository.updateStatus(existingRental.bookId, 'AVAILABLE');

      // Si pas de date de retour fournie, utiliser maintenant
      if (!data.returnDate) {
        data.returnDate = new Date();
      }
    }

    // Si on annule la location, libérer le livre
    if (data.status === 'CANCELLED' && existingRental.status !== 'CANCELLED') {
      await bookRepository.updateStatus(existingRental.bookId, 'AVAILABLE');
    }

    const updatedRental = await rentalRepository.update(id, data);
    return updatedRental;
  }

  async returnBook(id: string, comment?: string): Promise<RentalWithDetails> {
    return await this.updateRental(id, {
      status: 'COMPLETED',
      returnDate: new Date(),
      comment,
    });
  }

  async cancelRental(id: string, comment?: string): Promise<RentalWithDetails> {
    const existingRental = await rentalRepository.findById(id);
    if (!existingRental) {
      throw new ResourceNotFoundError('Location non trouvée');
    }

    if (existingRental.status === 'COMPLETED') {
      throw AppError.conflict(
        "Impossible d'annuler une location déjà terminée"
      );
    }

    return await this.updateRental(id, {
      status: 'CANCELLED',
      comment,
    });
  }

  async getRentalsByUserId(userId: string): Promise<RentalWithDetails[]> {
    if (!userId) {
      throw new ValidationError('ID utilisateur requis', {
        userId: ['ID utilisateur requis'],
      });
    }

    return await rentalRepository.findByUserId(userId);
  }

  async getActiveRentalByBookId(
    bookId: string
  ): Promise<RentalWithDetails | null> {
    if (!bookId) {
      throw new ValidationError('ID de livre requis', {
        bookId: ['ID de livre requis'],
      });
    }

    return await rentalRepository.findActiveRentalByBookId(bookId);
  }

  async getRentalStats(): Promise<{
    totalRentals: number;
    activeRentals: number;
    completedRentals: number;
    cancelledRentals: number;
    averageDuration: number;
  }> {
    return await rentalRepository.getStats();
  }

  async deleteRental(id: string): Promise<void> {
    if (!id) {
      throw new ValidationError('ID de location requis', {
        id: ['ID de location requis'],
      });
    }

    const existingRental = await rentalRepository.findById(id);
    if (!existingRental) {
      throw new ResourceNotFoundError('Location non trouvée');
    }

    // Si la location est active, libérer le livre
    if (existingRental.status === 'ACTIVE') {
      await bookRepository.updateStatus(existingRental.bookId, 'AVAILABLE');
    }

    await rentalRepository.delete(id);
  }

  async getOverdueRentals(): Promise<RentalWithDetails[]> {
    const now = new Date();

    const result = await rentalRepository.findMany({
      status: 'ACTIVE',
      endDateTo: now, // Les locations dont la date de fin est dépassée
    });

    return result.items;
  }
}

export const rentalService = new RentalService();
