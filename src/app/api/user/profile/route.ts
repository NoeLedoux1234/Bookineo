import { userController } from '@/controllers/UserController';
import { withErrorHandler } from '@/lib/errors/errorHandler';
import { applyRateLimit } from '@/middlewares/rateLimiter';
import { applySecurityMiddleware } from '@/middlewares/security';
import type { NextRequest } from 'next/server';

// GET /api/user/profile - Récupérer le profil utilisateur
export const GET = withErrorHandler(async (request: NextRequest) => {
  applySecurityMiddleware(request);
  applyRateLimit(request, 'moderate');

  return await userController.getCurrentUserProfile(request);
});

// PUT /api/user/profile - Mettre à jour le profil utilisateur
export const PUT = withErrorHandler(async (request: NextRequest) => {
  applySecurityMiddleware(request);
  applyRateLimit(request, 'moderate');

  return await userController.updateCurrentUserProfile(request);
});
