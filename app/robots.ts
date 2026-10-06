import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://flowfoundry.io";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/audit", "/thank-you"],
        disallow: ["/dashboard", "/dashboard/*", "/api/*", "/login"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
