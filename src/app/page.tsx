import { LandingPage } from "@/components/marketing/landing-page";
import { hasSessionCookie } from "@/lib/auth";

export default async function Home() {
  // Only picks nav/CTA labels, so a cookie check beats a network round-trip to
  // Supabase on every landing-page hit. The dashboard still does real auth.
  const signedIn = await hasSessionCookie();

  return <LandingPage signedIn={signedIn} />;
}
