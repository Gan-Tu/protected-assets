import type { Metadata } from "next";

import { signUpAction } from "@/app/auth/actions";
import { AuthForm } from "@/components/forms/auth-form";
import { AuthShell } from "@/components/marketing/auth-shell";

export const metadata: Metadata = {
  title: "Create account | Protected Assets",
};

export default function SignUpPage() {
  return (
    <AuthShell
      headline="Launch a private release workflow in minutes."
      tagline="Set up your first protected asset and start gating access requests right away. Add a phone number whenever you like."
    >
      <AuthForm
        title="Create your account"
        description="All you need is an email and password. Phone number and notification settings can be added later in settings."
        action={signUpAction}
        mode="sign-up"
      />
    </AuthShell>
  );
}
