import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import SpeakerCard from "./speaker-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Crown, Star } from "lucide-react";
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
  const { data: premierSpeakers, isLoading: premierLoading, error: premierError } = useQuery<Speaker[]>({
    queryKey: ["/api/speakers/tier/premier"],
    queryFn: async () => {
      const response = await fetch("/api/speakers/tier/premier");
      if (!response.ok) throw new Error("Failed to fetch premier speakers");
      return response.json();
    },
  });

  const { data: proSpeakers, isLoading: proLoading, error: proError } = useQuery<Speaker[]>({
    queryKey: ["/api/speakers/tier/pro"],
    queryFn: async () => {
      const response = await fetch("/api/speakers/tier/pro");
      if (!response.ok) throw new Error("Failed to fetch pro speakers");
      return response.json();
    },
  });

  // Shuffle and limit premier speakers to 12 (top spots)
  const shuffledPremierSpeakers = useMemo(() => {
    if (!premierSpeakers || premierSpeakers.length === 0) return [];
    const shuffled = shuffleArray(premierSpeakers);
    return shuffled.slice(0, 12);
  }, [premierSpeakers]);

  // Shuffle and limit pro speakers to 12 (bottom spots)
  const shuffledProSpeakers = useMemo(() => {
    if (!proSpeakers || proSpeakers.length === 0) return [];
    const shuffled = shuffleArray(proSpeakers);
    return shuffled.slice(0, 12);
  }, [proSpeakers]);

  const isLoading = premierLoading || proLoading;
  const error = premierError || proError;
  const hasSpeakers = shuffledPremierSpeakers.length > 0 || shuffledProSpeakers.length > 0;

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
          <>
            {/* Premier Speakers Section */}
            {shuffledPremierSpeakers.length > 0 && (
              <div className="mb-16">
                <div className="flex items-center justify-center gap-3 mb-8">
                  <Crown className="w-6 h-6 text-amber-600" />
                  <h3 className="text-2xl font-semibold text-gray-900">Premier Speakers</h3>
                </div>
                <div className="results-grid">
                  {shuffledPremierSpeakers.map((speaker) => (
                    <div key={`premier-${speaker.id}-${Math.random()}`} className="hover-lift clean-transition">
                      <SpeakerCard speaker={speaker} featured discoverySource="featured" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pro Speakers Section */}
            {shuffledProSpeakers.length > 0 && (
              <div>
                <div className="flex items-center justify-center gap-3 mb-8">
                  <Star className="w-6 h-6 text-blue-600" />
                  <h3 className="text-2xl font-semibold text-gray-900">Featured Speakers</h3>
                </div>
                <div className="results-grid">
                  {shuffledProSpeakers.map((speaker) => (
                    <div key={`pro-${speaker.id}-${Math.random()}`} className="hover-lift clean-transition">
                      <SpeakerCard speaker={speaker} featured discoverySource="featured" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!hasSpeakers && (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No featured speakers available at the moment.</p>
              </div>
            )}
          </>
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
