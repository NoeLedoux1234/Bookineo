# Configuration de développement Bookineo

## Commands à exécuter pour le développement

### Installation et setup initial

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
```

### Développement quotidien

```bash
npm run dev              # Lancer le serveur de développement
npm run lint             # Vérifier le code
npm run format           # Formatter le code
npm run type-check       # Vérifier les types TypeScript
```

### Base de données

```bash
npm run db:generate      # Générer le client Prisma
npm run db:migrate       # Créer/appliquer les migrations
npm run db:push          # Pousser le schéma (dev seulement)
npm run db:studio        # Interface graphique Prisma
```

### Production

```bash
npm run build           # Build de production
npm run start           # Démarrer en production
```

## Architecture du projet

- **Next.js 15** avec App Router
- **TypeScript** pour la sécurité des types
- **TailwindCSS** pour le styling
- **Prisma** pour l'ORM
- **NextAuth.js** pour l'authentification
- **PostgreSQL** comme base de données

## Notes importantes

- Le projet utilise le nouveau App Router de Next.js
- L'authentification est configurée avec NextAuth.js et Prisma
- Les styles utilisent TailwindCSS avec des couleurs personnalisées
- Le code est validé avec ESLint et formaté avec Prettier
- Husky s'occupe des pre-commit hooks

## Variables d'environnement requises

Voir `.env.example` pour la liste complète des variables nécessaires.
