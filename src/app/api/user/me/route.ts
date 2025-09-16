import {
  createErrorResponse,
  createSuccessResponse,
  getAuthenticatedUser,
} from '@/lib/AuthUtils';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return createErrorResponse(
        'Utilisateur non authentifié',
        { auth: 'Session expirée ou invalide' },
        401
      );
    }

    return createSuccessResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName:
            user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.firstName || user.email,
        },
      },
      'Données utilisateur récupérées'
    );
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    return createErrorResponse(
      'Erreur interne du serveur',
      { server: 'Impossible de récupérer les données utilisateur' },
      500
    );
  }
}
