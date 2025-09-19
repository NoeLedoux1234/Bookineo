import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface AuthenticatedRequest extends NextRequest {
  user: AuthenticatedUser;
}

/**
 * Middleware d'authentification centralisé
 * Vérifie la session et injecte les données utilisateur
 */
export async function withAuth<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const session = (await getServerSession(authOptions)) as any;

      if (!session?.user?.id) {
        return NextResponse.json(
          {
            success: false,
            message: 'Authentification requise',
            error: 'AUTHENTICATION_REQUIRED',
          },
          { status: 401 }
        );
      }

      // Injecter les données utilisateur dans la request
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = {
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
      };

      return await handler(authenticatedRequest, ...args);
    } catch (error) {
      console.error("Erreur d'authentification:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Erreur d'authentification",
          error: 'AUTHENTICATION_ERROR',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware d'authentification avec vérification de rôle
 */
export async function withAuthAndRole<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>,
  requiredRole?: string
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const authHandler = await withAuth(
      async (authRequest: AuthenticatedRequest, ...handlerArgs: T) => {
        // TODO: Ajouter la vérification de rôle quand le système de rôles sera implémenté
        if (requiredRole) {
          // Placeholder pour la vérification de rôle future
          console.log(
            `Vérification du rôle ${requiredRole} pour l'utilisateur ${authRequest.user.id}`
          );
        }

        return await handler(authRequest, ...handlerArgs);
      }
    );

    return await authHandler(request, ...args);
  };
}

/**
 * Middleware d'authentification optionnelle
 * N'échoue pas si l'utilisateur n'est pas connecté
 */
export async function withOptionalAuth<T extends any[]>(
  handler: (
    request: NextRequest & { user?: AuthenticatedUser },
    ...args: T
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const session = (await getServerSession(authOptions)) as any;

      if (session?.user?.id) {
        const requestWithUser = request as NextRequest & {
          user?: AuthenticatedUser;
        };
        requestWithUser.user = {
          id: session.user.id,
          email: session.user.email,
          firstName: session.user.firstName,
          lastName: session.user.lastName,
        };
        return await handler(requestWithUser, ...args);
      }

      return await handler(request, ...args);
    } catch (error) {
      console.error("Erreur d'authentification optionnelle:", error);
      return await handler(request, ...args);
    }
  };
}
