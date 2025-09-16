import { createSuccessResponse } from '@/lib/AuthUtils';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // La déconnexion NextAuth se fait côté client avec signOut()
    // Cette API peut servir pour des logs ou cleanup côté serveur

    console.log(
      'Déconnexion utilisateur depuis:',
      request.headers.get('user-agent')
    );

    return createSuccessResponse(
      {
        loggedOut: true,
      },
      'Déconnexion réussie'
    );
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    return createSuccessResponse(
      {
        loggedOut: true,
      },
      'Déconnexion effectuée'
    );
  }
}
