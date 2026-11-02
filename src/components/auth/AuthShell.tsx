import Link from "next/link";

const BENEFITS = [
  "Answers with clickable page and timestamp citations",
  "PDF, DOCX, TXT and video transcripts in one place",
  "Private workspaces for every team",
];

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 bg-aurora" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl lg:grid-cols-2">
        {/* Left: brand panel (desktop only) */}
        <aside className="hidden flex-col justify-between p-10 lg:flex">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="bg-gradient-neon glow flex h-9 w-9 items-center justify-center rounded-xl text-base font-bold text-white">
              D
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">DocMind</span>
          </Link>

          <div>
            <h2 className="max-w-md text-4xl font-bold leading-tight">
              Ask your documents.
              <br />
              <span className="text-gradient">Verify every answer.</span>
            </h2>

            <ul className="mt-8 space-y-4">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>

            {/* Decorative citation chips */}
            <div className="animate-float mt-10 flex flex-wrap gap-2">
              <span className="glass rounded-full px-3 py-1 text-xs font-medium text-accent-foreground">
                q3-report.pdf · p. 12
              </span>
              <span className="glass rounded-full px-3 py-1 text-xs font-medium text-accent-foreground">
                review-call.mp4 · 04:32
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} DocMind</p>
        </aside>

        {/* Right: form card */}
        <main className="flex flex-col items-center justify-center px-5 py-10">
          {/* Logo for mobile (the left panel is hidden there) */}
          <Link href="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="bg-gradient-neon glow flex h-9 w-9 items-center justify-center rounded-xl text-base font-bold text-white">
              D
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">DocMind</span>
          </Link>

          <div className="glass glow w-full max-w-md rounded-3xl p-6 sm:p-8">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>

          <Link
            href="/"
            className="mt-6 text-xs text-muted-foreground transition hover:text-foreground"
          >
            ← Back to home
          </Link>
        </main>
      </div>
    </div>
  );
}