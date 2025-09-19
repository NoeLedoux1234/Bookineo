import type { AuthenticatedRequest } from '@/middlewares/auth';
import { withAuthAndErrorHandler } from '@/middlewares/errorHandler';
import { chatbotService } from '@/services/ChatbotService';
import { NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  message: string;
  context?: 'books' | 'rentals' | 'account' | 'general';
}

const LM_STUDIO_URL = process.env.LM_STUDIO_URL || 'http://localhost:1234';

// Contextes prédéfinis pour le chatbot
const CONTEXTS = {
  books: `Tu es l'assistant Bookineo spécialisé dans les livres. Tu aides les utilisateurs à:
- Rechercher des livres par titre, auteur, catégorie
- Comprendre les statuts (disponible/loué)
- Ajouter de nouveaux livres
- Modifier leurs livres
Réponds de manière concise et utile en français.`,

  rentals: `Tu es l'assistant Bookineo spécialisé dans les locations. Tu aides les utilisateurs à:
- Comprendre le processus de location
- Gérer leurs locations en cours
- Résoudre les problèmes de retour
- Calculer les durées de location
Réponds de manière concise et utile en français.`,

  account: `Tu es l'assistant Bookineo spécialisé dans la gestion de compte. Tu aides les utilisateurs à:
- Modifier leur profil
- Gérer leurs messages
- Comprendre la sécurité du compte
- Résoudre les problèmes de connexion
Réponds de manière concise et utile en français.`,

  general: `Tu es l'assistant virtuel de Bookineo, une plateforme de location de livres entre particuliers. 
Tu aides les utilisateurs avec toutes leurs questions sur:
- La recherche et location de livres
- La gestion de leur compte
- La messagerie entre utilisateurs
- Les problèmes techniques
Réponds toujours en français, de manière amicale et concise.`,
};

export const POST = withAuthAndErrorHandler(
  async (request: AuthenticatedRequest) => {
    try {
      const { message, context = 'general' }: ChatRequest =
        await request.json();

      if (!message || message.trim().length === 0) {
        return NextResponse.json(
          { success: false, message: 'Message requis' },
          { status: 400 }
        );
      }

      if (message.length > 500) {
        return NextResponse.json(
          { success: false, message: 'Message trop long (max 500 caractères)' },
          { status: 400 }
        );
      }

      // 1. D'abord, traiter avec notre service intelligent
      const chatbotContext = {
        userId: request.user.id,
        userName: request.user.firstName || request.user.email,
      };

      const intelligentResponse = await chatbotService.processMessage(
        message,
        chatbotContext
      );

      // Si on a une réponse intelligente avec des données, on l'utilise
      if (intelligentResponse.data || intelligentResponse.actions) {
        return NextResponse.json({
          success: true,
          data: {
            message: intelligentResponse.message,
            context,
            timestamp: new Date().toISOString(),
            intelligent: true,
            bookData: intelligentResponse.data,
            actions: intelligentResponse.actions,
          },
        });
      }

      // 2. Sinon, on enrichit le contexte avec les données trouvées et on appelle l'IA
      let enhancedPrompt = message;

      // Enrichir le prompt si on a trouvé des informations pertinentes
      if (
        intelligentResponse.message.includes('trouvé') &&
        intelligentResponse.data
      ) {
        enhancedPrompt = `${message}\n\nInformations trouvées: ${intelligentResponse.message}`;
      }

      // Messages pour LM Studio avec contexte enrichi
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: `${CONTEXTS[context] || CONTEXTS.general}\n\nTu as accès aux données de la plateforme Bookineo. Si l'utilisateur demande des informations spécifiques, utilise les données fournies.`,
        },
        {
          role: 'user',
          content: enhancedPrompt,
        },
      ];

      // Appel à LM Studio
      const response = await fetch(`${LM_STUDIO_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen2-1.5b-instruct:2',
          messages,
          temperature: 0.7,
          max_tokens: 200,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`LM Studio error: ${response.status}`);
      }

      const data = await response.json();
      const botResponse = data.choices?.[0]?.message?.content;

      if (!botResponse) {
        // Utiliser la réponse intelligente comme fallback
        return NextResponse.json({
          success: true,
          data: {
            message: intelligentResponse.message,
            context,
            timestamp: new Date().toISOString(),
            fallback: true,
            bookData: intelligentResponse.data,
            actions: intelligentResponse.actions,
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          message: botResponse.trim(),
          context,
          timestamp: new Date().toISOString(),
          enhanced: true,
          bookData: intelligentResponse.data,
          actions: intelligentResponse.actions,
        },
      });
    } catch (error) {
      console.error('Erreur chatbot:', error);

      // Réponse de fallback intelligente
      try {
        const body = await request.json();
        const chatbotContext = {
          userId: request.user.id,
          userName: request.user.firstName || request.user.email,
        };

        const fallbackResponse = await chatbotService.processMessage(
          body.message,
          chatbotContext
        );

        return NextResponse.json({
          success: true,
          data: {
            message: fallbackResponse.message,
            context: body.context || 'general',
            timestamp: new Date().toISOString(),
            fallback: true,
            bookData: fallbackResponse.data,
            actions: fallbackResponse.actions,
          },
        });
      } catch {
        // Dernier recours
        return NextResponse.json({
          success: true,
          data: {
            message:
              'Je suis désolé, je ne peux pas traiter votre demande en ce moment. Essayez de reformuler votre question.',
            context: 'general',
            timestamp: new Date().toISOString(),
            fallback: true,
          },
        });
      }
    }
  }
);
