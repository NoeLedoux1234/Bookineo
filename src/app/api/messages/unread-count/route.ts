import { messageController } from '@/controllers/MessageController';
import { withErrorHandler } from '@/lib/errors/errorHandler';
import { applyRateLimit } from '@/middlewares/rateLimiter';
import { applySecurityMiddleware } from '@/middlewares/security';
import type { NextRequest } from 'next/server';

// GET /api/messages/unread-count - Compter les messages non lus
export const GET = withErrorHandler(async (request: NextRequest) => {
  applySecurityMiddleware(request);
  applyRateLimit(request, 'light');

  return await messageController.getUnreadCount(request);
});
