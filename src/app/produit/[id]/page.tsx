'use client';
import { useState, useEffect } from 'react';
import { use } from 'react';
import Image from 'next/image';
import AddToCartButton from '@/components/AddToCartButton';

type Book = {
  id: string;
  title: string;
  author: string;
  categoryName: string;
  stars?: number;
  description?: string;
  price: number;
  imgUrl?: string;
};

export default function ProduitPage({ params }: { params: { id: string } }) {
  const { id } = use(params as unknown as Promise<{ id: string }>);
  const [book, setBook] = useState<Book | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBook() {
      setLoading(true);
      const res = await fetch(`/api/books/${id}`);
      const data = await res.json();
      setBook(data.data);
      setLoading(false);
    }
    fetchBook();
  }, [id]);

  if (loading || !book) return <div>Chargement...</div>;

  const pricePerDay = book.price;
  // Calcul du nombre de jours entre startDate et endDate
  let days = 1;
  if (startDate && endDate) {
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const diff = Math.ceil(
      (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)
    );
    days = diff > 0 ? diff : 1;
  }
  const totalPrice = (pricePerDay * days).toFixed(2);

  // Calculer min et max pour les calendriers
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const minDate = `${yyyy}-${mm}-${dd}`;
  const maxDateObj = new Date(today);
  maxDateObj.setMonth(maxDateObj.getMonth() + 1);
  const maxyyyy = maxDateObj.getFullYear();
  const maxmm = String(maxDateObj.getMonth() + 1).padStart(2, '0');
  const maxdd = String(maxDateObj.getDate()).padStart(2, '0');
  const maxDate = `${maxyyyy}-${maxmm}-${maxdd}`;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative w-64 h-96">
          <Image
            src={book.imgUrl || '/default.jpg'}
            alt={book.title}
            fill
            className="object-cover rounded"
          />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-2">{book.title}</h1>
          <p className="text-gray-700 mb-1">Auteur : {book.author}</p>
          <p className="text-gray-700 mb-1">Catégorie : {book.categoryName}</p>
          <p className="text-gray-700 mb-1">
            Note : {book.stars?.toFixed(1) || 'N/A'} / 5
          </p>
          <p className="text-gray-700 mb-1">
            Description : {book.description || 'Aucune description.'}
          </p>
          <p className="text-blue-700 font-semibold mt-4">
            Prix location/jour : {pricePerDay.toFixed(2)} €
          </p>
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-2">
              <label htmlFor="start-date" className="mr-2">
                Date de début :
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                min={minDate}
                max={maxDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded p-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="end-date" className="mr-2">
                Date de fin :
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                min={startDate || minDate}
                max={maxDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border rounded p-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Nombre de jours :</span>
              <span>{days}</span>
            </div>
          </div>
          <p className="mt-2 text-lg font-bold">Prix total : {totalPrice} €</p>
          <AddToCartButton
            bookId={book.id}
            size="lg"
            variant="primary"
            className="mt-6"
          />
        </div>
      </div>
    </div>
  );
}
