'use client';
import React from 'react';

export type FilterType = 'date' | 'title' | 'rating';
export type FilterOrder = 'asc' | 'desc';

export type FilterProps = {
  type: FilterType;
  order: FilterOrder;
  onChange: (type: FilterType, order: FilterOrder) => void;
};

export default function Filter({ type, order, onChange }: FilterProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded shadow">
      <label className="flex flex-col text-sm">
        Filtrer par&nbsp;
        <select
          value={type}
          onChange={(e) => onChange(e.target.value as FilterType, order)}
          className="border rounded p-1"
        >
          <option value="date">Date</option>
          <option value="title">Titre</option>
          <option value="rating">Note</option>
        </select>
      </label>
      <label className="flex flex-col text-sm">
        Ordre&nbsp;
        <select
          value={order}
          onChange={(e) => onChange(type, e.target.value as FilterOrder)}
          className="border rounded p-1"
        >
          <option value="asc">Croissant</option>
          <option value="desc">Décroissant</option>
        </select>
      </label>
    </div>
  );
}
