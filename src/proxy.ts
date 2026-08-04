import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  /**
   * Session refresh only matters for routes that render owner UI. `api/` (the
   * QStash webhook) and `d/` (requester downloads) are authenticated by
   * signature or by capability URL, so running Supabase auth there only added
   * a network round-trip per call.
   */
  matcher: [
    "/((?!api/|d/|_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
