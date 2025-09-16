import { jwtVerify } from 'jose';
import { getServerSession } from 'next-auth/next';
import { NextRequest } from 'next/server';
import { authOptions } from './auth';
import { prisma } from './Prisma';

// Types pour l'authentification
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string>;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

/**
 * Valide un token JWT et retourne les données utilisateur
 */
export async function validateJWT(
  token: string
): Promise<AuthenticatedUser | null> {
  try {
    const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'dev-secret-key';
    const secret = new TextEncoder().encode(JWT_SECRET);

    const { payload } = await jwtVerify(token, secret);

    if (!payload.id || typeof payload.id !== 'string') {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Erreur validation JWT:', error);
    return null;
  }
}

/**
 * Récupère l'utilisateur authentifié depuis la session ou token Bearer
 */
export async function getAuthenticatedUser(
  request?: NextRequest
): Promise<AuthenticatedUser | null> {
  // Essayer d'abord avec le token Bearer (pour les API calls)
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await validateJWT(token);
      if (user) return user;
    }
  }

  // Fallback sur NextAuth session (pour les routes web)
  const session: { user?: { id?: string } } | null =
    await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  return user;
}

/**
 * Middleware pour protéger les routes API
 */
export async function requireAuth(
  request?: NextRequest
): Promise<AuthenticatedUser | ApiError> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return {
      success: false,
      message: 'Authentication requise',
      errors: {
        auth: 'Vous devez être connecté pour accéder à cette ressource',
      },
    };
  }

  return user;
}

/**
 * Vérifie si l'utilisateur est propriétaire d'une ressource
 */
export async function requireOwnership(
  resourceOwnerId: string,
  currentUserId: string
): Promise<boolean> {
  return resourceOwnerId === currentUserId;
}

/**
 * Wrapper pour les routes API protégées
 */
export function withAuth<T extends unknown[]>(
  handler: (user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    // Le premier argument devrait être NextRequest pour les routes API
    const request = args[0] as NextRequest;
    const authResult = await requireAuth(request);

    if ('success' in authResult && !authResult.success) {
      return new Response(JSON.stringify(authResult), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return handler(authResult as AuthenticatedUser, ...args);
  };
}

/**
 * Utilitaire pour créer des réponses d'erreur standardisées
 */
export function createErrorResponse(
  message: string,
  errors?: Record<string, string>,
  status: number = 400
): Response {
  const response: ApiError = {
    success: false,
    message,
    errors,
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Utilitaire pour créer des réponses de succès standardisées
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): Response {
  const response: ApiSuccess<T> = {
    success: true,
    data,
    message,
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Rate limiting simple (en mémoire - pour production utiliser Redis)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;

  const record = rateLimitMap.get(identifier);

  if (!record || record.resetTime < windowStart) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count += 1;
  return true;
}

/**
 * Extrait l'IP du client pour le rate limiting
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}
