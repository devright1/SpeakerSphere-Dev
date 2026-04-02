import Header from "@/components/header";
import Footer from "@/components/footer";
import HeroSection from "@/components/hero-section";
import FeaturedSpeakers from "@/components/featured-speakers";

import TestimonialsSection from "@/components/testimonials-section";
import CTASection from "@/components/cta-section";
import { SEOHead, generateOrganizationStructuredData } from "@/components/seo-head";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral">
      <SEOHead
        title="Find Top Healthcare Speakers for Medical Events & Conferences"
        description="Connect with expert healthcare speakers, medical professionals, and thought leaders for your conferences, events, and educational programs. Browse verified speaker profiles, reviews, and videos."
        keywords="healthcare speakers, medical speakers, conference speakers, healthcare events, medical conferences, CME speakers, dental speakers, physician speakers"
        ogType="website"
        structuredData={generateOrganizationStructuredData()}
      />
      <Header />
      <HeroSection />
      <div className="bg-white">
        <FeaturedSpeakers />
      </div>

      <div className="bg-white">
        <TestimonialsSection />
      </div>
      <CTASection />
      <Footer />
    </div>
  );
}
