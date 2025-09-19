import { NextRequest, NextResponse } from 'next/server';
import { bookService } from '@/services/BookService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'title', 'author', 'category'
    const query = searchParams.get('q') || '';
    let suggestions: string[] = [];

    if (type === 'title') {
      // Get all book titles, filter by query
      const books = await bookService.getBooks({}, { limit: 1000 });
      suggestions = Array.from(
        new Set(
          books.items
            .map((b) => b.title)
            .filter((t) => t && t.toLowerCase().includes(query.toLowerCase()))
        )
      );
    } else if (type === 'author') {
      // Use service for author autocomplete
      if (query.length >= 2) {
        suggestions = await bookService.searchAuthors(query);
      } else {
        // Get all authors if no query
        const books = await bookService.getBooks({}, { limit: 1000 });
        suggestions = Array.from(new Set(books.items.map((b) => b.author)));
      }
    } else if (type === 'category') {
      // Get all categories, filter by query
      const categories = await bookService.getCategories();
      suggestions = categories.filter(
        (c) => c && c.toLowerCase().includes(query.toLowerCase())
      );
    }

    return NextResponse.json({ success: true, suggestions });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erreur suggestions', error: String(error) },
      { status: 500 }
    );
  }
}
