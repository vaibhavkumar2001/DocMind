import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css"


export const metadata: Metadata = {
    title: "DocMind",
    description: "AI Document Summarizer",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
// //Ab mujhe children ko wrap krna h
// <body>
//     <ClerkProvider>{children}</ClerkProvider>    
// </body>


// //Now We will add signIn and signUp Pages
