import type { BookFilter } from '@/lib/database/repositories/BookRepository';
import { bookQuerySchema, createBookSchema } from '@/lib/validation/schemas';
import type { AuthenticatedRequest } from '@/middlewares/auth';
import {
  withAuthAndErrorHandler,
  withErrorHandler,
} from '@/middlewares/errorHandler';
import { bookService } from '@/services/BookService';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/books - Récupérer la liste des livres (public)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const queryObject = Object.fromEntries(searchParams.entries());

  const validatedQuery = bookQuerySchema.parse(queryObject);

  const filters: BookFilter = {
    search: validatedQuery.search,
    status: validatedQuery.status,
    category: validatedQuery.category,
    author: validatedQuery.author,
    priceMin: validatedQuery.priceMin,
    priceMax: validatedQuery.priceMax,
    hasOwner: validatedQuery.hasOwner,
  };

  const pagination = {
    page: validatedQuery.page,
    limit: validatedQuery.limit,
    sortBy: validatedQuery.sortBy,
    sortOrder: validatedQuery.sortOrder,
  };

  const result = await bookService.getBooks(filters, pagination);

  return NextResponse.json({
    success: true,
    data: result,
  });
});

// POST /api/books - Créer un nouveau livre (authentifié)
export const POST = withAuthAndErrorHandler(
  async (request: AuthenticatedRequest) => {
    const body = await request.json();
    const validatedData = createBookSchema.parse(body);

    // Générer un categoryId si pas fourni mais categoryName présent
    if (!validatedData.categoryId && validatedData.categoryName) {
      // Générer un ID simple basé sur le hash du nom de catégorie
      validatedData.categoryId =
        Math.abs(
          validatedData.categoryName
            .split('')
            .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
        ) || 1;
    } else if (!validatedData.categoryId) {
      // ID par défaut si aucune catégorie
      validatedData.categoryId = 1;
    }

    const createdBook = await bookService.createBook(
      validatedData,
      request.user.id
    );

    return NextResponse.json(
      {
        success: true,
        data: createdBook,
        message: 'Livre créé avec succès',
      },
      { status: 201 }
    );
  }
);
