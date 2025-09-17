import { authOptions } from '@/lib/auth';
import { AppError } from '@/lib/errors/AppError';
import { bookService } from '@/services/BookService';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateBookSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  author: z.string().min(1).max(100).optional(),
  year: z.number().int().min(1000).max(2030).optional().nullable(),
  category: z.string().min(1).max(50).optional(),
  price: z.number().min(0).max(10000).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  status: z.enum(['AVAILABLE', 'RENTED']).optional(),
  ownerId: z.string().optional().nullable(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
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
  } catch (error) {
    console.error('Erreur lors de la récupération du livre:', error);

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

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Authentification requise' },
        { status: 401 }
      );
    }

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
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: updatedBook,
      message: 'Livre mis à jour avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du livre:', error);

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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Authentification requise' },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID du livre requis' },
        { status: 400 }
      );
    }

    await bookService.deleteBook(id, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Livre supprimé avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du livre:', error);

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
