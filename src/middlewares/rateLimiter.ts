import { NextRequest } from 'next/server';
import { AppError } from '@/lib/errors/AppError';

// Interface pour la configuration du rate limiter
interface RateLimiterConfig {
  windowMs: number; // Fenêtre de temps en millisecondes
  maxRequests: number; // Nombre maximum de requêtes
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
}

// Stockage en mémoire (pour production, utiliser Redis)
const rateLimitStore = new Map<
  string,
  {
    count: number;
    resetTime: number;
    requests: number[];
  }
>();

// Nettoie les anciennes entrées toutes les 10 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
      if (data.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  },
  10 * 60 * 1000
);

// Fonction pour obtenir l'IP du client
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (cfConnectingIP) return cfConnectingIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIP) return realIP;

  return 'unknown';
}

// Rate limiter principal
export function createRateLimiter(config: RateLimiterConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Trop de requêtes, veuillez réessayer plus tard',
    keyGenerator = getClientIP,
  } = config;

  return (request: NextRequest): void => {
    const key = keyGenerator(request);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Récupérer ou créer l'entrée
    let record = rateLimitStore.get(key);

    if (!record || record.resetTime < windowStart) {
      // Nouvelle fenêtre ou première requête
      record = {
        count: 0,
        resetTime: now + windowMs,
        requests: [],
      };
    }

    // Nettoyer les anciennes requêtes
    record.requests = record.requests.filter(
      (timestamp) => timestamp > windowStart
    );

    // Vérifier la limite
    if (record.requests.length >= maxRequests) {
      throw new AppError(message, 429, 'RATE_LIMIT_EXCEEDED', {
        retryAfter: Math.ceil((record.resetTime - now) / 1000).toString(),
      });
    }

    // Ajouter la requête actuelle
    record.requests.push(now);
    record.count = record.requests.length;

    // Sauvegarder
    rateLimitStore.set(key, record);
  };
}

// Rate limiters pré-configurés
export const rateLimiters = {
  // Strict pour les opérations sensibles (authentification, changement de mot de passe)
  strict: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Trop de tentatives, veuillez réessayer dans 15 minutes',
  }),

  // Modéré pour les opérations normales
  moderate: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Trop de requêtes, veuillez réessayer plus tard',
  }),

  // Léger pour la lecture
  light: createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 200,
    message: 'Trop de requêtes, veuillez ralentir',
  }),

  // Spécial pour les messages (anti-spam)
  messaging: createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 10,
    message:
      "Trop de messages envoyés, veuillez attendre avant d'envoyer un nouveau message",
  }),

  // Pour les créations de comptes
  registration: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 heure
    maxRequests: 3,
    message: 'Trop de créations de compte, veuillez réessayer dans 1 heure',
  }),
};

// Rate limiter basé sur l'utilisateur authentifié
export function createUserBasedRateLimiter(config: RateLimiterConfig) {
  return createRateLimiter({
    ...config,
    keyGenerator: (request: NextRequest) => {
      // Essayer d'extraire l'ID utilisateur de différentes sources
      const authHeader = request.headers.get('authorization');
      const sessionCookie = request.cookies.get('next-auth.session-token');

      // Si on a un token Bearer, l'utiliser comme clé
      if (authHeader?.startsWith('Bearer ')) {
        return `user:${authHeader.substring(7, 20)}`;
      }

      // Si on a un cookie de session, l'utiliser
      if (sessionCookie) {
        return `session:${sessionCookie.value.substring(0, 20)}`;
      }

      // Fallback sur l'IP
      return `ip:${getClientIP(request)}`;
    },
  });
}

// Middleware combiné pour différents types de requêtes
export function applyRateLimit(
  request: NextRequest,
  type: 'strict' | 'moderate' | 'light' | 'messaging' | 'registration'
): void {
  const rateLimiter = rateLimiters[type];
  rateLimiter(request);
}

// Fonction utilitaire pour obtenir les informations de rate limiting
export function getRateLimitInfo(request: NextRequest): {
  remaining: number;
  resetTime: number;
  total: number;
} {
  const key = getClientIP(request);
  const record = rateLimitStore.get(key);

  if (!record) {
    return {
      remaining: 100,
      resetTime: Date.now() + 15 * 60 * 1000,
      total: 100,
    };
  }

  return {
    remaining: Math.max(0, 100 - record.count),
    resetTime: record.resetTime,
    total: 100,
  };
}
