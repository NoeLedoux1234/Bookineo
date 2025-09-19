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
  birthDate: z
    .string()
    .optional()
    .transform((date) => date || undefined),
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

// Schémas pour les livres
export const createBookSchema = z.object({
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
  categoryName: z.string().max(50, 'Maximum 50 caractères').optional(),
  categoryId: z.number().int().min(1, "L'ID de catégorie est requis"),
  price: z
    .number()
    .min(0, 'Prix ne peut pas être négatif')
    .max(10000, 'Prix trop élevé'),
  imgUrl: z.string().url('URL invalide').optional().or(z.literal('')),
  asin: z.string().optional(),
  soldBy: z.string().optional(),
  productURL: z.string().url('URL invalide').optional().or(z.literal('')),
  stars: z.number().min(0).max(5).optional(),
  reviews: z.number().int().min(0).optional(),
  isKindleUnlimited: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isEditorsPick: z.boolean().optional(),
  isGoodReadsChoice: z.boolean().optional(),
  publishedDate: z.string().optional(),
});

export const updateBookSchema = createBookSchema.partial();

export const bookQuerySchema = paginationSchema.extend({
  status: z.enum(['AVAILABLE', 'RENTED']).optional(),
  category: z.string().optional(),
  author: z.string().optional(),
  priceMin: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().min(0).optional()),
  priceMax: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .pipe(z.number().min(0).optional()),
  hasOwner: z
    .string()
    .optional()
    .transform((val) =>
      val === 'true' ? true : val === 'false' ? false : undefined
    ),
  sortBy: z
    .enum([
      'title',
      'author',
      'categoryName',
      'price',
      'createdAt',
      'updatedAt',
      'stars', // Ajouté pour permettre le tri par note
    ])
    .optional(),
});

// Schémas pour les locations
export const createRentalSchema = z.object({
  bookId: idSchema,
  renterId: idSchema,
  duration: z
    .number()
    .int()
    .min(1, 'Durée minimum: 1 jour')
    .max(365, 'Durée maximum: 365 jours'),
  comment: z.string().optional(),
  startDate: z.string().datetime().optional(),
});

export const updateRentalSchema = z.object({
  returnDate: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  comment: z.string().optional(),
  action: z.enum(['return', 'cancel']).optional(),
});

export const rentalQuerySchema = paginationSchema.extend({
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  bookId: idSchema.optional(),
  renterId: idSchema.optional(),
  startDateFrom: z.string().optional(),
  startDateTo: z.string().optional(),
  endDateFrom: z.string().optional(),
  endDateTo: z.string().optional(),
  sortBy: z
    .enum(['startDate', 'endDate', 'duration', 'status', 'createdAt'])
    .optional(),
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

// Types pour les livres
export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type BookQueryInput = z.infer<typeof bookQuerySchema>;

// Types pour les locations
export type CreateRentalInput = z.infer<typeof createRentalSchema>;
export type UpdateRentalInput = z.infer<typeof updateRentalSchema>;
export type RentalQueryInput = z.infer<typeof rentalQuerySchema>;
