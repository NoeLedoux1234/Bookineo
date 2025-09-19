'use client';
import React, { useState } from 'react';

export type FilterType = 'title' | 'stars';
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
  onValidate,
}: FilterProps & { onValidate?: () => void }) {
  // Local filter state (not applied until validation)
  const [localSearchTitle, setLocalSearchTitle] = useState('');
  const [localStatus, setLocalStatus] = useState('');
  const [localCategory, setLocalCategory] = useState('');
  const [localAuthor, setLocalAuthor] = useState('');
  const [localPriceMin, setLocalPriceMin] = useState('');
  const [localPriceMax, setLocalPriceMax] = useState('');
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [authorSuggestions, setAuthorSuggestions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);

  // Fetch categories on mount
  React.useEffect(() => {
    fetch('/api/books/suggestions?type=category')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.suggestions)) {
          setCategoryOptions(json.suggestions);
        }
      });
  }, []);

  // Fetch title suggestions
  React.useEffect(() => {
    if (localSearchTitle.length > 3) {
      fetch(
        `/api/books/suggestions?type=title&q=${encodeURIComponent(localSearchTitle)}`
      )
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.suggestions)) {
            setTitleSuggestions(json.suggestions);
            setShowTitleSuggestions(json.suggestions.length > 0);
          }
        });
    } else {
      setTitleSuggestions([]);
      setShowTitleSuggestions(false);
    }
  }, [localSearchTitle]);

  // Fetch author suggestions
  React.useEffect(() => {
    if (localAuthor.length > 3) {
      fetch(
        `/api/books/suggestions?type=author&q=${encodeURIComponent(localAuthor)}`
      )
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.suggestions)) {
            setAuthorSuggestions(json.suggestions);
            setShowAuthorSuggestions(json.suggestions.length > 0);
          }
        });
    } else {
      setAuthorSuggestions([]);
      setShowAuthorSuggestions(false);
    }
  }, [localAuthor]);

  return (
    <div className="fixed left-0 top-0 h-screen w-72 bg-white shadow-lg flex flex-col p-6 z-20">
      <form
        className="flex flex-col gap-6 flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          // Only apply filters on validate
          onSearchTitle?.(localSearchTitle);
          onStatusChange?.(localStatus);
          onCategoryChange?.(localCategory);
          onAuthorChange?.(localAuthor);
          onPriceChange?.(localPriceMin, localPriceMax);
          onValidate?.();
        }}
      >
        {/* Recherche par titre avec autocomplete */}
        <div className="flex flex-col text-sm relative">
          <label htmlFor="search-title">Recherche titre</label>
          <input
            id="search-title"
            type="text"
            value={localSearchTitle}
            onChange={(e) => {
              setLocalSearchTitle(e.target.value);
            }}
            className="border rounded p-1"
            placeholder="Titre du livre..."
            autoComplete="off"
          />
          {showTitleSuggestions && (
            <div className="absolute left-0 right-0 top-full bg-white border rounded shadow z-30 max-h-40 overflow-y-auto">
              {titleSuggestions.map((t) => (
                <div
                  key={t}
                  className="px-2 py-1 cursor-pointer hover:bg-blue-100"
                  onClick={() => {
                    setLocalSearchTitle(t);
                    setShowTitleSuggestions(false);
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Auteur autocomplete */}
        <div className="flex flex-col text-sm relative">
          <label htmlFor="author">Auteur</label>
          <input
            id="author"
            type="text"
            value={localAuthor}
            onChange={(e) => {
              setLocalAuthor(e.target.value);
            }}
            className="border rounded p-1"
            placeholder="Nom de l'auteur..."
            autoComplete="off"
          />
          {showAuthorSuggestions && (
            <div className="absolute left-0 right-0 top-full bg-white border rounded shadow z-30 max-h-40 overflow-y-auto">
              {authorSuggestions.map((a) => (
                <div
                  key={a}
                  className="px-2 py-1 cursor-pointer hover:bg-blue-100"
                  onClick={() => {
                    setLocalAuthor(a);
                    setShowAuthorSuggestions(false);
                  }}
                >
                  {a}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Statut */}
        <div className="flex flex-col text-sm">
          <label>Statut</label>
          <select
            value={localStatus}
            onChange={(e) => {
              setLocalStatus(e.target.value);
            }}
            className="border rounded p-1"
          >
            <option value="">Tous</option>
            <option value="AVAILABLE">Disponible</option>
            <option value="RENTED">Loué</option>
          </select>
        </div>
        {/* Catégorie */}
        <div className="flex flex-col text-sm">
          <label htmlFor="category">Catégorie</label>
          <select
            id="category"
            value={localCategory}
            onChange={(e) => {
              setLocalCategory(e.target.value);
            }}
            className="border rounded p-1"
          >
            <option value="">Toutes</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        {/* Prix */}
        <div className="flex flex-col text-sm">
          <label>Prix (€)</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              value={localPriceMin}
              onChange={(e) => {
                setLocalPriceMin(e.target.value);
              }}
              className="border rounded p-1 w-20"
              placeholder="Min"
            />
            <span>-</span>
            <input
              type="number"
              min="0"
              value={localPriceMax}
              onChange={(e) => {
                setLocalPriceMax(e.target.value);
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
              <option value="stars">Note</option>
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
        <button
          type="submit"
          className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Valider
        </button>
      </form>
    </div>
  );
}
