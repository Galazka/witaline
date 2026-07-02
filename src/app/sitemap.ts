import type { MetadataRoute } from "next";
import { blogPosts } from "@/lib/blog";
import { parsePolishDate } from "@/lib/date-utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://witaline.pl";

  const staticRoutes = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${baseUrl}/regulamin`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${baseUrl}/polityka-prywatnosci`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.2 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.2 },
    { url: `${baseUrl}/oferta-indywidualna`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },

  ];

  const blogRoutes = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: parsePolishDate(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes];
}
