export default function StatsSection() {
  const stats = [
    { value: "2,500+", label: "Verified Speakers" },
    { value: "15,000+", label: "Successful Events" },
    { value: "500+", label: "Fortune 500 Clients" },
    { value: "98%", label: "Satisfaction Rate" },
  ];

  const clients = ["Microsoft", "Google", "Amazon", "IBM", "Apple"];

  return (
    <section className="section-spacing bg-primary text-white">
      <div className="container-spacing">
        <div className="text-center mb-16">
          <h2 className="font-bold mb-6 text-balance">Trusted by Industry Leaders</h2>
          <p className="text-xl md:text-2xl opacity-90 text-balance max-w-4xl mx-auto">Join thousands of event planners who rely on our platform</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="space-y-4">
              <div className="text-5xl md:text-6xl lg:text-7xl font-bold">{stat.value}</div>
              <div className="text-lg md:text-xl opacity-90">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Client Logos */}
        <div className="pt-8 border-t border-white/20">
          <p className="text-center text-lg md:text-xl mb-12 opacity-90">Trusted by leading organizations worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70">
            {clients.map((client, index) => (
              <div key={index} className="text-xl md:text-2xl lg:text-3xl font-bold clean-transition hover:opacity-100">
                {client}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
