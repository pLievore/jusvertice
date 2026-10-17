import type { MetadataRoute } from "next";
import { empresa } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: empresa.url, changeFrequency: "monthly", priority: 1 }];
}
