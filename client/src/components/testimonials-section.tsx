import { Star } from "lucide-react";

export default function TestimonialsSection() {
  const testimonials = [
    {
      id: 1,
      quote: "SpeakerSphere made finding the perfect keynote speaker effortless. The verification system gave us confidence, and the speaker exceeded all expectations.",
      author: "Jennifer Walsh",
      title: "Event Director",
      company: "TechCorp",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60",
    },
    {
      id: 2,
      quote: "The platform's review system and detailed speaker profiles helped us make an informed decision. Our annual conference was the most successful yet.",
      author: "Michael Chen",
      title: "Conference Manager",
      company: "HealthSync",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60",
    },
    {
      id: 3,
      quote: "From search to booking, everything was seamless. The speaker we found through the platform delivered exactly what we needed for our leadership summit.",
      author: "Sarah Johnson",
      title: "VP Events",
      company: "GlobalTech",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60",
    },
  ];

  return (
    <section className="section-spacing">
      <div className="container-spacing">
        <div className="text-center mb-16">
          <h2 className="font-bold text-gray-900 mb-6 text-balance">What Our Clients Say</h2>
          <p className="text-xl md:text-2xl text-gray-600 text-balance max-w-4xl mx-auto leading-relaxed">Real experiences from event planners and organizations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-gray-50 rounded-2xl card-spacing hover-lift clean-transition">
              <div className="flex text-yellow-400 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-current" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-8 italic text-lg leading-relaxed">
                "{testimonial.quote}"
              </blockquote>
              <div className="flex items-center">
                <img 
                  src={testimonial.avatar} 
                  alt={testimonial.author}
                  className="w-14 h-14 rounded-full object-cover mr-4"
                />
                <div>
                  <div className="font-semibold text-gray-900 text-lg">{testimonial.author}</div>
                  <div className="text-gray-600">{testimonial.title}, {testimonial.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
