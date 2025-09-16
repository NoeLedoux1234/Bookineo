import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Utilisateur non authentifié',
          errors: { auth: 'Session expirée ou invalide' },
        },
        { status: 401 }
      );
    }

    const sessionUser = session.user as any;

    const { id } = params;

    // Récupérer le message complet
    const message = await prisma.message.findFirst({
      where: {
        id,
        receiverId: sessionUser.id, // S'assurer que l'utilisateur peut accéder à ce message
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
      return NextResponse.json(
        {
          success: false,
          message: 'Message introuvable',
          errors: {
            message: "Ce message n'existe pas ou vous n'y avez pas accès",
          },
        },
        { status: 404 }
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

    return NextResponse.json(
      {
        success: true,
        message: formattedMessage,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur récupération message:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur interne du serveur',
        errors: { server: 'Impossible de récupérer le message' },
      },
      { status: 500 }
    );
  }
}
