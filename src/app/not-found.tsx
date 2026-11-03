import Link from "next/link";
import ThemeToggle from "@/components/UI/ThemeToggle";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0 bg-aurora" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
        aria-hidden="true"
      />
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 text-center">
        <p className="text-gradient font-display text-7xl font-bold sm:text-8xl">404</p>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">This page could not be found</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          The link may be broken, or the workspace may have been deleted or may not belong to you.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/documents"
            className="bg-gradient-neon glow rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Go to workspaces
          </Link>
          <Link
            href="/"
            className="glass rounded-full px-6 py-2.5 text-sm font-semibold transition hover:border-primary"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}