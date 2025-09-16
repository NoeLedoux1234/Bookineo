import {
  createErrorResponse,
  createSuccessResponse,
  getAuthenticatedUser,
} from '@/lib/AuthUtils';
import { prisma } from '@/lib/Prisma';
import { validateSchema } from '@/lib/Validation';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const profileUpdateSchema = z.object({
  firstName: z
    .string()
    .min(2, 'Prénom requis')
    .max(50, 'Prénom trop long')
    .optional(),
  lastName: z.string().min(2, 'Nom requis').max(50, 'Nom trop long').optional(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')
    .optional(),
});

// GET - Récupérer le profil
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

    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return createSuccessResponse(
      {
        profile: userProfile,
      },
      'Profil utilisateur récupéré'
    );
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    return createErrorResponse(
      'Erreur interne du serveur',
      { server: 'Impossible de récupérer le profil' },
      500
    );
  }
}

// PUT - Modifier le profil
export async function PUT(request: NextRequest) {
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
    const validation = validateSchema(profileUpdateSchema, body);

    if (!validation.success) {
      return createErrorResponse(
        'Données de validation invalides',
        validation.errors,
        400
      );
    }

    const { firstName, lastName, birthDate } = validation.data!;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        updatedAt: true,
      },
    });

    return createSuccessResponse(
      {
        profile: updatedUser,
      },
      'Profil mis à jour avec succès'
    );
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    return createErrorResponse(
      'Erreur interne du serveur',
      { server: 'Impossible de mettre à jour le profil' },
      500
    );
  }
}
