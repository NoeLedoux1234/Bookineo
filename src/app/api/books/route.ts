import { authOptions } from '@/lib/auth';
import type { BookFilter } from '@/lib/database/repositories/BookRepository';
import { AppError } from '@/lib/errors/AppError';
import { bookService } from '@/services/BookService';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createBookSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200),
  author: z.string().min(1, "L'auteur est requis").max(100),
  year: z.number().int().min(1000).max(2030).optional().nullable(),
  category: z.string().min(1, 'La catégorie est requise').max(50),
  price: z.number().min(0, 'Le prix ne peut pas être négatif').max(10000),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  asin: z.string().optional(),
  isbn10: z.string().optional(),
});

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
  status: z.enum(['AVAILABLE', 'RENTED']).optional(),
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
  year: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  hasOwner: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  sortBy: z
    .enum([
      'title',
      'author',
      'year',
      'category',
      'price',
      'status',
      'createdAt',
      'updatedAt',
    ])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryObject = Object.fromEntries(searchParams.entries());

    const validatedQuery = querySchema.parse(queryObject);

    const filters: BookFilter = {
      search: validatedQuery.search,
      status: validatedQuery.status,
      category: validatedQuery.category,
      author: validatedQuery.author,
      priceMin: validatedQuery.priceMin,
      priceMax: validatedQuery.priceMax,
      year: validatedQuery.year,
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
  } catch (error) {
    console.error('Erreur lors de la récupération des livres:', error);

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

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Authentification requise' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createBookSchema.parse(body);

    const createdBook = await bookService.createBook(
      validatedData,
      session.user.id
    );

    return NextResponse.json(
      {
        success: true,
        data: createdBook,
        message: 'Livre créé avec succès',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de la création du livre:', error);

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
