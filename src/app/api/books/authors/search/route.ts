import { AppError } from '@/lib/errors/AppError';
import { bookService } from '@/services/BookService';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const searchQuerySchema = z.object({
  q: z.string().min(2, 'La recherche doit contenir au moins 2 caractères'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    const validatedQuery = searchQuerySchema.parse({ q: query });

    const authors = await bookService.searchAuthors(validatedQuery.q);

    return NextResponse.json({
      success: true,
      data: authors,
    });
  } catch (error) {
    console.error("Erreur lors de la recherche d'auteurs:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Paramètres de requête invalides',
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
