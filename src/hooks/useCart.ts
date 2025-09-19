'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';

interface CartItem {
  id: string;
  addedAt: string;
  book: {
    id: string;
    title: string;
    author: string;
    price: number;
    imgUrl: string | null;
    stars: number | null;
    categoryName: string | null;
    status: string;
  };
}

interface CartData {
  id: string;
  itemCount: number;
  totalPrice: number;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

interface UseCartReturn {
  cart: CartData | null;
  itemCount: number;
  loading: boolean;
  error: string | null;
  addToCart: (bookId: string) => Promise<boolean>;
  removeFromCart: (bookId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  isInCart: (bookId: string) => boolean;
  refreshCart: () => Promise<void>;
}

export function useCart(): UseCartReturn {
  const { data: session } = useSession();
  const [cart, setCart] = useState<CartData | null>(null);
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger le panier complet
  const loadCart = useCallback(async () => {
    if (!session) {
      setCart(null);
      setItemCount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/cart?includeDetails=true');
      const data = await response.json();

      if (data.success) {
        setCart(data.data);
        setItemCount(data.data.itemCount);
      } else {
        throw new Error(data.message || 'Erreur lors du chargement du panier');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setCart(null);
      setItemCount(0);
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Charger le panier au montage et changement de session
  useEffect(() => {
    if (session) {
      loadCart();
    } else {
      setCart(null);
      setItemCount(0);
    }
  }, [session, loadCart]);

  // Ajouter un livre au panier
  const addToCart = useCallback(
    async (bookId: string): Promise<boolean> => {
      if (!session) return false;

      try {
        setError(null);

        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bookId }),
        });

        const data = await response.json();

        if (data.success) {
          setItemCount(data.data.itemCount);
          // Recharger le panier si on l'a déjà chargé
          if (cart) {
            await loadCart();
          }
          return true;
        } else {
          setError(data.message || "Erreur lors de l'ajout au panier");
          return false;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        return false;
      }
    },
    [session, cart, loadCart]
  );

  // Retirer un livre du panier
  const removeFromCart = useCallback(
    async (bookId: string): Promise<boolean> => {
      if (!session) return false;

      try {
        setError(null);

        const response = await fetch(`/api/cart/${bookId}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (data.success) {
          setItemCount(data.data.itemCount);
          // Recharger le panier si on l'a déjà chargé
          if (cart) {
            await loadCart();
          }
          return true;
        } else {
          setError(data.message || 'Erreur lors de la suppression');
          return false;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        return false;
      }
    },
    [session, cart, loadCart]
  );

  // Vider le panier
  const clearCart = useCallback(async (): Promise<boolean> => {
    if (!session) return false;

    try {
      setError(null);

      const response = await fetch('/api/cart', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setCart(null);
        setItemCount(0);
        return true;
      } else {
        setError(data.message || 'Erreur lors du vidage du panier');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return false;
    }
  }, [session]);

  // Vérifier si un livre est dans le panier
  const isInCart = useCallback(
    (bookId: string): boolean => {
      if (!cart) return false;
      return cart.items.some((item) => item.book.id === bookId);
    },
    [cart]
  );

  // Rafraîchir le panier
  const refreshCart = useCallback(async () => {
    await loadCart();
  }, [loadCart]);

  return {
    cart,
    itemCount,
    loading,
    error,
    addToCart,
    removeFromCart,
    clearCart,
    isInCart,
    refreshCart,
  };
}
