import { AppError } from '@/lib/errors/AppError';
import { userService } from '@/services/UserService';
import type {
  CreateUserData,
  UpdateUserData,
  UserFilter,
} from '@/types/database';
import { NextRequest } from 'next/server';
import { BaseController } from './BaseController';

export class UserController extends BaseController {
  // Créer un nouvel utilisateur
  async createUser(request: NextRequest) {
    return this.handleRequest(async () => {
      const userData = await this.parseRequestBody<CreateUserData>(request);

      const user = await userService.createUser(userData);

      return {
        success: true,
        data: user,
        message: 'Utilisateur créé avec succès',
      };
    });
  }

  // Obtenir le profil utilisateur actuel
  async getCurrentUserProfile(request: NextRequest) {
    return this.handleAuthenticatedRequest(request, async (authContext) => {
      const user = await userService.getUserById(authContext.user.id);
      const stats = await userService.getUserStats(authContext.user.id);

      return {
        success: true,
        profile: user,
        stats,
        message: 'Profil récupéré avec succès',
      };
    });
  }

  // Mettre à jour le profil utilisateur
  async updateCurrentUserProfile(request: NextRequest) {
    return this.handleAuthenticatedRequest(request, async (authContext) => {
      const updateData = await this.parseRequestBody<UpdateUserData>(request);

      // Filtrer et valider les champs autorisés
      const filteredData: UpdateUserData = {};

      if (updateData.firstName !== undefined) {
        filteredData.firstName = updateData.firstName;
      }
      if (updateData.lastName !== undefined) {
        filteredData.lastName = updateData.lastName;
      }
      if (updateData.birthDate !== undefined) {
        filteredData.birthDate = updateData.birthDate;
      }

      const user = await userService.updateUser(
        authContext.user.id,
        filteredData
      );

      return {
        success: true,
        profile: user,
        message: 'Profil mis à jour avec succès',
      };
    });
  }

  // Obtenir un utilisateur par ID
  async getUserById(request: NextRequest, params: { id: string }) {
    return this.handleAuthenticatedRequest(request, async (authContext) => {
      const userId = this.extractId(params);

      // Les utilisateurs ne peuvent voir que leur propre profil complet
      // Pour les autres, on limite les informations
      if (userId === authContext.user.id) {
        const user = await userService.getUserById(userId);
        const stats = await userService.getUserStats(userId);

        return {
          success: true,
          data: {
            profile: user,
            stats,
          },
        };
      } else {
        const user = await userService.getUserById(userId);

        // Limiter les informations pour les autres utilisateurs
        return {
          success: true,
          data: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email, // Peut être retiré selon les besoins de confidentialité
          },
        };
      }
    });
  }

  // Changer le mot de passe
  async changePassword(request: NextRequest) {
    return this.handleAuthenticatedRequest(request, async (authContext) => {
      const { currentPassword, newPassword } = await this.parseRequestBody<{
        currentPassword: string;
        newPassword: string;
      }>(request);

      if (!currentPassword || !newPassword) {
        throw AppError.badRequest(
          'Mot de passe actuel et nouveau mot de passe requis'
        );
      }

      await userService.changePassword(
        authContext.user.id,
        currentPassword,
        newPassword
      );

      return {
        success: true,
        message: 'Mot de passe mis à jour avec succès',
      };
    });
  }

  // Rechercher des utilisateurs (recherche publique limitée)
  async searchUsers(request: NextRequest) {
    return this.handleRequest(async () => {
      const pagination = this.getPaginationParams(request);
      const { searchParams } = new URL(request.url);

      const filter: UserFilter = {
        email: searchParams.get('email') || undefined,
        firstName: searchParams.get('firstName') || undefined,
        lastName: searchParams.get('lastName') || undefined,
      };

      // Ajouter filtre de date si fourni
      const createdFrom = searchParams.get('createdFrom');
      const createdTo = searchParams.get('createdTo');

      if (createdFrom || createdTo) {
        filter.createdAt = {};
        if (createdFrom) filter.createdAt.from = new Date(createdFrom);
        if (createdTo) filter.createdAt.to = new Date(createdTo);
      }

      const result = await userService.searchUsers(filter, pagination);

      // Limiter les informations retournées pour la recherche publique
      const limitedResults = {
        ...result,
        items: result.items.map((user) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          // Email omis pour la confidentialité dans la recherche publique
        })),
      };

      return {
        success: true,
        data: limitedResults,
        message: 'Recherche effectuée avec succès',
      };
    });
  }

  // Supprimer le compte utilisateur
  async deleteCurrentUser(request: NextRequest) {
    return this.handleAuthenticatedRequest(request, async (authContext) => {
      const { password } = await this.parseRequestBody<{ password: string }>(
        request
      );

      if (!password) {
        throw AppError.badRequest(
          'Mot de passe requis pour supprimer le compte'
        );
      }

      // Vérifier le mot de passe avant suppression
      await userService.authenticateUser(authContext.user.email, password);

      // Supprimer l'utilisateur
      await userService.deleteUser(authContext.user.id);

      return {
        success: true,
        message: 'Compte supprimé avec succès',
      };
    });
  }

  // Vérifier si un email existe (pour validation côté client)
  async checkEmailExists(request: NextRequest) {
    return this.handleRequest(async () => {
      const { searchParams } = new URL(request.url);
      const email = searchParams.get('email');

      if (!email) {
        throw AppError.badRequest('Email requis');
      }

      const exists = await userService.emailExists(email);

      return {
        success: true,
        data: { exists },
        message: exists ? 'Email déjà utilisé' : 'Email disponible',
      };
    });
  }
}

// Export singleton instance
export const userController = new UserController();
