import { Link } from "wouter";
import TierBadge from "@/components/TierBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Star, CheckCircle, Heart, UserPlus, LogIn } from "lucide-react";
import { FaInstagram, FaLinkedin, FaFacebook, FaTwitter } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Speaker } from "@shared/schema";
import { trackSpeakerView, trackEmailClick, trackPhoneClick, trackWebsiteClick } from "@/lib/analytics";

interface SpeakerCardProps {
  speaker: Speaker;
  featured?: boolean;
}

export default function SpeakerCard({ speaker, featured = false }: SpeakerCardProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Check if speaker is bookmarked
  const { data: isBookmarked = false } = useQuery({
    queryKey: [`/api/users/${user?.id}/bookmarks/check/${speaker.id}`],
    queryFn: async () => {
      if (!user?.id) return false;
      const response = await fetch(`/api/users/${user.id}/bookmarks/check/${speaker.id}`);
      if (!response.ok) return false;
      const data = await response.json();
      return data.bookmarked || false;
    },
    enabled: !!user?.id,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Fetch speaker topics
  const { data: speakerTopics, isLoading: topicsLoading } = useQuery({
    queryKey: ["/api/speakers", speaker.id, "topics"],
    queryFn: async () => {
      const response = await fetch(`/api/speakers/${speaker.id}/topics`);
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Toggle bookmark mutation
  const toggleBookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const response = await fetch(`/api/users/${user.id}/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speakerId: speaker.id }),
      });
      
      if (!response.ok) throw new Error("Failed to toggle bookmark");
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate bookmark queries
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/bookmarks`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/bookmarks/check/${speaker.id}`] });
      
      toast({
        title: data.bookmarked ? "Speaker saved" : "Speaker removed",
        description: data.bookmarked 
          ? `${speaker.name} has been added to your favorites`
          : `${speaker.name} has been removed from your favorites`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    },
  });

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any parent click handlers
    e.stopPropagation();
    
    
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }
    
    toggleBookmarkMutation.mutate();
  };

  return (
    <Card className={`overflow-hidden hover-lift clean-transition ${featured ? "shadow-lg h-[700px] flex flex-col" : "shadow-md h-full flex flex-col"}`}>
      <div className="relative overflow-hidden flex-shrink-0">
        {!imageError && speaker.imageUrl ? (
          <img 
            src={speaker.imageUrl} 
            alt={speaker.name}
            onError={() => setImageError(true)}
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
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                <UserPlus className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium">{speaker.name}</p>
              <p className="text-xs">Image unavailable</p>
            </div>
          </div>
        )}

        {/* Favorite button overlay */}
        <button 
          onClick={handleFavoriteClick}
          disabled={toggleBookmarkMutation.isPending}
          className="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <Heart 
            className={`w-5 h-5 transition-all duration-200`}
            style={{
              color: isBookmarked ? '#ef4444' : '#6b7280',
              fill: isBookmarked ? '#ef4444' : 'transparent',
              transform: isBookmarked ? 'scale(1.1)' : 'scale(1)'
            }}
          />
        </button>
      </div>
      
      <CardContent className="card-spacing flex flex-col h-full">
        {/* Badges moved below image */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <TierBadge tier={speaker.subscriptionTier as "basic" | "pro" | "premier"} size="sm" />
          {speaker.verified && (
            <Badge variant="default" className="bg-success text-white">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified
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
        </div>

        <h3 className="font-bold text-gray-900 mb-3">{speaker.name}</h3>
        
        {/* Content area that expands to fill available space */}
        <div className="flex-1 flex flex-col">
          <p className="text-primary font-semibold mb-2 text-lg">{speaker.title}</p>
          <p className="text-gray-600 mb-4 leading-relaxed line-clamp-2">
            {speaker.bio}
          </p>

          <div className="mb-4">
            <div className="flex flex-wrap gap-1 mb-2">
              {topicsLoading ? (
                <div className="flex items-center space-x-1">
                  <div className="animate-pulse bg-gray-200 h-5 w-16 rounded"></div>
                  <div className="animate-pulse bg-gray-200 h-5 w-20 rounded"></div>
                </div>
              ) : speakerTopics && speakerTopics.length > 0 ? (
                <>
                  {speakerTopics.slice(0, 2).map((topic: any) => (
                    <Badge key={topic.id} variant="secondary" className="text-xs">
                      {topic.name}
                    </Badge>
                  ))}
                  {speakerTopics.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{speakerTopics.length - 2} more
                    </Badge>
                  )}
                </>
              ) : (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  No topics available
                </Badge>
              )}
            </div>
            
            {/* Social Media Icons */}
            {!speaker.hideSocial && (speaker.instagramHandle || speaker.linkedinHandle || speaker.facebookHandle || speaker.xHandle || (speaker.socialMedia && speaker.socialMedia.length > 0)) && (
              <div className="flex items-center gap-2 mt-2">
                {speaker.instagramHandle && (
                  <a 
                    href={`https://instagram.com/${speaker.instagramHandle}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-pink-600 transition-colors"
                    title={`Follow ${speaker.name} on Instagram`}
                  >
                    <FaInstagram className="w-4 h-4" />
                  </a>
                )}
                {speaker.linkedinHandle && (
                  <a 
                    href={speaker.linkedinHandle.includes('linkedin.com') ? speaker.linkedinHandle : `https://linkedin.com/in/${speaker.linkedinHandle}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-blue-600 transition-colors"
                    title={`Connect with ${speaker.name} on LinkedIn`}
                  >
                    <FaLinkedin className="w-4 h-4" />
                  </a>
                )}
                {speaker.facebookHandle && (
                  <a 
                    href={speaker.facebookHandle.includes('facebook.com') ? speaker.facebookHandle : `https://facebook.com/${speaker.facebookHandle}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-blue-700 transition-colors"
                    title={`Follow ${speaker.name} on Facebook`}
                  >
                    <FaFacebook className="w-4 h-4" />
                  </a>
                )}
                {speaker.xHandle && (
                  <a 
                    href={speaker.xHandle.includes('x.com') || speaker.xHandle.includes('twitter.com') ? speaker.xHandle : `https://x.com/${speaker.xHandle}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-gray-900 transition-colors"
                    title={`Follow ${speaker.name} on X`}
                  >
                    <FaXTwitter className="w-4 h-4" />
                  </a>
                )}
                {/* Fallback for speakers with socialMedia array but no specific handles */}
                {!speaker.instagramHandle && !speaker.linkedinHandle && !speaker.facebookHandle && !speaker.xHandle && speaker.socialMedia && speaker.socialMedia.map((link, index) => {
                  if (link.includes('instagram.com')) {
                    return (
                      <a 
                        key={index}
                        href={link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-pink-600 transition-colors"
                        title={`Follow ${speaker.name} on Instagram`}
                      >
                        <FaInstagram className="w-4 h-4" />
                      </a>
                    );
                  }
                  if (link.includes('linkedin.com')) {
                    return (
                      <a 
                        key={index}
                        href={link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-blue-600 transition-colors"
                        title={`Connect with ${speaker.name} on LinkedIn`}
                      >
                        <FaLinkedin className="w-4 h-4" />
                      </a>
                    );
                  }
                  if (link.includes('facebook.com')) {
                    return (
                      <a 
                        key={index}
                        href={link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-blue-700 transition-colors"
                        title={`Follow ${speaker.name} on Facebook`}
                      >
                        <FaFacebook className="w-4 h-4" />
                      </a>
                    );
                  }
                  if (link.includes('x.com') || link.includes('twitter.com')) {
                    return (
                      <a 
                        key={index}
                        href={link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-gray-900 transition-colors"
                        title={`Follow ${speaker.name} on X`}
                      >
                        <FaXTwitter className="w-4 h-4" />
                      </a>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>

          {/* Spacer to push button to bottom */}
          <div className="flex-1"></div>

          {/* Button area - always at bottom */}
          <div className="flex gap-2 mt-4">
            <Link href={`/speakers/${(speaker as any).slug}`} className="flex-1">
              <Button 
                className="w-full bg-primary hover:bg-blue-700 text-white"
                onClick={() => trackSpeakerView(speaker.id, { source: 'speaker_card' })}
              >
                View Profile
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>

      {/* Authentication Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Save Your Favorite Speakers
            </DialogTitle>
            <DialogDescription>
              Create an account or sign in to save speakers to your favorites and access them anytime.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <Button 
              onClick={() => window.location.href = '/auth'}
              className="w-full bg-primary hover:bg-blue-700 text-white"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In to Your Account
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or
                </span>
              </div>
            </div>
            
            <Button 
              onClick={() => window.location.href = '/auth'}
              variant="outline" 
              className="w-full"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create New Account
            </Button>
            
            <div className="text-center text-sm text-gray-600">
              <p>With an account you can:</p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• Save your favorite speakers</li>
                <li>• Access speaker profiles anytime</li>
                <li>• Get personalized recommendations</li>
                <li>• Leave reviews and ratings</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
