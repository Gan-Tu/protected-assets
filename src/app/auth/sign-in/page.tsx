import type { Metadata } from "next";

import { signInAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/forms/auth-form";
import { AuthShell } from "@/components/marketing/auth-shell";

export const metadata: Metadata = {
  title: "Sign in | Protected Assets",
};

export default function SignInPage() {
  return (
    <AuthShell
      headline={
        <>
          Approve or <span className="whitespace-nowrap">auto-release</span> without
          losing the paper trail.
        </>
      }
      tagline="Manage protected links, file bundles and incoming requests from one clean dashboard."
    >
      <AuthForm
        title="Welcome back"
        description="Sign in with your email and password to get back to your approval queue."
        action={signInAction}
        mode="sign-in"
      />
    </AuthShell>
  );
}
