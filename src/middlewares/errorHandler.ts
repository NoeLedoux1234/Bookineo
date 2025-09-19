import { AppError } from '@/lib/errors/AppError';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Middleware de gestion d'erreurs centralisé
 */
export function withErrorHandler<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      console.error('Erreur dans la route API:', error);

      // Erreur de validation Zod
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            message: 'Données invalides',
            errors: error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
              code: issue.code,
            })),
            error: 'VALIDATION_ERROR',
          },
          { status: 400 }
        );
      }

      // Erreur applicative
      if (error instanceof AppError) {
        return NextResponse.json(
          {
            success: false,
            message: error.message,
            error: error.code || 'APPLICATION_ERROR',
            ...(error.details && { details: error.details }),
          },
          { status: error.statusCode }
        );
      }

      // Erreur de base de données
      if (error instanceof Error && error.message.includes('prisma')) {
        return NextResponse.json(
          {
            success: false,
            message: 'Erreur de base de données',
            error: 'DATABASE_ERROR',
          },
          { status: 500 }
        );
      }

      // Erreur réseau/timeout
      if (
        error instanceof Error &&
        (error.message.includes('timeout') ||
          error.message.includes('ECONNREFUSED'))
      ) {
        return NextResponse.json(
          {
            success: false,
            message: 'Service temporairement indisponible',
            error: 'SERVICE_UNAVAILABLE',
          },
          { status: 503 }
        );
      }

      // Erreur générique
      return NextResponse.json(
        {
          success: false,
          message: 'Erreur interne du serveur',
          error: 'INTERNAL_SERVER_ERROR',
          ...(process.env.NODE_ENV === 'development' && {
            details: error instanceof Error ? error.message : String(error),
          }),
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Combine l'authentification et la gestion d'erreurs
 */
export function withAuthAndErrorHandler<T extends any[]>(
  handler: (request: any, ...args: T) => Promise<NextResponse>
) {
  return withErrorHandler(async (request: NextRequest, ...args: T) => {
    const { withAuth } = await import('./auth');
    const authHandler = await withAuth(handler);
    return await authHandler(request, ...args);
  });
}
