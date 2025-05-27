import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, CheckCircle, Heart } from "lucide-react";
import type { Speaker } from "@shared/schema";

interface SpeakerCardProps {
  speaker: Speaker;
  featured?: boolean;
}

export default function SpeakerCard({ speaker, featured = false }: SpeakerCardProps) {
  const formatFee = (fee: string | undefined | null) => {
    if (!fee) return "Contact for pricing";
    return `$${parseFloat(fee).toLocaleString()}+`;
  };

  return (
    <Card className={`overflow-hidden hover:shadow-xl transition-all duration-300 ${featured ? "shadow-lg" : "shadow-md"}`}>
      <div className="relative overflow-hidden">
        <img 
          src={speaker.imageUrl} 
          alt={speaker.name}
          className={`w-full h-48 ${
            speaker.name === "Dr. Larry Brecht" 
              ? "object-cover object-[center_20%] bg-white" 
              : speaker.name === "Dr. Will Martin"
              ? "object-cover object-[center_17%]"
              : speaker.name === "Marisa Notturno"
              ? "object-cover object-[center_7%] scale-90"
              : "object-cover object-[center_22%] scale-150"
          }`}
        />
        <div className="absolute top-4 left-4 flex gap-2">
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
        <button className="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white transition-colors">
          <Heart className="w-4 h-4 text-gray-600 hover:text-red-500" />
        </button>
      </div>
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="flex text-yellow-400 mr-2">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${i < Math.floor(parseFloat(speaker.rating || "0")) ? "fill-current" : ""}`} 
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">{speaker.rating} ({speaker.reviewCount})</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {speaker.speakerType}
          </Badge>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">{speaker.name}</h3>
        <p className="text-primary font-semibold mb-2">{speaker.title}</p>
        <p className="text-gray-600 mb-4 line-clamp-3">{speaker.bio}</p>

        <div className="mb-4">
          <div className="flex flex-wrap gap-1 mb-2">
            {speaker.expertise.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {speaker.expertise.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{speaker.expertise.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500 flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            {speaker.location}
          </div>
          <div className="text-lg font-bold text-primary">{formatFee((speaker as any).fee)}</div>
        </div>

        <div className="flex gap-2">
          <Link href={`/speakers/${speaker.id}`} className="flex-1">
            <Button className="w-full bg-primary hover:bg-blue-700 text-white">
              View Profile
            </Button>
          </Link>
          <Button variant="outline" size="icon" className="border-primary text-primary hover:bg-primary hover:text-white">
            <Heart className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
