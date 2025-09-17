'use client';

import React, { JSX } from 'react';
import type { FilterType } from '@/components/Filter';
import Card from '@/components/Card';
import Filter from '@/components/Filter';

export default function HomePage(): JSX.Element {
  const [filterType, setFilterType] = React.useState<FilterType>(
    'date' as FilterType
  );
  const [filterOrder, setFilterOrder] = React.useState<'asc' | 'desc'>('asc');

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
          }}
        />
      </div>
      <div className="w-full">
        <div className="flex w-full">
          <Card
            image="/file.svg"
            title="Le Petit Prince"
            author="Antoine de Saint-Exupéry"
            rating={4.7}
            description="Un conte poétique et philosophique, incontournable de la littérature française. Découvrez l’histoire du Petit Prince et ses rencontres sur différentes planètes."
            genre="Conte"
            onAddToCart={() => alert('Ajouté au panier !')}
          />
        </div>
      </div>
    </main>
  );
}
