import type { BookFilter } from '@/lib/database/repositories/BookRepository';
import { bookService } from './BookService';
import { rentalService } from './RentalService';

export interface ChatbotContext {
  userId: string;
  userName?: string;
}

export interface ChatbotResponse {
  message: string;
  data?: {
    books?: Array<{
      id: string;
      title: string;
      author: string;
      stars?: number | null;
      price: number;
      status: string;
    }>;
    rentals?: Array<{
      id: string;
      status: string;
      endDate: Date;
      book?: { title: string };
    }>;
    total?: number;
  };
  actions?: ChatbotAction[];
}

export interface ChatbotAction {
  type:
    | 'search_books'
    | 'view_book'
    | 'rent_book'
    | 'view_rentals'
    | 'external_link';
  label: string;
  payload?: {
    bookId?: string;
    url?: string;
    filters?: Record<string, string>;
  };
}

export class ChatbotService {
  /**
   * Analyse le message de l'utilisateur et extrait des intentions
   */
  private analyzeIntent(message: string): {
    intent: string;
    entities: Record<string, string>;
  } {
    const lowerMessage = message.toLowerCase();

    // Intentions de recherche de livres
    if (
      lowerMessage.includes('livre') ||
      lowerMessage.includes('bouquin') ||
      lowerMessage.includes('cherche') ||
      lowerMessage.includes('trouve') ||
      lowerMessage.includes('note') ||
      lowerMessage.includes('étoile') ||
      lowerMessage.includes('rating') ||
      lowerMessage.includes('star')
    ) {
      const entities: Record<string, string> = {};

      // Extraction de note/rating
      const ratingPatterns = [
        /note\s+(?:de\s+)?(\d+(?:[,.]\d+)?)/i,
        /rating\s+(?:de\s+)?(\d+(?:[,.]\d+)?)/i,
        /(\d+(?:[,.]\d+)?)\s+(?:étoiles?|stars?)/i,
        /avec\s+(?:une\s+)?note\s+(?:de\s+)?(\d+(?:[,.]\d+)?)/i,
      ];

      for (const pattern of ratingPatterns) {
        const match = message.match(pattern);
        if (match) {
          entities.rating = match[1].replace(',', '.');
          break;
        }
      }

      // Extraction d'auteur plus précise
      const authorPatterns = [
        /(?:auteur|écrit\s+par|de\s+l'auteur|par)\s+([a-zA-ZÀ-ÿ\-'\s]+?)(?:\s|$)/i,
        /livres?\s+de\s+([a-zA-ZÀ-ÿ\-'\s]+?)(?:\s|$)/i,
        /([A-Z][a-zA-ZÀ-ÿ\-']+\s+[A-Z][a-zA-ZÀ-ÿ\-']+)(?:\s+livre|\s+auteur|$)/i,
      ];

      for (const pattern of authorPatterns) {
        const match = message.match(pattern);
        if (match) {
          const author = match[1].trim();
          // Éviter les mots non pertinents
          if (
            !['avec', 'une', 'les', 'des', 'sur', 'dans'].includes(
              author.toLowerCase()
            )
          ) {
            entities.author = author;
            break;
          }
        }
      }

      // Extraction de catégorie étendue
      const categories = [
        'fiction',
        'roman',
        'policier',
        'science-fiction',
        'sci-fi',
        'fantasy',
        'fantastique',
        'biography',
        'biographie',
        'histoire',
        'historique',
        'thriller',
        'mystère',
        'romance',
        'aventure',
        'philosophie',
        'essai',
        'poésie',
        'théâtre',
        'jeunesse',
        'enfant',
        'bd',
        'bande dessinée',
        'manga',
        'comics',
      ];

      for (const category of categories) {
        if (lowerMessage.includes(category)) {
          entities.category = category;
          break;
        }
      }

      // Extraction de titre (entre guillemets, après "livre" ou "bouquin")
      const titlePatterns = [
        /["«""]([^"»""]+)["»""]/,
        /livre\s+"([^"]+)"/i,
        /bouquin\s+"([^"]+)"/i,
        /titre\s+"([^"]+)"/i,
      ];

      for (const pattern of titlePatterns) {
        const match = message.match(pattern);
        if (match) {
          entities.title = match[1].trim();
          break;
        }
      }

      // Si pas de critères spécifiques trouvés, recherche générale
      if (
        !entities.title &&
        !entities.author &&
        !entities.category &&
        !entities.rating
      ) {
        // Recherche de mots-clés généraux
        const searchTerms = message
          .replace(
            /(?:cherche|trouve|donne|moi|les?|des?|un|une|avec|sur|dans|livre|bouquin)/gi,
            ''
          )
          .trim();

        if (searchTerms.length > 2) {
          entities.search = searchTerms;
        }
      }

      return { intent: 'search_books', entities };
    }

    // Intentions de location
    if (
      lowerMessage.includes('louer') ||
      lowerMessage.includes('location') ||
      lowerMessage.includes('emprunter')
    ) {
      return { intent: 'rental_info', entities: {} };
    }

    // Intentions de mes locations
    if (
      lowerMessage.includes('mes location') ||
      lowerMessage.includes('mes livre') ||
      lowerMessage.includes('en cours')
    ) {
      return { intent: 'my_rentals', entities: {} };
    }

    // Intentions d'aide
    if (
      lowerMessage.includes('aide') ||
      lowerMessage.includes('comment') ||
      lowerMessage.includes('help')
    ) {
      return { intent: 'help', entities: {} };
    }

    return { intent: 'general', entities: {} };
  }

  /**
   * Recherche des livres en fonction des critères extraits
   */
  async searchBooks(entities: Record<string, string>, limit: number = 5) {
    const filters: BookFilter = {};

    if (entities.title) {
      filters.search = entities.title;
    } else if (entities.author) {
      filters.author = entities.author;
    } else if (entities.search) {
      filters.search = entities.search;
    }

    if (entities.category) {
      filters.category = entities.category;
    }

    // Note: Le rating/stars n'est pas encore supporté dans BookFilter
    // Pour l'instant, on fait une recherche normale puis on filtre côté code
    const result = await bookService.getBooks(filters, {
      page: 1,
      limit: limit * 2,
    });

    // Filtrage par rating si spécifié
    if (entities.rating && result.items) {
      const targetRating = parseFloat(entities.rating);
      const filteredBooks = result.items.filter((book) => {
        // Si le livre a un champ 'stars' qui correspond au rating
        return book.stars && Math.abs(book.stars - targetRating) < 0.1;
      });

      return {
        ...result,
        items: filteredBooks.slice(0, limit),
        total: filteredBooks.length,
      };
    }

    return result;
  }

  /**
   * Obtient les locations d'un utilisateur
   */
  async getUserRentals(userId: string, limit: number = 5) {
    const filters = { renterId: userId };
    const result = await rentalService.getRentals(filters, { page: 1, limit });
    return result;
  }

  /**
   * Traite la requête de l'utilisateur et génère une réponse intelligente
   */
  async processMessage(
    message: string,
    context: ChatbotContext
  ): Promise<ChatbotResponse> {
    try {
      const { intent, entities } = this.analyzeIntent(message);

      switch (intent) {
        case 'search_books':
          return await this.handleBookSearch(entities);

        case 'my_rentals':
          return await this.handleMyRentals(context);

        case 'rental_info':
          return this.handleRentalInfo();

        case 'help':
          return this.handleHelp();

        default:
          return {
            message:
              "Je n'ai pas bien compris votre demande. Vous pouvez me demander de chercher des livres, voir vos locations, ou obtenir de l'aide sur le fonctionnement de Bookineo.",
          };
      }
    } catch (error) {
      console.error('Erreur ChatbotService:', error);
      return {
        message:
          "Désolé, j'ai rencontré une erreur en traitant votre demande. Pouvez-vous reformuler ?",
      };
    }
  }

  private async handleBookSearch(
    entities: Record<string, string>
  ): Promise<ChatbotResponse> {
    const books = await this.searchBooks(entities);

    if (books.items.length === 0) {
      const searchCriteria = [];
      if (entities.title) searchCriteria.push(`titre "${entities.title}"`);
      if (entities.author) searchCriteria.push(`auteur "${entities.author}"`);
      if (entities.category)
        searchCriteria.push(`catégorie "${entities.category}"`);
      if (entities.rating)
        searchCriteria.push(`note de ${entities.rating} étoiles`);
      if (entities.search) searchCriteria.push(`"${entities.search}"`);

      const criteria =
        searchCriteria.length > 0 ? ` avec ${searchCriteria.join(', ')}` : '';

      return {
        message: `Je n'ai trouvé aucun livre${criteria}. Essayez avec d'autres mots-clés ou parcourez notre catalogue complet.`,
        actions: [
          {
            type: 'external_link',
            label: 'Voir tous les livres',
            payload: { url: '/' },
          },
        ],
      };
    }

    const bookList = books.items
      .slice(0, 3)
      .map((book) => {
        const starsText = book.stars ? ` ⭐ ${book.stars}/5` : '';
        const statusText =
          book.status === 'AVAILABLE' ? '✅ Disponible' : '🔴 Loué';
        return `📚 **${book.title}** par ${book.author}${starsText} - ${book.price}€ (${statusText})`;
      })
      .join('\n');

    const totalText =
      books.total > 3 ? `\n\n*Et ${books.total - 3} autres livres...* ` : '';

    const actions: ChatbotAction[] = books.items.slice(0, 3).map((book) => ({
      type: 'view_book',
      label: `Voir "${book.title}"`,
      payload: { bookId: book.id },
    }));

    if (books.total > 3) {
      actions.push({
        type: 'search_books',
        label: 'Voir tous les résultats',
        payload: { filters: entities },
      });
    }

    return {
      message: `J'ai trouvé ${books.total} livre${books.total > 1 ? 's' : ''} :\n\n${bookList}${totalText}`,
      data: { books: books.items.slice(0, 3), total: books.total },
      actions,
    };
  }

  private async handleMyRentals(
    context: ChatbotContext
  ): Promise<ChatbotResponse> {
    const rentals = await this.getUserRentals(context.userId);

    if (rentals.items.length === 0) {
      return {
        message:
          "Vous n'avez actuellement aucune location en cours. Explorez notre catalogue pour trouver votre prochain livre !",
        actions: [
          {
            type: 'external_link',
            label: 'Parcourir les livres',
            payload: { url: '/' },
          },
        ],
      };
    }

    const rentalList = rentals.items
      .map((rental) => {
        const endDate = new Date(rental.endDate);
        const isOverdue = endDate < new Date();
        const statusIcon = isOverdue
          ? '⚠️'
          : rental.status === 'ACTIVE'
            ? '📖'
            : '✅';

        return `${statusIcon} **${rental.book?.title || 'Livre'}** (jusqu'au ${endDate.toLocaleDateString('fr-FR')})`;
      })
      .join('\n');

    const actions: ChatbotAction[] = [
      {
        type: 'view_rentals',
        label: 'Gérer mes locations',
        payload: {},
      },
    ];

    return {
      message: `Vos locations actuelles :\n\n${rentalList}`,
      data: { rentals: rentals.items },
      actions,
    };
  }

  private handleRentalInfo(): ChatbotResponse {
    return {
      message: `Pour louer un livre sur Bookineo :\n\n1. 📖 Trouvez un livre disponible\n2. 📅 Choisissez la durée de location (1-365 jours)\n3. 💸 Payez le tarif affiché\n4. 📚 Profitez de votre lecture !\n\nLes livres doivent être retournés à la date prévue.`,
      actions: [
        {
          type: 'external_link',
          label: 'Commencer à chercher',
          payload: { url: '/' },
        },
      ],
    };
  }

  private handleHelp(): ChatbotResponse {
    return {
      message: `Je peux vous aider avec :\n\n🔍 **Recherche de livres** - "Cherche livre de Victor Hugo"\n📚 **Vos locations** - "Mes locations en cours"\n❓ **Informations** - "Comment louer un livre"\n\nN'hésitez pas à me poser vos questions !`,
      actions: [
        {
          type: 'external_link',
          label: "Page d'accueil",
          payload: { url: '/' },
        },
        {
          type: 'external_link',
          label: 'Mon profil',
          payload: { url: '/profile' },
        },
      ],
    };
  }
}

// Export singleton
export const chatbotService = new ChatbotService();
