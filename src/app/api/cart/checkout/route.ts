import { checkoutCartSchema } from '@/lib/validation/schemas';
import type { AuthenticatedRequest } from '@/middlewares/auth';
import { withAuthAndErrorHandler } from '@/middlewares/errorHandler';
import { cartService } from '@/services/CartService';
import { NextResponse } from 'next/server';

/**
 * POST /api/cart/checkout - Procède au checkout du panier (transforme en locations)
 */
export const POST = withAuthAndErrorHandler(
  async (request: AuthenticatedRequest) => {
    const body = await request.json();
    const checkoutData = checkoutCartSchema.parse(body);

    const result = await cartService.checkoutCart(
      request.user.id,
      checkoutData
    );

    return NextResponse.json(
      {
        success: true,
        message: `${result.rentals.length} location(s) créée(s) avec succès`,
        data: {
          rentalCount: result.rentals.length,
          rentalIds: result.rentals,
          totalAmount: result.total,
        },
      },
      { status: 201 }
    );
  }
);
