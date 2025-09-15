export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  birthDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  year: number;
  category: string;
  price: number;
  status: BookStatus;
  ownerId: string;
  owner?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface Rental {
  id: string;
  startDate: Date;
  endDate: Date;
  returnDate?: Date;
  duration: number;
  comment?: string;
  status: RentalStatus;
  bookId: string;
  book?: Book;
  renterId: string;
  renter?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  content: string;
  isRead: boolean;
  senderId: string;
  sender?: User;
  receiverId: string;
  receiver?: User;
  createdAt: Date;
}

export enum BookStatus {
  AVAILABLE = 'AVAILABLE',
  RENTED = 'RENTED',
}

export enum RentalStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
