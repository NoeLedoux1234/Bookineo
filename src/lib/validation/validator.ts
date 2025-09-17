import { AppError, ValidationError } from '@/lib/errors/AppError';
import { z } from 'zod';

// Fonction utilitaire pour valider les données avec Zod
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};

      error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        errors[path] = issue.message;
      });

      throw new ValidationError('Données invalides', errors);
    }

    throw new AppError('Erreur de validation inconnue', 500);
  }
}

// Fonction pour valider de manière asynchrone
export async function validateDataAsync<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<T> {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};

      error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        errors[path] = issue.message;
      });

      throw new ValidationError('Données invalides', errors);
    }

    throw new AppError('Erreur de validation inconnue', 500);
  }
}

// Fonction pour valider partiellement (safe parse)
export function safeValidateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
):
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });

  return { success: false, errors };
}

// Middleware pour valider les query parameters
export function validateQueryParams<T>(
  schema: z.ZodSchema<T>,
  params: URLSearchParams
): T {
  const queryObject: Record<string, string | string[]> = {};

  for (const [key, value] of params.entries()) {
    if (queryObject[key]) {
      // Si la clé existe déjà, créer un tableau
      if (Array.isArray(queryObject[key])) {
        (queryObject[key] as string[]).push(value);
      } else {
        queryObject[key] = [queryObject[key] as string, value];
      }
    } else {
      queryObject[key] = value;
    }
  }

  return validateData(schema, queryObject);
}

// Middleware pour valider les paramètres de route
export function validateRouteParams<T>(
  schema: z.ZodSchema<T>,
  params: Record<string, string>
): T {
  return validateData(schema, params);
}

// Fonction pour créer un middleware de validation personnalisé
export function createValidator<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    return validateData(schema, data);
  };
}

// Fonction pour nettoyer et transformer les données
export function sanitizeHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Supprimer les scripts
    .replace(/<[^>]+>/g, '') // Supprimer toutes les balises HTML
    .trim();
}

// Fonction pour nettoyer les chaînes de caractères
export function sanitizeString(input: string, maxLength: number = 255): string {
  return input.trim().substring(0, maxLength).replace(/[<>]/g, ''); // Supprimer les caractères potentiellement dangereux
}

// Validation des fichiers uploadés (pour plus tard)
export function validateFileUpload(
  file: File,
  maxSize: number = 5 * 1024 * 1024, // 5MB par défaut
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif']
): void {
  if (!file) {
    throw new ValidationError('Fichier requis', {
      file: 'Aucun fichier fourni',
    });
  }

  if (file.size > maxSize) {
    throw new ValidationError('Fichier trop volumineux', {
      file: `Taille maximale autorisée: ${maxSize / (1024 * 1024)}MB`,
    });
  }

  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError('Type de fichier non autorisé', {
      file: `Types autorisés: ${allowedTypes.join(', ')}`,
    });
  }
}

// Validation des coordonnées géographiques
export const geoLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// Validation des numéros de téléphone (format français)
export const phoneSchema = z
  .string()
  .regex(
    /^(?:\+33|0)[1-9](?:[0-9]{8})$/,
    'Numéro de téléphone français invalide'
  );

// Validation des codes postaux français
export const postalCodeSchema = z
  .string()
  .regex(/^(?:[0-8]\d|9[0-8])\d{3}$/, 'Code postal français invalide');

// Validation des URL
export const urlSchema = z
  .string()
  .url('URL invalide')
  .max(2048, 'URL trop longue');

// Export des validateurs couramment utilisés
export const commonValidators = {
  email: (email: string) => z.string().email().parse(email),
  password: (password: string) => z.string().min(8).parse(password),
  phone: (phone: string) => phoneSchema.parse(phone),
  postalCode: (code: string) => postalCodeSchema.parse(code),
  url: (url: string) => urlSchema.parse(url),
};
