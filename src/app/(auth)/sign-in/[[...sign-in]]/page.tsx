import { SignIn } from "@clerk/nextjs";
import AuthShell from "@/components/auth/AuthShell";
import { clerkAppearance } from "@/lib/clerkAppearance";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue to your workspaces.">
      <SignIn appearance={clerkAppearance} />
    </AuthShell>
  );
}