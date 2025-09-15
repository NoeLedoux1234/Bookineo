# Tests d'authentification - Guide Backend

## 🧪 **Tests à effectuer avec Postman/cURL**

### 1. **API d'inscription (POST /api/auth/register)**

#### ✅ **Cas de succès :**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "MonMotDePasse123!",
    "confirmPassword": "MonMotDePasse123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Réponse attendue (201) :**

```json
{
  "success": true,
  "message": "Compte créé avec succès",
  "user": {
    "id": "...",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### ❌ **Cas d'erreur - Email invalide :**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "email-invalide",
    "password": "MonMotDePasse123!",
    "confirmPassword": "MonMotDePasse123!"
  }'
```

**Réponse attendue (400) :**

```json
{
  "success": false,
  "message": "Données de validation invalides",
  "errors": {
    "email": "Format d'email invalide (ex: prenom.nom@domaine.com)"
  }
}
```

#### ❌ **Cas d'erreur - Mot de passe faible :**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123",
    "confirmPassword": "123"
  }'
```

**Réponse attendue (400) :**

```json
{
  "success": false,
  "message": "Données de validation invalides",
  "errors": {
    "password": "Au moins 8 caractères requis"
  }
}
```

#### ❌ **Cas d'erreur - Email déjà utilisé :**

```bash
# Répéter le même email deux fois
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "AutreMotDePasse123!",
    "confirmPassword": "AutreMotDePasse123!"
  }'
```

**Réponse attendue (409) :**

```json
{
  "success": false,
  "message": "Un compte avec cet email existe déjà",
  "errors": {
    "email": "Cet email est déjà utilisé"
  }
}
```

---

### 2. **API de connexion (via NextAuth)**

#### ✅ **Cas de succès :**

```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "MonMotDePasse123!",
    "rememberMe": true
  }'
```

#### ❌ **Cas d'erreur - Mauvais mot de passe :**

```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "MauvaisMotDePasse"
  }'
```

---

### 3. **API Profil (GET /api/users/profile)**

#### ✅ **Cas de succès (avec session) :**

```bash
# Connectez-vous d'abord via browser ou récupérez le cookie
curl -X GET http://localhost:3000/api/users/profile \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Réponse attendue (200) :**

```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "birthDate": null,
    "_count": {
      "ownedBooks": 0,
      "rentals": 0,
      "sentMessages": 0
    }
  }
}
```

#### ❌ **Cas d'erreur - Sans authentification :**

```bash
curl -X GET http://localhost:3000/api/users/profile
```

**Réponse attendue (401) :**

```json
{
  "success": false,
  "message": "Authentication requise",
  "errors": {
    "auth": "Vous devez être connecté pour accéder à cette ressource"
  }
}
```

---

### 4. **API Mise à jour profil (PUT /api/users/profile)**

#### ✅ **Cas de succès :**

```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "firstName": "Jean",
    "lastName": "Dupont",
    "birthDate": "1990-01-15T00:00:00.000Z"
  }'
```

---

### 5. **API Changement mot de passe (PUT /api/users/change-password)**

#### ✅ **Cas de succès :**

```bash
curl -X PUT http://localhost:3000/api/users/change-password \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "currentPassword": "MonMotDePasse123!",
    "newPassword": "NouveauMotDePasse456@",
    "confirmNewPassword": "NouveauMotDePasse456@"
  }'
```

#### ❌ **Cas d'erreur - Mauvais mot de passe actuel :**

```bash
curl -X PUT http://localhost:3000/api/users/change-password \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "currentPassword": "MauvaisMotDePasse",
    "newPassword": "NouveauMotDePasse456@",
    "confirmNewPassword": "NouveauMotDePasse456@"
  }'
```

---

## 🔒 **Tests de sécurité**

### 1. **Protection des routes :**

```bash
# Essayer d'accéder à une page protégée sans auth
curl -X GET http://localhost:3000/dashboard
# Doit rediriger vers /login

# Essayer d'accéder à une API protégée sans auth
curl -X GET http://localhost:3000/api/users/profile
# Doit retourner 401
```

### 2. **Rate Limiting (si implémenté) :**

```bash
# Faire plusieurs tentatives de connexion rapides
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"spam@test.com","password":"Test123!","confirmPassword":"Test123!"}'
done
```

### 3. **Validation stricte :**

```bash
# Tester tous les formats d'email invalides
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@",
    "password": "ValidPassword123!",
    "confirmPassword": "ValidPassword123!"
  }'

# Tester mots de passe sans majuscule, minuscule, caractère spécial
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "motdepassesansmajuscule",
    "confirmPassword": "motdepassesansmajuscule"
  }'
```

---

## 🎯 **Checklist de validation :**

- [ ] ✅ Inscription avec données valides
- [ ] ❌ Inscription avec email invalide
- [ ] ❌ Inscription avec mot de passe faible
- [ ] ❌ Inscription avec email déjà utilisé
- [ ] ❌ Inscription avec mots de passe non identiques
- [ ] ✅ Connexion avec bonnes credentials
- [ ] ❌ Connexion avec mauvaises credentials
- [ ] ✅ Remember me prolonge la session
- [ ] ✅ Récupération profil avec session valide
- [ ] ❌ Récupération profil sans session
- [ ] ✅ Mise à jour profil avec données valides
- [ ] ❌ Mise à jour profil avec données invalides
- [ ] ✅ Changement mot de passe avec bon mot de passe actuel
- [ ] ❌ Changement mot de passe avec mauvais mot de passe actuel
- [ ] 🛡️ Routes protégées bloquent accès non authentifié
- [ ] 🛡️ Middleware redirige correctement
- [ ] 🍪 Cookies sécurisés configurés
- [ ] 🔒 Mots de passe hashés en base
