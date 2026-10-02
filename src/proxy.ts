import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Ye pages sirf logged-in users ke liye
const isProtectedRoute = createRouteMatcher(["/documents(.*)", "/chat(.*)"]);
//iss createRouteMatcher ke ander jobhi h mention h jaise document aur chat yeh sb protected h 

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Next.js ki internal files aur static files skip karo
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // API routes pe hamesha chalao
    "/(api|trpc)(.*)",
  ],
};