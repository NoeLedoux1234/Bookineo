import Link from 'next/link';
import React from 'react';

type HeaderProps = { userName?: string | null };

export default function Header({ userName }: HeaderProps) {
  const name = userName ?? 'Invité';
  const initials = name
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold">
            B
          </div>
          <span className="text-lg font-semibold text-gray-800">Bookineo</span>
        </Link>

        <details className="relative">
          <summary className="flex items-center gap-3 cursor-pointer list-none outline-none">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-medium select-none">
              {initials}
            </div>
            <span className="text-sm text-gray-700 hidden sm:inline">
              {name}
            </span>
            <svg
              className="w-4 h-4 text-gray-500 ml-1"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.584l3.71-4.354a.75.75 0 111.14.98l-4.25 5a.75.75 0 01-1.14 0l-4.25-5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </summary>

          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
            <ul className="py-1">
              <li>
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Profil
                </Link>
              </li>
              <li>
                <Link
                  href="/messages"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Messagerie
                </Link>
              </li>
              <li>
                <form method="post" action="/api/auth/logout">
                  <button
                    type="submit"
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Déconnexion
                  </button>
                </form>
              </li>
            </ul>
          </div>
        </details>
      </div>
    </header>
  );
}
