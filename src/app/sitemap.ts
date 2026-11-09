import type { MetadataRoute } from "next";
import { empresa } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: empresa.url, changeFrequency: "monthly", priority: 1 },
    { url: `${empresa.url}/georreferenciamento`, changeFrequency: "monthly", priority: 0.9 },
  ];
}
