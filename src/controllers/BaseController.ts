import { authOptions } from '@/lib/auth';
import { AppError } from '@/lib/errors/AppError';
import { handleError } from '@/lib/errors/errorHandler';
import type { AuthContext } from '@/types/api';
import type { Session } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

// Contrôleur de base avec méthodes communes
export abstract class BaseController {
  // Wrapper pour gérer les erreurs automatiquement
  protected async handleRequest<T>(
    handler: () => Promise<T>
  ): Promise<NextResponse<T> | NextResponse<unknown>> {
    try {
      const result = await handler();
      return NextResponse.json(result);
    } catch (error) {
      return handleError(error);
    }
  }

  // Wrapper pour les requêtes authentifiées
  protected async handleAuthenticatedRequest<T>(
    request: NextRequest,
    handler: (authContext: AuthContext) => Promise<T>
  ): Promise<NextResponse<T> | NextResponse<unknown>> {
    try {
      const authContext = await this.getAuthContext();
      const result = await handler(authContext);
      return NextResponse.json(result);
    } catch (error) {
      return handleError(error);
    }
  }

  // Récupérer le contexte d'authentification
  protected async getAuthContext(): Promise<AuthContext> {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user) {
      throw AppError.unauthorized('Session expirée ou invalide');
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email || '',
        firstName: session.user.firstName,
        lastName: session.user.lastName,
      },
      sessionId: session.user.id, // Utiliser l'ID utilisateur comme session ID
    };
  }

  // Extraire les paramètres de pagination depuis la requête
  protected getPaginationParams(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    return {
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: Math.min(parseInt(searchParams.get('limit') || '20', 10), 100),
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };
  }

  // Créer une réponse de succès standardisée
  protected createSuccessResponse<T>(
    data: T,
    message?: string,
    status: number = 200
  ): NextResponse {
    return NextResponse.json(
      {
        success: true,
        data,
        message,
      },
      { status }
    );
  }

  // Créer une réponse d'erreur standardisée
  protected createErrorResponse(
    message: string,
    errors?: Record<string, string | string[]>,
    status: number = 400
  ): NextResponse {
    return NextResponse.json(
      {
        success: false,
        message,
        errors: errors || {},
      },
      { status }
    );
  }

  // Extraire et valider l'ID depuis les paramètres de route
  protected extractId(params: { id: string }): string {
    const { id } = params;

    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw AppError.badRequest('ID invalide');
    }

    return id;
  }

  // Valider et parser le body JSON
  protected async parseRequestBody<T>(request: NextRequest): Promise<T> {
    try {
      return await request.json();
    } catch {
      throw AppError.badRequest('Corps de requête JSON invalide');
    }
  }

  // Extraire l'IP du client pour logging/rate limiting
  protected getClientIP(request: NextRequest): string {
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

  // Logger pour debugging
  protected log(
    level: 'info' | 'warn' | 'error',
    message: string,
    data?: unknown
  ) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (data) {
      console[level](logMessage, data);
    } else {
      console[level](logMessage);
    }
  }
}
