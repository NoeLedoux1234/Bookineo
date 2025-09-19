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
  categoryName?: string;
  categoryId: number;
  price: number;
  imgUrl?: string;
  ownerId?: string;
  asin?: string;
  soldBy?: string;
  productURL?: string;
  stars?: number;
  reviews?: number;
  isKindleUnlimited?: boolean;
  isBestSeller?: boolean;
  isEditorsPick?: boolean;
  isGoodReadsChoice?: boolean;
  publishedDate?: string;
}

export interface UpdateBookData {
  title?: string;
  author?: string;
  categoryName?: string;
  categoryId?: number;
  price?: number;
  imgUrl?: string;
  status?: BookStatus;
  ownerId?: string | null;
  asin?: string;
  soldBy?: string;
  productURL?: string;
  stars?: number;
  reviews?: number;
  isKindleUnlimited?: boolean;
  isBestSeller?: boolean;
  isEditorsPick?: boolean;
  isGoodReadsChoice?: boolean;
  publishedDate?: string;
}

export interface BookExportData {
  titre: string;
  auteur: string;
  categorie: string;
  prix: number;
  statut: string;
  proprietaire: string;
  email_proprietaire: string;
  date_creation: string;
  asin: string;
  vendu_par: string;
  etoiles: number;
  nombre_avis: number;
  kindle_unlimited: boolean;
  bestseller: boolean;
  choix_editeur: boolean;
  choix_goodreads: boolean;
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
        categoryName: data.categoryName?.trim(),
        categoryId: data.categoryId,
        price: data.price,
        imgUrl: data.imgUrl,
        asin: data.asin,
        soldBy: data.soldBy,
        productURL: data.productURL,
        stars: data.stars,
        reviews: data.reviews,
        isKindleUnlimited: data.isKindleUnlimited || false,
        isBestSeller: data.isBestSeller || false,
        isEditorsPick: data.isEditorsPick || false,
        isGoodReadsChoice: data.isGoodReadsChoice || false,
        publishedDate: data.publishedDate,
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
      data.categoryName ||
      data.price !== undefined
    ) {
      this.validateBookData({
        title: data.title || existingBook.title,
        author: data.author || existingBook.author,
        categoryName:
          data.categoryName || existingBook.categoryName || undefined,
        categoryId: data.categoryId || existingBook.categoryId,
        price: data.price !== undefined ? data.price : existingBook.price,
      });
    }

    try {
      const updatedBook = await bookRepository.updateById(id, {
        ...(data.title && { title: data.title.trim() }),
        ...(data.author && { author: data.author.trim() }),
        ...(data.categoryName && { categoryName: data.categoryName.trim() }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.imgUrl !== undefined && { imgUrl: data.imgUrl }),
        ...(data.status && { status: data.status }),
        ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
        ...(data.asin !== undefined && { asin: data.asin }),
        ...(data.soldBy !== undefined && { soldBy: data.soldBy }),
        ...(data.productURL !== undefined && { productURL: data.productURL }),
        ...(data.stars !== undefined && { stars: data.stars }),
        ...(data.reviews !== undefined && { reviews: data.reviews }),
        ...(data.isKindleUnlimited !== undefined && {
          isKindleUnlimited: data.isKindleUnlimited,
        }),
        ...(data.isBestSeller !== undefined && {
          isBestSeller: data.isBestSeller,
        }),
        ...(data.isEditorsPick !== undefined && {
          isEditorsPick: data.isEditorsPick,
        }),
        ...(data.isGoodReadsChoice !== undefined && {
          isGoodReadsChoice: data.isGoodReadsChoice,
        }),
        ...(data.publishedDate !== undefined && {
          publishedDate: data.publishedDate,
        }),
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
        categorie: book.categoryName || '',
        prix: book.price,
        statut: book.status === 'AVAILABLE' ? 'Disponible' : 'Loué',
        proprietaire: book.owner
          ? `${book.owner.firstName || ''} ${book.owner.lastName || ''}`.trim() ||
            book.owner.email
          : 'Aucun',
        email_proprietaire: book.owner?.email || '',
        date_creation: book.createdAt.toISOString().split('T')[0],
        asin: book.asin || '',
        vendu_par: book.soldBy || '',
        etoiles: book.stars || 0,
        nombre_avis: book.reviews || 0,
        kindle_unlimited: book.isKindleUnlimited,
        bestseller: book.isBestSeller,
        choix_editeur: book.isEditorsPick,
        choix_goodreads: book.isGoodReadsChoice,
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
    categoryName?: string;
    categoryId: number;
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

    if (!data.categoryId) {
      errors.push("L'ID de catégorie est requis");
    }

    if (data.categoryName && data.categoryName.length > 50) {
      errors.push('Le nom de catégorie ne peut pas dépasser 50 caractères');
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
