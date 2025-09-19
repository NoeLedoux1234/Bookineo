import type { AuthenticatedRequest } from '@/middlewares/auth';
import { withAuthAndErrorHandler } from '@/middlewares/errorHandler';
import { rentalService } from '@/services/RentalService';
import { NextResponse } from 'next/server';

/**
 * GET /api/rentals/user - Récupère les locations de l'utilisateur connecté
 */
export const GET = withAuthAndErrorHandler(
  async (request: AuthenticatedRequest) => {
    const rentals = await rentalService.getRentalsByUserId(request.user.id);

    return NextResponse.json({
      success: true,
      data: rentals,
    });
  }
);
