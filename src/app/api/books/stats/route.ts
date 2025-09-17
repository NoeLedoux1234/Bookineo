import { AppError } from '@/lib/errors/AppError';
import { bookService } from '@/services/BookService';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const stats = await bookService.getBookStatistics();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);

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
