// Fonctions utilitaires pour l'application

/**
 * Formatte une date de manière lisible en français
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formatte une date avec l'heure
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatte une date de manière relative (il y a X temps)
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - d.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "À l'instant";
  if (diffInMinutes < 60)
    return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
  if (diffInHours < 24)
    return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
  if (diffInDays < 7)
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;

  return formatDate(d);
}

/**
 * Génère un nom d'affichage à partir du prénom et nom
 */
export function getDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  email?: string
): string {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  if (firstName) {
    return firstName;
  }
  if (lastName) {
    return lastName;
  }
  if (email) {
    return email.split('@')[0];
  }
  return 'Utilisateur';
}

/**
 * Génère des initiales à partir du nom
 */
export function getInitials(
  firstName?: string | null,
  lastName?: string | null,
  email?: string
): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName.substring(0, 2).toUpperCase();
  }
  if (lastName) {
    return lastName.substring(0, 2).toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return 'U';
}

/**
 * Tronque un texte à une longueur donnée
 */
export function truncateText(
  text: string,
  maxLength: number = 100,
  suffix: string = '...'
): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Formatte un prix en euros
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

/**
 * Génère un slug à partir d'un texte
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9\s-]/g, '') // Supprimer les caractères spéciaux
    .trim()
    .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
    .replace(/-+/g, '-'); // Supprimer les tirets multiples
}

/**
 * Valide un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valide un mot de passe selon les critères de sécurité
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  score: number;
} {
  const errors: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else errors.push('Au moins 8 caractères requis');

  if (/[a-z]/.test(password)) score += 1;
  else errors.push('Au moins une minuscule requise');

  if (/[A-Z]/.test(password)) score += 1;
  else errors.push('Au moins une majuscule requise');

  if (/[0-9]/.test(password)) score += 1;
  else errors.push('Au moins un chiffre requis');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else errors.push('Au moins un caractère spécial requis');

  return {
    isValid: errors.length === 0,
    errors,
    score,
  };
}

/**
 * Génère une couleur basée sur un texte (pour les avatars)
 */
export function getColorFromText(text: string): string {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E9',
    '#F8C471',
    '#82E0AA',
    '#F1948A',
    '#85C1E9',
    '#D2B4DE',
  ];

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Debounce une fonction
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle une fonction
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Génère un ID unique
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Copie profonde d'un objet
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array)
    return obj.map((item) => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as { [key: string]: any };
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone((obj as any)[key]);
      }
    }
    return clonedObj as T;
  }
  return obj;
}
