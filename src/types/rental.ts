import type { RentalStatus } from '@/generated/prisma';

export interface RenterInfo {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface BookInfo {
  id: string;
  title: string;
  author: string;
  imgUrl: string | null;
  price: number;
}

export interface Rental {
  id: string;
  startDate: Date;
  endDate: Date;
  returnDate: Date | null;
  duration: number;
  comment: string | null;
  status: RentalStatus;
  createdAt: Date;
  updatedAt: Date;
  book: BookInfo;
  renter: RenterInfo;
}

export interface CreateRentalRequest {
  bookId: string;
  renterId: string;
  duration: number;
  comment?: string;
  startDate?: string; // ISO string
}

export interface UpdateRentalRequest {
  returnDate?: string; // ISO string
  status?: RentalStatus;
  comment?: string;
}

export interface RentalFilters {
  search?: string;
  status?: RentalStatus;
  bookId?: string;
  renterId?: string;
  startDateFrom?: string; // ISO string
  startDateTo?: string; // ISO string
  endDateFrom?: string; // ISO string
  endDateTo?: string; // ISO string
}

export interface RentalStats {
  totalRentals: number;
  activeRentals: number;
  completedRentals: number;
  cancelledRentals: number;
  averageDuration: number;
}

export interface AvailableBook {
  id: string;
  title: string;
  author: string;
  imgUrl: string | null;
  price: number;
  categoryId: number;
  categoryName: string | null;
  publishedDate: string | null;
  stars: number | null;
  reviews: number | null;
  status: 'AVAILABLE';
}

export interface RenterOption {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string; // Computed field for display
}
