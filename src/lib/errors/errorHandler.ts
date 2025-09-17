import type { ApiErrorResponse } from '@/types/api';
import { NextResponse } from 'next/server';
import { AppError } from './AppError';

// Gestionnaire d'erreur global
export function handleError(error: unknown): NextResponse<ApiErrorResponse> {
  console.error('Error caught by handler:', error);

  // Si c'est une AppError, on l'utilise directement
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        errors: (error.details as Record<string, string | string[]>) ?? {},
      },
      { status: error.statusCode }
    );
  }

  // Si c'est une erreur Prisma
  if (error && typeof error === 'object' && 'code' in error) {
    return handlePrismaError(error);
  }

  // Si c'est une erreur Zod (validation)
  if (error && typeof error === 'object' && 'issues' in error) {
    return handleZodError(error);
  }

  // Erreur inconnue - on ne révèle pas les détails en production
  const isDevelopment = process.env.NODE_ENV === 'development';

  const errorResponse: ApiErrorResponse = {
    success: false,
    message: isDevelopment
      ? error instanceof Error
        ? error.message
        : 'Erreur inconnue'
      : 'Erreur interne du serveur',
    errors: {},
  };

  // Ajouter les détails de debug en développement seulement
  if (isDevelopment) {
    errorResponse.errors.stack =
      error instanceof Error ? (error.stack ?? error.message) : String(error);
  }

  return NextResponse.json(errorResponse, { status: 500 });
}

// Gestion des erreurs Prisma
function handlePrismaError(error: any): NextResponse<ApiErrorResponse> {
  switch (error.code) {
    case 'P2002':
      // Violation de contrainte unique
      const field = error.meta?.target?.[0] || 'champ';
      return NextResponse.json(
        {
          success: false,
          message: `Cette valeur pour '${field}' existe déjà`,
          errors: { [field]: `Cette valeur pour '${field}' existe déjà` },
        },
        { status: 409 }
      );

    case 'P2025':
      // Enregistrement non trouvé
      return NextResponse.json(
        {
          success: false,
          message: 'Ressource non trouvée',
          errors: { resource: "La ressource demandée n'existe pas" },
        },
        { status: 404 }
      );

    case 'P2003':
      // Violation de contrainte de clé étrangère
      return NextResponse.json(
        {
          success: false,
          message: 'Référence invalide',
          errors: { reference: "La ressource référencée n'existe pas" },
        },
        { status: 400 }
      );

    case 'P2014':
      // Violation de relation requise
      return NextResponse.json(
        {
          success: false,
          message: 'Relation manquante',
          errors: { relation: 'Une relation requise est manquante' },
        },
        { status: 400 }
      );

    default:
      return NextResponse.json(
        {
          success: false,
          message: 'Erreur de base de données',
          errors: {
            database: error.message || 'Erreur inconnue de la base de données',
          },
        },
        { status: 500 }
      );
  }
}

// Gestion des erreurs Zod
function handleZodError(error: any): NextResponse<ApiErrorResponse> {
  const errors: Record<string, string> = {};

  if (error.issues) {
    for (const issue of error.issues) {
      const path = issue.path.join('.');
      errors[path] = issue.message;
    }
  }

  return NextResponse.json(
    {
      success: false,
      message: 'Données de validation invalides',
      errors,
    },
    { status: 422 }
  );
}

// Wrapper pour les gestionnaires d'API
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error);
    }
  };
}
