// Export des principales classes et fonctions de l'architecture backend

// Database layer
export { BaseRepository } from './database/BaseRepository';
export { prisma } from './database/client';
export { messageRepository } from './database/repositories/MessageRepository';
export { userRepository } from './database/repositories/UserRepository';

// Error handling
export {
  AppError,
  AuthenticationError,
  AuthorizationError,
  DatabaseError,
  DuplicateResourceError,
  ResourceNotFoundError,
  ValidationError,
} from './errors/AppError';
export { handleError, withErrorHandler } from './errors/errorHandler';

// Validation
export * from './validation/schemas';

// Auth utilities (legacy - to be deprecated)
export { authOptions } from './auth';
// Utilities
export * from './utils/helpers';
