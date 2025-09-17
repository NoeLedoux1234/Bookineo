// Types de base pour les réponses API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string | string[]>;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface ApiSuccessResponse<T = unknown> extends ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse extends ApiResponse {
  success: false;
  errors: Record<string, string | string[]>;
}

// Types pour l'authentification
export interface AuthUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface AuthContext {
  user: AuthUser;
  sessionId?: string;
}

// Types pour la pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Types pour les filtres
export interface BaseFilter {
  search?: string;
  createdAt?: {
    from?: Date;
    to?: Date;
  };
  updatedAt?: {
    from?: Date;
    to?: Date;
  };
}
