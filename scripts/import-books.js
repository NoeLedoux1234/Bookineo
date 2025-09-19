import fs from 'fs';
import { PrismaClient } from '../src/generated/prisma/index.js';
const prisma = new PrismaClient();

async function importBooks() {
  try {
    console.log('🚀 Import des livres...');

    // Lire le fichier JSON
    const booksData = JSON.parse(
      fs.readFileSync('./datasets/books.json', 'utf8')
    );

    console.log(`📚 ${booksData.length} livres trouvés dans le JSON`);

    // Supprimer tous les livres existants
    await prisma.book.deleteMany({});
    console.log('🧹 Livres existants supprimés');

    // Importer les nouveaux livres
    const importedBooks = [];

    for (const book of booksData) {
      try {
        const newBook = await prisma.book.create({
          data: {
            asin: book.asin,
            title: book.title,
            author: book.author,
            soldBy: book.soldBy,
            imgUrl: book.imgUrl,
            productURL: book.productURL,
            stars: book.stars,
            reviews: book.reviews,
            price: book.price,
            isKindleUnlimited: book.isKindleUnlimited || false,
            categoryId: book.category_id,
            isBestSeller: book.isBestSeller || false,
            isEditorsPick: book.isEditorsPick || false,
            isGoodReadsChoice: book.isGoodReadsChoice || false,
            publishedDate: book.publishedDate,
            categoryName: book.category_name,
            status: 'AVAILABLE',
          },
        });
        importedBooks.push(newBook);
      } catch (error) {
        console.error(
          `❌ Erreur lors de l'import du livre "${book.title}":`,
          error.message
        );
      }
    }

    console.log(`✅ ${importedBooks.length} livres importés avec succès`);
    console.log('📊 Résumé par catégorie:');

    // Compter par catégorie
    const categoryCount = {};
    importedBooks.forEach((book) => {
      categoryCount[book.categoryId] =
        (categoryCount[book.categoryId] || 0) + 1;
    });

    Object.entries(categoryCount).forEach(([categoryId, count]) => {
      console.log(`   - Catégorie ${categoryId}: ${count} livres`);
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'import:", error);
  } finally {
    await prisma.$disconnect();
  }
}

importBooks();
