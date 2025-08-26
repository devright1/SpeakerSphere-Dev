import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSpeakerTracking } from "@/hooks/useSpeakerTracking";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import SpeakerVideoPortfolio from "@/components/speaker-video-portfolio";
import { apiRequest } from "@/lib/queryClient";
import { 
  Star, 
  Globe, 
  Phone, 
  Mail, 
  Calendar, 
  CheckCircle, 
  Users, 
  Award, 
  TrendingUp, 
  Heart, 
  Share2, 
  MessageCircle,
  AlertCircle,
  Instagram,
  Linkedin,
  Facebook,
  UserPlus,
  LogIn,
  FileText,
  Image,
  Video,
  Music,
  BookOpen,
  Download,
  Folder
} from "lucide-react";
import type { Speaker, Review } from "@shared/schema";

const inquirySchema = z.object({
  clientName: z.string().min(1, "Name is required"),
  clientEmail: z.string().email("Valid email is required"),
  clientCompany: z.string().min(1, "Company is required"),
  eventType: z.string().min(1, "Event type is required"),
  eventDate: z.string().min(1, "Event date is required"),
  eventLocation: z.string().min(1, "Event location is required"),
  expectedAttendees: z.string().min(1, "Expected attendees is required"),
  budget: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

const reviewSchema = z.object({
  reviewerName: z.string().min(1, "Name is required"),
  reviewerTitle: z.string().min(1, "Title is required"),
  reviewerCompany: z.string().min(1, "Company is required"),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, "Written review is required (minimum 10 characters)"),
  eventType: z.string().min(1, "Event type is required"),
  eventDate: z.string().min(1, "Event date is required"),
  photo: z.any().refine((file) => file instanceof File, { message: "Photo from audience is required" }),
});

export default function SpeakerProfile() {
  const { name } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isAccessCodeModalOpen, setIsAccessCodeModalOpen] = useState(false);
  const [selectedProtectedContent, setSelectedProtectedContent] = useState<any>(null);
  const [accessCode, setAccessCode] = useState("");

  const { data: speaker, isLoading: speakerLoading, error: speakerError } = useQuery<Speaker>({
    queryKey: ["/api/speakers", name],
    queryFn: async () => {
      const response = await fetch(`/api/speakers/${name}`);
      if (!response.ok) {
        throw new Error("Speaker not found");
      }
      return response.json();
    },
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: ["/api/speakers", name, "reviews"],
    queryFn: async () => {
      if (!speaker) return [];
      const response = await fetch(`/api/speakers/${speaker.id}/reviews`);
      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }
      return response.json();
    },
    enabled: !!speaker,
  });

  // Fetch speaker content (only for approved speakers)
  const { data: speakerContent, isLoading: contentLoading } = useQuery({
    queryKey: ["/api/speakers/content", speaker?.id],
    queryFn: async () => {
      if (!speaker?.id) return [];
      const response = await fetch(`/api/speakers/${speaker.id}/content`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: Boolean(speaker?.id && speaker?.verified),
  });

  // Initialize speaker tracking
  const tracking = useSpeakerTracking(speaker?.id || 0);

  // Track profile view when speaker data loads
  useEffect(() => {
    if (speaker?.id) {
      tracking.trackProfileView();
    }
  }, [speaker?.id, tracking]);

  // Check if speaker is bookmarked
  const { data: isBookmarked = false } = useQuery({
    queryKey: [`/api/users/${user?.id}/bookmarks/check/${speaker?.id}`],
    enabled: !!user?.id && !!speaker?.id,
    retry: false,
  });

  // Toggle bookmark mutation
  const toggleBookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !speaker?.id) throw new Error("User not authenticated or speaker not found");
      
      const response = await fetch(`/api/users/${user.id}/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speakerId: speaker.id }),
      });
      
      if (!response.ok) throw new Error("Failed to toggle bookmark");
      return response.json();
    },
    onSuccess: (data) => {
      // Track favorite interaction
      if (data.bookmarked) {
        tracking.trackFavoriteAdd();
      } else {
        tracking.trackFavoriteRemove();
      }
      
      // Invalidate bookmark queries
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/bookmarks`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/bookmarks/check/${speaker?.id}`] });
      
      toast({
        title: data.bookmarked ? "Speaker saved" : "Speaker removed",
        description: data.bookmarked 
          ? `${speaker?.name} has been added to your favorites`
          : `${speaker?.name} has been removed from your favorites`,
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

  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleFavoriteClick = () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }
    
    toggleBookmarkMutation.mutate();
  };

  const inquiryForm = useForm<z.infer<typeof inquirySchema>>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      clientCompany: "",
      eventType: "",
      eventDate: "",
      eventLocation: "",
      expectedAttendees: "",
      budget: "",
      message: "",
    },
  });

  const reviewForm = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      reviewerName: "",
      reviewerTitle: "",
      reviewerCompany: "",
      rating: 5,
      comment: "",
      eventType: "",
      eventDate: "",
      photo: undefined,
    },
  });

  const inquiryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof inquirySchema>) => {
      if (!speaker) throw new Error("Speaker not found");
      const inquiryData = { ...data, speakerId: speaker.id };
      const response = await apiRequest("POST", `/api/inquiries`, inquiryData);
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Track inquiry submission
      tracking.trackInquirySubmit({
        eventType: variables.eventType,
        eventLocation: variables.eventLocation,
        expectedAttendees: variables.expectedAttendees,
        budget: variables.budget
      });
      
      toast({
        title: "Inquiry Sent",
        description: "Your inquiry has been sent to our admin team for review and forwarding to the speaker.",
      });
      setIsInquiryOpen(false);
      inquiryForm.reset();
    },
    onError: (error: any) => {
      if (error.message?.includes('401') || error.message?.includes('Authentication required')) {
        toast({
          title: "Login Required",
          description: "Please log in or create an account to send an inquiry.",
          variant: "destructive",
        });
        // Redirect to login page after a short delay
        setTimeout(() => {
          window.location.href = '/auth';
        }, 1500);
      } else {
        toast({
          title: "Error",
          description: "Failed to send inquiry. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: z.infer<typeof reviewSchema>) => {
      if (!speaker) throw new Error("Speaker not found");
      
      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append('reviewerName', data.reviewerName);
      formData.append('reviewerTitle', data.reviewerTitle);
      formData.append('reviewerCompany', data.reviewerCompany);
      formData.append('rating', data.rating.toString());
      formData.append('comment', data.comment);
      formData.append('eventType', data.eventType);
      formData.append('eventDate', data.eventDate);
      formData.append('photo', data.photo);
      
      const response = await fetch(`/api/speakers/${speaker.id}/reviews`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit review');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review Submitted",
        description: "Your review has been submitted successfully.",
      });
      setIsReviewOpen(false);
      setSelectedFile(null);
      setHoveredRating(0);
      reviewForm.reset({
        reviewerName: "",
        reviewerTitle: "",
        reviewerCompany: "",
        rating: 5,
        comment: "",
        eventType: "",
        eventDate: "",
        photo: undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/speakers", name, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/speakers", name] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Access code download mutation
  const accessCodeDownloadMutation = useMutation({
    mutationFn: async ({ contentId, accessCode }: { contentId: number; accessCode: string }) => {
      const response = await fetch(`/api/content/${contentId}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessCode }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Download failed');
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Download Started",
        description: `${data.fileName} download has been tracked successfully.`,
      });
      setIsAccessCodeModalOpen(false);
      setAccessCode("");
      setSelectedProtectedContent(null);
      tracking.trackInteraction('protected_content_download', data.fileName);
    },
    onError: (error: any) => {
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download content. Please check your access code.",
        variant: "destructive",
      });
    },
  });

  if (speakerLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (speakerError || !speaker) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Speaker not found. Please check the URL and try again.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Helper functions for file management
  const getFileIcon = (category: string) => {
    switch (category) {
      case 'image': return <Image className="h-5 w-5 text-blue-600" />;
      case 'video': return <Video className="h-5 w-5 text-purple-600" />;
      case 'audio': return <Music className="h-5 w-5 text-green-600" />;
      case 'presentation': return <BookOpen className="h-5 w-5 text-orange-600" />;
      default: return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case 'image': return 'Images';
      case 'video': return 'Videos';
      case 'audio': return 'Audio';
      case 'presentation': return 'Presentations';
      case 'document': return 'Documents';
      default: return 'Files';
    }
  };

  // Group content by category
  const groupedContent = speakerContent?.reduce((acc: any, content: any) => {
    const category = content.category || 'document';
    if (!acc[category]) acc[category] = [];
    acc[category].push(content);
    return acc;
  }, {}) || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Speaker Header */}
            <Card className="mb-8">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <div className="flex-shrink-0">
                    {!imageError && speaker.imageUrl ? (
                      <img
                        src={speaker.imageUrl}
                        alt={speaker.name}
                        onError={() => setImageError(true)}
                        className={`w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover ${
                          // Profile headshots use original scaling system
                          speaker.name === "Dr. Larry Brecht" 
                            ? "speaker-image-position-center speaker-image-scale-md bg-white" 
                            : speaker.name === "Marisa Notturno"
                            ? "object-[center_7%] speaker-image-scale-md"
                            : speaker.name === "Dr. Sascha Jovanovic"
                            ? "object-contain bg-gray-100"
                            : speaker.name === "Dr. Robert Levine"
                            ? "object-[center_20%] speaker-image-scale-md"
                            : "speaker-image-position-center speaker-image-scale-md"
                        }`}
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center">
                        <UserPlus className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                      <h1 className="text-3xl font-bold text-gray-900">{speaker.name}</h1>
                      <div className="flex flex-wrap justify-center md:justify-start gap-2">
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
                        <Badge variant="outline">{speaker.speakerType}</Badge>
                      </div>
                    </div>
                    
                    <p className="text-xl text-primary font-semibold mb-3">{speaker.title}</p>
                    
                    <div className="flex items-center justify-center md:justify-start gap-6 mb-4">
                      {!speaker.hideRatings && (
                        <div className="flex items-center">
                          <div className="flex text-yellow-400 mr-2">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-5 h-5 ${i < Math.floor(parseFloat(speaker.overallRating || "0")) ? "fill-current" : ""}`} 
                              />
                            ))}
                          </div>
                          <span className="font-semibold">{speaker.overallRating}</span>
                          <span className="text-gray-600 ml-1">({speaker.reviewCount} reviews)</span>
                        </div>
                      )}
                      

                    </div>

                    {!speaker.hideRatings && (
                      <div className="mb-4">
                        <Button 
                          onClick={() => setIsReviewOpen(true)}
                          className="bg-primary hover:bg-blue-700 text-white"
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Leave a Review
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center justify-center md:justify-start gap-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleFavoriteClick}
                        disabled={toggleBookmarkMutation.isPending}
                        className={`transition-all duration-200 ${
                          isBookmarked 
                            ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" 
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <Heart 
                          className="w-4 h-4 mr-2 transition-all duration-200"
                          style={{
                            color: isBookmarked ? '#ef4444' : '#6b7280',
                            fill: isBookmarked ? '#ef4444' : 'transparent'
                          }}
                        />
                        {isBookmarked ? "Saved" : "Save"}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          tracking.trackShareClick();
                          // Copy current URL to clipboard
                          navigator.clipboard.writeText(window.location.href);
                          toast({
                            title: "Link copied",
                            description: "Speaker profile link copied to clipboard",
                          });
                        }}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                      
                      {/* Social Media Icons */}
                      {!speaker.hideSocial && (
                        <div className="flex items-center gap-3 ml-4">
                          {speaker.instagramHandle && (
                            <a 
                              href={`https://instagram.com/${speaker.instagramHandle}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={() => tracking.trackSocialClick('instagram')}
                              className="text-gray-600 hover:text-pink-600 transition-colors"
                            >
                              <Instagram className="w-5 h-5" />
                            </a>
                          )}
                          {speaker.socialMedia && speaker.socialMedia.find(link => link.includes('linkedin')) && (
                            <a 
                              href={speaker.socialMedia.find(link => link.includes('linkedin'))} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={() => tracking.trackSocialClick('linkedin')}
                              className="text-gray-600 hover:text-blue-600 transition-colors"
                            >
                              <Linkedin className="w-5 h-5" />
                            </a>
                          )}
                          {speaker.socialMedia && speaker.socialMedia.find(link => link.includes('facebook')) && (
                            <a 
                              href={speaker.socialMedia.find(link => link.includes('facebook'))} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={() => tracking.trackSocialClick('facebook')}
                              className="text-gray-600 hover:text-blue-700 transition-colors"
                            >
                              <Facebook className="w-5 h-5" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className={`grid w-full ${
                speaker.hideRatings 
                  ? (speaker.verified ? 'grid-cols-4' : 'grid-cols-3')
                  : (speaker.verified ? 'grid-cols-5' : 'grid-cols-4')
              }`}>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="topics">Topics</TabsTrigger>
                {speaker.verified && (
                  <TabsTrigger value="resources">Speaker Resources</TabsTrigger>
                )}
                {!speaker.hideRatings && <TabsTrigger value="reviews">Reviews</TabsTrigger>}
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed mb-6">{speaker.bio}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Expertise</h3>
                        <div className="flex flex-wrap gap-2">
                          {speaker.expertise?.map((skill, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary"
                              className="cursor-pointer hover:bg-secondary/80 transition-colors"
                              onClick={() => tracking.trackTagClick(skill)}
                            >
                              {skill}
                            </Badge>
                          )) || []}
                        </div>
                      </div>
                      

                    </div>
                  </CardContent>
                </Card>

                {/* Video Portfolio */}
                <SpeakerVideoPortfolio speakerId={speaker.id} />

                {/* Recent Reviews */}
                {!speaker.hideRatings && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Recent Reviews</CardTitle>
                    <div className="text-sm text-gray-600">
                      What clients are saying about {speaker.name}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {reviewsLoading ? (
                      <div className="space-y-4">
                        {[...Array(2)].map((_, i) => (
                          <Skeleton key={i} className="h-24 w-full" />
                        ))}
                      </div>
                    ) : reviews && reviews.length > 0 ? (
                      <div className="space-y-4">
                        {reviews.slice(0, 3).map((review) => (
                          <div key={review.id} className="border-l-4 border-primary bg-gray-50 p-4 rounded-r-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h5 className="font-semibold text-sm">{review.reviewerName}</h5>
                                <p className="text-xs text-gray-600">{review.reviewerTitle} at {review.reviewerCompany}</p>
                              </div>
                              <div className="flex items-center">
                                <div className="flex text-yellow-400 mr-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-3 h-3 ${i < review.overallRating ? "fill-current" : ""}`} />
                                  ))}
                                </div>
                                <span className="text-xs font-medium">{review.overallRating}/5</span>
                              </div>
                            </div>
                            <p className="text-gray-700 text-sm mb-2 line-clamp-2">"{review.comment}"</p>
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-gray-500">
                                {review.eventType} • {review.eventDate}
                                {review.verified && (
                                  <span className="ml-2 inline-flex items-center">
                                    <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                                    Verified
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {reviews.length > 3 && (
                          <div className="text-center pt-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // Switch to reviews tab - we need to get the tab trigger
                                const reviewsTab = document.querySelector('[value="reviews"]') as HTMLButtonElement;
                                reviewsTab?.click();
                              }}
                            >
                              View All {reviews.length} Reviews
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="mb-2">No reviews yet</p>
                        <p className="text-sm">Be the first to review {speaker.name}</p>
                        <Button 
                          onClick={() => setIsReviewOpen(true)}
                          className="mt-3"
                          size="sm"
                        >
                          Leave a Review
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                )}
              </TabsContent>

              <TabsContent value="experience">
                <Card>
                  <CardHeader>
                    <CardTitle>Professional Experience</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Achievements</h3>
                      <ul className="space-y-2">
                        {speaker.achievements?.map((achievement, index) => (
                          <li key={index} className="flex items-start">
                            <Award className="w-4 h-4 text-accent mt-1 mr-2 flex-shrink-0" />
                            <span className="text-gray-700">{achievement}</span>
                          </li>
                        )) || []}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Languages</h3>
                      <div className="flex flex-wrap gap-2">
                        {speaker.languages?.map((language, index) => (
                          <Badge key={index} variant="outline">{language}</Badge>
                        )) || []}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="topics">
                <Card>
                  <CardHeader>
                    <CardTitle>Speaking Topics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {speaker.expertise?.map((topic: string, index: number) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-2">{topic}</h4>
                          <p className="text-gray-600 text-sm">Expert-level presentation on {topic.toLowerCase()}</p>
                        </div>
                      )) || []}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="resources">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Speaker Resources</h2>
                      <p className="text-gray-600 mt-2">
                        Downloadable content and materials shared by {speaker.name}
                      </p>
                    </div>
                  </div>

                  {speakerContent && speakerContent.length > 0 ? (
                    <div className="space-y-6">
                      {Object.entries(groupedContent).map(([category, contents]: [string, any]) => (
                        <Card key={category}>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Folder className="h-5 w-5 text-blue-600" />
                              {getCategoryDisplayName(category)}
                              <Badge variant="outline">{contents.length} files</Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-4">
                              {contents.map((content: any) => (
                                <div key={content.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                      {getFileIcon(content.category)}
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-gray-900">{content.originalName}</h4>
                                      <p className="text-sm text-gray-600">{content.description}</p>
                                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                        <span>{formatFileSize(content.fileSize)}</span>
                                        <span>{content.downloadCount} downloads</span>
                                        <span>
                                          Updated {new Date(content.updatedAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Check if user is authenticated before allowing download
                                      if (!isAuthenticated) {
                                        toast({
                                          title: "Login Required",
                                          description: "Please sign in or create an account to download content.",
                                          variant: "destructive",
                                        });
                                        // Redirect to login page
                                        window.location.href = '/auth';
                                        return;
                                      }
                                      
                                      // Check if content requires access code
                                      if (content.requiresAccessCode) {
                                        setSelectedProtectedContent(content);
                                        setIsAccessCodeModalOpen(true);
                                        return;
                                      }
                                      
                                      tracking.trackInteraction('resource_download', content.originalName);
                                      
                                      // Create a form to download with proper session cookies
                                      const form = document.createElement('form');
                                      form.method = 'GET';
                                      form.action = `/api/content/${content.id}/download`;
                                      form.target = '_blank';
                                      form.style.display = 'none';
                                      document.body.appendChild(form);
                                      form.submit();
                                      document.body.removeChild(form);
                                    }}
                                    className="flex items-center gap-2"
                                  >
                                    <Download className="h-4 w-4" />
                                    {!isAuthenticated ? "Login to Download" : content.requiresAccessCode ? "Access Code Required" : "Download"}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Folder className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Resources Available</h3>
                        <p className="text-gray-600">
                          {speaker.name} hasn't shared any downloadable resources yet.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="reviews">
                {!speaker.hideRatings ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold">Reviews</h2>
                      <Button 
                        onClick={() => {
                          tracking.trackReviewSectionView();
                          setIsReviewOpen(true);
                        }}
                      >
                        Leave a Review
                      </Button>
                    </div>

                    {reviewsLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-32 w-full" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {reviews?.map((review) => (
                          <Card key={review.id}>
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h4 className="font-semibold">{review.reviewerName}</h4>
                                  <p className="text-sm text-gray-600">{review.reviewerTitle} at {review.reviewerCompany}</p>
                                </div>
                                <div className="flex items-center">
                                  <div className="flex text-yellow-400 mr-2">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} className={`w-4 h-4 ${i < review.overallRating ? "fill-current" : ""}`} />
                                    ))}
                                  </div>
                                  <span className="text-sm font-medium">{review.overallRating}/5</span>
                                </div>
                              </div>
                              <p className="text-gray-700 mb-3">{review.comment}</p>
                              <div className="text-xs text-gray-500">
                                {review.eventType} • {review.eventDate}
                                {review.verified && (
                                  <span className="ml-2 inline-flex items-center">
                                    <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                                    Verified
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )) || []}
                      </div>
                    )}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="text-gray-500 mb-4">
                        <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">Reviews Not Available</h3>
                        <p>This speaker has chosen not to display reviews at this time.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">


            {/* Contact Information */}
            {!speaker.hideContact && (
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-3 text-gray-500" />
                    <a 
                      href={`mailto:${speaker.email}`}
                      onClick={() => tracking.trackEmailClick()}
                      className="text-sm text-primary hover:underline"
                    >
                      {speaker.email}
                    </a>
                  </div>
                  {speaker.phone && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-3 text-gray-500" />
                      <a 
                        href={`tel:${speaker.phone}`}
                        onClick={() => tracking.trackPhoneClick()}
                        className="text-sm text-primary hover:underline"
                      >
                        {speaker.phone}
                      </a>
                    </div>
                  )}
                  {speaker.website && (
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-3 text-gray-500" />
                      <a 
                        href={speaker.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        onClick={() => tracking.trackWebsiteClick()}
                        className="text-sm text-primary hover:underline"
                      >
                        Website
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Book Speaker */}
            <Card>
              <CardHeader>
                <CardTitle>Book This Speaker</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    className="w-full bg-primary hover:bg-blue-700 text-white"
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast({
                          title: "Login Required",
                          description: "Please log in or create an account to send an inquiry.",
                          variant: "destructive",
                        });
                        // Redirect to login page
                        window.location.href = '/auth';
                        return;
                      }
                      tracking.trackContactFormOpen();
                      setIsInquiryOpen(true);
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {!isAuthenticated ? "Login to Send Inquiry" : "Send Inquiry"}
                  </Button>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Response time:</span>
                        <span>Within 24 hours</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>


          </div>
        </div>
      </div>

      <Footer />

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Leave a Review for {speaker?.name}</DialogTitle>
          </DialogHeader>
          <Form {...reviewForm}>
            <form onSubmit={reviewForm.handleSubmit((data) => reviewMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={reviewForm.control}
                  name="reviewerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={reviewForm.control}
                  name="reviewerTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={reviewForm.control}
                  name="reviewerCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={reviewForm.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating *</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              className="focus:outline-none"
                              onMouseEnter={() => setHoveredRating(star)}
                              onMouseLeave={() => setHoveredRating(0)}
                              onClick={() => field.onChange(star)}
                            >
                              <Star
                                className={`w-8 h-8 transition-colors ${
                                  star <= (hoveredRating || field.value)
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                          <span className="ml-2 text-sm text-gray-600">
                            {field.value ? `${field.value}/5` : "Click to rate"}
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={reviewForm.control}
                  name="eventType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Corporate Conference" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={reviewForm.control}
                  name="eventDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={reviewForm.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Written Review *</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} placeholder="Share your experience with this speaker..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={reviewForm.control}
                name="photo"
                render={({ field: { onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Photo from Audience *</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSelectedFile(file);
                              onChange(file);
                            }
                          }}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {selectedFile && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <span>✓ {selectedFile.name}</span>
                          </div>
                        )}
                        <p className="text-xs text-gray-500">
                          Upload a photo of the speaker presenting to your audience
                        </p>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsReviewOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={reviewMutation.isPending}>
                  {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Inquiry Dialog */}
      <Dialog open={isInquiryOpen} onOpenChange={setIsInquiryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Inquiry to {speaker?.name}</DialogTitle>
          </DialogHeader>
          <Form {...inquiryForm}>
            <form onSubmit={inquiryForm.handleSubmit((data) => inquiryMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={inquiryForm.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={inquiryForm.control}
                  name="clientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={inquiryForm.control}
                name="clientCompany"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={inquiryForm.control}
                  name="eventType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type</FormLabel>
                      <Select onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="corporate">Corporate Event</SelectItem>
                          <SelectItem value="conference">Conference</SelectItem>
                          <SelectItem value="workshop">Workshop</SelectItem>
                          <SelectItem value="webinar">Webinar</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={inquiryForm.control}
                  name="eventDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={inquiryForm.control}
                  name="eventLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="City, State" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={inquiryForm.control}
                  name="expectedAttendees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Attendees</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., 100-200" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={inquiryForm.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., $5,000 - $10,000" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={inquiryForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} placeholder="Tell us about your event..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsInquiryOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={inquiryMutation.isPending}>
                  {inquiryMutation.isPending ? "Sending..." : "Send Inquiry"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Access Code Modal */}
      <Dialog open={isAccessCodeModalOpen} onOpenChange={setIsAccessCodeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Access Code Required</DialogTitle>
            <DialogDescription>
              This content requires a 4-letter access code to download. Enter the code provided by the speaker.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div>
              <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-2">
                Access Code
              </label>
              <Input
                id="accessCode"
                type="text"
                placeholder="Enter 4-letter code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase().slice(0, 4))}
                maxLength={4}
                className="text-center text-lg font-mono tracking-widest"
              />
            </div>
            
            {selectedProtectedContent && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{selectedProtectedContent.originalName}</p>
                <p className="text-xs text-gray-500">{selectedProtectedContent.description}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsAccessCodeModalOpen(false);
                  setAccessCode("");
                  setSelectedProtectedContent(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedProtectedContent && accessCode.length === 4) {
                    accessCodeDownloadMutation.mutate({
                      contentId: selectedProtectedContent.id,
                      accessCode: accessCode
                    });
                  }
                }}
                disabled={accessCode.length !== 4 || accessCodeDownloadMutation.isPending}
              >
                {accessCodeDownloadMutation.isPending ? "Downloading..." : "Download"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}