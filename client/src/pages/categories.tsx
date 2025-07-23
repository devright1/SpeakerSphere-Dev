import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderOpen, Users, ArrowRight } from "lucide-react";

interface Category {
  id: number;
  name: string;
  description: string;
  speakerCount?: number;
}

interface Speaker {
  id: number;
  name: string;
  category: string;
}

export default function Categories() {
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: speakers = [] } = useQuery<Speaker[]>({
    queryKey: ["/api/speakers"],
  });

  // Calculate speaker count for each category
  const categoriesWithCount = categories.map(category => ({
    ...category,
    speakerCount: speakers.filter(speaker => speaker.category === category.name).length
  }));

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading categories...</p>
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
              Speaker Categories
            </h1>
            <p className="text-xl text-muted-foreground">
              Discover world-class speakers organized by expertise and specialty areas. 
              Find the perfect match for your event's needs.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoriesWithCount.map((category) => (
              <Card key={category.id} className="group hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <FolderOpen className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {category.name}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary" className="text-xs">
                          {category.speakerCount} {category.speakerCount === 1 ? 'speaker' : 'speakers'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <CardDescription className="text-muted-foreground mb-4 line-clamp-3">
                    {category.description}
                  </CardDescription>
                  
                  <div className="flex justify-between items-center">
                    <Link href={`/speakers?category=${encodeURIComponent(category.name)}`}>
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

          {categoriesWithCount.length === 0 && (
            <div className="text-center py-16">
              <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Categories Found</h3>
              <p className="text-muted-foreground">
                Categories are currently being updated. Please check back soon.
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