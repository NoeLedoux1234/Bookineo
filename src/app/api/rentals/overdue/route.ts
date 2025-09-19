import { authOptions } from '@/lib/auth';
import { AppError } from '@/lib/errors/AppError';
import { rentalService } from '@/services/RentalService';
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Authentification requise' },
        { status: 401 }
      );
    }

    const overdueRentals = await rentalService.getOverdueRentals();

    return NextResponse.json({
      success: true,
      data: overdueRentals,
      message: `${overdueRentals.length} locations en retard trouvées`,
    });
  } catch (error) {
    console.error(
      'Erreur lors de la récupération des locations en retard:',
      error
    );

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
