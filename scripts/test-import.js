// Script de test pour l'import des livres
// Usage: node scripts/test-import.js [chemin_vers_books.json]

import fs from 'fs';

async function testImport(jsonFilePath) {
  try {
    console.log("🚀 Test d'import des livres Amazon");
    console.log(`📁 Fichier: ${jsonFilePath}`);

    // Lire le fichier JSON
    if (!fs.existsSync(jsonFilePath)) {
      throw new Error(`Fichier non trouvé: ${jsonFilePath}`);
    }

    const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
    const books = JSON.parse(jsonData);

    console.log(`📚 ${books.length} livres trouvés dans le JSON`);

    // Vérifier l'état actuel
    console.log("\n🔍 Vérification de l'état actuel...");
    const statusResponse = await fetch(
      'http://localhost:3000/api/admin/books/import'
    );
    const statusData = await statusResponse.json();

    if (!statusData.success) {
      throw new Error("Erreur lors de la vérification de l'état");
    }

    console.log(
      `📊 Livres actuels en base: ${statusData.data.currentBooksCount}`
    );
    console.log(`✅ Peut importer: ${statusData.data.canImport}`);

    if (statusData.data.issues.length > 0) {
      console.log('⚠️  Problèmes détectés:');
      statusData.data.issues.forEach((issue) => console.log(`   - ${issue}`));
    }

    // Lancer l'import
    console.log("\n🚀 Lancement de l'import...");
    const importResponse = await fetch(
      'http://localhost:3000/api/admin/books/import',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ books }),
      }
    );

    const importData = await importResponse.json();

    if (!importData.success) {
      throw new Error(`Import échoué: ${importData.message}`);
    }

    // Afficher les résultats
    console.log('\n🎉 Import terminé avec succès!');
    console.log(`📊 Résultats:`);
    console.log(`   - Importés: ${importData.data.imported}`);
    console.log(`   - Échoués: ${importData.data.failed}`);
    console.log(`   - Ignorés: ${importData.data.skipped}`);
    console.log(
      `   - Temps de traitement: ${importData.data.processingTime}ms`
    );

    if (importData.data.errors.length > 0) {
      console.log('\n❌ Erreurs rencontrées:');
      importData.data.errors
        .slice(0, 10)
        .forEach((error) => console.log(`   - ${error}`));
      if (importData.data.errors.length > 10) {
        console.log(
          `   ... et ${importData.data.errors.length - 10} autres erreurs`
        );
      }
    }
  } catch (error) {
    console.error("❌ Erreur lors du test d'import:", error.message);
    process.exit(1);
  }
}

// Point d'entrée
const jsonFilePath = process.argv[2] || './datasets/books-sample.json';

// Créer un échantillon si pas de fichier fourni
if (
  !fs.existsSync(jsonFilePath) &&
  jsonFilePath === './datasets/books-sample.json'
) {
  console.log("📝 Création d'un échantillon de test...");

  const sampleBooks = [
    {
      asin: '0007350813',
      ISBN10: '0007350813',
      answered_questions: 0,
      availability: 'In Stock.',
      brand: 'Emily Brontë',
      currency: 'USD',
      date_first_available: null,
      delivery: ['FREE delivery Tuesday, December 28'],
      department: null,
      description: 'A classic novel by Emily Brontë',
      discount: null,
      domain: 'www.amazon.com',
      features: [],
      final_price: 3.99,
      format: [
        {
          name: 'Kindle',
          price: '$0.99',
          url: '/Wuthering-Heights-Emily-Bronte-ebook/dp/B001C5L5V0',
        },
      ],
      image_url:
        'https://images-na.ssl-images-amazon.com/images/I/41k1JwQ6zVL._SY291_BO1,204,203,200_QL40_FMwebp_.jpg',
      images_count: '4',
      initial_price: null,
      item_weight: '7.8 ounces',
      manufacturer: null,
      model_number: null,
      plus_content: false,
      product_dimensions: '1 x 4.3 x 7 inches',
      rating: '4.6 out of 5 stars',
      reviews_count: 13451,
      root_bs_rank: 253400,
      seller_id: 'ATVPDKIKX0DER',
      seller_name: 'Amazon',
      timestamp: '2021-12-21T23:35:40.084Z',
      title: 'Wuthering Heights (Collins Classics)',
      upc: null,
      url: 'https://www.amazon.com/dp/0007350813',
      video: false,
      video_count: 0,
      categories: ['Books', 'Literature & Fiction', 'Genre Fiction'],
      best_sellers_rank: [
        {
          category: 'Books / Literature & Fiction / Historical Fiction',
          rank: 28,
        },
      ],
    },
  ];

  fs.writeFileSync(jsonFilePath, JSON.stringify(sampleBooks, null, 2));
  console.log(`✅ Échantillon créé: ${jsonFilePath}`);
}

testImport(jsonFilePath);
