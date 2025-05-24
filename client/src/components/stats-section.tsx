export default function StatsSection() {
  const stats = [
    { value: "2,500+", label: "Verified Speakers" },
    { value: "15,000+", label: "Successful Events" },
    { value: "500+", label: "Fortune 500 Clients" },
    { value: "98%", label: "Satisfaction Rate" },
  ];

  const clients = ["Microsoft", "Google", "Amazon", "IBM", "Apple"];

  return (
    <section className="py-16 bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Industry Leaders</h2>
          <p className="text-xl opacity-90">Join thousands of event planners who rely on our platform</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mb-16">
          {stats.map((stat, index) => (
            <div key={index}>
              <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
              <div className="text-lg opacity-90">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Client Logos */}
        <div>
          <p className="text-center text-lg mb-8 opacity-90">Trusted by leading organizations worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-70">
            {clients.map((client, index) => (
              <div key={index} className="text-xl md:text-2xl font-bold">
                {client}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
