'use client';

import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutDuration, setCheckoutDuration] = useState(7);
  const [checkoutComment, setCheckoutComment] = useState('');

  // Rediriger si pas connecté
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  // Charger le panier
  useEffect(() => {
    if (session) {
      loadCart();
    }
  }, [session]);

  const loadCart = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/cart?includeDetails=true');
      const data = await response.json();

      if (data.success) {
        setCart(data.data);
      } else {
        throw new Error(data.message || 'Erreur lors du chargement du panier');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (bookId: string) => {
    try {
      setRemovingItems((prev) => new Set(prev.add(bookId)));

      const response = await fetch(`/api/cart/${bookId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Recharger le panier
        await loadCart();
      } else {
        throw new Error(data.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setRemovingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(bookId);
        return newSet;
      });
    }
  };

  const clearCart = async () => {
    if (!confirm('Êtes-vous sûr de vouloir vider votre panier ?')) return;

    try {
      setLoading(true);

      const response = await fetch('/api/cart', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setCart(null);
      } else {
        throw new Error(data.message || 'Erreur lors du vidage du panier');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const proceedToCheckout = async () => {
    if (!cart || cart.items.length === 0) return;

    try {
      setCheckingOut(true);
      setError(null);

      const response = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration: checkoutDuration,
          comment: checkoutComment.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Rediriger vers les locations avec un message de succès
        router.push(
          `/rentals?success=checkout&count=${data.data.rentalCount}&total=${data.data.totalAmount}`
        );
      } else {
        throw new Error(data.message || 'Erreur lors du checkout');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setCheckingOut(false);
    }
  };

  const renderStars = (stars: number | null) => {
    if (!stars) return null;
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${
              i < Math.floor(stars) ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">{stars.toFixed(1)}</span>
      </div>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de votre panier...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Redirection en cours
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mon Panier</h1>
          <p className="mt-2 text-gray-600">
            {cart?.itemCount || 0} livre{(cart?.itemCount || 0) > 1 ? 's' : ''}{' '}
            dans votre panier
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg
                className="w-5 h-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="ml-3 text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {!cart || cart.items.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-24 h-24 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Votre panier est vide
            </h2>
            <p className="text-gray-600 mb-6">
              Découvrez notre collection de livres et ajoutez vos favoris !
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Parcourir les livres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Liste des livres */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Articles dans votre panier
                </h2>
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Vider le panier
                </button>
              </div>

              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm p-6 flex items-start space-x-4"
                >
                  <div className="flex-shrink-0">
                    {item.book.imgUrl ? (
                      <Image
                        src={item.book.imgUrl}
                        alt={item.book.title}
                        width={80}
                        height={120}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-30 bg-gray-200 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {item.book.title}
                    </h3>
                    <p className="text-gray-600 mb-2">par {item.book.author}</p>

                    {item.book.categoryName && (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">
                        {item.book.categoryName}
                      </span>
                    )}

                    {renderStars(item.book.stars)}

                    <p className="text-xs text-gray-500 mt-2">
                      Ajouté le{' '}
                      {new Date(item.addedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <p className="text-xl font-bold text-gray-900">
                      {item.book.price.toFixed(2)}€
                    </p>
                    <button
                      onClick={() => removeFromCart(item.book.id)}
                      disabled={removingItems.has(item.book.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                    >
                      {removingItems.has(item.book.id)
                        ? 'Suppression...'
                        : 'Retirer'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Résumé et checkout */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Résumé de la commande
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nombre de livres</span>
                    <span className="font-medium">{cart.itemCount}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-3">
                    <span>Total</span>
                    <span>{cart.totalPrice.toFixed(2)}€</span>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label
                      htmlFor="duration"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Durée de location (jours)
                    </label>
                    <select
                      id="duration"
                      value={checkoutDuration}
                      onChange={(e) =>
                        setCheckoutDuration(Number(e.target.value))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>1 jour</option>
                      <option value={3}>3 jours</option>
                      <option value={7}>1 semaine</option>
                      <option value={14}>2 semaines</option>
                      <option value={30}>1 mois</option>
                      <option value={60}>2 mois</option>
                      <option value={90}>3 mois</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="comment"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Commentaire (optionnel)
                    </label>
                    <textarea
                      id="comment"
                      value={checkoutComment}
                      onChange={(e) => setCheckoutComment(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ajoutez un commentaire pour vos locations..."
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {checkoutComment.length}/500
                    </p>
                  </div>
                </div>

                <button
                  onClick={proceedToCheckout}
                  disabled={checkingOut || cart.items.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  {checkingOut ? 'Traitement...' : 'Procéder aux locations'}
                </button>

                <p className="text-xs text-gray-500 mt-3 text-center">
                  En continuant, vous acceptez de louer ces livres pour la durée
                  sélectionnée.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
