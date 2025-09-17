import { clearRateLimit } from '@/middlewares/rateLimiter';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/dev/clear-rate-limit - Nettoie le rate limiting (développement uniquement)
export async function POST(request: NextRequest) {
  // Vérifier qu'on est en développement
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      {
        success: false,
        message: 'Route disponible uniquement en développement',
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { key } = body;

    clearRateLimit(key);

    return NextResponse.json({
      success: true,
      message: key
        ? `Rate limit cleared for key: ${key}`
        : 'All rate limits cleared',
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Erreur lors du nettoyage du rate limiting' },
      { status: 500 }
    );
  }
}
