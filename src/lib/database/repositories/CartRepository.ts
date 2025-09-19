import type { Cart, CartItem } from '@/generated/prisma';
import { prisma } from '@/lib/database/client';

export interface CartWithItems extends Cart {
  items: (CartItem & {
    book: {
      id: string;
      title: string;
      author: string;
      price: number;
      imgUrl: string | null;
      status: string;
      stars: number | null;
      categoryName: string | null;
    };
  })[];
  _count?: {
    items: number;
  };
}

export interface CreateCartData {
  userId: string;
}

export interface CreateCartItemData {
  cartId: string;
  bookId: string;
}

class CartRepository {
  /**
   * Récupère ou crée le panier d'un utilisateur
   */
  async findOrCreateByUserId(userId: string): Promise<CartWithItems> {
    try {
      // Essayer de récupérer le panier existant
      let cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              book: {
                select: {
                  id: true,
                  title: true,
                  author: true,
                  price: true,
                  imgUrl: true,
                  status: true,
                  stars: true,
                  categoryName: true,
                },
              },
            },
            orderBy: {
              addedAt: 'desc',
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
      });

      // Si pas de panier, en créer un
      if (!cart) {
        cart = await prisma.cart.create({
          data: { userId },
          include: {
            items: {
              include: {
                book: {
                  select: {
                    id: true,
                    title: true,
                    author: true,
                    price: true,
                    imgUrl: true,
                    status: true,
                    stars: true,
                    categoryName: true,
                  },
                },
              },
              orderBy: {
                addedAt: 'desc',
              },
            },
            _count: {
              select: {
                items: true,
              },
            },
          },
        });
      }

      return cart as CartWithItems;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du panier: ${error}`);
    }
  }

  /**
   * Ajoute un livre au panier
   */
  async addItem(
    cartId: string,
    bookId: string,
    userId?: string
  ): Promise<CartItem> {
    try {
      // Vérifier que le livre n'est pas déjà dans le panier
      const existingItem = await prisma.cartItem.findUnique({
        where: {
          cartId_bookId: {
            cartId,
            bookId,
          },
        },
      });

      if (existingItem) {
        throw new Error('Ce livre est déjà dans votre panier');
      }

      // Vérifier que le livre est disponible
      const book = await prisma.book.findUnique({
        where: { id: bookId },
        select: { status: true, title: true, ownerId: true },
      });

      if (!book) {
        throw new Error('Livre introuvable');
      }

      if (book.status !== 'AVAILABLE') {
        throw new Error(`Le livre "${book.title}" n'est pas disponible`);
      }

      // Vérifier que l'utilisateur n'essaie pas d'ajouter son propre livre
      if (userId && book.ownerId === userId) {
        throw new Error(
          'Vous ne pouvez pas ajouter votre propre livre au panier'
        );
      }

      // Ajouter l'item au panier
      const cartItem = await prisma.cartItem.create({
        data: {
          cartId,
          bookId,
        },
      });

      return cartItem;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Erreur lors de l'ajout au panier: ${error}`);
    }
  }

  /**
   * Retire un livre du panier
   */
  async removeItem(cartId: string, bookId: string): Promise<void> {
    try {
      const deleted = await prisma.cartItem.deleteMany({
        where: {
          cartId,
          bookId,
        },
      });

      if (deleted.count === 0) {
        throw new Error('Livre non trouvé dans le panier');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Erreur lors de la suppression: ${error}`);
    }
  }

  /**
   * Vide complètement le panier
   */
  async clearCart(cartId: string): Promise<void> {
    try {
      await prisma.cartItem.deleteMany({
        where: { cartId },
      });
    } catch (error) {
      throw new Error(`Erreur lors du vidage du panier: ${error}`);
    }
  }

  /**
   * Récupère le nombre d'items dans le panier
   */
  async getItemCount(userId: string): Promise<number> {
    try {
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
          _count: {
            select: { items: true },
          },
        },
      });

      return cart?._count.items || 0;
    } catch (error) {
      throw new Error(`Erreur lors du comptage des items: ${error}`);
    }
  }

  /**
   * Vérifie si un livre est dans le panier de l'utilisateur
   */
  async hasBook(userId: string, bookId: string): Promise<boolean> {
    try {
      const cart = await prisma.cart.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!cart) return false;

      const item = await prisma.cartItem.findUnique({
        where: {
          cartId_bookId: {
            cartId: cart.id,
            bookId,
          },
        },
      });

      return !!item;
    } catch {
      return false;
    }
  }

  /**
   * Récupère tous les livres du panier avec leurs détails
   */
  async getCartItems(userId: string): Promise<CartItem[]> {
    try {
      const cart = await this.findOrCreateByUserId(userId);
      return cart.items;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des items: ${error}`);
    }
  }

  /**
   * Calcule le total du panier
   */
  async calculateTotal(userId: string): Promise<number> {
    try {
      const cart = await this.findOrCreateByUserId(userId);
      return cart.items.reduce((total, item) => total + item.book.price, 0);
    } catch (error) {
      throw new Error(`Erreur lors du calcul du total: ${error}`);
    }
  }
}

// Export singleton
export const cartRepository = new CartRepository();
