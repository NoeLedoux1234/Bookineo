import { authOptions } from '@/lib/auth';
import type { BookFilter } from '@/lib/database/repositories/BookRepository';
import { AppError } from '@/lib/errors/AppError';
import { bookService } from '@/services/BookService';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const querySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(parseInt(val, 10), 100) : 20)),
  search: z.string().optional(),
  category: z.string().optional(),
  author: z.string().optional(),
  priceMin: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  priceMax: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  sortBy: z
    .enum(['title', 'author', 'category', 'price', 'createdAt', 'updatedAt'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Authentification requise' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryObject = Object.fromEntries(searchParams.entries());

    const validatedQuery = querySchema.parse(queryObject);

    // Forcer le filtre sur les livres disponibles uniquement
    const filters: BookFilter = {
      status: 'AVAILABLE', // Uniquement les livres disponibles
      search: validatedQuery.search,
      category: validatedQuery.category,
      author: validatedQuery.author,
      priceMin: validatedQuery.priceMin,
      priceMax: validatedQuery.priceMax,
    };

    const pagination = {
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      sortBy: validatedQuery.sortBy || 'title',
      sortOrder: validatedQuery.sortOrder || 'asc',
    };

    const result = await bookService.getBooks(filters, pagination);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(
      'Erreur lors de la récupération des livres disponibles:',
      error
    );

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
