import { authOptions } from '@/lib/auth';
import { AppError } from '@/lib/errors/AppError';
import { rentalService } from '@/services/RentalService';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateRentalSchema = z.object({
  returnDate: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  comment: z.string().optional(),
  action: z.enum(['return', 'cancel']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Authentification requise' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const rental = await rentalService.getRentalById(id);

    return NextResponse.json({
      success: true,
      data: rental,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la location:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Erreur interne du serveur',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Authentification requise' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateRentalSchema.parse(body);

    const { id } = await params;
    let rental;
    let message = 'Location mise à jour avec succès';

    // Gérer les actions spécifiques
    if (validatedData.action === 'return') {
      rental = await rentalService.returnBook(id, validatedData.comment);
      message = 'Livre retourné avec succès';
    } else if (validatedData.action === 'cancel') {
      rental = await rentalService.cancelRental(id, validatedData.comment);
      message = 'Location annulée avec succès';
    } else {
      // Mise à jour normale
      const updateData = {
        ...validatedData,
        returnDate: validatedData.returnDate
          ? new Date(validatedData.returnDate)
          : undefined,
      };
      // Exclure l'action des données de mise à jour
      delete updateData.action;
      rental = await rentalService.updateRental(id, updateData);
    }

    return NextResponse.json({
      success: true,
      data: rental,
      message,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la location:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Données invalides',
          errors: error.issues.map(
            (e: any) => `${e.path.join('.')}: ${e.message}`
          ),
        },
        { status: 400 }
      );
    }

    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Erreur interne du serveur',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Authentification requise' },
        { status: 401 }
      );
    }

    const { id } = await params;
    await rentalService.deleteRental(id);

    return NextResponse.json({
      success: true,
      message: 'Location supprimée avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la location:', error);

    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Erreur interne du serveur',
      },
      { status: 500 }
    );
  }
}
