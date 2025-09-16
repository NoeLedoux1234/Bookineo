import { prisma } from '@/lib/prisma';
import { validateSchema } from '@/lib/Validation';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const profileUpdateSchema = z.object({
  firstName: z
    .string()
    .transform((val) => val.trim() || null)
    .refine(
      (val) => !val || val.length >= 2,
      'Prénom requis (minimum 2 caractères)'
    )
    .refine(
      (val) => !val || val.length <= 50,
      'Prénom trop long (maximum 50 caractères)'
    )
    .nullable()
    .optional(),
  lastName: z
    .string()
    .transform((val) => val.trim() || null)
    .refine(
      (val) => !val || val.length >= 2,
      'Nom requis (minimum 2 caractères)'
    )
    .refine(
      (val) => !val || val.length <= 50,
      'Nom trop long (maximum 50 caractères)'
    )
    .nullable()
    .optional(),
  birthDate: z
    .string()
    .transform((val) => val.trim() || null)
    .refine(
      (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
      'Format de date invalide (utilisez YYYY-MM-DD)'
    )
    .refine((val) => {
      if (!val) return true;
      const d = new Date(val);
      const now = new Date();
      return d < now;
    }, 'La date de naissance doit être dans le passé')
    .nullable()
    .optional(),
});

// GET - Récupérer le profil
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
    const userProfile = await prisma.user.findUnique({
      where: { id: sessionUser.id },
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

    if (!userProfile) {
      return NextResponse.json(
        {
          success: false,
          message: 'Utilisateur non trouvé',
          errors: { user: 'Profil introuvable' },
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        profile: userProfile,
        message: 'Profil utilisateur récupéré',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur interne du serveur',
        errors: { server: 'Impossible de récupérer le profil' },
      },
      { status: 500 }
    );
  }
}

// PUT - Modifier le profil
export async function PUT(request: NextRequest) {
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
    const validation = validateSchema(profileUpdateSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Données de validation invalides',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const { firstName, lastName, birthDate } = validation.data!;

    const updatedUser = await prisma.user.update({
      where: { id: sessionUser.id },
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
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        profile: updatedUser,
        message: 'Profil mis à jour avec succès',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur interne du serveur',
        errors: { server: 'Impossible de mettre à jour le profil' },
      },
      { status: 500 }
    );
  }
}
