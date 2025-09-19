import {
  createRentalSchema,
  rentalQuerySchema,
} from '@/lib/validation/schemas';
import type { AuthenticatedRequest } from '@/middlewares/auth';
import { withAuthAndErrorHandler } from '@/middlewares/errorHandler';
import { rentalService } from '@/services/RentalService';
import { NextResponse } from 'next/server';

export const GET = withAuthAndErrorHandler(
  async (request: AuthenticatedRequest) => {
    const { searchParams } = new URL(request.url);
    const queryObject = Object.fromEntries(searchParams.entries());

    const validatedQuery = rentalQuerySchema.parse(queryObject);

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

    return NextResponse.json({
      success: true,
      data: result,
    });
  }
);

export const POST = withAuthAndErrorHandler(
  async (request: AuthenticatedRequest) => {
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
  }
);
