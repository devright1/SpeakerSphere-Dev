import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Eye, Calendar, Clock } from "lucide-react";
import { useState } from "react";

interface Video {
  id: number;
  speakerId: number;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number | null;
  videoType: string;
  eventName: string | null;
  eventDate: string | null;
  topics: string[] | null;
  viewCount: number | null;
  featured: boolean | null;
  createdAt: Date | null;
}

interface SpeakerVideoPortfolioProps {
  speakerId: number;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "Unknown";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function getVideoTypeLabel(type: string): string {
  switch (type) {
    case "demo_reel":
      return "Demo Reel";
    case "keynote":
      return "Keynote";
    case "interview":
      return "Interview";
    case "testimonial":
      return "Testimonial";
    case "lecture":
      return "Lecture";
    default:
      return type;
  }
}

function getVideoTypeColor(type: string): string {
  switch (type) {
    case "demo_reel":
      return "bg-devright-green text-white";
    case "keynote":
      return "bg-devright-blue text-white";
    case "interview":
      return "bg-purple-600 text-white";
    case "testimonial":
      return "bg-orange-600 text-white";
    case "lecture":
      return "bg-gray-600 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

export default function SpeakerVideoPortfolio({ speakerId }: SpeakerVideoPortfolioProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: [`/api/speakers/${speakerId}/videos`],
    queryFn: async () => {
      const response = await fetch(`/api/speakers/${speakerId}/videos`);
      if (!response.ok) throw new Error('Failed to fetch videos');
      return response.json() as Promise<Video[]>;
    }
  });

  const handleVideoPlay = async (video: Video) => {
    setSelectedVideo(video);
    // Track video view
    try {
      await fetch(`/api/videos/${video.id}/view`, { method: 'POST' });
    } catch (error) {
      console.log('Failed to track view');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return null;
  }

  const featuredVideo = videos.find(v => v.featured) || videos[0];

  return (
    <div className="space-y-6">
      {/* Featured Video Player */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Featured Demo</h3>
          <Badge className={getVideoTypeColor(selectedVideo?.videoType || featuredVideo.videoType)}>
            {getVideoTypeLabel(selectedVideo?.videoType || featuredVideo.videoType)}
          </Badge>
        </div>
        
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            src={selectedVideo?.videoUrl || featuredVideo.videoUrl}
            title={selectedVideo?.title || featuredVideo.title}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>

        <div className="space-y-2">
          <h4 className="text-lg font-semibold text-gray-900">
            {selectedVideo?.title || featuredVideo.title}
          </h4>
          <p className="text-gray-600">
            {selectedVideo?.description || featuredVideo.description}
          </p>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {(selectedVideo?.eventName || featuredVideo.eventName) && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{selectedVideo?.eventName || featuredVideo.eventName}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(selectedVideo?.duration || featuredVideo.duration)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{(selectedVideo?.viewCount || featuredVideo.viewCount || 0)} views</span>
            </div>
          </div>

          {(selectedVideo?.topics || featuredVideo.topics) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {(selectedVideo?.topics || featuredVideo.topics || []).map((topic, index) => (
                <Badge key={index} variant="secondary">{topic}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Video Gallery */}
      {videos.length > 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Video Portfolio</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <Card 
                key={video.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedVideo?.id === video.id ? 'ring-2 ring-devright-blue' : ''
                }`}
                onClick={() => handleVideoPlay(video)}
              >
                <CardContent className="p-4">
                  <div className="aspect-video bg-gray-100 rounded-lg relative mb-3 overflow-hidden">
                    {video.thumbnailUrl ? (
                      <img 
                        src={video.thumbnailUrl} 
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-devright-blue to-blue-800">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center">
                      <Play className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <Badge className={getVideoTypeColor(video.videoType)} variant="secondary">
                        {getVideoTypeLabel(video.videoType)}
                      </Badge>
                    </div>
                  </div>
                  
                  <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                    {video.title}
                  </h4>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDuration(video.duration)}</span>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{video.viewCount || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}