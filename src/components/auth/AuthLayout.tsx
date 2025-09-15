import { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
};

export default function AuthLayout({ title, description, children }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
              📚
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Bookineo
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 md:grid-cols-2 md:py-16 lg:gap-14">
        <aside className="hidden md:block">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Bienvenue</CardTitle>
              <CardDescription>
                Louez et proposez des livres en toute simplicité.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-32 rounded-2xl border bg-muted" />
            </CardContent>
          </Card>
        </aside>

        <section>
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              {description ? (
                <CardDescription>{description}</CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="grid gap-4">{children}</CardContent>
          </Card>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 text-xs text-muted-foreground sm:px-6">
        <div className="flex items-center justify-between">
          <span>© Bookineo</span>
          <nav className="flex items-center gap-4">
            <a className="hover:text-foreground" href="#">
              Conditions
            </a>
            <a className="hover:text-foreground" href="#">
              Confidentialité
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
