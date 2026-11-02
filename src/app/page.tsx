import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import HeroPreview from "@/components/landing/HeroPreview";
import AnimatedHeadline from "@/components/landing/AnimatedHeadline";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#preview", label: "Preview" },
];

const FEATURES = [
  {
    title: "Cited answers",
    text: "Every answer shows the exact page or timestamp it came from. One click opens the source.",
    icon: "M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    title: "PDF, DOCX and TXT",
    text: "Upload your files and DocMind reads, splits and indexes them automatically.",
    icon: "M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zM14 3v5h5",
  },
  {
    title: "Video transcripts",
    text: "Paste SRT, VTT or timestamped text and get answers that link to the right moment.",
    icon: "M15 10l5-3v10l-5-3M4 6h11a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z",
  },
  {
    title: "Team workspaces",
    text: "Keep documents separated by team. Admins manage files, members ask questions.",
    icon: "M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-6.13a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    title: "Streaming replies",
    text: "Answers appear word by word, and you can stop or retry at any time.",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  {
    title: "Secure by design",
    text: "Private storage, per-workspace search and sanitized output keep your data yours.",
    icon: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z",
  },
];

const STEPS = [
  {
    title: "Create a workspace",
    text: "Sign in and make a workspace for your team or project.",
  },
  {
    title: "Upload your sources",
    text: "Add PDFs, Word files or paste a video transcript. Indexing starts on its own.",
  },
  {
    title: "Ask and verify",
    text: "Ask in plain English, read the streamed answer and click the citations to check it.",
  },
];

export default async function HomePage() {
  // Used only to decide which buttons to show; the page itself stays public
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);
  const year = new Date().getFullYear();

  return (
    // overflow-x-clip (not overflow-hidden) so the sticky navbar still works
    <div className="relative min-h-screen overflow-x-clip">
      {/* Background layers: aurora glow + faded grid */}
      <div className="pointer-events-none absolute inset-0 bg-aurora" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black,transparent_60%)]"
        aria-hidden="true"
      />

      {/* ---------- Navbar ---------- */}
      <header className="sticky top-0 z-40 border-b bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="bg-gradient-neon glow flex h-9 w-9 items-center justify-center rounded-xl text-base font-bold text-white">
              D
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">DocMind</span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 md:flex">
            {isSignedIn ? (
              <Link
                href="/documents"
                className="bg-gradient-neon rounded-full px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                Open dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-gradient-neon rounded-full px-5 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu: plain <details>, so no client JavaScript is needed */}
          <details className="group relative md:hidden">
            <summary
              className="glass flex h-10 w-10 list-none items-center justify-center rounded-full [&::-webkit-details-marker]:hidden"
              aria-label="Open menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </summary>
            <div className="glass absolute right-0 mt-3 w-56 rounded-2xl p-2 shadow-xl">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
              <div className="my-2 border-t" />
              {isSignedIn ? (
                <Link
                  href="/documents"
                  className="bg-gradient-neon block rounded-xl px-3 py-2.5 text-center text-sm font-medium text-white"
                >
                  Open dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="block rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    className="bg-gradient-neon mt-1 block rounded-xl px-3 py-2.5 text-center text-sm font-medium text-white"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </details>
        </div>
      </header>

      <main className="relative z-10">
        {/* ---------- Hero ---------- */}
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 text-center sm:pt-24">
          <div className="glass mx-auto inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
            AI answers with clickable citations
          </div>

          <AnimatedHeadline />

          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            Upload PDFs, Word files and video transcripts, then ask questions in plain English.
            DocMind answers from your files only and shows exactly where it found each answer.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={isSignedIn ? "/documents" : "/sign-up"}
              className="bg-gradient-neon glow rounded-full px-7 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
            >
              {isSignedIn ? "Open dashboard" : "Start for free"}
            </Link>
            {!isSignedIn && (
              <Link
                href="/sign-in"
                className="glass rounded-full px-7 py-3 text-sm font-semibold transition hover:border-primary"
              >
                Sign in
              </Link>
            )}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            PDF, DOCX, TXT and video transcripts · Private team workspaces
          </p>
        </section>

        {/* ---------- Product preview (floating, tilting, draggable) ---------- */}
        <section id="preview" className="scroll-mt-24 mx-auto max-w-6xl px-6 pb-24">
          <HeroPreview />
        </section>

        {/* ---------- Features ---------- */}
        <section id="features" className="scroll-mt-24 mx-auto max-w-6xl px-6 pb-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-secondary">Features</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Everything you need to trust AI answers</h2>
            <p className="mt-4 text-muted-foreground">
              Built for people who need answers they can verify, not just answers that sound right.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="glass group rounded-2xl p-6 transition hover:-translate-y-1 hover:border-primary"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground transition group-hover:glow">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={feature.icon} />
                  </svg>
                </span>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- How it works ---------- */}
        <section id="how-it-works" className="scroll-mt-24 mx-auto max-w-6xl px-6 pb-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-secondary">How it works</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">From files to answers in three steps</h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="glass rounded-2xl p-6">
                <span className="text-gradient font-display text-4xl font-bold">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Final call to action ---------- */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="glass glow relative overflow-hidden rounded-3xl px-6 py-14 text-center">
            <div className="pointer-events-none absolute inset-0 bg-aurora opacity-70" aria-hidden="true" />
            <h2 className="relative text-3xl font-bold sm:text-4xl">Ready to ask your documents?</h2>
            <p className="relative mx-auto mt-4 max-w-md text-muted-foreground">
              Create a workspace, upload a file and get your first cited answer in minutes.
            </p>
            <Link
              href={isSignedIn ? "/documents" : "/sign-up"}
              className="bg-gradient-neon glow relative mt-8 inline-block rounded-full px-8 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
            >
              {isSignedIn ? "Open dashboard" : "Get started for free"}
            </Link>
          </div>
        </section>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="relative z-10 border-t bg-background/60 backdrop-blur-xl">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="bg-gradient-neon flex h-9 w-9 items-center justify-center rounded-xl text-base font-bold text-white">
                D
              </span>
              <span className="font-display text-lg font-semibold tracking-tight">DocMind</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Chat with your documents and get answers you can verify, with citations that open the
              exact page or video moment.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Product</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><a href="#features" className="transition hover:text-foreground">Features</a></li>
              <li><a href="#how-it-works" className="transition hover:text-foreground">How it works</a></li>
              <li><a href="#preview" className="transition hover:text-foreground">Preview</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Account</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {isSignedIn ? (
                <li><Link href="/documents" className="transition hover:text-foreground">Dashboard</Link></li>
              ) : (
                <>
                  <li><Link href="/sign-in" className="transition hover:text-foreground">Sign in</Link></li>
                  <li><Link href="/sign-up" className="transition hover:text-foreground">Create account</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-muted-foreground sm:flex-row">
            <p>© {year} DocMind. All rights reserved.</p>
            <p>Built with Next.js, Gemini and pgvector</p>
          </div>
        </div>
      </footer>
    </div>
  );
}