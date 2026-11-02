import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const description =
  "Chat with your documents. Upload PDFs, Word files and video transcripts, and get answers with clickable citations.";

export const metadata: Metadata = {
  // Needed so the share-card image URL becomes an absolute URL
  metadataBase: new URL(siteUrl),
  title: {
    default: "DocMind | Chat with your documents",
    template: "%s | DocMind",
  },
  description,
  openGraph: {
    title: "DocMind | Chat with your documents",
    description,
    siteName: "DocMind",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DocMind | Chat with your documents",
    description,
  },
};

// Runs before the first paint: dark is the default, light only if the user saved it
const themeScript = `
(function () {
  try {
    var saved = localStorage.getItem("theme");
    if (saved !== "light") {
      document.documentElement.classList.add("dark");
    }
  } catch (e) {
    document.documentElement.classList.add("dark");
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${inter.variable} ${spaceGrotesk.variable}`}
        suppressHydrationWarning
      >
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        </head>
        <body className="min-h-screen antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}