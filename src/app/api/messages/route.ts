import {
  createErrorResponse,
  createSuccessResponse,
  getAuthenticatedUser,
} from '@/lib/AuthUtils';
import { prisma } from '@/lib/prisma';
import { validateSchema } from '@/lib/Validation';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const sendMessageSchema = z.object({
  receiverId: z.string().min(1, 'Destinataire requis'),
  content: z
    .string()
    .min(1, 'Contenu du message requis')
    .max(1000, 'Message trop long (max 1000 caractères)'),
});

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

    // Récupérer tous les messages reçus par l'utilisateur
    const messages = await prisma.message.findMany({
      where: {
        receiverId: user.id,
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

    return createSuccessResponse(
      {
        messages: formattedMessages,
        totalCount: messages.length,
        unreadCount: messages.filter((m) => !m.isRead).length,
      },
      'Messages récupérés avec succès'
    );
  } catch (error) {
    console.error('Erreur récupération messages:', error);
    return createErrorResponse(
      'Erreur interne du serveur',
      { server: 'Impossible de récupérer les messages' },
      500
    );
  }
}

// POST - Envoyer un message
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return createErrorResponse(
        'Utilisateur non authentifié',
        { auth: 'Session expirée ou invalide' },
        401
      );
    }

    const body = await request.json();
    const validation = validateSchema(sendMessageSchema, body);

    if (!validation.success) {
      return createErrorResponse('Données invalides', validation.errors, 400);
    }

    const { receiverId, content } = validation.data!;

    // Vérifier que le destinataire existe
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!receiver) {
      return createErrorResponse(
        'Destinataire introuvable',
        { receiverId: "Cet utilisateur n'existe pas" },
        404
      );
    }

    // Créer le message
    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        receiverId,
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

    return createSuccessResponse(
      {
        message: {
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
      },
      'Message envoyé avec succès'
    );
  } catch (error) {
    console.error('Erreur envoi message:', error);
    return createErrorResponse(
      'Erreur interne du serveur',
      { server: "Impossible d'envoyer le message" },
      500
    );
  }
}
