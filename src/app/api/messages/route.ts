import { messageController } from '@/controllers/MessageController';
import { withErrorHandler } from '@/lib/errors/errorHandler';
import { applyRateLimit } from '@/middlewares/rateLimiter';
import { applySecurityMiddleware } from '@/middlewares/security';
import type { NextRequest } from 'next/server';

// GET /api/messages - Récupérer les messages reçus
export const GET = withErrorHandler(async (request: NextRequest) => {
  applySecurityMiddleware(request);
  applyRateLimit(request, 'light');

  return await messageController.getReceivedMessages(request);
});

// POST /api/messages - Envoyer un nouveau message
export const POST = withErrorHandler(async (request: NextRequest) => {
  applySecurityMiddleware(request);
  applyRateLimit(request, 'messaging');

  return await messageController.sendMessage(request);
});
