import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const publicRoutes = [
    "/",
    "/about",
    "/categories",
    "/category",
    "/contact",
    "/faq",
    "/login",
    "/register",
    "/search",
    "/terms",
    "/privacy",
    "/workers",
  ];

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "/" ? 1 : 0.8,
  }));
}
