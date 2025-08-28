import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import SpeakerCard from "./speaker-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { Speaker } from "@shared/schema";
import { useMemo } from "react";

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function FeaturedSpeakers() {
  const { data: speakers, isLoading, error } = useQuery<Speaker[]>({
    queryKey: ["/api/speakers/featured"],
    queryFn: async () => {
      const response = await fetch("/api/speakers/featured");
      if (!response.ok) throw new Error("Failed to fetch featured speakers");
      return response.json();
    },
  });

  // Shuffle and limit speakers to 24 each time the component mounts (increased from 16 for larger database)
  const shuffledSpeakers = useMemo(() => {
    if (!speakers || speakers.length === 0) return [];
    const shuffled = shuffleArray(speakers);
    return shuffled.slice(0, 24);
  }, [speakers]);

  return (
    <section className="section-spacing">
      <div className="container-spacing">
        <div className="text-center mb-16">
          <h2 className="font-bold text-gray-900 mb-6 text-balance">Featured Speakers</h2>
          <p className="text-xl md:text-2xl text-gray-600 text-balance max-w-4xl mx-auto leading-relaxed">Top-rated podium speakers trusted by event directors and reviewed by their peers</p>
        </div>

        {error && (
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load featured speakers. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="results-grid">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg card-spacing">
                <Skeleton className="w-full h-48 mb-6" />
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="results-grid">
            {shuffledSpeakers.map((speaker) => (
              <div key={`${speaker.id}-${Math.random()}`} className="hover-lift clean-transition">
                <SpeakerCard speaker={speaker} featured />
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-16 pt-8 border-t border-gray-200">
          <Link href="/speakers">
            <button className="bg-primary text-white px-10 py-4 rounded-lg hover:bg-blue-700 font-semibold text-lg clean-transition shadow-lg hover-lift">
              View All Speakers
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
