'use client';

import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface RentalItem {
  id: string;
  startDate: string;
  endDate: string;
  returnDate: string | null;
  duration: number;
  comment: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
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

type FilterStatus = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export default function RentalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rentals, setRentals] = useState<RentalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());

  // Messages de succès depuis le checkout
  const success = searchParams.get('success');
  const count = searchParams.get('count');
  const total = searchParams.get('total');

  // Rediriger si pas connecté
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  // Charger les locations
  useEffect(() => {
    if (session) {
      loadRentals();
    }
  }, [session]);

  const loadRentals = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/rentals/user');
      const data = await response.json();

      if (data.success) {
        setRentals(data.data);
      } else {
        throw new Error(
          data.message || 'Erreur lors du chargement des locations'
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnBook = async (rentalId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retourner ce livre ?')) return;

    try {
      setActionLoading((prev) => new Set(prev.add(rentalId)));

      const response = await fetch(`/api/rentals/${rentalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'return',
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Recharger les locations
        await loadRentals();
      } else {
        throw new Error(data.message || 'Erreur lors du retour du livre');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setActionLoading((prev) => {
        const newSet = new Set(prev);
        newSet.delete(rentalId);
        return newSet;
      });
    }
  };

  const handleCancelRental = async (rentalId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette location ?')) return;

    try {
      setActionLoading((prev) => new Set(prev.add(rentalId)));

      const response = await fetch(`/api/rentals/${rentalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Recharger les locations
        await loadRentals();
      } else {
        throw new Error(data.message || "Erreur lors de l'annulation");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setActionLoading((prev) => {
        const newSet = new Set(prev);
        newSet.delete(rentalId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };

    const labels = {
      ACTIVE: 'En cours',
      COMPLETED: 'Terminée',
      CANCELLED: 'Annulée',
    };

    return (
      <span
        className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles]}`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    );
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

  const isOverdue = (rental: RentalItem) => {
    if (rental.status !== 'ACTIVE') return false;
    return new Date(rental.endDate) < new Date();
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Filtrer les locations
  const filteredRentals = rentals.filter((rental) => {
    if (filter === 'ALL') return true;
    return rental.status === filter;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de vos locations...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Mes Locations</h1>
          <p className="mt-2 text-gray-600">
            Gérez vos locations de livres en cours et passées
          </p>
        </div>

        {/* Message de succès du checkout */}
        {success === 'checkout' && count && total && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <svg
                className="w-5 h-5 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Checkout réussi !
                </h3>
                <p className="mt-1 text-sm text-green-700">
                  {count} livre{parseInt(count) > 1 ? 's' : ''} loué
                  {parseInt(count) > 1 ? 's' : ''} pour un total de{' '}
                  {parseFloat(total).toFixed(2)}€
                </p>
              </div>
            </div>
          </div>
        )}

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

        {/* Filtres */}
        <div className="mb-6 flex flex-wrap gap-2">
          {(['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as FilterStatus[]).map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {status === 'ALL'
                  ? 'Toutes'
                  : status === 'ACTIVE'
                    ? 'En cours'
                    : status === 'COMPLETED'
                      ? 'Terminées'
                      : 'Annulées'}
                {status !== 'ALL' &&
                  ` (${rentals.filter((r) => r.status === status).length})`}
              </button>
            )
          )}
        </div>

        {filteredRentals.length === 0 ? (
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
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'ALL'
                ? 'Aucune location trouvée'
                : `Aucune location ${filter.toLowerCase()}`}
            </h2>
            <p className="text-gray-600 mb-6">
              {filter === 'ALL'
                ? "Vous n'avez pas encore loué de livres."
                : `Vous n'avez aucune location ${filter.toLowerCase()}.`}
            </p>
            {filter === 'ALL' && (
              <button
                onClick={() => router.push('/')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Parcourir les livres
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRentals.map((rental) => {
              const daysRemaining = getDaysRemaining(rental.endDate);
              const overdue = isOverdue(rental);

              return (
                <div
                  key={rental.id}
                  className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${
                    overdue
                      ? 'border-red-500'
                      : rental.status === 'ACTIVE'
                        ? 'border-green-500'
                        : rental.status === 'COMPLETED'
                          ? 'border-blue-500'
                          : 'border-gray-500'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {rental.book.imgUrl ? (
                        <Image
                          src={rental.book.imgUrl}
                          alt={rental.book.title}
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
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {rental.book.title}
                          </h3>
                          <p className="text-gray-600 mb-2">
                            par {rental.book.author}
                          </p>

                          {rental.book.categoryName && (
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">
                              {rental.book.categoryName}
                            </span>
                          )}

                          {renderStars(rental.book.stars)}
                        </div>

                        <div className="flex flex-col items-end space-y-2">
                          {getStatusBadge(rental.status)}
                          <p className="text-xl font-bold text-gray-900">
                            {rental.book.price.toFixed(2)}€
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Début :</span>
                          <p className="font-medium">
                            {new Date(rental.startDate).toLocaleDateString(
                              'fr-FR'
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Fin prévue :</span>
                          <p className="font-medium">
                            {new Date(rental.endDate).toLocaleDateString(
                              'fr-FR'
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Durée :</span>
                          <p className="font-medium">
                            {rental.duration} jour
                            {rental.duration > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      {rental.status === 'ACTIVE' && (
                        <div className="mt-2">
                          <span className="text-gray-500 text-sm">
                            Temps restant :
                          </span>
                          <p
                            className={`font-medium text-sm ${overdue ? 'text-red-600' : daysRemaining <= 3 ? 'text-orange-600' : 'text-green-600'}`}
                          >
                            {overdue
                              ? `En retard de ${Math.abs(daysRemaining)} jour${Math.abs(daysRemaining) > 1 ? 's' : ''}`
                              : daysRemaining > 0
                                ? `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''}`
                                : "Se termine aujourd'hui"}
                          </p>
                        </div>
                      )}

                      {rental.returnDate && (
                        <div className="mt-2">
                          <span className="text-gray-500 text-sm">
                            Retourné le :
                          </span>
                          <p className="font-medium text-sm">
                            {new Date(rental.returnDate).toLocaleDateString(
                              'fr-FR'
                            )}
                          </p>
                        </div>
                      )}

                      {rental.comment && (
                        <div className="mt-2">
                          <span className="text-gray-500 text-sm">
                            Commentaire :
                          </span>
                          <p className="text-sm italic text-gray-700">
                            {rental.comment}
                          </p>
                        </div>
                      )}

                      {rental.status === 'ACTIVE' && (
                        <div className="mt-4 flex space-x-3">
                          <button
                            onClick={() => handleReturnBook(rental.id)}
                            disabled={actionLoading.has(rental.id)}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            {actionLoading.has(rental.id)
                              ? 'Traitement...'
                              : 'Retourner le livre'}
                          </button>
                          <button
                            onClick={() => handleCancelRental(rental.id)}
                            disabled={actionLoading.has(rental.id)}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            {actionLoading.has(rental.id)
                              ? 'Traitement...'
                              : 'Annuler'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
