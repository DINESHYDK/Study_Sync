import { MetadataRoute } from "next";

import { STUDYSYNC_PUBLIC_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/callback", "/dashboard", "/friends", "/settings"],
    },
    sitemap: `${STUDYSYNC_PUBLIC_URL}/sitemap.xml`,
  };
}
