import { AmbientOrbits } from "@/components/app/ambient-orbits";
import { LogoMark } from "@/components/app/logo-mark";
import { AuthForm } from "@/components/forms/auth-form";
import { signInAction } from "@/app/auth/actions";

export default function SignInPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#dff4ff,transparent_30%),linear-gradient(180deg,#f7fbff_0%,#eef2f8_45%,#f7f8fb_100%)] px-6 py-8 sm:px-8">
      <AmbientOrbits />
      <div className="relative mx-auto max-w-6xl">
        <LogoMark />
        <div className="grid min-h-[calc(100vh-6rem)] items-center gap-10 lg:grid-cols-[0.9fr_0.7fr]">
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">
              Protected owner workspace
            </p>
            <h1 className="mt-5 text-5xl font-semibold tracking-tight text-slate-950">
              Approve or auto-release without losing the paper trail.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Sign in to manage protected links, file bundles, and incoming requests from one clean dashboard.
            </p>
          </div>
          <AuthForm
            title="Welcome back"
            description="Use email + password or connect with Google/GitHub to get back to your approval queue."
            action={signInAction}
            mode="sign-in"
          />
        </div>
      </div>
    </main>
  );
}
