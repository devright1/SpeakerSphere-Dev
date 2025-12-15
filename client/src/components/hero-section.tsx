import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export default function HeroSection() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    const trimmedSearch = searchTerm.trim();
    if (trimmedSearch) params.append("search", trimmedSearch);
    if (category && category !== "all") params.append("category", category);
    
    setLocation(`/speakers?${params.toString()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section className="bg-devright-blue text-white section-spacing" style={{backgroundColor: '#1E4347'}}>
      <div className="container-spacing">
        <div className="text-center">
          <h1 className="font-bold mb-8 text-balance max-w-5xl mx-auto">
            Find & Review Healthcare Speakers
          </h1>
          <p className="text-xl md:text-2xl mb-12 opacity-90 text-balance max-w-4xl mx-auto leading-relaxed">Discover top-rated dental professionals and healthcare experts through authentic peer reviews</p>
          
          {/* Search Bar */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl card-spacing shadow-2xl">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 md:flex-[2]">
                <Input 
                  type="text" 
                  placeholder="Search speakers, topics, or expertise..." 
                  className="w-full px-6 py-4 border-gray-300 text-gray-900 h-14 text-lg focus-ring"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <div className="flex-1 min-w-0">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full h-14 text-gray-900 text-lg focus-ring">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Digital Dentistry">Digital Dentistry</SelectItem>
                    <SelectItem value="Prosthodontics">Prosthodontics</SelectItem>
                    <SelectItem value="Esthetic Dentistry">Esthetic Dentistry</SelectItem>
                    <SelectItem value="Orthodontics">Orthodontics</SelectItem>
                    <SelectItem value="Implant Dentistry">Implant Dentistry</SelectItem>
                    <SelectItem value="Surgical Pathways">Surgical Pathways</SelectItem>
                    <SelectItem value="TMJ">TMJ</SelectItem>
                    <SelectItem value="Periodontics">Periodontics</SelectItem>
                    <SelectItem value="Oral Surgery">Oral Surgery</SelectItem>
                    <SelectItem value="Maxillofacial Surgery">Maxillofacial Surgery</SelectItem>
                    <SelectItem value="Dental Leadership">Dental Leadership</SelectItem>
                    <SelectItem value="Team Development">Team Development</SelectItem>
                    <SelectItem value="Business Management">Business Management</SelectItem>
                    <SelectItem value="AI in Dentistry">AI in Dentistry</SelectItem>
                    <SelectItem value="Social Media">Social Media</SelectItem>
                    <SelectItem value="Marketing Strategies">Marketing Strategies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Button 
                  className="w-full bg-accent hover:bg-orange-600 text-white h-14 text-lg font-semibold clean-transition"
                  onClick={handleSearch}
                >
                  <Search className="w-6 h-6 mr-3" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
