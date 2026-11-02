// Shared Clerk styling so sign-in and sign-up always look the same.
// Every text element gets an explicit color class, so Clerk never guesses
// "dark background, so white text" while the app is in light mode.
export const clerkAppearance = {
  variables: {
    colorPrimary: "var(--primary)",
    colorBackground: "var(--card)",
    colorForeground: "var(--foreground)",
    colorMutedForeground: "var(--muted-foreground)",
    colorText: "var(--foreground)",
    colorTextSecondary: "var(--muted-foreground)",
    colorNeutral: "var(--foreground)",
    colorInput: "var(--muted)",
    colorInputForeground: "var(--foreground)",
    colorInputBackground: "var(--muted)",
    colorInputText: "var(--foreground)",
    colorDanger: "var(--destructive)",
    colorSuccess: "var(--success)",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  },
  elements: {
    // Remove Clerk's own card so our glass container shows through
    rootBox: "w-full text-foreground!",
    cardBox: "w-full max-w-full! shadow-none! border-0! bg-transparent! overflow-visible!",
    card: "w-full max-w-full! shadow-none! border-0! bg-transparent! p-0! text-foreground! overflow-visible!",

    // Hide Clerk's own heading, because AuthShell already shows a title and subtitle
    header: "hidden!",
    headerTitle: "hidden!",
    headerSubtitle: "hidden!",

    // Primary button with the neon gradient
    formButtonPrimary:
      "bg-gradient-neon! text-white! shadow-none! hover:opacity-90! transition normal-case! text-sm! font-semibold!",

    // Form fields
    formFieldLabel: "text-foreground! font-medium!",
    formFieldInput:
      "bg-muted! text-foreground! placeholder:text-muted-foreground! border! border-input! focus:border-primary! focus:ring-2! focus:ring-ring/30!",
    formFieldHintText: "text-muted-foreground!",
    formFieldInputShowPasswordButton: "text-muted-foreground! hover:text-foreground!",
    formFieldAction: "text-secondary! hover:text-primary!",
    formFieldSuccessText: "text-success!",
    formFieldErrorText: "text-destructive!",
    otpCodeFieldInput: "bg-muted! text-foreground! border! border-input!",

    // Social buttons (Google, GitHub, ...)
    socialButtonsBlockButton: "bg-muted! border! border-input! hover:border-primary! transition",
    socialButtonsBlockButtonText: "text-foreground! font-medium!",
    socialButtonsProviderIcon: "opacity-90",

    // Divider ("or")
    dividerLine: "bg-border!",
    dividerText: "text-muted-foreground!",

    // Footer area: remove both the background color AND the background image
    footer: "bg-transparent! bg-none! shadow-none! border-0!",
    footerAction: "bg-transparent! bg-none!",
    footerPages: "bg-transparent! bg-none!",
    footerActionText: "text-muted-foreground!",
    footerActionLink: "text-secondary! hover:text-primary! font-medium!",
    footerPagesLink: "text-muted-foreground! hover:text-foreground!",
    formResendCodeLink: "text-secondary! hover:text-primary!",
    backLink: "text-secondary! hover:text-primary!",

    // Multi-step screens (verify email, choose account, ...)
    identityPreviewText: "text-foreground!",
    identityPreviewEditButton: "text-secondary!",
    identityPreviewEditButtonIcon: "text-secondary!",
    formHeaderTitle: "text-foreground!",
    formHeaderSubtitle: "text-muted-foreground!",
    alertText: "text-foreground!",
  },
  
};

// Styling for the profile button and its popup menu (used in the dashboard header)
export const userButtonAppearance = {
  variables: clerkAppearance.variables,
  elements: {
    avatarBox: "h-9 w-9 ring-2 ring-primary/40",
    userButtonPopoverCard: "bg-card! border! border-border! text-foreground! shadow-xl!",
    userButtonPopoverActionButton: "hover:bg-muted!",
    userButtonPopoverActionButtonText: "text-foreground!",
    userButtonPopoverActionButtonIcon: "text-muted-foreground!",
    userPreviewMainIdentifier: "text-foreground!",
    userPreviewSecondaryIdentifier: "text-muted-foreground!",
    userButtonPopoverFooter: "bg-transparent! bg-none!",
  },
};