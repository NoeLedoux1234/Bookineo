import { authOptions } from '@/lib/auth';
import { setRememberMeCookie } from '@/lib/rememberMe';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any;

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { remember } = await request.json();
    const response = NextResponse.json({
      success: true,
      message: remember ? 'Remember Me activé' : 'Remember Me désactivé',
    });

    // Définir ou supprimer le cookie Remember Me
    if (remember) {
      setRememberMeCookie(response, true);
    } else {
      // Forcer la suppression du cookie
      response.cookies.set('bookineo-remember-me', '', {
        expires: new Date(0), // Date dans le passé pour supprimer
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Erreur Remember Me:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any;

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const rememberMeCookie = request.cookies.get('bookineo-remember-me');
    const isRemembered = rememberMeCookie?.value === 'true';

    return NextResponse.json({
      success: true,
      data: {
        remembered: isRemembered,
        expiresAt: isRemembered
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : null,
      },
    });
  } catch (error) {
    console.error('Erreur vérification Remember Me:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
