import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import SpeakerCard from "./speaker-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { Speaker } from "@shared/schema";

export default function FeaturedSpeakers() {
  const { data: speakers, isLoading, error } = useQuery<Speaker[]>({
    queryKey: ["/api/speakers/featured"],
    queryFn: async () => {
      const response = await fetch("/api/speakers/featured");
      if (!response.ok) throw new Error("Failed to fetch featured speakers");
      return response.json();
    },
  });

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Featured Speakers</h2>
          <p className="text-xl text-gray-600">Top-rated executive speakers trusted by Fortune 500 companies</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg p-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-8">
            {speakers?.map((speaker) => (
              <div key={speaker.id} className="transform transition-transform hover:scale-105">
                <SpeakerCard speaker={speaker} featured />
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link href="/speakers">
            <button className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold text-lg transition-colors">
              View All Speakers
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
