import { messageController } from '@/controllers/MessageController';
import { withErrorHandler } from '@/lib/errors/errorHandler';
import { applyRateLimit } from '@/middlewares/rateLimiter';
import { applySecurityMiddleware } from '@/middlewares/security';
import type { NextRequest } from 'next/server';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/messages/[id] - Récupérer un message spécifique
export const GET = withErrorHandler(
  async (request: NextRequest, context: RouteParams) => {
    applySecurityMiddleware(request);
    applyRateLimit(request, 'moderate');

    const params = await context.params;
    return await messageController.getMessageById(request, params);
  }
);
