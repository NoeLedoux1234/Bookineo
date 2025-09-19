import { idSchema } from '@/lib/validation/schemas';
import type { AuthenticatedRequest } from '@/middlewares/auth';
import { withAuthAndErrorHandler } from '@/middlewares/errorHandler';
import { cartService } from '@/services/CartService';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: {
    bookId: string;
  };
}

/**
 * DELETE /api/cart/[bookId] - Retire un livre spécifique du panier
 */
export const DELETE = withAuthAndErrorHandler(
  async (request: AuthenticatedRequest, { params }: RouteParams) => {
    const bookId = idSchema.parse(params.bookId);

    await cartService.removeFromCart(request.user.id, bookId);

    // Retourner le nouveau nombre d'items
    const itemCount = await cartService.getCartItemCount(request.user.id);

    return NextResponse.json({
      success: true,
      message: 'Livre retiré du panier avec succès',
      data: { itemCount },
    });
  }
);
