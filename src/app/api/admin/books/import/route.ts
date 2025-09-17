import { BookImportService } from '@/services/BookImportService';
import type { AmazonBookData } from '@/types/books';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/admin/books/import - Importer les livres depuis un JSON
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { books } = body as { books: AmazonBookData[] };

    if (!books || !Array.isArray(books)) {
      return NextResponse.json(
        { success: false, message: 'Format de données invalide' },
        { status: 400 }
      );
    }

    // Vérifier les prérequis
    const prerequisites = await BookImportService.checkImportPrerequisites();
    if (!prerequisites.canImport) {
      return NextResponse.json(
        {
          success: false,
          message: 'Import impossible',
          issues: prerequisites.issues,
          currentBooksCount: prerequisites.currentBooksCount,
        },
        { status: 400 }
      );
    }

    // Lancer l'import
    const result = await BookImportService.importBooksFromJson(books);

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Import terminé avec succès' : 'Import échoué',
      data: result,
    });
  } catch (error) {
    console.error('Erreur API import:', error);
    return NextResponse.json(
      {
        success: false,
        message: "Erreur serveur lors de l'import",
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/books/import - Vérifier l'état avant import
export async function GET() {
  try {
    const prerequisites = await BookImportService.checkImportPrerequisites();

    return NextResponse.json({
      success: true,
      data: prerequisites,
    });
  } catch (error) {
    console.error('Erreur vérification prérequis:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la vérification',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/books/import - Nettoyer tous les livres (dev uniquement)
export async function DELETE() {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        {
          success: false,
          message: 'Action autorisée uniquement en développement',
        },
        { status: 403 }
      );
    }

    await BookImportService.clearAllBooks();

    return NextResponse.json({
      success: true,
      message: 'Tous les livres ont été supprimés',
    });
  } catch (error) {
    console.error('Erreur suppression livres:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la suppression',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
