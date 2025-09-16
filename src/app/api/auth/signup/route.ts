import { prisma } from '@/lib/prisma';
import { registerSchemaSimple, validateSchema } from '@/lib/Validation';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation des données avec le schéma simple
    const validation = validateSchema(registerSchemaSimple, body);

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

    const { email, password, firstName, lastName, birthDate } =
      validation.data!;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'Un compte avec cet email existe déjà',
          errors: { email: 'Cet email est déjà utilisé' },
        },
        { status: 409 }
      );
    }

    // Hasher le mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        birthDate: birthDate ? new Date(birthDate) : null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Compte créé avec succès',
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de la création du compte:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Erreur interne du serveur',
        errors: {
          server: 'Une erreur est survenue lors de la création du compte',
        },
      },
      { status: 500 }
    );
  }
}
