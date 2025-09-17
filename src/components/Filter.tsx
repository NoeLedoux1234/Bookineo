'use client';
import React, { useState } from 'react';

export type FilterType = 'title' | 'rating';
export type FilterOrder = 'asc' | 'desc';

export type FilterProps = {
  type: FilterType;
  order: FilterOrder;
  onChange: (type: FilterType, order: FilterOrder) => void;
  // Add new filter callbacks for demo
  onSearchTitle?: (value: string) => void;
  onStatusChange?: (value: string) => void;
  onCategoryChange?: (value: string) => void;
  onAuthorChange?: (value: string) => void;
  onPriceChange?: (min: string, max: string) => void;
};

export default function Filter({
  type,
  order,
  onChange,
  onSearchTitle,
  onStatusChange,
  onCategoryChange,
  onAuthorChange,
  onPriceChange,
}: FilterProps) {
  const [searchTitle, setSearchTitle] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [author, setAuthor] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  // Demo categories and authors
  const categories = [
    'Roman',
    'Science-fiction',
    'Fantastique',
    'Policier',
    'Jeunesse',
    'Business',
    'Santé',
    'Biographie',
  ];
  const authors = [
    'Emily Brontë',
    'J. R. R. Tolkien',
    'C. S. Lewis',
    'Maurice Sendak',
    'Shel Silverstein',
    'Mark Manson',
    'Karin Slaughter',
    'Sally Thorne',
  ];

  return (
    <form className="flex flex-wrap gap-4 p-4 bg-white rounded shadow items-end">
      {/* Recherche par titre */}
      <div className="flex flex-col text-sm">
        <label htmlFor="search-title">Recherche titre</label>
        <input
          id="search-title"
          type="text"
          value={searchTitle}
          onChange={(e) => {
            setSearchTitle(e.target.value);
            onSearchTitle?.(e.target.value);
          }}
          className="border rounded p-1"
          placeholder="Titre du livre..."
        />
      </div>
      {/* Statut */}
      <div className="flex flex-col text-sm">
        <label>Statut</label>
        <div className="flex gap-2 mt-1">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="status"
              value="Disponible"
              checked={status === 'Disponible'}
              onChange={(e) => {
                setStatus(e.target.value);
                onStatusChange?.(e.target.value);
              }}
            />
            Disponible
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              name="status"
              value="Loué"
              checked={status === 'Loué'}
              onChange={(e) => {
                setStatus(e.target.value);
                onStatusChange?.(e.target.value);
              }}
            />
            Loué
          </label>
        </div>
      </div>
      {/* Catégorie */}
      <div className="flex flex-col text-sm">
        <label htmlFor="category">Catégorie</label>
        <select
          id="category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            onCategoryChange?.(e.target.value);
          }}
          className="border rounded p-1"
        >
          <option value="">Toutes</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      {/* Auteur autocomplete */}
      <div className="flex flex-col text-sm">
        <label htmlFor="author">Auteur</label>
        <input
          id="author"
          type="text"
          value={author}
          onChange={(e) => {
            setAuthor(e.target.value);
            onAuthorChange?.(e.target.value);
          }}
          className="border rounded p-1"
          list="author-list"
          placeholder="Nom de l'auteur..."
        />
        <datalist id="author-list">
          {authors.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
      </div>
      {/* Prix */}
      <div className="flex flex-col text-sm">
        <label>Prix (€)</label>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            value={priceMin}
            onChange={(e) => {
              setPriceMin(e.target.value);
              onPriceChange?.(e.target.value, priceMax);
            }}
            className="border rounded p-1 w-20"
            placeholder="Min"
          />
          <span>-</span>
          <input
            type="number"
            min="0"
            value={priceMax}
            onChange={(e) => {
              setPriceMax(e.target.value);
              onPriceChange?.(priceMin, e.target.value);
            }}
            className="border rounded p-1 w-20"
            placeholder="Max"
          />
        </div>
      </div>
      {/* Tri principal */}
      <div className="flex flex-col text-sm">
        <label>Tri</label>
        <div className="flex gap-2">
          <select
            value={type}
            onChange={(e) => onChange(e.target.value as FilterType, order)}
            className="border rounded p-1"
          >
            <option value="title">Titre (A-Z)</option>
            <option value="rating">Note</option>
          </select>
          <select
            value={order}
            onChange={(e) => onChange(type, e.target.value as FilterOrder)}
            className="border rounded p-1"
          >
            <option value="asc">Croissant</option>
            <option value="desc">Décroissant</option>
          </select>
        </div>
      </div>
    </form>
  );
}
