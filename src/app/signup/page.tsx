'use client';

import { registerSchemaSimple, validateSchema } from '@/lib/Validation';
import { useRouter } from 'next/navigation';
import React, { JSX, useState } from 'react';

export default function SignupPage(): JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = (): boolean => {
    // Validation simple côté client
    if (password !== confirm) {
      setErrors(['Les mots de passe ne correspondent pas']);
      return false;
    }
    let birthDateISO = birthDate;
    if (birthDate && /^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      birthDateISO = new Date(birthDate).toISOString();
    }
    const payload = {
      email,
      password,
      firstName,
      lastName,
      birthDate: birthDateISO,
    };
    const res = validateSchema(registerSchemaSimple, payload);
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

    // Envoie la date au format ISO complet (YYYY-MM-DDT00:00:00.000Z)
    let birthDateToSend: string | undefined = undefined;
    if (birthDate) {
      birthDateToSend = new Date(birthDate).toISOString();
    }
    console.log('birthDate (input):', birthDate);
    console.log('birthDate (ISO sent):', birthDateToSend);
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          birthDate: birthDateToSend,
        }),
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

        <label className="block mb-4">
          <span className="text-sm">Prénom</span>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 p-2"
            autoComplete="given-name"
            placeholder="Prénom"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm">Nom (optionnel)</span>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 p-2"
            autoComplete="family-name"
            placeholder="Nom"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm">Date de naissance</span>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="mt-1 block w-full rounded border border-gray-300 p-2"
            autoComplete="bday"
            placeholder="Date de naissance"
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
