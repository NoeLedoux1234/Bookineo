# 📚 Import de Datasets de Livres

## 🗂️ Organisation

Placez vos fichiers JSON de livres dans ce dossier :

```
datasets/
├── books.json              # Votre dataset principal (5000-19000 livres)
├── books-sample.json       # Échantillon de test (généré automatiquement)
└── README.md              # Ce fichier
```

## 🎲 Fonctionnement

Le système d'import :

- Prend **1000 livres ALÉATOIRES** de votre dataset
- Applique un filtrage basique (titre, auteur, prix > 0, rating > 0)
- Évite les doublons (ASIN ou titre+auteur)
- Traite par batch de 50 livres

## 🚀 Comment importer

### Méthode 1: Script de test (recommandé)

```bash
# Avec votre fichier
node scripts/test-import.js datasets/books.json

# Ou avec l'échantillon de test
node scripts/test-import.js
```

### Méthode 2: API directe

```bash
curl -X POST http://localhost:3000/api/admin/books/import \
  -H "Content-Type: application/json" \
  -d @datasets/books.json
```

## 📋 Vérifications avant import

```bash
# Vérifier l'état actuel
curl http://localhost:3000/api/admin/books/import

# Nettoyer la base (dev uniquement)
curl -X DELETE http://localhost:3000/api/admin/books/import
```

## 📊 Format attendu

Votre fichier JSON doit être un array d'objets avec cette structure minimum :

```json
[
  {
    "asin": "string",
    "title": "string",
    "brand": "string",
    "final_price": number,
    "rating": "4.5 out of 5 stars",
    "reviews_count": number,
    "categories": ["Books", "Fiction"],
    "image_url": "string",
    // ... autres champs optionnels
  }
]
```

## ⚙️ Configuration

Dans `/src/services/BookImportService.ts` :

- `MAX_BOOKS = 1000` : Nombre max de livres à importer
- `BATCH_SIZE = 50` : Taille des batch de traitement
- Filtres de qualité modifiables

## 🗑️ Nettoyage

En développement, vous pouvez vider la base :

```bash
curl -X DELETE http://localhost:3000/api/admin/books/import
```
