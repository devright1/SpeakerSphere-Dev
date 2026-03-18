import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: "website" | "profile" | "article";
  canonicalUrl?: string;
  structuredData?: object;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

export function SEOHead({
  title,
  description,
  keywords,
  ogImage,
  ogType = "website",
  canonicalUrl,
  structuredData,
  author,
  publishedTime,
  modifiedTime,
}: SEOProps) {
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const fullTitle = `${title} | SpeakerSphere`;
  const defaultImage = `${siteUrl}/og-default.jpg`;
  const imageUrl = ogImage ? (ogImage.startsWith("http") ? ogImage : `${siteUrl}${ogImage}`) : defaultImage;
  const canonical = canonicalUrl || currentUrl;

  useEffect(() => {
    // Track all elements created by this component for cleanup
    const createdElements: Element[] = [];

    // Update document title
    document.title = fullTitle;

    // Update or create meta tags
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const attribute = isProperty ? "property" : "name";
      let element = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, property);
        element.setAttribute("data-seo-managed", "true");
        document.head.appendChild(element);
        createdElements.push(element);
      }
      
      element.setAttribute("content", content);
    };

    // Remove optional meta tags from previous pages
    const removeMetaTag = (property: string, isProperty = false) => {
      const attribute = isProperty ? "property" : "name";
      const element = document.querySelector(`meta[${attribute}="${property}"][data-seo-managed="true"]`);
      if (element) {
        element.remove();
      }
    };

    // Basic meta tags
    updateMetaTag("description", description);
    
    // Optional meta tags - remove if not present
    if (keywords) {
      updateMetaTag("keywords", keywords);
    } else {
      removeMetaTag("keywords");
    }
    
    if (author) {
      updateMetaTag("author", author);
    } else {
      removeMetaTag("author");
    }

    // Open Graph tags
    updateMetaTag("og:title", fullTitle, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:image", imageUrl, true);
    updateMetaTag("og:url", canonical, true);
    updateMetaTag("og:type", ogType, true);
    updateMetaTag("og:site_name", "SpeakerSphere", true);

    // Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", fullTitle);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", imageUrl);

    // Article-specific tags - remove if not present
    if (publishedTime) {
      updateMetaTag("article:published_time", publishedTime, true);
    } else {
      removeMetaTag("article:published_time", true);
    }
    
    if (modifiedTime) {
      updateMetaTag("article:modified_time", modifiedTime, true);
    } else {
      removeMetaTag("article:modified_time", true);
    }
    
    if (author && ogType === "article") {
      updateMetaTag("article:author", author, true);
    } else {
      removeMetaTag("article:author", true);
    }

    // Canonical URL
    let linkElement = document.querySelector('link[rel="canonical"][data-seo-managed="true"]');
    if (!linkElement) {
      linkElement = document.createElement("link");
      linkElement.setAttribute("rel", "canonical");
      linkElement.setAttribute("data-seo-managed", "true");
      document.head.appendChild(linkElement);
      createdElements.push(linkElement);
    }
    linkElement.setAttribute("href", canonical);

    // Structured data (JSON-LD) - use unique ID to avoid collisions
    const jsonLdId = "seo-json-ld";
    let scriptElement = document.getElementById(jsonLdId) as HTMLScriptElement;
    
    if (structuredData) {
      if (!scriptElement) {
        scriptElement = document.createElement("script");
        scriptElement.setAttribute("type", "application/ld+json");
        scriptElement.setAttribute("id", jsonLdId);
        scriptElement.setAttribute("data-seo-managed", "true");
        document.head.appendChild(scriptElement);
        createdElements.push(scriptElement);
      }
      scriptElement.textContent = JSON.stringify(structuredData);
    } else {
      // Remove JSON-LD if no structured data provided
      if (scriptElement) {
        scriptElement.remove();
      }
    }

    // Cleanup function to remove managed elements when component unmounts
    return () => {
      createdElements.forEach(el => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
    };
  }, [fullTitle, description, keywords, imageUrl, canonical, ogType, structuredData, author, publishedTime, modifiedTime]);

  return null;
}

// Helper function to generate speaker structured data
export function generateSpeakerStructuredData(speaker: {
  name: string;
  title: string;
  bio: string;
  imageUrl: string;
  location: string;
  email: string;
  phone?: string;
  website?: string;
  expertise: string[];
  overallRating?: string;
  reviewCount?: number;
}) {
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: speaker.name,
    jobTitle: speaker.title,
    description: speaker.bio,
    image: speaker.imageUrl.startsWith("http") ? speaker.imageUrl : `${siteUrl}${speaker.imageUrl}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: speaker.location,
    },
    ...(speaker.email ? { email: speaker.email } : {}),
    telephone: speaker.phone,
    url: speaker.website,
    knowsAbout: speaker.expertise,
    ...(speaker.overallRating && speaker.reviewCount ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: speaker.overallRating,
        reviewCount: speaker.reviewCount,
      },
    } : {}),
  };
}

// Helper function to generate organization structured data
export function generateOrganizationStructuredData() {
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SpeakerSphere",
    description: "Find and connect with top healthcare speakers for your medical events, conferences, and educational programs",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: [
      // Add social media profiles here
    ],
  };
}

// Helper function to generate breadcrumb structured data
export function generateBreadcrumbStructuredData(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
