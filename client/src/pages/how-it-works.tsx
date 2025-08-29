import { CheckCircle, Search, UserCheck, Calendar, Star } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: "Search & Filter",
      description: "Browse our verified speakers by category, expertise, location, and ratings. Use our advanced filters to find the perfect match for your event - no need to brush past the best options!"
    },
    {
      icon: UserCheck,
      title: "Review Profiles",
      description: "Explore detailed speaker profiles with professional backgrounds, speaking topics, speaker resources, and authentic peer reviews, so you can pick the perfect speaker without any cavities in your planning."
    },
    {
      icon: Calendar,
      title: "Request Booking",
      description: "Submit an inquiry directly through the platform with your event details. Our team will get back to you with speaker availability and pricing, faster than you can say 'open wide.'"
    },
    {
      icon: Star,
      title: "Leave Review",
      description: "After your event, leave a review on your speaker's profile. Your insights build trust and help others in the community find their perfect match. Like flossing, it's quick but makes a big difference."
    }
  ];

  const benefits = [
    "Access to 500+ verified healthcare speakers",
    "Authentic peer reviews from real events",
    "Comprehensive speaker profiles and resources",
    "Secure inquiry and booking process",
    "Video portfolios and speaking samples",
    "Advanced search and filtering tools"
  ];

  return (
    <div className="min-h-screen bg-neutral">
      <Header />
      <div className="section-spacing">
        <div className="container-spacing">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <h1 className="font-bold text-gray-900 mb-6 text-balance">
              How SpeakerSphere Works
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 text-balance max-w-4xl mx-auto leading-relaxed">
              Find, evaluate, and book healthcare speakers in four simple steps
            </p>
          </div>

          {/* Steps Section */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <step.icon className="w-10 h-10 text-primary" />
                </div>
                <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>

          {/* Benefits Section */}
          <div className="bg-gray-50 rounded-2xl card-spacing mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose SpeakerSphere?
              </h2>
              <p className="text-xl text-gray-600 text-balance max-w-3xl mx-auto">
                The only trusted platform for healthcare speaking engagements
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-primary text-white rounded-2xl card-spacing">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Find Your Perfect Speaker?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of event planners who trust SpeakerSphere for their speaking needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/speakers">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
                  Browse Speakers
                </Button>
              </Link>
              <Link href="/auth">
                <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-primary">
                  Sign Up Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}