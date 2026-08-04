import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/utils";

/** Only the public marketing surface. Share pages are deliberately excluded. */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();

  return [
    { url: baseUrl, changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/auth/sign-in`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/auth/sign-up`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
