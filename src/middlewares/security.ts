import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@/lib/errors/AppError';

// Configuration de sécurité
const SECURITY_CONFIG = {
  maxBodySize: 10 * 1024 * 1024, // 10MB
  allowedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    process.env.FRONTEND_URL || 'http://localhost:3000',
  ].filter(Boolean),
  trustedProxies: ['127.0.0.1', '::1'],
  contentTypeWhitelist: [
    'application/json',
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain',
  ],
};

// Validation CORS
export function validateCORS(request: NextRequest): void {
  const origin = request.headers.get('origin');

  if (origin && !SECURITY_CONFIG.allowedOrigins.includes(origin)) {
    throw new AppError('Origin non autorisé', 403, 'CORS_VIOLATION');
  }
}

// Validation de la taille du body
export function validateContentLength(request: NextRequest): void {
  const contentLength = request.headers.get('content-length');

  if (
    contentLength &&
    parseInt(contentLength, 10) > SECURITY_CONFIG.maxBodySize
  ) {
    throw new AppError(
      'Corps de requête trop volumineux',
      413,
      'PAYLOAD_TOO_LARGE'
    );
  }
}

// Validation du Content-Type
export function validateContentType(request: NextRequest): void {
  const contentType = request.headers.get('content-type');
  const method = request.method;

  // Skip validation pour GET, HEAD, DELETE
  if (['GET', 'HEAD', 'DELETE'].includes(method)) {
    return;
  }

  if (!contentType) {
    throw new AppError('Content-Type manquant', 400, 'MISSING_CONTENT_TYPE');
  }

  const baseContentType = contentType.split(';')[0].trim().toLowerCase();

  if (!SECURITY_CONFIG.contentTypeWhitelist.includes(baseContentType)) {
    throw new AppError(
      'Content-Type non autorisé',
      415,
      'UNSUPPORTED_MEDIA_TYPE'
    );
  }
}

// Validation des headers de sécurité
export function validateSecurityHeaders(request: NextRequest): void {
  const userAgent = request.headers.get('user-agent');

  // Bloquer les requêtes sans User-Agent (souvent des bots malveillants)
  if (!userAgent) {
    throw new AppError('User-Agent requis', 400, 'MISSING_USER_AGENT');
  }

  // Détecter des patterns suspects dans le User-Agent
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /burp/i,
    /curl.*bot/i,
    /scanner/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(userAgent)) {
      throw new AppError(
        'User-Agent suspect détecté',
        403,
        'SUSPICIOUS_USER_AGENT'
      );
    }
  }
}

// Protection contre les injections dans les paramètres
export function validateQueryParameters(request: NextRequest): void {
  const { searchParams } = new URL(request.url);

  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /eval\(/i,
    /union.*select/i,
    /drop.*table/i,
    /insert.*into/i,
    /delete.*from/i,
    /'.*or.*'.*=/i,
  ];

  for (const [key, value] of searchParams.entries()) {
    // Vérifier la clé
    for (const pattern of dangerousPatterns) {
      if (pattern.test(key) || pattern.test(value)) {
        throw new AppError(
          'Paramètres suspects détectés',
          400,
          'SUSPICIOUS_PARAMETERS'
        );
      }
    }

    // Limiter la longueur des paramètres
    if (key.length > 100 || value.length > 1000) {
      throw new AppError('Paramètres trop longs', 400, 'PARAMETER_TOO_LONG');
    }
  }
}

// Validation de l'IP et détection de proxies
export function validateClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  let clientIP = 'unknown';

  if (cfConnectingIP) {
    clientIP = cfConnectingIP;
  } else if (realIP) {
    clientIP = realIP;
  } else if (forwarded) {
    // Prendre la première IP de la liste (la vraie IP client)
    clientIP = forwarded.split(',')[0].trim();
  }

  // Vérifier si l'IP est valide
  if (clientIP !== 'unknown' && !isValidIP(clientIP)) {
    throw new AppError('Adresse IP invalide', 400, 'INVALID_IP');
  }

  return clientIP;
}

// Validation d'IP
function isValidIP(ip: string): boolean {
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  // IPv6 regex qui gère les formats compressés comme ::1 et les formats complets
  const ipv6Regex =
    /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

  // Handle localhost explicitly
  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    return true;
  }

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

// Middleware de sécurité global
export function applySecurityMiddleware(request: NextRequest): void {
  try {
    validateCORS(request);
    validateContentLength(request);
    validateContentType(request);
    validateSecurityHeaders(request);
    validateQueryParameters(request);
    validateClientIP(request);
  } catch (error) {
    // Log des tentatives suspectes
    console.warn(
      `Security violation from ${request.headers.get('x-forwarded-for') || 'unknown'}:`,
      error
    );
    throw error;
  }
}

// Headers de sécurité à ajouter aux réponses
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // CSP (Content Security Policy)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self'; object-src 'none'; media-src 'self'; frame-src 'none';"
  );

  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Content Type Options
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Frame Options
  response.headers.set('X-Frame-Options', 'DENY');

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // HSTS (en production uniquement)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  return response;
}

// Fonction pour nettoyer les inputs utilisateur
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Supprimer les scripts
    .replace(/<[^>]+>/g, '') // Supprimer les balises HTML
    .replace(/javascript:/gi, '') // Supprimer les liens javascript
    .replace(/vbscript:/gi, '') // Supprimer les liens vbscript
    .replace(/on\w+=/gi, '') // Supprimer les événements HTML
    .trim();
}

// Validation des uploads de fichiers
export function validateFileUpload(file: File): void {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
  ];

  const dangerousExtensions = [
    '.exe',
    '.bat',
    '.cmd',
    '.com',
    '.pif',
    '.scr',
    '.vbs',
    '.js',
    '.jar',
    '.php',
    '.asp',
    '.jsp',
    '.sh',
    '.ps1',
  ];

  if (file.size > maxSize) {
    throw new AppError('Fichier trop volumineux', 413, 'FILE_TOO_LARGE');
  }

  if (!allowedTypes.includes(file.type)) {
    throw new AppError(
      'Type de fichier non autorisé',
      415,
      'UNSUPPORTED_FILE_TYPE'
    );
  }

  const extension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf('.'));
  if (dangerousExtensions.includes(extension)) {
    throw new AppError(
      'Extension de fichier dangereuse',
      415,
      'DANGEROUS_FILE_EXTENSION'
    );
  }
}

// Export des fonctions principales
export const securityMiddleware = {
  applyAll: applySecurityMiddleware,
  addHeaders: addSecurityHeaders,
  sanitize: sanitizeInput,
  validateFile: validateFileUpload,
  validateIP: validateClientIP,
};
