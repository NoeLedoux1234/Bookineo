import {
  cartRepository,
  CartWithItems,
} from '@/lib/database/repositories/CartRepository';
import { AppError } from '@/lib/errors/AppError';
import type { CheckoutCartInput } from '@/lib/validation/schemas';
import { rentalService } from './RentalService';

export interface CartSummary {
  itemCount: number;
  totalPrice: number;
  books: Array<{
    id: string;
    title: string;
    author: string;
    price: number;
    imgUrl: string | null;
    stars: number | null;
    categoryName: string | null;
  }>;
}

export class CartService {
  /**
   * Récupère le panier complet d'un utilisateur
   */
  async getUserCart(userId: string): Promise<CartWithItems> {
    try {
      return await cartRepository.findOrCreateByUserId(userId);
    } catch {
      throw AppError.internal('Erreur lors de la récupération du panier');
    }
  }

  /**
   * Récupère un résumé du panier (pour affichage rapide)
   */
  async getCartSummary(userId: string): Promise<CartSummary> {
    try {
      const cart = await cartRepository.findOrCreateByUserId(userId);

      const books = cart.items.map((item) => ({
        id: item.book.id,
        title: item.book.title,
        author: item.book.author,
        price: item.book.price,
        imgUrl: item.book.imgUrl,
        stars: item.book.stars,
        categoryName: item.book.categoryName,
      }));

      const totalPrice = books.reduce((total, book) => total + book.price, 0);

      return {
        itemCount: cart.items.length,
        totalPrice,
        books,
      };
    } catch {
      throw AppError.internal(
        'Erreur lors de la récupération du résumé du panier'
      );
    }
  }

  /**
   * Ajoute un livre au panier
   */
  async addToCart(userId: string, bookId: string): Promise<void> {
    try {
      // Récupérer ou créer le panier
      const cart = await cartRepository.findOrCreateByUserId(userId);

      // Ajouter le livre
      await cartRepository.addItem(cart.id, bookId);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('déjà dans votre panier')) {
          throw AppError.conflict(error.message);
        }
        if (error.message.includes('pas disponible')) {
          throw AppError.badRequest(error.message);
        }
        if (error.message.includes('introuvable')) {
          throw AppError.notFound(error.message);
        }
      }
      throw AppError.internal("Erreur lors de l'ajout au panier");
    }
  }

  /**
   * Retire un livre du panier
   */
  async removeFromCart(userId: string, bookId: string): Promise<void> {
    try {
      const cart = await cartRepository.findOrCreateByUserId(userId);
      await cartRepository.removeItem(cart.id, bookId);
    } catch (error) {
      if (error instanceof Error && error.message.includes('non trouvé')) {
        throw AppError.notFound('Livre non trouvé dans le panier');
      }
      throw AppError.internal('Erreur lors de la suppression du panier');
    }
  }

  /**
   * Vide complètement le panier
   */
  async clearCart(userId: string): Promise<void> {
    try {
      const cart = await cartRepository.findOrCreateByUserId(userId);
      await cartRepository.clearCart(cart.id);
    } catch {
      throw AppError.internal('Erreur lors du vidage du panier');
    }
  }

  /**
   * Vérifie si un livre est dans le panier
   */
  async isBookInCart(userId: string, bookId: string): Promise<boolean> {
    try {
      return await cartRepository.hasBook(userId, bookId);
    } catch {
      return false;
    }
  }

  /**
   * Récupère le nombre d'items dans le panier
   */
  async getCartItemCount(userId: string): Promise<number> {
    try {
      return await cartRepository.getItemCount(userId);
    } catch {
      return 0;
    }
  }

  /**
   * Valide que tous les livres du panier sont encore disponibles
   */
  async validateCartAvailability(userId: string): Promise<{
    valid: boolean;
    unavailableBooks: string[];
  }> {
    try {
      const cart = await cartRepository.findOrCreateByUserId(userId);
      const unavailableBooks: string[] = [];

      for (const item of cart.items) {
        if (item.book.status !== 'AVAILABLE') {
          unavailableBooks.push(item.book.title);
        }
      }

      return {
        valid: unavailableBooks.length === 0,
        unavailableBooks,
      };
    } catch {
      throw AppError.internal('Erreur lors de la validation du panier');
    }
  }

  /**
   * Procède au checkout du panier (transforme les items en locations)
   */
  async checkoutCart(
    userId: string,
    checkoutData: CheckoutCartInput
  ): Promise<{ rentals: string[]; total: number }> {
    try {
      // Valider que le panier n'est pas vide
      const cart = await cartRepository.findOrCreateByUserId(userId);

      if (cart.items.length === 0) {
        throw AppError.badRequest('Le panier est vide');
      }

      // Valider la disponibilité de tous les livres
      const validation = await this.validateCartAvailability(userId);
      if (!validation.valid) {
        throw AppError.conflict(
          `Certains livres ne sont plus disponibles: ${validation.unavailableBooks.join(', ')}`
        );
      }

      // Créer les locations pour chaque livre
      const rentalIds: string[] = [];
      let totalAmount = 0;

      for (const item of cart.items) {
        const rental = await rentalService.createRental({
          bookId: item.book.id,
          renterId: userId,
          duration: checkoutData.duration,
          comment: checkoutData.comment,
          startDate: checkoutData.startDate
            ? new Date(checkoutData.startDate)
            : undefined,
        });

        rentalIds.push(rental.id);
        totalAmount += item.book.price;
      }

      // Vider le panier après checkout réussi
      await cartRepository.clearCart(cart.id);

      return {
        rentals: rentalIds,
        total: totalAmount,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.internal('Erreur lors du checkout du panier');
    }
  }

  /**
   * Nettoie le panier en retirant les livres qui ne sont plus disponibles
   */
  async cleanupUnavailableItems(userId: string): Promise<string[]> {
    try {
      const cart = await cartRepository.findOrCreateByUserId(userId);
      const removedBooks: string[] = [];

      for (const item of cart.items) {
        if (item.book.status !== 'AVAILABLE') {
          await cartRepository.removeItem(cart.id, item.book.id);
          removedBooks.push(item.book.title);
        }
      }

      return removedBooks;
    } catch {
      throw AppError.internal('Erreur lors du nettoyage du panier');
    }
  }
}

// Export singleton
export const cartService = new CartService();
