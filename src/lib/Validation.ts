import { z } from 'zod';

// Validation email stricte
export const emailSchema = z
  .string()
  .email("Format d'email invalide (ex: prenom.nom@domaine.com)")
  .min(5, 'Email trop court')
  .max(100, 'Email trop long')
  .transform((email) => email.toLowerCase().trim());

// Validation mot de passe stricte selon spécifications
export const passwordSchema = z
  .string()
  .min(8, 'Au moins 8 caractères requis')
  .max(128, 'Mot de passe trop long')
  .regex(/[a-z]/, 'Au moins une minuscule requise')
  .regex(/[A-Z]/, 'Au moins une majuscule requise')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Au moins un caractère spécial requis');

// Schéma d'inscription
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    firstName: z
      .string()
      .min(2, 'Prénom requis')
      .max(50, 'Prénom trop long')
      .optional(),
    lastName: z
      .string()
      .min(2, 'Nom requis')
      .max(50, 'Nom trop long')
      .optional(),
    birthDate: z.string().datetime().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

// Schéma de connexion
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Mot de passe requis'),
  rememberMe: z.boolean().optional(),
});

// Types dérivés
export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;

// Fonction utilitaire pour valider et formater les erreurs
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.reduce(
    (acc: Record<string, string>, err) => {
      acc[err.path.join('.')] = err.message;
      return acc;
    },
    {} as Record<string, string>
  );

  return { success: false, errors };
}
