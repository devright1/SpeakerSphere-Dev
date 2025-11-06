import { Router } from "express";
import type { IStorage } from "../storage";

export function createSitemapRouter(storage: IStorage) {
  const router = Router();

  // Generate XML sitemap
  router.get("/sitemap.xml", async (req, res) => {
    try {
      const speakers = await storage.getSpeakers({ verified: true });
      const categories = await storage.getCategories();
      
      // Use protocol from request or default to https in production
      const protocol = req.protocol === 'https' || process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const baseUrl = `${protocol}://${req.get("host")}`;
      
      const currentDate = new Date().toISOString().split("T")[0];

      // Build sitemap XML
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- For Speakers Page -->
  <url>
    <loc>${baseUrl}/for-speakers</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Categories Page -->
  <url>
    <loc>${baseUrl}/categories</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Individual Category Pages -->
${categories.map((category: any) => `  <url>
    <loc>${baseUrl}/category/${encodeURIComponent(category.name)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join("\n")}
  
  <!-- Speaker Profile Pages -->
${speakers.map((speaker: any) => `  <url>
    <loc>${baseUrl}/speaker/${speaker.slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>${speaker.imageUrl ? `
    <image:image>
      <image:loc>${speaker.imageUrl.startsWith("http") ? speaker.imageUrl : baseUrl + speaker.imageUrl}</image:loc>
      <image:title>${speaker.name}</image:title>
      <image:caption>${speaker.title}</image:caption>
    </image:image>` : ""}
  </url>`).join("\n")}
</urlset>`;

      res.header("Content-Type", "application/xml");
      res.send(sitemap);
    } catch (error) {
      console.error("Sitemap generation error:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  // Generate robots.txt
  router.get("/robots.txt", (req, res) => {
    const baseUrl = `https://${req.get("host")}`;
    
    const robotsTxt = `# SpeakerSphere - Healthcare Speaker Platform
User-agent: *
Allow: /
Allow: /speaker/*
Allow: /category/*
Allow: /categories
Allow: /for-speakers

# Disallow admin and private pages
Disallow: /admin
Disallow: /admin/*
Disallow: /dashboard
Disallow: /dashboard/*
Disallow: /api/*

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay (be nice to servers)
Crawl-delay: 1
`;

    res.header("Content-Type", "text/plain");
    res.send(robotsTxt);
  });

  return router;
}
