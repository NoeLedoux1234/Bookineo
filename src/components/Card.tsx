'use client';
import React from 'react';

export type BookCardProps = {
  image: string;
  title: string;
  author: string;
  rating: number;
  description: string;
  onAddToCart?: () => void;
};

export default function Card({
  image,
  title,
  author,
  rating,
  description,
  onAddToCart,
}: BookCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col w-72">
      <img src={image} alt={title} className="h-48 w-full object-cover" />
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-1">{author}</p>
        <div className="flex items-center mb-2">
          <span className="text-yellow-500 mr-1">
            {'★'.repeat(Math.round(rating))}
          </span>
          <span className="text-xs text-gray-500">{rating.toFixed(1)}</span>
        </div>
        <p className="text-sm text-gray-700 mb-4 line-clamp-3">{description}</p>
        <button
          onClick={onAddToCart}
          className="mt-auto bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          Ajouter au panier
        </button>
      </div>
    </div>
  );
}
