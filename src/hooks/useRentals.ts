import type {
  AvailableBook,
  CreateRentalRequest,
  Rental,
  RentalFilters,
  RentalStats,
  RenterOption,
  UpdateRentalRequest,
} from '@/types/rental';
import { useCallback, useState } from 'react';

interface UseRentalsReturn {
  // States
  rentals: Rental[];
  availableBooks: AvailableBook[];
  renters: RenterOption[];
  stats: RentalStats | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchRentals: (
    filters?: RentalFilters,
    page?: number,
    limit?: number
  ) => Promise<void>;
  fetchAvailableBooks: (
    search?: string,
    page?: number,
    limit?: number
  ) => Promise<void>;
  fetchRenters: (
    search?: string,
    page?: number,
    limit?: number
  ) => Promise<void>;
  fetchStats: () => Promise<void>;
  createRental: (data: CreateRentalRequest) => Promise<Rental | undefined>;
  updateRental: (
    id: string,
    data: UpdateRentalRequest
  ) => Promise<Rental | undefined>;
  returnBook: (id: string, comment?: string) => Promise<Rental | undefined>;
  cancelRental: (id: string, comment?: string) => Promise<Rental | undefined>;
  deleteRental: (id: string) => Promise<void>;

  // Utilities
  getRentalById: (id: string) => Promise<Rental>;
  getOverdueRentals: () => Promise<Rental[]>;
  getUserRentals: (userId: string) => Promise<Rental[]>;
  getBookRentalStatus: (
    bookId: string
  ) => Promise<{ isRented: boolean; rental?: Rental }>;
}

export function useRentals(): UseRentalsReturn {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [availableBooks, setAvailableBooks] = useState<AvailableBook[]>([]);
  const [renters, setRenters] = useState<RenterOption[]>([]);
  const [stats, setStats] = useState<RentalStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (error: any) => {
    console.error('Rental hook error:', error);
    setError(error.message || 'Une erreur est survenue');
    throw error;
  };

  const fetchRentals = useCallback(
    async (filters?: RentalFilters, page: number = 1, limit: number = 20) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(filters?.search && { search: filters.search }),
          ...(filters?.status && { status: filters.status }),
          ...(filters?.bookId && { bookId: filters.bookId }),
          ...(filters?.renterId && { renterId: filters.renterId }),
          ...(filters?.startDateFrom && {
            startDateFrom: filters.startDateFrom,
          }),
          ...(filters?.startDateTo && { startDateTo: filters.startDateTo }),
          ...(filters?.endDateFrom && { endDateFrom: filters.endDateFrom }),
          ...(filters?.endDateTo && { endDateTo: filters.endDateTo }),
        });

        const response = await fetch(`/api/rentals?${params}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message);
        }

        setRentals(result.data.items);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchAvailableBooks = useCallback(
    async (search?: string, page: number = 1, limit: number = 50) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(search && { search }),
        });

        const response = await fetch(`/api/books/available?${params}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message);
        }

        setAvailableBooks(result.data.items);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchRenters = useCallback(
    async (search?: string, page: number = 1, limit: number = 50) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(search && { search }),
        });

        const response = await fetch(`/api/users?${params}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message);
        }

        // Transform users to renter options with display names
        const renterOptions: RenterOption[] = result.data.items.map(
          (user: any) => ({
            ...user,
            displayName:
              user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName} (${user.email})`
                : user.email,
          })
        );

        setRenters(renterOptions);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rentals/stats');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      setStats(result.data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createRental = useCallback(
    async (data: CreateRentalRequest): Promise<Rental | undefined> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/rentals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message);
        }

        return result.data;
      } catch (error) {
        handleError(error);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateRental = useCallback(
    async (
      id: string,
      data: UpdateRentalRequest
    ): Promise<Rental | undefined> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/rentals/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message);
        }

        return result.data;
      } catch (error) {
        handleError(error);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const returnBook = useCallback(
    async (id: string, comment?: string): Promise<Rental | undefined> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/rentals/${id}/return`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ comment }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message);
        }

        return result.data;
      } catch (error) {
        handleError(error);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const cancelRental = useCallback(
    async (id: string, comment?: string): Promise<Rental | undefined> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/rentals/${id}/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ comment }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message);
        }

        return result.data;
      } catch (error) {
        handleError(error);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteRental = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rentals/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getRentalById = useCallback(async (id: string): Promise<Rental> => {
    const response = await fetch(`/api/rentals/${id}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    return result.data;
  }, []);

  const getOverdueRentals = useCallback(async (): Promise<Rental[]> => {
    const response = await fetch('/api/rentals/overdue');
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    return result.data;
  }, []);

  const getUserRentals = useCallback(
    async (userId: string): Promise<Rental[]> => {
      const response = await fetch(`/api/users/${userId}/rentals`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    },
    []
  );

  const getBookRentalStatus = useCallback(
    async (bookId: string): Promise<{ isRented: boolean; rental?: Rental }> => {
      const response = await fetch(`/api/books/${bookId}/rental-status`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result.data;
    },
    []
  );

  return {
    // States
    rentals,
    availableBooks,
    renters,
    stats,
    loading,
    error,

    // Actions
    fetchRentals,
    fetchAvailableBooks,
    fetchRenters,
    fetchStats,
    createRental,
    updateRental,
    returnBook,
    cancelRental,
    deleteRental,

    // Utilities
    getRentalById,
    getOverdueRentals,
    getUserRentals,
    getBookRentalStatus,
  };
}
