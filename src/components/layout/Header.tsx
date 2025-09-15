import * as React from 'react';
import Link from 'next/link';

type HeaderProps = {
  userName?: string;
};

export default function Header({ userName = 'Utilisateur' }: HeaderProps) {
  const initials =
    userName
      .split(' ')
      .map((s) => s[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2) || 'U';

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
            📚
          </div>
          <span className="text-lg font-semibold tracking-tight">Bookineo</span>
        </Link>

        <details className="group relative">
          <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/60">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-muted text-sm font-medium">
              {initials}
            </div>
            <span className="text-sm font-medium">{userName}</span>
            <svg
              className="ml-1 h-4 w-4 transition-transform group-open:rotate-180"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 10.17l3.71-2.94a.75.75 0 111.04 1.08l-4.24 3.36a.75.75 0 01-.94 0L5.21 8.31a.75.75 0 01.02-1.1z"
                clipRule="evenodd"
              />
            </svg>
          </summary>

          <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-md">
            <Link
              href="/profil"
              className="block px-4 py-2 text-sm hover:bg-muted/60"
            >
              Profil
            </Link>
            <Link
              href="/messagerie"
              className="block px-4 py-2 text-sm hover:bg-muted/60"
            >
              Messagerie
            </Link>
            <Link
              href="/deconnexion"
              className="block px-4 py-2 text-sm text-red-600 hover:bg-muted/60"
            >
              Déconnexion
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}
