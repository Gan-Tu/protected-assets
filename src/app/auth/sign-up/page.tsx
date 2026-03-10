import { AmbientOrbits } from "@/components/app/ambient-orbits";
import { LogoMark } from "@/components/app/logo-mark";
import { AuthForm } from "@/components/forms/auth-form";
import { signUpAction } from "@/app/auth/actions";

export default function SignUpPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#dff4ff,transparent_30%),linear-gradient(180deg,#f7fbff_0%,#eef2f8_45%,#f7f8fb_100%)] px-6 py-8 sm:px-8">
      <AmbientOrbits />
      <div className="relative mx-auto max-w-6xl">
        <LogoMark />
        <div className="grid min-h-[calc(100vh-6rem)] items-center gap-10 lg:grid-cols-[0.9fr_0.7fr]">
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">
              Create an owner account
            </p>
            <h1 className="mt-5 text-5xl font-semibold tracking-tight text-slate-950">
              Launch a private release workflow in minutes.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Set up your first protected asset, add a phone number later, and start gating access requests immediately.
            </p>
          </div>
          <AuthForm
            title="Create your workspace"
            description="Create your account with email and password. Phone number and notification settings can be added in account settings after signup."
            action={signUpAction}
            mode="sign-up"
          />
        </div>
      </div>
    </main>
  );
}
