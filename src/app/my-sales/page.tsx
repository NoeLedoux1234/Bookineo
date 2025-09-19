'use client';

import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  imgUrl: string | null;
  stars: number | null;
  categoryName: string | null;
  status: 'AVAILABLE' | 'RENTED';
  createdAt: string;
  updatedAt: string;
}

interface BookFormData {
  title: string;
  author: string;
  price: number;
  categoryName: string;
  imgUrl: string;
  description: string;
  stars: number;
}

export default function MySalesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    author: '',
    price: 0,
    categoryName: '',
    imgUrl: '',
    description: '',
    stars: 5.0,
  });

  // Rediriger si pas connecté
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  // Charger les livres de l'utilisateur
  useEffect(() => {
    if (session) {
      loadMyBooks();
    }
  }, [session]);

  const loadMyBooks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/books/my-books');
      const data = await response.json();

      if (data.success) {
        setBooks(data.data.items || []);
      } else {
        throw new Error(data.message || 'Erreur lors du chargement des livres');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Reset form
        setFormData({
          title: '',
          author: '',
          price: 0,
          categoryName: '',
          imgUrl: '',
          description: '',
          stars: 5.0,
        });
        setShowAddForm(false);
        // Recharger la liste
        await loadMyBooks();
      } else {
        throw new Error(data.message || 'Erreur lors de la création du livre');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (bookId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce livre ?')) return;

    try {
      setDeletingIds((prev) => new Set(prev.add(bookId)));

      const response = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Recharger la liste
        await loadMyBooks();
      } else {
        throw new Error(data.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(bookId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'AVAILABLE') {
      return (
        <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          📖 Disponible
        </span>
      );
    }
    return (
      <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
        🔒 Loué
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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de vos livres...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Mes Ventes</h1>
          <p className="mt-2 text-gray-600">
            Gérez votre bibliothèque personnelle et ajoutez de nouveaux livres à
            louer
          </p>
        </div>

        <div className="mb-8">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            {showAddForm ? 'Annuler' : 'Ajouter un livre'}
          </button>
        </div>

        {showAddForm && (
          <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Ajouter un nouveau livre
            </h2>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre du livre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Entrez le titre du livre"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auteur *
                </label>
                <input
                  type="text"
                  required
                  value={formData.author}
                  onChange={(e) =>
                    setFormData({ ...formData, author: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nom de l'auteur"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prix de location (€) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie *
                </label>
                <input
                  type="text"
                  required
                  value={formData.categoryName}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryName: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Fiction, Science-Fiction, Romance..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de l&apos;image de couverture
                </label>
                <input
                  type="url"
                  value={formData.imgUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imgUrl: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/cover.jpg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Description du livre..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (étoiles) * - de 1.0 à 5.0
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formData.stars}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stars: parseFloat(e.target.value) || 1,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="4.6"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Exemple: 4.6 pour 4 étoiles et demie
                </p>
              </div>

              <div className="md:col-span-2 flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {submitting ? 'Création...' : 'Créer le livre'}
                </button>
              </div>
            </form>
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

        {books.length === 0 ? (
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
              Aucun livre trouvé
            </h2>
            <p className="text-gray-600 mb-6">
              Commencez par ajouter votre premier livre à votre collection
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Ajouter mon premier livre
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Mes livres ({books.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book) => (
                <div key={book.id} className="relative">
                  <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
                    <div className="relative h-48 w-full">
                      {book.imgUrl ? (
                        <Image
                          src={book.imgUrl}
                          alt={book.title}
                          fill
                          className="object-cover rounded-lg"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-12 h-12 text-gray-400"
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
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        {getStatusBadge(book.status)}
                        {book.categoryName && (
                          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                            {book.categoryName}
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-gray-900 line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-sm text-gray-600">par {book.author}</p>

                      {renderStars(book.stars)}

                      <p className="text-lg font-bold text-gray-900">
                        {book.price.toFixed(2)}€
                      </p>

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            (window.location.href = `/produit/${book.id}`)
                          }
                          className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition"
                        >
                          Voir
                        </button>
                        <button
                          onClick={() => handleDelete(book.id)}
                          disabled={deletingIds.has(book.id)}
                          className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-3 rounded text-sm transition flex items-center gap-1"
                        >
                          {deletingIds.has(book.id) ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </button>
                      </div>

                      <div className="text-xs text-gray-500 pt-2 border-t">
                        <p>
                          Créé le{' '}
                          {new Date(book.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
