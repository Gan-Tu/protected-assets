import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/utils";

/**
 * Share pages leak asset names and descriptions if they are indexed, and the
 * dashboard/download routes have no business in a search index either.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/auth/sign-in", "/auth/sign-up"],
        disallow: ["/a/", "/d/", "/dashboard", "/api/"],
      },
    ],
    sitemap: `${getBaseUrl()}/sitemap.xml`,
  };
}
