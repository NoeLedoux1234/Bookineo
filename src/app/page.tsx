'use client';

import React, { JSX } from 'react';
import type { FilterType } from '@/components/Filter';
import Card from '@/components/Card';
import Filter from '@/components/Filter';

export default function HomePage(): JSX.Element {
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [filterType, setFilterType] = React.useState<FilterType>('title');
  const [filterOrder, setFilterOrder] = React.useState<'asc' | 'desc'>('asc');
  type BookType = {
    id: string;
    imgUrl?: string;
    title: string;
    author: string;
    stars?: number;
    price?: number;
    categoryName?: string;
  };
  const [books, setBooks] = React.useState<BookType[]>([]);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  // Filter states
  const [searchTitle, setSearchTitle] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [author, setAuthor] = React.useState('');
  const [priceMin, setPriceMin] = React.useState('');
  const [priceMax, setPriceMax] = React.useState('');

  // Show all books by default, only apply filters after 'Valider'
  const [filtersApplied, setFiltersApplied] = React.useState(false);

  React.useEffect(() => {
    async function fetchBooks() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '9',
          sortBy: filterType === 'stars' ? 'stars' : filterType,
          sortOrder: filterOrder,
        });
        // Only add filters if filtersApplied
        if (filtersApplied) {
          if (searchTitle) params.append('search', searchTitle);
          if (status) params.append('status', status);
          if (category) params.append('category', category);
          if (author) params.append('author', author);
          if (priceMin) params.append('priceMin', priceMin);
          if (priceMax) params.append('priceMax', priceMax);
        }
        const res = await fetch(`/api/books?${params.toString()}`);
        const json = await res.json();
        if (json.success && json.data) {
          setBooks(json.data.items || []);
          setTotalPages(json.data.totalPages || 1);
        }
      } catch {
        setBooks([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, [
    filtersApplied,
    filterType,
    filterOrder,
    page,
    searchTitle,
    status,
    category,
    author,
    priceMin,
    priceMax,
  ]);

  // Handler for 'Valider' button
  const handleValidate = () => {
    setFiltersApplied(true);
    setPage(1);
    setIsFilterOpen(false); // Ferme le tiroir après validation
  };

  return (
    <main className="min-h-screen flex bg-gray-50 relative">
      {/* Bouton d'ouverture du tiroir : visible sur tablette et moins */}
      <button
        className="absolute top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white rounded shadow hover:bg-blue-50 transition lg:hidden"
        onClick={() => setIsFilterOpen(true)}
        aria-label="Ouvrir les filtres"
      >
        <svg
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span className="font-semibold">Filtres</span>
      </button>

      {/* Overlay flou et tiroir : md et moins */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
            onClick={() => setIsFilterOpen(false)}
          />
          <aside
            className="relative bg-white shadow-lg p-6 w-full max-w-xs h-full z-50 transition-transform duration-300"
            style={{ transform: 'translateX(0)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-lg font-bold">Filtres</span>
              <button
                className="p-2 rounded hover:bg-gray-100"
                onClick={() => setIsFilterOpen(false)}
                aria-label="Fermer"
              >
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>
            <Filter
              type={filterType}
              order={filterOrder}
              onChange={(type, order) => {
                setFilterType(type);
                setFilterOrder(order);
              }}
              onSearchTitle={setSearchTitle}
              onStatusChange={setStatus}
              onCategoryChange={setCategory}
              onAuthorChange={setAuthor}
              onPriceChange={(min, max) => {
                setPriceMin(min);
                setPriceMax(max);
              }}
              onValidate={handleValidate}
            />
          </aside>
        </div>
      )}
      <aside className="hidden lg:block w-72 bg-white shadow-lg p-6 border-r border-gray-200">
        <Filter
          type={filterType}
          order={filterOrder}
          onChange={(type, order) => {
            setFilterType(type);
            setFilterOrder(order);
          }}
          onSearchTitle={setSearchTitle}
          onStatusChange={setStatus}
          onCategoryChange={setCategory}
          onAuthorChange={setAuthor}
          onPriceChange={(min, max) => {
            setPriceMin(min);
            setPriceMax(max);
          }}
          onValidate={handleValidate}
        />
      </aside>

      <div className="flex-1 flex flex-col items-center justify-center p-6 md:ml-72">
        {loading ? (
          <div className="text-center py-8">Chargement des livres...</div>
        ) : (
          <div className="w-full Subgrid">
            {books.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun livre trouvé.
              </div>
            ) : (
              books.map((book) => (
                <Card
                  key={book.id}
                  id={book.id}
                  image={book.imgUrl || '/file.svg'}
                  title={book.title}
                  author={book.author}
                  rating={book.stars ?? 0}
                  description={book.price ? `${book.price} €` : ''}
                  genre={book.categoryName || 'Livre'}
                />
              ))
            )}
          </div>
        )}
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Précédent
          </button>
          <span className="px-2">
            Page {page} / {totalPages}
          </span>
          <button
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Suivant
          </button>
        </div>
      </div>
    </main>
  );
}
