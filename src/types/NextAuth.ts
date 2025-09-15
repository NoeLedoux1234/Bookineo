// Types pour NextAuth callbacks
export interface NextAuthJWT {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  rememberMe?: boolean;
  exp?: number;
}

export interface NextAuthUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  rememberMe?: boolean;
}

export interface NextAuthSession {
  user: {
    id: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    name?: string | null;
  };
  expires: string;
}

export interface NextAuthJWTParams {
  token: NextAuthJWT;
  user?: NextAuthUser;
  account?: unknown;
}

export interface NextAuthSessionParams {
  session: NextAuthSession;
  token: NextAuthJWT;
}

export interface NextAuthSignInEventParams {
  user: NextAuthUser;
  account?: unknown;
  profile?: unknown;
  isNewUser?: boolean;
}

export interface NextAuthSignOutEventParams {
  token?: NextAuthJWT;
  session?: NextAuthSession;
}
