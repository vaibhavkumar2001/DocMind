import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import ThemeToggle from "../components/UI/ThemeToggle"
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

export const metadata: Metadata = {
  title: {
    default: "DocMind",
    template: "%s | DocMind",
  },
  description:
    "Chat with your documents. Upload PDFs, Word files and video transcripts, and get answers with clickable citations.",
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
        <body className="min-h-screen antialiased">
          {children}
          {/* Temporary floating toggle for testing. We will move it into the sidebar in Step 2 */}
          <div className="fixed bottom-4 right-4 z-50">
            <ThemeToggle />
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}