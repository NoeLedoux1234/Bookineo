import { userRepository } from '@/lib/database/repositories/UserRepository';
import { AuthenticationError, ValidationError } from '@/lib/errors/AppError';
import type { PaginatedResponse, PaginationParams } from '@/types/api';
import type {
  CreateUserData,
  UpdateUserData,
  UserFilter,
  UserWithRelations,
} from '@/types/database';
import bcrypt from 'bcryptjs';

export class UserService {
  // Méthode utilitaire pour exclure le mot de passe des réponses
  private excludePassword(
    user: UserWithRelations
  ): Omit<UserWithRelations, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  // Créer un nouvel utilisateur
  async createUser(
    userData: CreateUserData
  ): Promise<Omit<UserWithRelations, 'password'>> {
    // Valider les données
    this.validateUserData(userData);

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Créer l'utilisateur
    const user = await userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    // Retourner sans le mot de passe
    return this.excludePassword(user);
  }

  // Authentifier un utilisateur
  async authenticateUser(
    email: string,
    password: string
  ): Promise<Omit<UserWithRelations, 'password'>> {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new AuthenticationError('Email ou mot de passe incorrect');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AuthenticationError('Email ou mot de passe incorrect');
    }

    // Retourner sans le mot de passe
    return this.excludePassword(user);
  }

  // Obtenir un utilisateur par ID
  async getUserById(id: string): Promise<Omit<UserWithRelations, 'password'>> {
    const user = await userRepository.findById(id);

    // Retourner sans le mot de passe
    return this.excludePassword(user);
  }

  // Obtenir un utilisateur par email
  async getUserByEmail(
    email: string
  ): Promise<Omit<UserWithRelations, 'password'> | null> {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      return null;
    }

    return this.excludePassword(user);
  }

  // Mettre à jour un utilisateur
  async updateUser(
    id: string,
    updateData: UpdateUserData
  ): Promise<Omit<UserWithRelations, 'password'>> {
    // Valider les données de mise à jour
    this.validateUpdateData(updateData);

    const user = await userRepository.updateById(id, updateData);

    return this.excludePassword(user);
  }

  // Changer le mot de passe
  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await userRepository.findById(id);

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw new AuthenticationError('Mot de passe actuel incorrect');
    }

    // Valider le nouveau mot de passe
    this.validatePassword(newPassword);

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await userRepository.updateById(id, { password: hashedPassword });
  }

  // Rechercher des utilisateurs
  async searchUsers(
    filter: UserFilter,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Omit<UserWithRelations, 'password'>>> {
    const result = await userRepository.search(filter, pagination);

    // Retourner sans les mots de passe
    const itemsWithoutPasswords = result.items.map((user) =>
      this.excludePassword(user)
    );

    return {
      ...result,
      items: itemsWithoutPasswords,
    };
  }

  // Obtenir les statistiques d'un utilisateur
  async getUserStats(id: string) {
    return await userRepository.getUserStats(id);
  }

  // Supprimer un utilisateur
  async deleteUser(id: string): Promise<void> {
    await userRepository.deleteById(id);
  }

  // Vérifier si un email existe
  async emailExists(email: string): Promise<boolean> {
    const user = await userRepository.findByEmail(email);
    return user !== null;
  }

  // Méthodes privées de validation
  private validateUserData(userData: CreateUserData): void {
    const errors: Record<string, string> = {};

    if (!userData.email || !this.isValidEmail(userData.email)) {
      errors.email = 'Email invalide';
    }

    if (!userData.password) {
      errors.password = 'Mot de passe requis';
    } else {
      const passwordError = this.validatePassword(userData.password);
      if (passwordError) {
        errors.password = passwordError;
      }
    }

    if (userData.firstName && userData.firstName.trim().length < 2) {
      errors.firstName = 'Le prénom doit contenir au moins 2 caractères';
    }

    if (userData.lastName && userData.lastName.trim().length < 2) {
      errors.lastName = 'Le nom doit contenir au moins 2 caractères';
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Données utilisateur invalides', errors);
    }
  }

  private validateUpdateData(updateData: UpdateUserData): void {
    const errors: Record<string, string> = {};

    if (updateData.email && !this.isValidEmail(updateData.email)) {
      errors.email = 'Email invalide';
    }

    if (updateData.firstName && updateData.firstName.trim().length < 2) {
      errors.firstName = 'Le prénom doit contenir au moins 2 caractères';
    }

    if (updateData.lastName && updateData.lastName.trim().length < 2) {
      errors.lastName = 'Le nom doit contenir au moins 2 caractères';
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Données de mise à jour invalides', errors);
    }
  }

  private validatePassword(password: string): string | null {
    if (password.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (!/[a-z]/.test(password)) {
      return 'Le mot de passe doit contenir au moins une minuscule';
    }

    if (!/[A-Z]/.test(password)) {
      return 'Le mot de passe doit contenir au moins une majuscule';
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Le mot de passe doit contenir au moins un caractère spécial';
    }

    return null;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length >= 5 && email.length <= 100;
  }
}

// Export singleton instance
export const userService = new UserService();
