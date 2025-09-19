import { prisma } from '@/lib/database/client';
import { AppError } from '@/lib/errors/AppError';
import type {
  AmazonBookData,
  BookImportData,
  ImportProgress,
  ImportResult,
} from '@/types/books';

export class BookImportService {
  private static readonly MAX_BOOKS = 1000; // Limiter à 1000 livres
  private static readonly BATCH_SIZE = 50; // Traiter par batch de 50
  private static readonly MIN_RATING = 4.0; // Rating minimum pour filtrer
  private static readonly MIN_REVIEWS = 100; // Minimum d'avis pour filtrer

  /**
   * Parse et valide les données Amazon en format BookImportData
   */
  private static parseAmazonBook(
    amazonBook: AmazonBookData
  ): BookImportData | null {
    try {
      // Filtres de qualité pour sélectionner les meilleurs livres
      const rating = parseFloat(amazonBook.rating?.split(' ')[0] || '0');
      const reviewsCount = amazonBook.reviews_count || 0;

      // Pas de filtrage strict - accepter tous les livres avec des données basiques
      if (rating <= 0 || reviewsCount <= 0) {
        return null;
      }

      // Extraire l'année à partir de différentes sources (utilisée pour d'éventuelles validations futures)
      // let year: number | null = null;
      // if (amazonBook.timestamp) {
      //   year = new Date(amazonBook.timestamp).getFullYear();
      // }

      // Déterminer la catégorie principale
      const mainCategory =
        amazonBook.categories?.[1] ||
        amazonBook.categories?.[0] ||
        'Uncategorized';

      // Filtrer les catégories non désirées
      const unwantedCategories = ['Adult', 'Erotica', 'XXX'];
      if (
        unwantedCategories.some((cat) =>
          amazonBook.categories?.some((bookCat) =>
            bookCat.toLowerCase().includes(cat.toLowerCase())
          )
        )
      ) {
        return null;
      }

      return {
        title: amazonBook.title?.trim() || 'Unknown Title',
        author: amazonBook.brand?.trim() || 'Unknown Author',
        categoryName: mainCategory,
        categoryId: 1, // Default category ID
        price: amazonBook.final_price || 0,
        asin: amazonBook.asin,
        soldBy: amazonBook.seller_name,
        imgUrl: amazonBook.image_url,
        productURL: amazonBook.url,
        stars: amazonBook.rating ? parseFloat(amazonBook.rating) : undefined,
        reviews: amazonBook.reviews_count,
        isKindleUnlimited: false, // Default
        isBestSeller:
          amazonBook.best_sellers_rank &&
          amazonBook.best_sellers_rank.length > 0,
        isEditorsPick: false, // Default
        isGoodReadsChoice: false, // Default
        publishedDate: amazonBook.date_first_available || undefined,
        // Anciens champs pour compatibilité
        category: mainCategory,
        isbn10: amazonBook.ISBN10,
        description: amazonBook.description || undefined,
        imageUrl: amazonBook.image_url,
        rating: amazonBook.rating,
        reviewsCount: amazonBook.reviews_count,
        availability: amazonBook.availability,
        format: amazonBook.format || undefined,
        categories: amazonBook.categories,
        dimensions: amazonBook.product_dimensions,
        weight: amazonBook.item_weight,
      };
    } catch {
      console.warn('Erreur lors du parsing du livre');
      return null;
    }
  }

  /**
   * Sélectionne 1000 livres aléatoires avec filtrage basique
   */
  private static selectRandomBooks(books: AmazonBookData[]): AmazonBookData[] {
    // Filtrage basique - juste pour éviter les livres vraiment mauvais ou sans données
    const filteredBooks = books.filter((book) => {
      const rating = parseFloat(book.rating?.split(' ')[0] || '0');
      const reviewsCount = book.reviews_count || 0;

      // Filtres très légers - juste pour éliminer les livres sans données valides
      return (
        book.title &&
        book.brand &&
        book.final_price > 0 &&
        rating > 0 &&
        reviewsCount > 0
      );
    });

    // Mélanger le tableau de manière aléatoire (algorithme Fisher-Yates)
    const shuffled = [...filteredBooks];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Prendre les 1000 premiers après mélange
    return shuffled.slice(0, this.MAX_BOOKS);
  }

  /**
   * Importe les livres par batch avec gestion d'erreurs
   */
  private static async importBatch(books: BookImportData[]): Promise<{
    imported: number;
    failed: number;
    errors: string[];
  }> {
    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const book of books) {
      try {
        // Vérifier si le livre existe déjà (par ASIN ou titre+auteur)
        const existing = await prisma.book.findFirst({
          where: {
            OR: [
              { asin: book.asin },
              {
                AND: [{ title: book.title }, { author: book.author }],
              },
            ],
          },
        });

        if (existing) {
          console.log(`Livre déjà existant: ${book.title}`);
          continue;
        }

        // Créer le livre (sans propriétaire initial - sera attribué plus tard)
        await prisma.book.create({
          data: {
            title: book.title,
            author: book.author,
            categoryName: book.categoryName,
            categoryId: book.categoryId || 1,
            price: book.price,
            asin: book.asin,
            soldBy: book.soldBy,
            imgUrl: book.imgUrl,
            productURL: book.productURL,
            stars: book.stars,
            reviews: book.reviews,
            isKindleUnlimited: book.isKindleUnlimited || false,
            isBestSeller: book.isBestSeller || false,
            isEditorsPick: book.isEditorsPick || false,
            isGoodReadsChoice: book.isGoodReadsChoice || false,
            publishedDate: book.publishedDate,
            // Pas de ownerId - les livres importés n'ont pas de propriétaire initial
          },
        });

        imported++;
      } catch (error) {
        failed++;
        const errorMsg = `Erreur import livre "${book.title}": ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return { imported, failed, errors };
  }

  /**
   * Import principal avec limitation à 1000 livres
   */
  static async importBooksFromJson(
    amazonBooks: AmazonBookData[],
    onProgress?: (progress: ImportProgress) => void
  ): Promise<ImportResult> {
    const startTime = Date.now();

    try {
      console.log(
        `🚀 Début de l'import - ${amazonBooks.length} livres dans le dataset`
      );

      // Sélectionner 1000 livres aléatoires
      const selectedBooks = this.selectRandomBooks(amazonBooks);
      console.log(
        `🎲 ${selectedBooks.length} livres sélectionnés aléatoirement`
      );

      if (selectedBooks.length === 0) {
        throw new AppError(
          'Aucun livre ne correspond aux critères de qualité',
          400
        );
      }

      // Parser les livres sélectionnés
      const parsedBooks: BookImportData[] = [];
      for (const amazonBook of selectedBooks) {
        const parsed = this.parseAmazonBook(amazonBook);
        if (parsed) {
          parsedBooks.push(parsed);
        }
      }

      console.log(`✅ ${parsedBooks.length} livres validés pour l'import`);

      // Calculer les batches
      const totalBatches = Math.ceil(parsedBooks.length / this.BATCH_SIZE);
      let totalImported = 0;
      let totalFailed = 0;
      const allErrors: string[] = [];

      // Traitement par batch
      for (let i = 0; i < totalBatches; i++) {
        const startIndex = i * this.BATCH_SIZE;
        const endIndex = Math.min(
          startIndex + this.BATCH_SIZE,
          parsedBooks.length
        );
        const batch = parsedBooks.slice(startIndex, endIndex);

        console.log(
          `📦 Traitement du batch ${i + 1}/${totalBatches} (${batch.length} livres)`
        );

        // Progress callback
        if (onProgress) {
          const processed = startIndex;
          const estimatedTimeRemaining =
            processed > 0
              ? ((Date.now() - startTime) / processed) *
                (parsedBooks.length - processed)
              : 0;

          onProgress({
            total: parsedBooks.length,
            processed,
            imported: totalImported,
            failed: totalFailed,
            currentBatch: i + 1,
            totalBatches,
            estimatedTimeRemaining,
          });
        }

        // Import du batch
        const batchResult = await this.importBatch(batch);
        totalImported += batchResult.imported;
        totalFailed += batchResult.failed;
        allErrors.push(...batchResult.errors);

        // Petite pause entre les batches pour éviter la surcharge
        if (i < totalBatches - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      const processingTime = Date.now() - startTime;

      console.log(`🎉 Import terminé en ${processingTime}ms`);
      console.log(
        `📊 Résultats: ${totalImported} importés, ${totalFailed} échoués`
      );

      return {
        success: true,
        imported: totalImported,
        failed: totalFailed,
        skipped: selectedBooks.length - parsedBooks.length,
        errors: allErrors,
        processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMsg =
        error instanceof Error ? error.message : 'Erreur inconnue';

      console.error("❌ Erreur lors de l'import:", errorMsg);

      return {
        success: false,
        imported: 0,
        failed: 0,
        skipped: 0,
        errors: [errorMsg],
        processingTime,
      };
    }
  }

  /**
   * Vérifie l'état de la base de données avant import
   */
  static async checkImportPrerequisites(): Promise<{
    canImport: boolean;
    currentBooksCount: number;
    issues: string[];
  }> {
    try {
      const currentBooksCount = await prisma.book.count();
      const issues: string[] = [];

      if (currentBooksCount >= this.MAX_BOOKS) {
        issues.push(`Base déjà remplie: ${currentBooksCount} livres existants`);
      }

      return {
        canImport: issues.length === 0,
        currentBooksCount,
        issues,
      };
    } catch {
      return {
        canImport: false,
        currentBooksCount: 0,
        issues: ['Erreur de connexion à la base de données'],
      };
    }
  }

  /**
   * Nettoie la base de données (développement uniquement)
   */
  static async clearAllBooks(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      throw new AppError('Action autorisée uniquement en développement', 403);
    }

    await prisma.book.deleteMany({});
    console.log('🧹 Tous les livres ont été supprimés');
  }
}
