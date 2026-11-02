// Shared Clerk styling so sign-in and sign-up always look the same.
// Colors come from our CSS variables, so they follow the light/dark theme automatically.
export const clerkAppearance = {
  variables: {
    colorPrimary: "var(--primary)",
    colorBackground: "transparent",
    colorText: "var(--foreground)",
    colorTextSecondary: "var(--muted-foreground)",
    colorInputBackground: "var(--muted)",
    colorInputText: "var(--foreground)",
    colorDanger: "var(--destructive)",
    colorSuccess: "var(--success)",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  },
  elements: {
    // Remove Clerk's own card so our glass container shows through
    rootBox: "w-full",
    cardBox: "w-full shadow-none! border-0! bg-transparent!",
    card: "shadow-none! border-0! bg-transparent! p-0!",
    header: "hidden",
    // Primary button with the neon gradient
    formButtonPrimary:
      "bg-gradient-neon! text-white! shadow-none! hover:opacity-90! transition normal-case! text-sm! font-semibold!",
    formFieldInput:
      "bg-muted! border! border-input! focus:border-primary! focus:ring-2! focus:ring-ring/30!",
    socialButtonsBlockButton:
      "bg-muted! border! border-input! hover:border-primary! transition",
    socialButtonsBlockButtonText: "text-foreground! font-medium!",
    dividerLine: "bg-border!",
    dividerText: "text-muted-foreground!",
    footerActionLink: "text-secondary! hover:text-primary! font-medium!",
    identityPreviewEditButton: "text-secondary!",
    formFieldLabel: "text-foreground! font-medium!",
    // Hide the Clerk branding strip at the bottom if your plan allows it
    footer: "bg-transparent!",
  },
};