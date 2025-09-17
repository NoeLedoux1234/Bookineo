'use client';
import React from 'react';
import Image from 'next/image';
import styles from './CardStars.module.css';

export type BookCardProps = {
  image: string;
  title: string;
  author: string;
  rating: number;
  description: string;
  genre: string;
  onAddToCart?: () => void;
};

export default function Card({
  image,
  title,
  author,
  rating,
  description,
  genre,
  onAddToCart,
}: BookCardProps) {
  const maxStars = 5;
  const percent = Math.max(0, Math.min(1, rating / maxStars)) * 100;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col w-72">
      <div className="relative h-48 w-full">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover rounded-t-lg"
          sizes="(max-width: 400px) 100vw, 400px"
        />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full ml-2">
            {genre}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-1">{author}</p>
        <div className="flex items-center mb-2">
          <span className={styles.stars} aria-hidden="true">
            <mark
              className={styles.mark}
              style={{ width: `${percent}%` }}
            ></mark>
          </span>
          <span className={styles.ratingText}>{rating.toFixed(1)}</span>
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
