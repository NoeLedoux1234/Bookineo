import { addToCartSchema, cartQuerySchema } from '@/lib/validation/schemas';
import type { AuthenticatedRequest } from '@/middlewares/auth';
import { withAuthAndErrorHandler } from '@/middlewares/errorHandler';
import { cartService } from '@/services/CartService';
import { NextResponse } from 'next/server';

/**
 * GET /api/cart - Récupère le panier de l'utilisateur
 */
export const GET = withAuthAndErrorHandler(
  async (request: AuthenticatedRequest) => {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Convertir string boolean en boolean
    const processedParams: Record<string, any> = { ...queryParams };
    if (processedParams.includeDetails) {
      processedParams.includeDetails =
        processedParams.includeDetails === 'true';
    }

    const { includeDetails } = cartQuerySchema.parse(processedParams);

    if (includeDetails) {
      // Retourner le panier complet avec détails des livres
      const cart = await cartService.getUserCart(request.user.id);

      return NextResponse.json({
        success: true,
        data: {
          id: cart.id,
          itemCount: cart.items.length,
          totalPrice: cart.items.reduce(
            (total, item) => total + item.book.price,
            0
          ),
          items: cart.items.map((item) => ({
            id: item.id,
            addedAt: item.addedAt,
            book: {
              id: item.book.id,
              title: item.book.title,
              author: item.book.author,
              price: item.book.price,
              imgUrl: item.book.imgUrl,
              stars: item.book.stars,
              categoryName: item.book.categoryName,
              status: item.book.status,
            },
          })),
          createdAt: cart.createdAt,
          updatedAt: cart.updatedAt,
        },
      });
    } else {
      // Retourner seulement le résumé
      const summary = await cartService.getCartSummary(request.user.id);

      return NextResponse.json({
        success: true,
        data: summary,
      });
    }
  }
);

/**
 * POST /api/cart - Ajoute un livre au panier
 */
export const POST = withAuthAndErrorHandler(
  async (request: AuthenticatedRequest) => {
    const body = await request.json();
    const { bookId } = addToCartSchema.parse(body);

    await cartService.addToCart(request.user.id, bookId);

    // Retourner le nouveau nombre d'items
    const itemCount = await cartService.getCartItemCount(request.user.id);

    return NextResponse.json(
      {
        success: true,
        message: 'Livre ajouté au panier avec succès',
        data: { itemCount },
      },
      { status: 201 }
    );
  }
);

/**
 * DELETE /api/cart - Vide complètement le panier
 */
export const DELETE = withAuthAndErrorHandler(
  async (request: AuthenticatedRequest) => {
    await cartService.clearCart(request.user.id);

    return NextResponse.json({
      success: true,
      message: 'Panier vidé avec succès',
    });
  }
);
