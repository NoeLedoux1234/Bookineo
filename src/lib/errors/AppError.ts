// Classe d'erreur personnalisée pour l'application
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: Record<string, unknown>,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    // Maintient la stack trace pour le debugging
    Error.captureStackTrace(this, this.constructor);
  }

  // Méthodes de convenance pour créer des erreurs communes
  static badRequest(
    message: string,
    details?: Record<string, unknown>
  ): AppError {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message: string = 'Non autorisé'): AppError {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Accès interdit'): AppError {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static notFound(message: string = 'Ressource non trouvée'): AppError {
    return new AppError(message, 404, 'NOT_FOUND');
  }

  static conflict(
    message: string,
    details?: Record<string, unknown>
  ): AppError {
    return new AppError(message, 409, 'CONFLICT', details);
  }

  static validation(
    message: string,
    details: Record<string, string | string[]>
  ): AppError {
    return new AppError(message, 422, 'VALIDATION_ERROR', details);
  }

  static internal(message: string = 'Erreur interne du serveur'): AppError {
    return new AppError(message, 500, 'INTERNAL_SERVER_ERROR');
  }

  // Convertit l'erreur en objet JSON sérialisable
  toJSON() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      details: this.details,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }
}

// Erreurs spécifiques au domaine
export class AuthenticationError extends AppError {
  constructor(message: string = "Échec de l'authentification") {
    super(message, 401, 'AUTHENTICATION_FAILED');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Permissions insuffisantes') {
    super(message, 403, 'INSUFFICIENT_PERMISSIONS');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details: Record<string, string | string[]>) {
    super(message, 422, 'VALIDATION_FAILED', details);
  }
}

export class DatabaseError extends AppError {
  constructor(
    message: string = 'Erreur de base de données',
    originalError?: Error
  ) {
    super(message, 500, 'DATABASE_ERROR', {
      originalMessage: originalError?.message,
    });
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} avec l'ID '${id}' non trouvé(e)`
      : `${resource} non trouvé(e)`;
    super(message, 404, 'RESOURCE_NOT_FOUND', { resource, id });
  }
}

export class DuplicateResourceError extends AppError {
  constructor(resource: string, field: string, value: string) {
    super(
      `${resource} avec ${field} '${value}' existe déjà`,
      409,
      'DUPLICATE_RESOURCE',
      { resource, field, value }
    );
  }
}
