import type { AuthenticatedRequest } from '@/middlewares/auth';
import { withAuthAndErrorHandler } from '@/middlewares/errorHandler';
import { cartService } from '@/services/CartService';
import { NextResponse } from 'next/server';

/**
 * GET /api/cart/count - Récupère rapidement le nombre d'items dans le panier
 */
export const GET = withAuthAndErrorHandler(
  async (request: AuthenticatedRequest) => {
    const itemCount = await cartService.getCartItemCount(request.user.id);

    return NextResponse.json({
      success: true,
      data: { count: itemCount },
    });
  }
);
