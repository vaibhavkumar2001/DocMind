import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">DocMind</h1>
      <div className="flex gap-3">
        <Link href="/sign-in" className="rounded-lg border px-4 py-2">Sign in</Link>
        <Link href="/sign-up" className="rounded-lg bg-indigo-600 px-4 py-2 text-white">Sign up</Link>
      </div>
    </main>
  );
}