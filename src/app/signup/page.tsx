'use client';

import React, { JSX, useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerSchema, validateSchema } from '@/lib/Validation';

export default function SignupPage(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = (): boolean => {
    // on utilise le schéma server-friendly existant (registerSchema) pour valider côté client
    const payload = { email, password, confirmPassword: confirm };
    const res = validateSchema(registerSchema, payload);
    if (!res.success) {
      setErrors(Object.values(res.errors ?? {}));
      return false;
    }
    setErrors([]);
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const txt = await res.text();
      let data: any = {};
      try {
        data = txt ? JSON.parse(txt) : {};
      } catch {
        data = { message: txt };
      }

      if (!res.ok) {
        const msg =
          data?.message || data?.error || res.statusText || 'Erreur serveur';
        setServerError(msg);
        return;
      }

      // création OK → redirection vers login
      router.push('/login');
    } catch (err: any) {
      setServerError(err?.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-white p-8 rounded-lg shadow"
      >
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Créer un compte
        </h2>

        {serverError && (
          <div className="mb-3 text-sm text-red-600">{serverError}</div>
        )}
        {errors.length > 0 && (
          <ul className="mb-3 text-sm text-red-600 list-disc pl-5">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}

        <label className="block mb-4">
          <span className="text-sm">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 p-2"
            autoComplete="email"
            required
          />
        </label>

        <label className="block mb-3">
          <span className="text-sm">Mot de passe</span>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 p-2 pr-10"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600"
              aria-label="Afficher / Masquer le mot de passe"
            >
              {show ? '🙈' : '👁️'}
            </button>
          </div>
        </label>

        <label className="block mb-4">
          <span className="text-sm">Confirmation</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 p-2"
            autoComplete="new-password"
            required
          />
        </label>

        <ul className="mb-4 text-sm space-y-1">
          <li className={checks.length ? 'text-green-600' : 'text-gray-500'}>
            • Au moins 8 caractères
          </li>
          <li className={checks.upper ? 'text-green-600' : 'text-gray-500'}>
            • Une majuscule
          </li>
          <li className={checks.lower ? 'text-green-600' : 'text-gray-500'}>
            • Une minuscule
          </li>
          <li className={checks.special ? 'text-green-600' : 'text-gray-500'}>
            • Un caractère spécial
          </li>
        </ul>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-60"
        >
          {loading ? 'Création...' : 'Créer un compte'}
        </button>
      </form>
    </div>
  );
}
