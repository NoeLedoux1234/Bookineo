import {
  createErrorResponse,
  createSuccessResponse,
  getAuthenticatedUser,
} from '@/lib/AuthUtils';
import { prisma } from '@/lib/prisma';
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

    // Compter les messages non lus
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: user.id,
        isRead: false,
      },
    });

    return createSuccessResponse(
      {
        unreadCount,
      },
      'Compteur de messages non lus récupéré'
    );
  } catch (error) {
    console.error('Erreur compteur messages non lus:', error);
    return createErrorResponse(
      'Erreur interne du serveur',
      { server: 'Impossible de récupérer le compteur' },
      500
    );
  }
}
