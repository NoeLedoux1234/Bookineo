import { prisma } from '@/lib/prisma';
import { validateSchema } from '@/lib/Validation';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const sendMessageSchema = z.object({
  receiverEmail: z.string().email('Email du destinataire requis'),
  content: z
    .string()
    .min(1, 'Contenu du message requis')
    .max(1000, 'Message trop long (max 1000 caractères)'),
});

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

    // Récupérer tous les messages reçus par l'utilisateur
    const messages = await prisma.message.findMany({
      where: {
        receiverId: sessionUser.id,
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
      orderBy: {
        createdAt: 'desc', // Messages les plus récents en premier
      },
    });

    // Formater les messages pour le frontend
    const formattedMessages = messages.map((message) => ({
      id: message.id,
      sender: {
        id: message.sender.id,
        name:
          message.sender.firstName && message.sender.lastName
            ? `${message.sender.firstName} ${message.sender.lastName}`
            : message.sender.email,
        email: message.sender.email,
      },
      subject:
        message.content.substring(0, 50) +
        (message.content.length > 50 ? '...' : ''), // Aperçu du message
      preview:
        message.content.substring(0, 100) +
        (message.content.length > 100 ? '...' : ''), // Aperçu plus long
      isRead: message.isRead,
      sentAt: message.createdAt,
    }));

    return NextResponse.json(
      {
        success: true,
        messages: formattedMessages,
        totalCount: messages.length,
        unreadCount: messages.filter((m) => !m.isRead).length,
        message: 'Messages récupérés avec succès',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur récupération messages:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur interne du serveur',
        errors: { server: 'Impossible de récupérer les messages' },
      },
      { status: 500 }
    );
  }
}

// POST - Envoyer un message
export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const validation = validateSchema(sendMessageSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Données invalides',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const { receiverEmail, content } = validation.data!;

    // Trouver le destinataire par email
    const receiver = await prisma.user.findUnique({
      where: { email: receiverEmail },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!receiver) {
      return NextResponse.json(
        {
          success: false,
          message: 'Destinataire introuvable',
          errors: { receiverEmail: 'Aucun utilisateur trouvé avec cet email' },
        },
        { status: 404 }
      );
    }

    // Créer le message
    const message = await prisma.message.create({
      data: {
        senderId: sessionUser.id,
        receiverId: receiver.id,
        content,
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
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: message.id,
          content: message.content,
          sentAt: message.createdAt,
          receiver: {
            id: receiver.id,
            name:
              receiver.firstName && receiver.lastName
                ? `${receiver.firstName} ${receiver.lastName}`
                : receiver.email,
          },
        },
        message: 'Message envoyé avec succès',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur envoi message:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur interne du serveur',
        errors: { server: "Impossible d'envoyer le message" },
      },
      { status: 500 }
    );
  }
}
