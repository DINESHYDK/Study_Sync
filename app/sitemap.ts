import { MetadataRoute } from "next";

import { STUDYSYNC_PUBLIC_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = STUDYSYNC_PUBLIC_URL;
  const routes = [
    "",
    "/login",
    "/signup",
    "/forgot-password",
    "/dashboard",
    "/friends",
    "/settings",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1.0 : 0.8,
  }));
}
