import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderOpen, Users, ArrowRight, Search, Filter } from "lucide-react";

interface SpeakingTopic {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  speakerCount: number;
  category: string | null;
  isActive: boolean;
  createdAt: Date;
}

export default function Categories() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("speakerCount");
  
  const { data: topics = [], isLoading: topicsLoading } = useQuery<SpeakingTopic[]>({
    queryKey: ["/api/topics"],
  });

  // Filter and sort topics
  const filteredAndSortedTopics = topics
    .filter(topic => 
      topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (topic.description && topic.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "speakerCount":
          return b.speakerCount - a.speakerCount;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  if (topicsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading topics...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-accent/10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Speaker Topics
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Discover world-class speakers organized by their specific speaking topics and areas of expertise. 
              Find the perfect match for your event's needs.
            </p>
            
            {/* Search and Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="speakerCount">Most Speakers</SelectItem>
                  <SelectItem value="name">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Topics Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {/* Results Summary */}
          <div className="mb-6">
            <p className="text-muted-foreground">
              Showing {filteredAndSortedTopics.length} of {topics.length} topics
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedTopics.map((topic) => (
              <Card key={topic.id} className="group hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <FolderOpen className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {topic.name}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary" className="text-xs">
                          {topic.speakerCount} {topic.speakerCount === 1 ? 'speaker' : 'speakers'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <CardDescription className="text-muted-foreground mb-4 line-clamp-3">
                    {topic.description || `Speakers who specialize in ${topic.name}`}
                  </CardDescription>
                  
                  <div className="flex justify-between items-center">
                    <Link href={`/speakers?topic=${encodeURIComponent(topic.name)}`}>
                      <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        View Speakers
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAndSortedTopics.length === 0 && (
            <div className="text-center py-16">
              <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchTerm ? "No Topics Found" : "No Topics Available"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? `No topics match "${searchTerm}". Try a different search term.`
                  : "Topics are currently being updated. Please check back soon."
                }
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Our speaker network is constantly growing. Let us help you find the perfect speaker 
            for your specific event requirements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/speakers">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Browse All Speakers
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg">
                Contact Our Team
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}