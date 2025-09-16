import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
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

    // Compter les messages non lus pour cet utilisateur
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: sessionUser.id,
        isRead: false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        count: unreadCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur compteur messages non lus:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur interne du serveur',
        errors: { server: 'Impossible de compter les messages non lus' },
      },
      { status: 500 }
    );
  }
}
