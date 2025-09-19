import type {
  Book,
  BookStatus,
  Message,
  Rental,
  RentalStatus,
  User,
} from '@/generated/prisma';

// Types étendus avec relations
export interface UserWithRelations extends User {
  ownedBooks?: BookWithRelations[];
  rentals?: RentalWithRelations[];
  sentMessages?: MessageWithRelations[];
  receivedMessages?: MessageWithRelations[];
}

export interface BookWithRelations extends Book {
  owner?: UserWithRelations;
  rentals?: RentalWithRelations[];
}

export interface RentalWithRelations extends Rental {
  book?: BookWithRelations;
  renter?: UserWithRelations;
}

// Types partiels pour les utilisateurs dans les messages
export interface UserPartial {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface MessageWithRelations extends Message {
  sender?: UserWithRelations;
  receiver?: UserWithRelations;
}

export interface MessageWithSender extends Message {
  sender: UserPartial;
}

export interface MessageWithReceiver extends Message {
  receiver: UserPartial;
}

export interface MessageWithUsers extends Message {
  sender: UserPartial;
  receiver: UserPartial;
}

// Types pour les créations/mises à jour
export interface CreateUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  birthDate?: Date;
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  password?: string;
}

export interface CreateBookData {
  title: string;
  author: string;
  year: number;
  category: string;
  price: number;
  ownerId: string;
}

export interface UpdateBookData {
  title?: string;
  author?: string;
  year?: number;
  category?: string;
  price?: number;
  status?: BookStatus;
}

export interface CreateRentalData {
  bookId: string;
  renterId: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  comment?: string;
}

export interface UpdateRentalData {
  endDate?: Date;
  returnDate?: Date;
  comment?: string;
  status?: RentalStatus;
}

export interface CreateMessageData {
  senderId: string;
  receiverId: string;
  content: string;
}

export interface UpdateMessageData {
  isRead?: boolean;
}

// Types pour les filtres spécifiques
export interface UserFilter {
  search?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  createdAt?: {
    from?: Date;
    to?: Date;
  };
}

export interface BookFilter {
  title?: string;
  author?: string;
  category?: string;
  status?: BookStatus;
  ownerId?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  yearRange?: {
    min?: number;
    max?: number;
  };
}

export interface RentalFilter {
  bookId?: string;
  renterId?: string;
  status?: RentalStatus;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}

export interface MessageFilter {
  senderId?: string;
  receiverId?: string;
  isRead?: boolean;
  content?: string;
}
