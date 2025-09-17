// Export centralisé des composants de la couche database
export { BaseRepository } from './BaseRepository';
export { default as prisma } from './client';
export { messageRepository } from './repositories/MessageRepository';
export { userRepository } from './repositories/UserRepository';
