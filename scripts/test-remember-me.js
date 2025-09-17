// Script de test pour le Remember Me
// Usage: node scripts/test-remember-me.js

const BASE_URL = 'http://localhost:3000';

class RememberMeTester {
  constructor() {
    this.cookies = {};
  }

  async log(message, isSuccess = true) {
    const status = isSuccess ? '✅' : '❌';
    console.log(`${status} ${message}`);
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${BASE_URL}${endpoint}`;

      // Ajouter les cookies aux headers
      const cookieHeader = Object.entries(this.cookies)
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(cookieHeader && { Cookie: cookieHeader }),
          ...options.headers,
        },
        ...options,
      });

      // Extraire les cookies de la réponse
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        this.extractCookies(setCookieHeader);
      }

      const data = await response.json();
      return { response, data };
    } catch (error) {
      console.error(`❌ Erreur requête ${endpoint}:`, error.message);
      throw error;
    }
  }

  extractCookies(setCookieHeader) {
    const cookies = setCookieHeader.split(',');
    cookies.forEach((cookie) => {
      const [nameValue] = cookie.trim().split(';');
      const [name, value] = nameValue.split('=');
      if (name && value) {
        this.cookies[name.trim()] = value.trim();
      }
    });
  }

  async testLoginWithRememberMe() {
    console.log('\n🔐 === TEST: Login avec Remember Me ===');

    // Note: Ce test nécessite une vraie session
    // Pour le moment, on teste juste l'API Remember Me
    try {
      const { data } = await this.makeRequest('/api/auth/remember-me', {
        method: 'POST',
        body: JSON.stringify({ remember: true }),
      });

      if (data.success) {
        await this.log('API Remember Me fonctionne');

        // Vérifier si le cookie a été défini
        if (this.cookies['bookineo-remember-me']) {
          await this.log('Cookie Remember Me défini correctement');
        } else {
          await this.log('Cookie Remember Me manquant', false);
        }
      } else {
        await this.log('API Remember Me échouée', false);
      }
    } catch (error) {
      if (error.message.includes('401')) {
        await this.log('Test nécessite une session active (normal)');
      } else {
        await this.log(`API Remember Me échouée: ${error.message}`, false);
      }
    }
  }

  async testRememberMeStatus() {
    console.log('\n📊 === TEST: Statut Remember Me ===');

    try {
      const { data } = await this.makeRequest('/api/auth/remember-me');

      if (data.success) {
        await this.log(
          `Statut Remember Me: ${data.data.remembered ? 'Activé' : 'Désactivé'}`
        );
        if (data.data.expiresAt) {
          await this.log(
            `Expire le: ${new Date(data.data.expiresAt).toLocaleString()}`
          );
        }
      } else {
        await this.log('Récupération statut échouée', false);
      }
    } catch (error) {
      if (error.message.includes('401')) {
        await this.log('Test nécessite une session active (normal)');
      } else {
        await this.log(`Récupération statut échouée: ${error.message}`, false);
      }
    }
  }

  async runAllTests() {
    console.log('🚀 === TESTS REMEMBER ME ===\n');
    console.log('⚠️  Ces tests nécessitent une session active');
    console.log("   1. Connectez-vous d'abord sur localhost:3000");
    console.log('   2. Puis relancez ce script\n');

    await this.testLoginWithRememberMe();
    await this.testRememberMeStatus();

    console.log('\n📋 === TESTS MANUELS À FAIRE ===');
    console.log('1. Se connecter avec "Se souvenir de moi" coché');
    console.log('2. Vérifier les cookies dans DevTools');
    console.log('3. Fermer le navigateur complètement');
    console.log('4. Rouvrir et vérifier que la session persiste');
  }
}

// Lancer les tests
const tester = new RememberMeTester();
tester.runAllTests().catch((error) => {
  console.error('❌ Erreur fatale lors des tests:', error);
  process.exit(1);
});
