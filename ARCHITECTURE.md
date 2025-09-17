# Architecture Backend - Bookineo

## Vue d'ensemble

Cette application utilise une architecture en couches clean et optimisée pour Next.js 15, suivant les meilleures pratiques modernes de développement backend.

## Structure des dossiers

```
src/
├── types/                   # Définitions TypeScript
│   ├── api.ts              # Types pour les API
│   └── database.ts         # Types pour la base de données
├── lib/                    # Couche de base
│   ├── database/           # Couche d'accès aux données
│   │   ├── client.ts       # Client Prisma configuré
│   │   ├── BaseRepository.ts # Repository de base
│   │   └── repositories/   # Repositories spécifiques
│   ├── errors/            # Gestion d'erreurs centralisée
│   │   ├── AppError.ts    # Classes d'erreur personnalisées
│   │   └── errorHandler.ts # Gestionnaire global d'erreurs
│   ├── validation/        # Validation des données
│   │   ├── schemas.ts     # Schémas Zod
│   │   └── validator.ts   # Utilitaires de validation
│   ├── auth/             # Authentification (legacy)
│   └── utils/            # Utilitaires partagés
├── services/             # Couche de logique métier
├── controllers/          # Couche de présentation
├── middlewares/          # Middlewares Express-style
└── app/api/             # Routes Next.js (couche fine)
```

## Couches de l'architecture

### 1. Couche de données (Database Layer)

- **Repository Pattern** : Abstraction de l'accès aux données
- **BaseRepository** : Opérations CRUD génériques
- **Repositories spécifiques** : UserRepository, MessageRepository, etc.
- **Client Prisma optimisé** : Configuration singleton avec gestion des connexions

### 2. Couche de services (Business Logic Layer)

- **Logique métier** centralisée
- **Validation des règles** d'affaires
- **Orchestration** des operations complexes
- **Transformation des données**

### 3. Couche de contrôleurs (Presentation Layer)

- **Gestion des requêtes/réponses** HTTP
- **Validation des entrées** utilisateur
- **Formatage des sorties**
- **Gestion de l'authentification**

### 4. Couche de routes (API Layer)

- **Routes Next.js minimalistes**
- **Application des middlewares**
- **Délégation aux contrôleurs**

## Fonctionnalités principales

### Gestion d'erreurs

```typescript
// Erreurs typées et centralisées
throw AppError.badRequest("Message d'erreur", { field: 'Details' });
throw new ResourceNotFoundError('User', userId);

// Gestionnaire global
export const GET = withErrorHandler(async (request) => {
  // Votre logique ici
});
```

### Validation

```typescript
// Schémas Zod réutilisables
const userSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Validation automatique
const validatedData = validateData(userSchema, requestData);
```

### Sécurité

```typescript
// Middlewares de sécurité
applySecurityMiddleware(request); // Validation CORS, headers, etc.
applyRateLimit(request, 'strict'); // Rate limiting intelligent
```

### Repositories

```typescript
// Repository pattern avec generics
class UserRepository extends BaseRepository<
  User,
  CreateUserData,
  UpdateUserData
> {
  // Méthodes spécifiques aux utilisateurs
  async findByEmail(email: string): Promise<User | null> {
    // Implementation
  }
}

// Utilisation
const user = await userRepository.findById(id);
const users = await userRepository.findMany(filters, pagination);
```

## Middlewares de sécurité

### Rate Limiting

- **Intelligent** : Basé sur IP et utilisateur
- **Configurable** : Différents niveaux selon l'endpoint
- **Memory-based** : Production-ready avec Redis

### Validation de sécurité

- **CORS** validation
- **Content-Type** whitelisting
- **Body size** limitations
- **Suspicious patterns** detection
- **IP validation**

### Headers de sécurité

- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security (HTTPS)
- Et plus...

## Types TypeScript

### Types API

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string | string[]>;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

### Types Database

```typescript
interface UserWithRelations extends User {
  ownedBooks?: BookWithRelations[];
  sentMessages?: MessageWithRelations[];
}
```

## Exemples d'utilisation

### Créer une nouvelle route API

```typescript
// 1. Dans /app/api/resource/route.ts
import { resourceController } from '@/controllers/ResourceController';
import { withErrorHandler } from '@/lib/errors/errorHandler';
import { applyRateLimit } from '@/middlewares/rateLimiter';

export const GET = withErrorHandler(async (request) => {
  applyRateLimit(request, 'moderate');
  return await resourceController.getAll(request);
});
```

### Créer un service

```typescript
// 2. Dans /services/ResourceService.ts
export class ResourceService {
  async createResource(data: CreateResourceData): Promise<Resource> {
    // Validation métier
    this.validateBusinessRules(data);

    // Utiliser le repository
    return await resourceRepository.create(data);
  }
}
```

### Créer un repository

```typescript
// 3. Dans /lib/database/repositories/ResourceRepository.ts
export class ResourceRepository extends BaseRepository<
  Resource,
  CreateResourceData,
  UpdateResourceData
> {
  protected readonly modelName = 'Resource';
  protected readonly model = this.prisma.resource;

  // Méthodes spécifiques
}
```

## Bonnes pratiques

### 1. Séparation des préoccupations

- Chaque couche a une responsabilité unique
- Pas de logique métier dans les contrôleurs
- Pas d'accès direct à la DB dans les services

### 2. Gestion d'erreurs

- Utiliser les classes d'erreur typées
- Toujours wrapper les handlers avec `withErrorHandler`
- Logger les erreurs importantes

### 3. Validation

- Valider à l'entrée (contrôleurs)
- Valider la logique métier (services)
- Utiliser des schémas Zod réutilisables

### 4. Sécurité

- Appliquer les middlewares sur toutes les routes
- Utiliser le rate limiting approprié
- Valider et nettoyer toutes les entrées

### 5. Performance

- Utiliser la pagination
- Optimiser les requêtes avec `select` et `include`
- Gérer les connexions DB efficacement

## Migration depuis l'ancienne architecture

1. **Routes** : Remplacer le code par des appels aux contrôleurs
2. **Logique** : Déplacer vers les services
3. **Données** : Utiliser les repositories
4. **Erreurs** : Migrer vers les nouvelles classes d'erreur
5. **Validation** : Utiliser les nouveaux schémas Zod

## Tests

```typescript
// Tests unitaires pour les services
describe('UserService', () => {
  it('should create user', async () => {
    const userData = { email: 'test@example.com', password: 'password' };
    const user = await userService.createUser(userData);
    expect(user.email).toBe(userData.email);
  });
});
```

## Monitoring et Observabilité

- Logs structurés avec des niveaux
- Métriques de performance automatiques
- Tracing des erreurs avec stack traces
- Rate limiting analytics

Cette architecture garantit une maintenabilité, une sécurité et une performance optimales pour l'application Bookineo.
