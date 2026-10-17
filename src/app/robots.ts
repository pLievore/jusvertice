import type { MetadataRoute } from "next";
import { empresa } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${empresa.url}/sitemap.xml`,
  };
}
