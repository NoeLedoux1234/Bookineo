export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // At least 8 characters, one uppercase, one lowercase, one special character
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
  return passwordRegex.test(password);
};

export const getPasswordStrengthMessage = (password: string): string[] => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Au moins 8 caractères');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Au moins une majuscule');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Au moins une minuscule');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Au moins un caractère spécial');
  }

  return errors;
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
};
