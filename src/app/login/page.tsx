'use client';

import { loginSchema, validateSchema } from '@/lib/Validation';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { JSX, useState } from 'react';

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = (): boolean => {
    const payload = { email, password, rememberMe: remember };
    const res = validateSchema(loginSchema, payload);
    if (!res.success) {
      setFieldError(
        res.errors ? Object.values(res.errors)[0] : 'Donnée invalide'
      );
      return false;
    }
    setFieldError(null);
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setServerError('Email ou mot de passe incorrect');
        return;
      }

      if (result?.ok) {
        router.push('/');
      }
    } catch (err: any) {
      setServerError(err?.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-white p-8 rounded-lg shadow"
      >
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Se connecter
        </h2>

        {fieldError && (
          <div className="mb-3 text-sm text-red-600">{fieldError}</div>
        )}
        {serverError && (
          <div className="mb-3 text-sm text-red-600">{serverError}</div>
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

        <label className="block mb-4">
          <span className="text-sm">Mot de passe</span>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 p-2 pr-10"
              autoComplete="current-password"
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

        <div className="flex items-center justify-between mb-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4"
            />
            Se souvenir de moi
          </label>
          <a href="/signup" className="text-sm text-blue-600">
            Créer un compte
          </a>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-60"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
