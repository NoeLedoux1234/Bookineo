import { z } from 'zod';

// Schémas de validation réutilisables
export const emailSchema = z
  .string()
  .email("Format d'email invalide")
  .min(5, 'Email trop court')
  .max(100, 'Email trop long')
  .transform((email) => email.toLowerCase().trim());

export const passwordSchema = z
  .string()
  .min(8, 'Au moins 8 caractères requis')
  .max(128, 'Mot de passe trop long')
  .regex(/[a-z]/, 'Au moins une minuscule requise')
  .regex(/[A-Z]/, 'Au moins une majuscule requise')
  .regex(/[0-9]/, 'Au moins un chiffre requis')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Au moins un caractère spécial requis');

export const nameSchema = z
  .string()
  .min(2, 'Au moins 2 caractères requis')
  .max(50, 'Trop long (max 50 caractères)')
  .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Caractères non valides détectés')
  .transform((name) => name.trim());

export const idSchema = z.string().cuid('ID invalide');

export const dateSchema = z
  .string()
  .datetime('Format de date invalide')
  .or(z.date())
  .transform((date) => (typeof date === 'string' ? new Date(date) : date));

// Schémas pour l'authentification
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  birthDate: dateSchema.optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Mot de passe requis'),
  rememberMe: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: passwordSchema,
});

// Schémas pour les utilisateurs
export const updateUserSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  birthDate: dateSchema.optional(),
});

export const userFilterSchema = z.object({
  email: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  createdFrom: dateSchema.optional(),
  createdTo: dateSchema.optional(),
});

// Schémas pour les messages
export const sendMessageSchema = z.object({
  receiverEmail: emailSchema,
  content: z
    .string()
    .min(1, 'Contenu du message requis')
    .max(1000, 'Message trop long (max 1000 caractères)')
    .transform((content) => content.trim()),
});

export const messageFilterSchema = z.object({
  content: z.string().optional(),
  isRead: z.boolean().optional(),
  senderId: idSchema.optional(),
  receiverId: idSchema.optional(),
});

// Schémas pour la pagination
export const paginationSchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .optional()
    .default('1')
    .transform((val) => {
      const num = typeof val === 'string' ? parseInt(val, 10) : val;
      return isNaN(num) ? 1 : num;
    })
    .refine((val: number) => val >= 1, 'Page doit être >= 1'),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .default('20')
    .transform((val) => {
      const num = typeof val === 'string' ? parseInt(val, 10) : val;
      const safeNum = isNaN(num) ? 20 : Math.min(num, 100);
      return safeNum >= 1 ? safeNum : 20;
    })
    .refine(
      (val: number) => val >= 1 && val <= 100,
      'Limit doit être entre 1 et 100'
    ),
  search: z.string().max(100, 'Recherche trop longue').optional(),
  sortBy: z.string().max(50, 'SortBy trop long').optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Schémas pour les livres (pour plus tard)
export const bookSchema = z.object({
  title: z
    .string()
    .min(1, 'Titre requis')
    .max(200, 'Titre trop long')
    .transform((title) => title.trim()),
  author: z
    .string()
    .min(1, 'Auteur requis')
    .max(100, "Nom d'auteur trop long")
    .transform((author) => author.trim()),
  year: z
    .number()
    .min(1000, 'Année invalide')
    .max(new Date().getFullYear() + 1, 'Année dans le futur'),
  category: z
    .string()
    .min(1, 'Catégorie requise')
    .max(50, 'Catégorie trop longue')
    .transform((category) => category.trim()),
  price: z
    .number()
    .min(0, 'Prix ne peut pas être négatif')
    .max(10000, 'Prix trop élevé'),
});

// Types inférés des schémas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserFilterInput = z.infer<typeof userFilterSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type MessageFilterInput = z.infer<typeof messageFilterSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type BookInput = z.infer<typeof bookSchema>;
