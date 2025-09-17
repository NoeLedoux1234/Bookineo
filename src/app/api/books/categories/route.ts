import { AppError } from '@/lib/errors/AppError';
import { bookService } from '@/services/BookService';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const categories = await bookService.getCategories();

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);

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
