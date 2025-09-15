# Bookineo 📚

Application web responsive de location de livres entre particuliers développée avec Next.js, TypeScript, et PostgreSQL.

## 🎯 Fonctionnalités

- **Authentification sécurisée** : Inscription/connexion avec validation des mots de passe
- **Gestion des livres** : Ajout, modification, suppression et recherche de livres
- **Système de location** : Location et restitution de livres avec suivi des dates
- **Messagerie** : Communication entre utilisateurs
- **Profil utilisateur** : Gestion des informations personnelles
- **Historique** : Suivi complet des locations
- **Interface responsive** : Adaptée mobile, tablette et desktop
- **Chatbot** : Assistant virtuel pour les questions fréquentes

## 🛠️ Technologies

- **Frontend** : Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend** : Next.js API Routes, NextAuth.js
- **Base de données** : PostgreSQL avec Prisma ORM
- **Authentification** : NextAuth.js avec stratégie credentials
- **Sécurité** : Mots de passe hashés avec bcryptjs
- **Validation** : Validation côté client et serveur
- **Qualité du code** : ESLint, Prettier, Husky, lint-staged

## 📋 Prérequis

- Node.js 18+
- PostgreSQL 15+
- npm ou yarn

## 🚀 Installation

1. **Cloner le repository**

   ```bash
   git clone <repository-url>
   cd bookineo
   ```

2. **Installer les dépendances**

   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**

   ```bash
   cp .env.example .env
   ```

   ⚠️ **Important** : Le fichier `.env` est déjà configuré avec Prisma Postgres local.
   Pas besoin de le modifier pour le développement local !

4. **Démarrer la base de données PostgreSQL locale**

   ```bash
   # Démarrer le serveur Prisma PostgreSQL (LAISSER TOURNER)
   npx prisma dev
   ```

   ⚠️ **Gardez ce terminal ouvert** - il fait tourner votre base de données !

5. **Dans un NOUVEAU terminal, configurer la base de données**

   ```bash
   # Générer le client Prisma
   npm run db:generate

   # Créer et appliquer les migrations (nommer la migration "init")
   npm run db:migrate
   ```

6. **Lancer le serveur de développement**

   ```bash
   npm run dev
   ```

   Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## ⚡ **TL;DR - Commandes rapides pour démarrer :**

```bash
# Terminal 1 (laisser ouvert)
npx prisma dev

# Terminal 2
npm install
npm run db:generate
npm run db:migrate  # nommer "init"
npm run dev
```

## 📁 Structure du projet

```
bookineo/
├── prisma/                 # Schéma de base de données
├── src/
│   ├── app/                # App Router de Next.js
│   │   ├── api/           # API Routes
│   │   ├── auth/          # Pages d'authentification
│   │   ├── dashboard/     # Tableau de bord
│   │   └── ...
│   ├── components/         # Composants React
│   │   ├── ui/            # Composants UI réutilisables
│   │   ├── forms/         # Formulaires
│   │   └── layout/        # Composants de mise en page
│   ├── lib/               # Utilitaires et configurations
│   ├── types/             # Types TypeScript
│   └── utils/             # Fonctions utilitaires
├── public/                # Fichiers statiques
└── ...
```

## 🔧 Scripts disponibles

```bash
# Développement
npm run dev              # Lancer le serveur de développement
npm run build           # Build de production
npm run start           # Démarrer le serveur de production

# Qualité du code
npm run lint            # Linter le code
npm run lint:fix        # Corriger automatiquement les erreurs de lint
npm run format          # Formatter le code avec Prettier
npm run format:check    # Vérifier le formatage
npm run type-check      # Vérifier les types TypeScript

# Base de données
npx prisma generate     # Générer le client Prisma
npx prisma migrate dev  # Créer et appliquer une migration
npx prisma db push      # Pousser le schéma vers la base de données
npx prisma studio       # Interface graphique pour la base de données
```

## 🧪 Tests et validation

### Validation des champs

- Email : Format valide (ex: prenom.nom@domaine.com)
- Mot de passe : Minimum 8 caractères, une majuscule, une minuscule, un caractère spécial

### Tests recommandés

- Tests de validation des formulaires
- Tests de navigation entre les pages
- Tests UX responsive (mobile/tablette/desktop)
- Tests des rôles et sessions utilisateur
- Vérification des exports CSV
- Vérification des statuts de livres

## 📊 Base de données

### Modèles principaux

- **User** : Utilisateurs de l'application
- **Book** : Livres disponibles à la location
- **Rental** : Locations de livres
- **Message** : Messages entre utilisateurs

### Statuts

- **BookStatus** : `AVAILABLE`, `RENTED`
- **RentalStatus** : `ACTIVE`, `COMPLETED`, `CANCELLED`

## 🔐 Sécurité

- Mots de passe hashés avec bcryptjs
- Sessions sécurisées avec NextAuth.js
- Validation des données côté client et serveur
- Protection CSRF intégrée
- Variables d'environnement pour les secrets

## 🎨 Design

- Design responsive avec TailwindCSS
- Accessibilité (contraste, navigation clavier)
- Interface utilisateur cohérente et intuitive
- Icônes et visuels soignés

## 📝 Fonctionnalités détaillées

### Authentification

- Connexion/inscription sécurisée
- Validation en temps réel des formulaires
- Gestion des sessions
- "Remember me" option

### Gestion des livres

- Affichage en tableau avec filtres
- Recherche par titre, auteur, catégorie
- Statuts visuels (disponible/loué)
- Export CSV

### Système de location

- Location de livres avec dates
- Calcul automatique de la durée
- Suivi des retours
- Historique complet

### Messagerie

- Messages entre utilisateurs
- Notifications de messages non lus
- Interface intuitive

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème, ouvrir une issue sur GitHub ou contacter l'équipe de développement.
