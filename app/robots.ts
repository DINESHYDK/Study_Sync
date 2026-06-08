import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/callback", "/dashboard", "/friends", "/settings"],
    },
    sitemap: "https://study-sync-ydk.vercel.app/sitemap.xml",
  };
}
