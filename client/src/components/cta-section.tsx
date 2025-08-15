import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-secondary to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Match Your Events with Speakers?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of event planners who trust SpeakerSphere to deliver exceptional speaking experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/speakers">
                <Button size="lg" className="bg-accent hover:bg-orange-600 text-white px-8 py-4 text-lg">
                  Find Speakers Now
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white text-white hover:bg-white hover:text-secondary px-8 py-4 text-lg"
              >
                Schedule Demo
              </Button>
            </div>
          </div>
          <div className="text-center">
            <img 
              src="https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400" 
              alt="Corporate networking event" 
              className="rounded-2xl shadow-2xl w-full max-w-md mx-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
