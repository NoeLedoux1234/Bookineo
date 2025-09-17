import type { BookStatus } from '@/generated/prisma';
import {
  bookRepository,
  type BookFilter,
  type BookWithDetails,
  type BookWithOwner,
} from '@/lib/database/repositories/BookRepository';
import {
  AppError,
  ResourceNotFoundError,
  ValidationError,
} from '@/lib/errors/AppError';
import type { PaginatedResponse, PaginationParams } from '@/types/api';

export interface CreateBookData {
  title: string;
  author: string;
  year?: number | null;
  category: string;
  price: number;
  description?: string;
  imageUrl?: string;
  ownerId?: string;
  asin?: string;
  isbn10?: string;
}

export interface UpdateBookData {
  title?: string;
  author?: string;
  year?: number | null;
  category?: string;
  price?: number;
  description?: string;
  imageUrl?: string;
  status?: BookStatus;
  ownerId?: string | null;
}

export interface BookExportData {
  titre: string;
  auteur: string;
  annee: number | null;
  categorie: string;
  prix: number;
  statut: string;
  proprietaire: string;
  email_proprietaire: string;
  date_creation: string;
  description: string;
  rating: string;
  nombre_avis: number;
}

export class BookService {
  /**
   * Récupère la liste des livres avec filtres et pagination
   */
  async getBooks(
    filters: BookFilter = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<BookWithOwner>> {
    try {
      return await bookRepository.findBooksWithFilters(filters, pagination);
    } catch (error) {
      console.error('Erreur lors de la récupération des livres:', error);
      throw new AppError('Erreur lors de la récupération des livres', 500);
    }
  }

  /**
   * Récupère un livre par son ID avec tous les détails
   */
  async getBookById(id: string): Promise<BookWithDetails> {
    if (!id) {
      throw new ValidationError('ID du livre requis', {});
    }

    const book = await bookRepository.findBookWithDetails(id);
    if (!book) {
      throw new ResourceNotFoundError('Livre', id);
    }

    return book;
  }

  /**
   * Crée un nouveau livre
   */
  async createBook(
    data: CreateBookData,
    creatorId?: string
  ): Promise<BookWithOwner> {
    // Validation des données
    this.validateBookData(data);

    // Vérifier les doublons (titre + auteur)
    const existingBooks = await bookRepository.findBooksWithFilters({
      search: `${data.title} ${data.author}`,
    });

    if (existingBooks.items.length > 0) {
      throw new ValidationError(
        'Un livre avec ce titre et cet auteur existe déjà',
        {}
      );
    }

    try {
      const createdBook = await bookRepository.create({
        title: data.title.trim(),
        author: data.author.trim(),
        year: data.year,
        category: data.category.trim(),
        price: data.price,
        description: data.description?.trim(),
        imageUrl: data.imageUrl,
        asin: data.asin,
        isbn10: data.isbn10,
        owner:
          data.ownerId || creatorId
            ? {
                connect: { id: data.ownerId || creatorId },
              }
            : undefined,
      });

      return (await bookRepository.findBookWithDetails(
        createdBook.id
      )) as BookWithOwner;
    } catch (error) {
      console.error('Erreur lors de la création du livre:', error);
      throw new AppError('Erreur lors de la création du livre', 500);
    }
  }

  /**
   * Met à jour un livre
   */
  async updateBook(
    id: string,
    data: UpdateBookData,
    userId?: string
  ): Promise<BookWithOwner> {
    if (!id) {
      throw new ValidationError('ID du livre requis', {});
    }

    // Vérifier que le livre existe
    const existingBook = await bookRepository.findByIdOrNull(id, undefined);
    if (!existingBook) {
      throw new ResourceNotFoundError('Livre', id);
    }

    // Vérifier les permissions (seul le propriétaire peut modifier)
    if (userId && existingBook.ownerId && existingBook.ownerId !== userId) {
      throw new AppError('Vous ne pouvez modifier que vos propres livres', 403);
    }

    // Validation des nouvelles données
    if (
      data.title ||
      data.author ||
      data.category ||
      data.price !== undefined
    ) {
      this.validateBookData({
        title: data.title || existingBook.title,
        author: data.author || existingBook.author,
        category: data.category || existingBook.category,
        price: data.price !== undefined ? data.price : existingBook.price,
      });
    }

    try {
      const updatedBook = await bookRepository.updateById(id, {
        ...(data.title && { title: data.title.trim() }),
        ...(data.author && { author: data.author.trim() }),
        ...(data.year !== undefined && { year: data.year }),
        ...(data.category && { category: data.category.trim() }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.description !== undefined && {
          description: data.description?.trim(),
        }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.status && { status: data.status }),
        ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
      });

      return (await bookRepository.findBookWithDetails(
        updatedBook.id
      )) as BookWithOwner;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du livre:', error);
      throw new AppError('Erreur lors de la mise à jour du livre', 500);
    }
  }

  /**
   * Supprime un livre
   */
  async deleteBook(id: string, userId?: string): Promise<void> {
    if (!id) {
      throw new ValidationError('ID du livre requis', {});
    }

    const existingBook = await bookRepository.findByIdOrNull(id, undefined);
    if (!existingBook) {
      throw new ResourceNotFoundError('Livre', id);
    }

    // Vérifier les permissions
    if (userId && existingBook.ownerId && existingBook.ownerId !== userId) {
      throw new AppError(
        'Vous ne pouvez supprimer que vos propres livres',
        403
      );
    }

    // Vérifier qu'il n'y a pas de locations actives
    const activeRentals = await bookRepository.findFirst({
      id,
      rentals: {
        some: {
          status: 'ACTIVE',
        },
      },
    });

    if (activeRentals) {
      throw new ValidationError(
        'Impossible de supprimer un livre avec des locations actives',
        {}
      );
    }

    try {
      await bookRepository.deleteById(id);
    } catch (error) {
      console.error('Erreur lors de la suppression du livre:', error);
      throw new AppError('Erreur lors de la suppression du livre', 500);
    }
  }

  /**
   * Récupère les catégories disponibles
   */
  async getCategories(): Promise<string[]> {
    try {
      return await bookRepository.getUniqueCategories();
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      throw new AppError('Erreur lors de la récupération des catégories', 500);
    }
  }

  /**
   * Recherche d'auteurs avec autocomplétion
   */
  async searchAuthors(query: string): Promise<string[]> {
    if (!query || query.length < 2) {
      throw new ValidationError(
        'La recherche doit contenir au moins 2 caractères',
        {}
      );
    }

    try {
      return await bookRepository.searchAuthors(query.trim(), 10);
    } catch (error) {
      console.error("Erreur lors de la recherche d'auteurs:", error);
      throw new AppError("Erreur lors de la recherche d'auteurs", 500);
    }
  }

  /**
   * Récupère les statistiques des livres
   */
  async getBookStatistics() {
    try {
      return await bookRepository.getBookStats();
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw new AppError(
        'Erreur lors de la récupération des statistiques',
        500
      );
    }
  }

  /**
   * Exporte les livres au format CSV
   */
  async exportBooksToCSV(filters: BookFilter = {}): Promise<BookExportData[]> {
    try {
      const books = await bookRepository.exportBooks(filters);

      return books.map((book) => ({
        titre: book.title,
        auteur: book.author,
        annee: book.year,
        categorie: book.category,
        prix: book.price,
        statut: book.status === 'AVAILABLE' ? 'Disponible' : 'Loué',
        proprietaire: book.owner
          ? `${book.owner.firstName || ''} ${book.owner.lastName || ''}`.trim() ||
            book.owner.email
          : 'Aucun',
        email_proprietaire: book.owner?.email || '',
        date_creation: book.createdAt.toISOString().split('T')[0],
        description: book.description || '',
        rating: book.rating || '',
        nombre_avis: book.reviewsCount || 0,
      }));
    } catch (error) {
      console.error("Erreur lors de l'export CSV:", error);
      throw new AppError("Erreur lors de l'export CSV", 500);
    }
  }

  /**
   * Assigner un propriétaire à un livre
   */
  async assignOwner(bookId: string, ownerId: string): Promise<BookWithOwner> {
    if (!bookId || !ownerId) {
      throw new ValidationError('ID du livre et du propriétaire requis', {});
    }

    try {
      await bookRepository.assignOwner(bookId, ownerId);
      return (await bookRepository.findBookWithDetails(
        bookId
      )) as BookWithOwner;
    } catch (error) {
      console.error("Erreur lors de l'assignation du propriétaire:", error);
      throw new AppError("Erreur lors de l'assignation du propriétaire", 500);
    }
  }

  /**
   * Validation des données d'un livre
   */
  private validateBookData(data: {
    title: string;
    author: string;
    category: string;
    price: number;
  }): void {
    const errors: string[] = [];

    if (!data.title?.trim()) {
      errors.push('Le titre est requis');
    } else if (data.title.length > 200) {
      errors.push('Le titre ne peut pas dépasser 200 caractères');
    }

    if (!data.author?.trim()) {
      errors.push("L'auteur est requis");
    } else if (data.author.length > 100) {
      errors.push("L'auteur ne peut pas dépasser 100 caractères");
    }

    if (!data.category?.trim()) {
      errors.push('La catégorie est requise');
    } else if (data.category.length > 50) {
      errors.push('La catégorie ne peut pas dépasser 50 caractères');
    }

    if (data.price === undefined || data.price === null) {
      errors.push('Le prix est requis');
    } else if (data.price < 0) {
      errors.push('Le prix ne peut pas être négatif');
    } else if (data.price > 10000) {
      errors.push('Le prix ne peut pas dépasser 10 000€');
    }

    if (errors.length > 0) {
      throw new ValidationError('Données invalides', { errors });
    }
  }
}

// Instance singleton
export const bookService = new BookService();
