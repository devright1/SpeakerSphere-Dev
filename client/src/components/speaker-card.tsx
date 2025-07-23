import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, CheckCircle, Heart } from "lucide-react";
import type { Speaker } from "@shared/schema";
import { trackSpeakerView, trackEmailClick, trackPhoneClick, trackWebsiteClick } from "@/lib/analytics";

interface SpeakerCardProps {
  speaker: Speaker;
  featured?: boolean;
}

export default function SpeakerCard({ speaker, featured = false }: SpeakerCardProps) {

  return (
    <Card className={`overflow-hidden hover:shadow-xl transition-all duration-300 ${featured ? "shadow-lg h-[700px] flex flex-col" : "shadow-md"}`}>
      <div className="relative overflow-hidden flex-shrink-0">
        <img 
          src={speaker.imageUrl} 
          alt={speaker.name}
          className={`w-full h-48 ${
            // All speakers use object-contain to show complete faces
            speaker.name === "Dr. Larry Brecht" 
              ? "object-contain object-center bg-white" 
              : speaker.name === "Marisa Notturno"
              ? "object-contain object-center bg-gray-100"
              : speaker.name === "Dr. Sascha Jovanovic"
              ? "object-contain object-center bg-gray-100"
              : speaker.name === "Dr. Robert Levine"
              ? "object-contain object-center bg-gray-100"
              : "object-contain object-center bg-gray-100"
          }`}
        />

        <button className="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white transition-colors">
          <Heart className="w-4 h-4 text-gray-600 hover:text-red-500" />
        </button>
      </div>
      
      <CardContent className={`p-6 ${featured ? "flex flex-col flex-1" : ""}`}>
        {/* Badges moved below image */}
        <div className="flex gap-2 mb-3">
          {speaker.verified && (
            <Badge variant="default" className="bg-success text-white">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
          {speaker.featured && (
            <Badge variant="default" className="bg-accent text-white">
              Featured
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mb-3">
          {!speaker.hideRatings && (
            <div className="flex items-center">
              <div className="flex text-yellow-400 mr-2">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < Math.floor(parseFloat(speaker.overallRating || "0")) ? "fill-current" : ""}`} 
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">{speaker.overallRating} ({speaker.reviewCount})</span>
            </div>
          )}
          <Badge variant="outline" className="text-xs">
            {speaker.speakerType}
          </Badge>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">{speaker.name}</h3>
        
        {/* Content area with proper flex layout */}
        <div className={featured ? "flex-1 flex flex-col justify-between" : ""}>
          <div className="flex-1">
            <p className="text-primary font-semibold mb-2">{speaker.title}</p>
            <p className={`text-gray-600 mb-4 ${featured ? "line-clamp-3" : "line-clamp-3"}`}>
              {speaker.bio}
            </p>

            <div className="mb-4">
              <div className="flex flex-wrap gap-1 mb-2">
                {speaker.expertise.slice(0, featured ? 2 : 3).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {speaker.expertise.length > (featured ? 2 : 3) && (
                  <Badge variant="secondary" className="text-xs">
                    +{speaker.expertise.length - (featured ? 2 : 3)} more
                  </Badge>
                )}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-500 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {speaker.location}
              </div>
            </div>
          </div>

          {/* Button area - always visible at bottom */}
          <div className="flex gap-2 mt-4">
            <Link href={`/speakers/${(speaker as any).slug}`} className="flex-1">
              <Button 
                className="w-full bg-primary hover:bg-blue-700 text-white"
                onClick={() => trackSpeakerView(speaker.id, { source: 'speaker_card' })}
              >
                View Profile
              </Button>
            </Link>
            <Button variant="outline" size="icon" className="border-primary text-primary hover:bg-primary hover:text-white">
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
