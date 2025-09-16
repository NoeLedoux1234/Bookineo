import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Routes publiques (accessibles sans authentification)
    const publicRoutes = ['/login', '/signup', '/'];
    const authRoutes = ['/login', '/signup'];

    // Si utilisateur connecté et essaie d'accéder aux pages d'auth
    if (token && authRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Si utilisateur non connecté et essaie d'accéder à une route protégée
    if (!token && !publicRoutes.includes(pathname)) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Toujours autoriser les routes publiques
        if (['/login', '/signup', '/'].includes(pathname)) {
          return true;
        }

        // Routes API d'authentification toujours autorisées
        if (pathname.startsWith('/api/auth/')) {
          return true;
        }

        // Routes API protégées nécessitent un token
        if (pathname.startsWith('/api/')) {
          return !!token;
        }

        // Pages protégées nécessitent un token
        return !!token;
      },
    },
  }
);

// Configuration des routes à protéger
export const config = {
  matcher: [
    // Pages protégées
    '/dashboard/:path*',
    '/books/:path*',
    '/rentals/:path*',
    '/messages/:path*',
    '/profile/:path*',

    // APIs protégées (sauf auth)
    '/api/((?!auth).)*',

    // Pages d'authentification (pour redirection)
    '/login',
    '/signup',
  ],
};
