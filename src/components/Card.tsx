'use client';
import React from 'react';
import Image from 'next/image';
import styles from './CardStars.module.css';

export type BookCardProps = {
  id: string;
  image: string;
  title: string;
  author: string;
  rating: number;
  description: string;
  genre: string;
};

export default function Card({
  id,
  image,
  title,
  author,
  rating,
  description,
  genre,
}: BookCardProps) {
  const maxStars = 5;
  const percent = Math.max(0, Math.min(1, rating / maxStars)) * 100;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden w-72 Card">
      <div className="relative h-48 w-full Top">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover rounded-t-lg"
          sizes="(max-width: 400px) 100vw, 400px"
        />
      </div>
      <p className="text-sm text-gray-600 mb-1">{author}</p>
      <h3 className="text-lg font-semibold line-clamp-2">{title}</h3>
      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1">
        {genre}
      </span>
      <div className="flex items-center mb-2">
        <span className={styles.stars} aria-hidden="true">
          <mark className={styles.mark} style={{ width: `${percent}%` }}></mark>
        </span>
        <span className={styles.ratingText}>{rating.toFixed(1)}</span>
      </div>
      <p className="text-sm text-gray-700 line-clamp-3">{description}</p>
      <button
        onClick={() => {
          window.location.href = `/produit/${id}`;
        }}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Voir plus
      </button>
    </div>
  );
}
