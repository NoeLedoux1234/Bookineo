import { authOptions } from '@/lib/auth';
import { AppError } from '@/lib/errors/AppError';
import { rentalService } from '@/services/RentalService';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createRentalSchema = z.object({
  bookId: z.string().min(1, 'ID du livre requis'),
  renterId: z.string().min(1, 'ID du locataire requis'),
  duration: z
    .number()
    .int()
    .min(1, "La durée doit être d'au moins 1 jour")
    .max(365, 'La durée ne peut pas dépasser 365 jours'),
  comment: z.string().optional(),
  startDate: z.string().datetime().optional(),
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
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  bookId: z.string().optional(),
  renterId: z.string().optional(),
  startDateFrom: z.string().datetime().optional(),
  startDateTo: z.string().datetime().optional(),
  endDateFrom: z.string().datetime().optional(),
  endDateTo: z.string().datetime().optional(),
  sortBy: z
    .enum([
      'startDate',
      'endDate',
      'duration',
      'status',
      'createdAt',
      'updatedAt',
    ])
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

    const filters = {
      search: validatedQuery.search,
      status: validatedQuery.status,
      bookId: validatedQuery.bookId,
      renterId: validatedQuery.renterId,
      startDateFrom: validatedQuery.startDateFrom
        ? new Date(validatedQuery.startDateFrom)
        : undefined,
      startDateTo: validatedQuery.startDateTo
        ? new Date(validatedQuery.startDateTo)
        : undefined,
      endDateFrom: validatedQuery.endDateFrom
        ? new Date(validatedQuery.endDateFrom)
        : undefined,
      endDateTo: validatedQuery.endDateTo
        ? new Date(validatedQuery.endDateTo)
        : undefined,
    };

    const pagination = {
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      sortBy: validatedQuery.sortBy,
      sortOrder: validatedQuery.sortOrder,
    };

    const result = await rentalService.getRentals(filters, pagination);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur lors de la récupération des locations:', error);

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
    const validatedData = createRentalSchema.parse(body);

    const rentalData = {
      ...validatedData,
      startDate: validatedData.startDate
        ? new Date(validatedData.startDate)
        : undefined,
    };

    const rental = await rentalService.createRental(rentalData);

    return NextResponse.json(
      {
        success: true,
        data: rental,
        message: 'Location créée avec succès',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de la création de la location:', error);

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
