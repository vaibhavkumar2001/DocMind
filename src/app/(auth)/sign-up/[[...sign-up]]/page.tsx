import { SignUp } from "@clerk/nextjs";
import AuthShell from "@/components/auth/AuthShell";
import { clerkAppearance } from "@/lib/clerkAppearance";

export const metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <AuthShell title="Create your account" subtitle="Start chatting with your documents in minutes.">
      <SignUp appearance={clerkAppearance} />
    </AuthShell>
  );
}