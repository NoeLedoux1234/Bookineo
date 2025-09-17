// Gestion du Remember Me avec des cookies personnalisés

import { NextRequest, NextResponse } from 'next/server';

const REMEMBER_ME_COOKIE = 'bookineo-remember-me';
const REMEMBER_ME_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 jours en millisecondes
const DEFAULT_DURATION = 24 * 60 * 60 * 1000; // 1 jour en millisecondes

export function setRememberMeCookie(response: NextResponse, remember: boolean) {
  if (remember) {
    // Définir un cookie Remember Me qui dure 30 jours
    response.cookies.set(REMEMBER_ME_COOKIE, 'true', {
      maxAge: REMEMBER_ME_DURATION / 1000, // En secondes
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  } else {
    // Supprimer le cookie Remember Me
    response.cookies.delete(REMEMBER_ME_COOKIE);
  }
}

export function hasRememberMeCookie(request: NextRequest): boolean {
  return request.cookies.get(REMEMBER_ME_COOKIE)?.value === 'true';
}

export function getSessionDuration(request: NextRequest): number {
  return hasRememberMeCookie(request) ? REMEMBER_ME_DURATION : DEFAULT_DURATION;
}
