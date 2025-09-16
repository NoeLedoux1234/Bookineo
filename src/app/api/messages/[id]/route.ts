import {
  createErrorResponse,
  createSuccessResponse,
  getAuthenticatedUser,
} from '@/lib/AuthUtils';
import { prisma } from '@/lib/Prisma';
import { NextRequest } from 'next/server';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return createErrorResponse(
        'Utilisateur non authentifié',
        { auth: 'Session expirée ou invalide' },
        401
      );
    }

    const { id } = params;

    // Récupérer le message complet
    const message = await prisma.message.findFirst({
      where: {
        id,
        receiverId: user.id, // S'assurer que l'utilisateur peut accéder à ce message
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!message) {
      return createErrorResponse(
        'Message introuvable',
        { message: "Ce message n'existe pas ou vous n'y avez pas accès" },
        404
      );
    }

    // Marquer le message comme lu s'il ne l'était pas déjà
    if (!message.isRead) {
      await prisma.message.update({
        where: { id },
        data: { isRead: true },
      });
    }

    // Formater la réponse
    const formattedMessage = {
      id: message.id,
      content: message.content,
      sender: {
        id: message.sender.id,
        name:
          message.sender.firstName && message.sender.lastName
            ? `${message.sender.firstName} ${message.sender.lastName}`
            : message.sender.email,
        email: message.sender.email,
      },
      isRead: true, // Maintenant lu
      sentAt: message.createdAt,
    };

    return createSuccessResponse(
      {
        message: formattedMessage,
      },
      'Message récupéré et marqué comme lu'
    );
  } catch (error) {
    console.error('Erreur récupération message:', error);
    return createErrorResponse(
      'Erreur interne du serveur',
      { server: 'Impossible de récupérer le message' },
      500
    );
  }
}
