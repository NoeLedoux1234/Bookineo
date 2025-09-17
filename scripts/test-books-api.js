// Script de test pour toutes les APIs de la page d'accueil (Liste des Livres)
// Usage: node scripts/test-books-api.js

const BASE_URL = 'http://localhost:3000';

class BookAPITester {
  constructor() {
    this.testResults = [];
    this.createdBookId = null;
  }

  async log(message, isSuccess = true) {
    const status = isSuccess ? '✅' : '❌';
    const logMessage = `${status} ${message}`;
    console.log(logMessage);
    this.testResults.push({
      message,
      success: isSuccess,
      timestamp: new Date(),
    });
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${BASE_URL}${endpoint}`;
      console.log(`🔗 ${options.method || 'GET'} ${endpoint}`);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: ${data.message || 'Erreur inconnue'}`
        );
      }

      return { response, data };
    } catch (error) {
      console.error(`❌ Erreur requête ${endpoint}:`, error.message);
      throw error;
    }
  }

  async testGetBooks() {
    console.log('\n📚 === TEST: Liste des livres ===');
    try {
      const { data } = await this.makeRequest('/api/books');

      if (data.success && data.data) {
        await this.log(
          `Liste des livres récupérée: ${data.data.total} livres trouvés`
        );
        await this.log(
          `Pagination: page ${data.data.page}/${data.data.totalPages}`
        );

        if (data.data.items && data.data.items.length > 0) {
          const book = data.data.items[0];
          const hasRequiredFields =
            book.title &&
            book.author &&
            book.category !== undefined &&
            book.status &&
            book.price !== undefined;

          if (hasRequiredFields) {
            await this.log(
              'Structure des livres correcte (titre, auteur, catégorie, statut, prix)'
            );
          } else {
            await this.log('Structure des livres incomplète', false);
          }
        }
      } else {
        await this.log('Réponse liste des livres invalide', false);
      }
    } catch (error) {
      await this.log(`Échec récupération liste: ${error.message}`, false);
    }
  }

  async testSearchAndFilters() {
    console.log('\n🔍 === TEST: Recherche et filtres ===');

    // Test recherche par titre
    try {
      await this.makeRequest('/api/books?search=test');
      await this.log(`Recherche par titre fonctionnelle`);
    } catch (error) {
      await this.log(`Recherche par titre échouée: ${error.message}`, false);
    }

    // Test filtre par statut
    try {
      await this.makeRequest('/api/books?status=AVAILABLE');
      await this.log(`Filtre par statut fonctionnel`);
    } catch (error) {
      await this.log(`Filtre par statut échoué: ${error.message}`, false);
    }

    // Test filtre par prix
    try {
      await this.makeRequest('/api/books?priceMin=5&priceMax=50');
      await this.log(`Filtre par prix fonctionnel`);
    } catch (error) {
      await this.log(`Filtre par prix échoué: ${error.message}`, false);
    }

    // Test pagination
    try {
      const { data } = await this.makeRequest('/api/books?page=1&limit=5');
      if (data.data.limit === 5) {
        await this.log(`Pagination fonctionnelle`);
      } else {
        await this.log(`Pagination incorrecte`, false);
      }
    } catch (error) {
      await this.log(`Pagination échouée: ${error.message}`, false);
    }
  }

  async testCreateBook() {
    console.log('\n➕ === TEST: Création de livre ===');
    try {
      const testBook = {
        title: 'Livre de Test API',
        author: 'Auteur Test',
        year: 2024,
        category: 'Test',
        price: 19.99,
        description: "Livre créé pour tester l'API",
      };

      const { data } = await this.makeRequest('/api/books', {
        method: 'POST',
        body: JSON.stringify(testBook),
      });

      if (data.success && data.data && data.data.id) {
        this.createdBookId = data.data.id;
        await this.log(`Livre créé avec succès (ID: ${this.createdBookId})`);
      } else {
        await this.log("Création de livre échouée - pas d'ID retourné", false);
      }
    } catch (error) {
      await this.log(`Création de livre échouée: ${error.message}`, false);
    }
  }

  async testGetBookDetails() {
    console.log('\n📖 === TEST: Détails du livre ===');
    if (!this.createdBookId) {
      await this.log('Pas de livre créé pour tester les détails', false);
      return;
    }

    try {
      const { data } = await this.makeRequest(
        `/api/books/${this.createdBookId}`
      );

      if (data.success && data.data) {
        const book = data.data;
        const hasBasicInfo = book.title && book.author && book.category;
        const hasRentalsInfo = Array.isArray(book.rentals);
        const hasOwnerInfo = book.owner !== undefined;

        if (hasBasicInfo && hasRentalsInfo && hasOwnerInfo) {
          await this.log(
            'Détails du livre complets (infos de base + locations + propriétaire)'
          );
        } else {
          await this.log('Détails du livre incomplets', false);
        }
      } else {
        await this.log('Réponse détails livre invalide', false);
      }
    } catch (error) {
      await this.log(`Récupération détails échouée: ${error.message}`, false);
    }
  }

  async testUpdateBook() {
    console.log('\n✏️ === TEST: Modification de livre ===');
    if (!this.createdBookId) {
      await this.log('Pas de livre créé pour tester la modification', false);
      return;
    }

    try {
      const updateData = {
        title: 'Livre de Test API - Modifié',
        price: 25.99,
      };

      const { data } = await this.makeRequest(
        `/api/books/${this.createdBookId}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData),
        }
      );

      if (data.success && data.data) {
        await this.log('Livre modifié avec succès');
      } else {
        await this.log('Modification de livre échouée', false);
      }
    } catch (error) {
      await this.log(`Modification de livre échouée: ${error.message}`, false);
    }
  }

  async testCategories() {
    console.log('\n📂 === TEST: Liste des catégories ===');
    try {
      const { data } = await this.makeRequest('/api/books/categories');

      if (data.success && Array.isArray(data.data)) {
        await this.log(`Catégories récupérées: ${data.data.length} catégories`);
      } else {
        await this.log('Liste des catégories invalide', false);
      }
    } catch (error) {
      await this.log(
        `Récupération catégories échouée: ${error.message}`,
        false
      );
    }
  }

  async testAuthorsSearch() {
    console.log("\n👤 === TEST: Recherche d'auteurs ===");
    try {
      const { data } = await this.makeRequest('/api/books/authors/search?q=au');

      if (data.success && Array.isArray(data.data)) {
        await this.log(
          `Recherche d'auteurs fonctionnelle: ${data.data.length} résultats`
        );
      } else {
        await this.log("Recherche d'auteurs invalide", false);
      }
    } catch (error) {
      await this.log(`Recherche d'auteurs échouée: ${error.message}`, false);
    }
  }

  async testStats() {
    console.log('\n📊 === TEST: Statistiques ===');
    try {
      const { data } = await this.makeRequest('/api/books/stats');

      if (data.success && data.data) {
        const stats = data.data;
        const hasRequiredStats =
          typeof stats.total === 'number' &&
          typeof stats.available === 'number' &&
          typeof stats.rented === 'number';

        if (hasRequiredStats) {
          await this.log(
            `Statistiques correctes: ${stats.total} total, ${stats.available} disponibles, ${stats.rented} loués`
          );
        } else {
          await this.log('Structure des statistiques incorrecte', false);
        }
      } else {
        await this.log('Réponse statistiques invalide', false);
      }
    } catch (error) {
      await this.log(
        `Récupération statistiques échouée: ${error.message}`,
        false
      );
    }
  }

  async testExport() {
    console.log('\n📄 === TEST: Export CSV ===');
    try {
      const response = await fetch(`${BASE_URL}/api/books/export`);

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        const contentDisposition = response.headers.get('content-disposition');

        if (contentType && contentType.includes('text/csv')) {
          await this.log('Export CSV - Type de contenu correct');
        } else {
          await this.log('Export CSV - Type de contenu incorrect', false);
        }

        if (contentDisposition && contentDisposition.includes('attachment')) {
          await this.log('Export CSV - En-têtes de téléchargement corrects');
        } else {
          await this.log(
            'Export CSV - En-têtes de téléchargement incorrects',
            false
          );
        }
      } else {
        await this.log(`Export CSV échoué: HTTP ${response.status}`, false);
      }
    } catch (error) {
      await this.log(`Export CSV échoué: ${error.message}`, false);
    }
  }

  async testDeleteBook() {
    console.log('\n🗑️ === TEST: Suppression de livre ===');
    if (!this.createdBookId) {
      await this.log('Pas de livre créé pour tester la suppression', false);
      return;
    }

    try {
      const { data } = await this.makeRequest(
        `/api/books/${this.createdBookId}`,
        {
          method: 'DELETE',
        }
      );

      if (data.success) {
        await this.log('Livre supprimé avec succès');
      } else {
        await this.log('Suppression de livre échouée', false);
      }
    } catch (error) {
      await this.log(`Suppression de livre échouée: ${error.message}`, false);
    }
  }

  async runAllTests() {
    console.log('🚀 === DÉMARRAGE DES TESTS API BOOKS ===\n');
    console.log(`🔗 URL de base: ${BASE_URL}`);

    await this.testGetBooks();
    await this.testSearchAndFilters();
    await this.testCreateBook();
    await this.testGetBookDetails();
    await this.testUpdateBook();
    await this.testCategories();
    await this.testAuthorsSearch();
    await this.testStats();
    await this.testExport();
    await this.testDeleteBook();

    this.generateReport();
  }

  generateReport() {
    console.log('\n📋 === RAPPORT FINAL ===');

    const totalTests = this.testResults.length;
    const successfulTests = this.testResults.filter((r) => r.success).length;
    const failedTests = totalTests - successfulTests;

    console.log(`📊 Tests total: ${totalTests}`);
    console.log(`✅ Réussis: ${successfulTests}`);
    console.log(`❌ Échoués: ${failedTests}`);
    console.log(
      `📈 Taux de réussite: ${Math.round((successfulTests / totalTests) * 100)}%`
    );

    if (failedTests > 0) {
      console.log('\n❌ Tests échoués:');
      this.testResults
        .filter((r) => !r.success)
        .forEach((r) => console.log(`   - ${r.message}`));
    }

    if (successfulTests === totalTests) {
      console.log(
        '\n🎉 TOUS LES TESTS SONT PASSÉS ! Le backend est prêt pour le frontend.'
      );
    } else {
      console.log(
        '\n⚠️ Certains tests ont échoué. Vérifiez les erreurs ci-dessus.'
      );
    }
  }
}

// Lancer les tests
const tester = new BookAPITester();
tester.runAllTests().catch((error) => {
  console.error('❌ Erreur fatale lors des tests:', error);
  process.exit(1);
});
