import type { AuthenticatedRequest } from '@/middlewares/auth';
import { withAuthAndErrorHandler } from '@/middlewares/errorHandler';
import { bookService } from '@/services/BookService';
import { NextResponse } from 'next/server';

/**
 * GET /api/books/my-books - Récupère les livres de l'utilisateur connecté
 */
export const GET = withAuthAndErrorHandler(
  async (request: AuthenticatedRequest) => {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const filters = {
      ownerId: request.user.id, // Filtrer par propriétaire
    };

    const pagination = {
      page,
      limit,
      sortBy: 'updatedAt' as const,
      sortOrder: 'desc' as const,
    };

    const result = await bookService.getBooks(filters, pagination);

    return NextResponse.json({
      success: true,
      data: result,
    });
  }
);
