import { authOptions } from '@/lib/auth';
import { AppError } from '@/lib/errors/AppError';
import { rentalService } from '@/services/RentalService';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const cancelRentalSchema = z.object({
  comment: z.string().optional(),
});

export async function POST(
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

    const body = await request.json().catch(() => ({}));
    const validatedData = cancelRentalSchema.parse(body);

    const { id } = await params;
    const rental = await rentalService.cancelRental(id, validatedData.comment);

    return NextResponse.json({
      success: true,
      data: rental,
      message: 'Location annulée avec succès',
    });
  } catch (error) {
    console.error("Erreur lors de l'annulation de la location:", error);

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
