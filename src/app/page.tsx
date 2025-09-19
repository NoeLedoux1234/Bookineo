'use client';

import React, { JSX } from 'react';
import type { FilterType } from '@/components/Filter';
import Card from '@/components/Card';
import Filter from '@/components/Filter';

export default function HomePage(): JSX.Element {
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

  React.useEffect(() => {
    async function fetchBooks() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '9',
          sortBy: filterType,
          sortOrder: filterOrder,
        });
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
  }, [filterType, filterOrder, page]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">
        Bienvenue sur Bookineo
      </h1>
      <div className="w-full mb-8">
        <Filter
          type={filterType}
          order={filterOrder}
          onChange={(type, order) => {
            setFilterType(type);
            setFilterOrder(order);
            setPage(1);
          }}
        />
      </div>
      <div className="w-full flex flex-col items-center">
        {loading ? (
          <div className="text-center py-8">Chargement des livres...</div>
        ) : (
          <div className="w-full Subgrid">
            {books.map((book) => (
              <Card
                key={book.id}
                image={book.imgUrl || '/file.svg'}
                title={book.title}
                author={book.author}
                rating={book.stars ?? 0}
                description={book.price ? `${book.price} €` : ''}
                genre={book.categoryName || 'Livre'}
                onAddToCart={() => alert(`Ajouté au panier : ${book.title}`)}
              />
            ))}
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
