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
      description: "Browse our verified speakers by category, expertise, location, and ratings. Use our advanced filters to find the perfect match for your event."
    },
    {
      icon: UserCheck,
      title: "Review Profiles",
      description: "Explore detailed speaker profiles with professional backgrounds, speaking topics, video portfolios, and authentic peer reviews."
    },
    {
      icon: Calendar,
      title: "Request Booking",
      description: "Submit an inquiry directly through the platform with your event details. Speakers will respond with availability and pricing."
    },
    {
      icon: Star,
      title: "Leave Review",
      description: "After your event, share your experience to help other event planners make informed decisions."
    }
  ];

  const benefits = [
    "Access to 500+ verified healthcare speakers",
    "Authentic peer reviews from real events",
    "Direct communication with speakers",
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

          {/* Humor Section */}
          <div className="text-center mb-20">
            <div className="bg-blue-50 rounded-2xl p-8 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                🦷 The Fine Print (Don't Worry, It Won't Hurt!)
              </h3>
              <div className="space-y-4 text-lg text-gray-700">
                <p className="italic">
                  "Unlike root canals, finding the perfect speaker through SpeakerSphere is actually enjoyable!"
                </p>
                <p>
                  📢 <strong>Warning:</strong> Side effects may include improved event attendance, enhanced audience engagement, and uncontrollable applause. 
                </p>
                <p>
                  🎤 <strong>Professional Tip:</strong> Our speakers are like good dental hygiene - they make everything better and leave your audience with a lasting smile!
                </p>
                <p className="text-sm text-gray-600 mt-6">
                  *No dental procedures were performed in the making of this platform. All speakers have been thoroughly screened (unlike your teeth, which you should probably get checked).
                </p>
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="bg-gray-50 rounded-2xl card-spacing mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose SpeakerSphere?
              </h2>
              <p className="text-xl text-gray-600 text-balance max-w-3xl mx-auto">
                The trusted platform for healthcare speaking engagements
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