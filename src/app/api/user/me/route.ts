import { updateUserSchema } from '@/lib/validation/schemas';
import type { AuthenticatedRequest } from '@/middlewares/auth';
import { withAuthAndErrorHandler } from '@/middlewares/errorHandler';
import { userService } from '@/services/UserService';
import { NextResponse } from 'next/server';

export const GET = withAuthAndErrorHandler(
  async (request: AuthenticatedRequest) => {
    const userDetails = await userService.getUserById(request.user.id);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: userDetails.id,
          email: userDetails.email,
          firstName: userDetails.firstName,
          lastName: userDetails.lastName,
          birthDate: userDetails.birthDate,
          createdAt: userDetails.createdAt,
          updatedAt: userDetails.updatedAt,
          fullName:
            userDetails.firstName && userDetails.lastName
              ? `${userDetails.firstName} ${userDetails.lastName}`
              : userDetails.firstName || userDetails.email,
        },
      },
      message: 'Données utilisateur récupérées',
    });
  }
);

export const PUT = withAuthAndErrorHandler(
  async (request: AuthenticatedRequest) => {
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    const updatedUser = await userService.updateUser(
      request.user.id,
      validatedData
    );

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          birthDate: updatedUser.birthDate,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
          fullName:
            updatedUser.firstName && updatedUser.lastName
              ? `${updatedUser.firstName} ${updatedUser.lastName}`
              : updatedUser.firstName || updatedUser.email,
        },
      },
      message: 'Profil mis à jour avec succès',
    });
  }
);
