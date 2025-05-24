import Header from "@/components/header";
import Footer from "@/components/footer";
import HeroSection from "@/components/hero-section";
import FeaturedSpeakers from "@/components/featured-speakers";
import StatsSection from "@/components/stats-section";
import TestimonialsSection from "@/components/testimonials-section";
import CTASection from "@/components/cta-section";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral">
      <Header />
      <HeroSection />
      <FeaturedSpeakers />
      <StatsSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
