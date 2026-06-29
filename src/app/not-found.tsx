/**
 * Custom 404 Not Found Page
 */

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4">
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-muted/10 mb-4">
          <span className="text-6xl font-bold text-muted-foreground">404</span>
        </div>
        
        <h1 className="text-4xl font-bold text-foreground">
          Page Not Found
        </h1>
        
        <p className="text-muted-foreground max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-transparent bg-gradient-to-r from-primary to-accent px-4 py-3 text-sm font-semibold text-white shadow-glow transition-all duration-200 hover:shadow-glow-lg hover:opacity-90"
          >
            Go Home
          </Link>

          <Link
            href="/projects"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-transparent px-4 py-3 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-surface hover:border-primary/50"
          >
            Browse Projects
          </Link>
        </div>

        <div className="pt-8">
          <p className="text-sm text-muted-foreground">
            Or try searching for what you need:
          </p>
          <div className="mt-2">
            <Link href="/engineering" className="text-sm text-primary hover:underline">
              Engineering Domains →
            </Link>
            {' | '}
            <Link href="/community" className="text-sm text-primary hover:underline">
              Community →
            </Link>
            {' | '}
            <Link href="/ai" className="text-sm text-primary hover:underline">
              AI Tools →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
