import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Si utilisateur connecté et essaie d'accéder aux pages d'auth
    if (token && ['/login', '/signup'].includes(pathname)) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Si utilisateur non connecté et essaie d'accéder à une route protégée
    if (!token && pathname === '/') {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Pages publiques
        if (['/login', '/signup'].includes(pathname)) {
          return true;
        }

        // Routes API d'authentification
        if (pathname.startsWith('/api/auth/')) {
          return true;
        }

        // Routes API protégées
        if (pathname.startsWith('/api/')) {
          return !!token;
        }

        // Page d'accueil et autres pages protégées
        return !!token;
      },
    },
  }
);

// Configuration des routes à protéger
export const config = {
  matcher: [
    // Page d'accueil maintenant protégée
    '/',

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
