declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email: string;
      image?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    rememberMe?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    rememberMe?: boolean;
    exp: number;
  }
}
