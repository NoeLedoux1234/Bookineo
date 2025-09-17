import { authOptions } from '@/lib/auth';
import type { BookFilter } from '@/lib/database/repositories/BookRepository';
import { AppError } from '@/lib/errors/AppError';
import { bookService } from '@/services/BookService';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const exportQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['AVAILABLE', 'RENTED']).optional(),
  category: z.string().optional(),
  author: z.string().optional(),
  priceMin: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  priceMax: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  year: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  hasOwner: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
});

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');

  const csvRows = data.map((row) => {
    return headers
      .map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return '';

        // Échapper les guillemets et entourer de guillemets si nécessaire
        const stringValue = String(value);
        if (
          stringValue.includes(',') ||
          stringValue.includes('"') ||
          stringValue.includes('\n')
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Authentification requise' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryObject = Object.fromEntries(searchParams.entries());

    const validatedQuery = exportQuerySchema.parse(queryObject);

    const filters: BookFilter = {
      search: validatedQuery.search,
      status: validatedQuery.status,
      category: validatedQuery.category,
      author: validatedQuery.author,
      priceMin: validatedQuery.priceMin,
      priceMax: validatedQuery.priceMax,
      year: validatedQuery.year,
      hasOwner: validatedQuery.hasOwner,
    };

    const exportData = await bookService.exportBooksToCSV(filters);
    const csvContent = convertToCSV(exportData);

    // Générer un nom de fichier avec timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `livres_export_${timestamp}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'export CSV:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Paramètres de requête invalides',
          errors: error.issues.map(
            (e: any) => `${e.path.join('.')}: ${e.message}`
          ),
        },
        { status: 400 }
      );
    }

    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Erreur interne du serveur',
      },
      { status: 500 }
    );
  }
}
