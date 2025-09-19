import { updateBookSchema } from '@/lib/validation/schemas';
import {
  withAuthAndErrorHandler,
  withErrorHandler,
} from '@/middlewares/errorHandler';
import { bookService } from '@/services/BookService';
import { NextRequest, NextResponse } from 'next/server';
import type { AuthenticatedRequest } from '@/middlewares/auth';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export const GET = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID du livre requis' },
        { status: 400 }
      );
    }

    const book = await bookService.getBookById(id);

    return NextResponse.json({
      success: true,
      data: book,
    });
  }
);

export const PUT = withAuthAndErrorHandler(
  async (request: AuthenticatedRequest, { params }: RouteParams) => {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID du livre requis' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateBookSchema.parse(body);

    const updatedBook = await bookService.updateBook(
      id,
      validatedData,
      request.user.id
    );

    return NextResponse.json({
      success: true,
      data: updatedBook,
      message: 'Livre mis à jour avec succès',
    });
  }
);

export const DELETE = withAuthAndErrorHandler(
  async (request: AuthenticatedRequest, { params }: RouteParams) => {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID du livre requis' },
        { status: 400 }
      );
    }

    await bookService.deleteBook(id, request.user.id);

    return NextResponse.json({
      success: true,
      message: 'Livre supprimé avec succès',
    });
  }
);
