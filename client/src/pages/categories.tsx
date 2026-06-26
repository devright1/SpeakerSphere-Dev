import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight } from "lucide-react";
import { SEOHead } from "@/components/seo-head";

interface Discipline {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  speakerCount: number;
}

export default function Categories() {
  const { data: disciplines = [], isLoading } = useQuery<Discipline[]>({
    queryKey: ["/api/disciplines"],
  });

  const sorted = disciplines
    .slice()
    .sort((a, b) => (b.speakerCount || 0) - (a.speakerCount || 0));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading disciplines...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Browse Dental Speakers by Discipline"
        description="Explore dental speakers organized by discipline. Find expert speakers in Periodontics, Prosthodontics, Oral Surgery, General Dentistry, and more for your events."
        keywords="dental speaker disciplines, periodontics speakers, oral surgery speakers, prosthodontics speakers, dental conference speakers"
        ogType="website"
      />
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-accent/10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Browse by Discipline
            </h1>
            <p className="text-xl text-muted-foreground">
              Find the right speaker for your event by exploring our {sorted.length} dental disciplines.
            </p>
          </div>
        </div>
      </section>

      {/* Disciplines Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map((discipline) => (
              <Card key={discipline.id} className="group hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {discipline.name}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary" className="text-xs">
                          {discipline.speakerCount || 0} {discipline.speakerCount === 1 ? "speaker" : "speakers"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {discipline.description && (
                    <CardDescription className="text-muted-foreground mb-4 line-clamp-3">
                      {discipline.description}
                    </CardDescription>
                  )}

                  <Link href={`/speakers?disciplineId=${discipline.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      disabled={!discipline.speakerCount}
                    >
                      View Speakers
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {sorted.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No disciplines found.</p>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Not sure which discipline to browse?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Search all speakers at once and use the discipline checkboxes to narrow your results.
          </p>
          <Link href="/speakers">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Browse All Speakers
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
