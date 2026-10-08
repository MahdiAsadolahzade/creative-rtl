import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteConfig.url, lastModified: new Date("2026-01-01"), changeFrequency: "monthly", priority: 1 },
    { url: `${siteConfig.url}/editor`, lastModified: new Date("2026-01-01"), changeFrequency: "monthly", priority: .9 },
  ];
}
