import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSpeakerTracking } from "@/hooks/useSpeakerTracking";
import Header from "@/components/header";
import Footer from "@/components/footer";
import TierBadge from "@/components/TierBadge";
import { StarRating } from "@/components/star-rating";
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
import { AccessCodeDialog } from "@/components/AccessCodeDialog";
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
  UserPlus,
  LogIn,
  FileText,
  Image,
  Video,
  Music,
  BookOpen,
  Download,
  Folder,
  FolderOpen,
  GraduationCap,
  Newspaper,
  MapPin,
  ExternalLink
} from "lucide-react";
import { FaInstagram, FaLinkedin, FaFacebook, FaTiktok } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import type { Speaker, Review, SpeakerEvent } from "@shared/schema";
import { SEOHead, generateSpeakerStructuredData, generateBreadcrumbStructuredData } from "@/components/seo-head";
import { SocialShare } from "@/components/social-share";
import { GA_EVENTS } from "@/lib/analytics";
import { getVideoThumbnail } from "@/lib/video-utils";

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
  speakingStyleRating: z.number().min(0).max(5),
  podiumPresenceRating: z.number().min(0).max(5),
  technicalProficiencyRating: z.number().min(0).max(5),
  contentRelevanceRating: z.number().min(0).max(5),
  easeOfWorkingRating: z.number().min(0).max(5),
  visualDesignRating: z.number().min(0).max(5),
  comment: z.string().min(10, "Written review is required (minimum 10 characters)"),
  eventName: z.string().optional(),
  eventType: z.string().min(1, "Event type is required"),
  eventDate: z.string().min(1, "Event date is required"),
  photo: z.any().optional().refine((file) => !file || file instanceof File, { message: "Invalid file format" }),
});

export default function SpeakerProfile() {
  const { name } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isAccessCodeModalOpen, setIsAccessCodeModalOpen] = useState(false);
  const [selectedProtectedContent, setSelectedProtectedContent] = useState<any>(null);
  const [accessCode, setAccessCode] = useState("");
  
  // Get discovery source from URL query parameter
  const discoverySource = new URLSearchParams(window.location.search).get('source') as 'search' | 'category' | 'featured' | 'direct' || 'direct';

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

  // Fetch speaker content
  const { data: speakerContent, isLoading: contentLoading } = useQuery({
    queryKey: ["/api/speakers/content", speaker?.id],
    queryFn: async () => {
      if (!speaker?.id) return [];
      const response = await fetch(`/api/speakers/${speaker.id}/content`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: Boolean(speaker?.id),
  });

  // Fetch speaker video links (public, respects tier visibility limits)
  const { data: videoLinksData } = useQuery<{
    links: Array<{ id: number; speakerId: number; title: string; url: string; description: string | null; position: number }>;
    tier: string;
    visibleCount: number;
    maxLinks: number;
  }>({
    queryKey: ["/api/speakers/video-links", speaker?.id],
    queryFn: async () => {
      if (!speaker?.id) return { links: [], tier: 'basic', visibleCount: 0, maxLinks: 0 };
      const response = await fetch(`/api/speakers/${speaker.id}/video-links`);
      if (!response.ok) return { links: [], tier: 'basic', visibleCount: 0, maxLinks: 0 };
      return response.json();
    },
    enabled: Boolean(speaker?.id),
  });

  // Fetch speaker upcoming events (public)
  const { data: speakerUpcomingEvents } = useQuery<SpeakerEvent[]>({
    queryKey: ["/api/speakers", speaker?.id, "events"],
    queryFn: async () => {
      if (!speaker?.id) return [];
      const response = await fetch(`/api/speakers/${speaker.id}/events`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!speaker?.id,
  });

  // Fetch speaker topics
  const { data: speakerTopics, isLoading: topicsLoading } = useQuery({
    queryKey: ["/api/speakers", speaker?.id, "topics"],
    queryFn: async () => {
      if (!speaker?.id) return [];
      const response = await fetch(`/api/speakers/${speaker.id}/topics`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!speaker?.id,
  });

  // Initialize speaker tracking (auto-tracks profile view) - only for Premier tier
  const tracking = useSpeakerTracking(speaker?.id || 0, speaker?.subscriptionTier, discoverySource);

  // Track speaker view with Google Analytics
  useEffect(() => {
    if (speaker?.id && speaker?.name) {
      GA_EVENTS.viewSpeaker(speaker.id, speaker.name);
    }
  }, [speaker?.id, speaker?.name]);

  // Check if speaker is bookmarked
  const { data: isBookmarked = false } = useQuery({
    queryKey: [`/api/users/${user?.id}/bookmarks/check/${speaker?.id}`],
    queryFn: async () => {
      if (!user?.id || !speaker?.id) return false;
      const response = await fetch(`/api/users/${user.id}/bookmarks/check/${speaker.id}`);
      if (!response.ok) return false;
      const data = await response.json();
      return data.bookmarked || false;
    },
    enabled: !!user?.id && !!speaker?.id,
    retry: false,
    refetchOnWindowFocus: false,
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
  const [authDialogReason, setAuthDialogReason] = useState<'favorite' | 'download'>('favorite');

  const requireAuth = (reason: 'favorite' | 'download' = 'favorite') => {
    setAuthDialogReason(reason);
    setShowAuthDialog(true);
  };

  const handleFavoriteClick = () => {
    if (!isAuthenticated) {
      requireAuth('favorite');
      return;
    }
    
    toggleBookmarkMutation.mutate();
  };

  const inquiryForm = useForm<z.infer<typeof inquirySchema>>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      clientName: user ? `${user.firstName} ${user.lastName}` : "",
      clientEmail: user?.email || "",
      clientCompany: user?.company || "",
      eventType: "",
      eventDate: "",
      eventLocation: "",
      expectedAttendees: "",
      budget: "",
      message: "",
    },
  });

  // Update form when user data becomes available
  useEffect(() => {
    if (user) {
      inquiryForm.setValue("clientName", `${user.firstName} ${user.lastName}`);
      inquiryForm.setValue("clientEmail", user.email || "");
      inquiryForm.setValue("clientCompany", user.company || "");
    }
  }, [user, inquiryForm]);

  const reviewForm = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      reviewerName: "",
      speakingStyleRating: 0,
      podiumPresenceRating: 0,
      technicalProficiencyRating: 0,
      contentRelevanceRating: 0,
      easeOfWorkingRating: 0,
      visualDesignRating: 0,
      comment: "",
      eventName: "",
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
      return response;
    },
    onSuccess: (_, variables) => {
      // Track inquiry submission (custom analytics)
      tracking.trackInquirySubmit({
        eventType: variables.eventType,
        eventLocation: variables.eventLocation,
        expectedAttendees: variables.expectedAttendees,
        budget: variables.budget
      });
      
      // Track inquiry submission (Google Analytics)
      if (speaker) {
        GA_EVENTS.contactSpeaker(speaker.id, speaker.name);
      }
      
      toast({
        title: "Inquiry Sent",
        description: "Your inquiry has been sent to our admin team for review and forwarding to the speaker.",
      });
      setIsInquiryOpen(false);
      inquiryForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to send inquiry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: z.infer<typeof reviewSchema>) => {
      if (!speaker) throw new Error("Speaker not found");
      
      // Simplified authentication - no longer required
      let userId = 'anonymous-user';
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          userId = user.id;
        } catch (error) {
          // Continue with anonymous user
        }
      }
      
      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append('reviewerName', data.reviewerName);
      if (data.eventName) formData.append('eventName', data.eventName);
      formData.append('speakingStyleRating', data.speakingStyleRating.toString());
      formData.append('podiumPresenceRating', data.podiumPresenceRating.toString());
      formData.append('technicalProficiencyRating', data.technicalProficiencyRating.toString());
      formData.append('contentRelevanceRating', data.contentRelevanceRating.toString());
      formData.append('easeOfWorkingRating', data.easeOfWorkingRating.toString());
      formData.append('visualDesignRating', data.visualDesignRating.toString());
      formData.append('comment', data.comment);
      formData.append('eventType', data.eventType);
      formData.append('eventDate', data.eventDate);
      formData.append('photo', data.photo);
      
      const response = await fetch(`/api/speakers/${speaker.id}/reviews`, {
        method: 'POST',
        headers: {
          'X-User-ID': userId
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit review');
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
        speakingStyleRating: 0,
        podiumPresenceRating: 0,
        technicalProficiencyRating: 0,
        contentRelevanceRating: 0,
        easeOfWorkingRating: 0,
        visualDesignRating: 0,
        comment: "",
        eventName: "",
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
      // Get user authentication for access code downloads
      const userData = localStorage.getItem('userData');
      if (!userData) {
        throw new Error('Authentication required to download content');
      }
      
      let userId;
      try {
        const user = JSON.parse(userData);
        userId = user.id;
      } catch (error) {
        throw new Error('Authentication required to download content');
      }

      // First validate the access code with authentication
      const validateResponse = await fetch(`/api/content/${contentId}/download?accessCode=${accessCode}`, {
        method: 'HEAD',
        headers: {
          'X-User-ID': userId
        }
      });
      
      if (!validateResponse.ok) {
        if (validateResponse.status === 401) {
          throw new Error('Please sign in or create an account to download content');
        }
        throw new Error('Invalid or expired access code');
      }

      // If valid, trigger direct download via window location with user auth
      const downloadUrl = `/api/content/${contentId}/download?accessCode=${accessCode}&userId=${userId}`;
      
      // Use window.open for better download handling in sandboxed environments
      const downloadWindow = window.open(downloadUrl, '_blank');
      
      // Fallback: if popup blocked, try direct navigation
      if (!downloadWindow) {
        window.location.href = downloadUrl;
      }
      
      // Extract filename from headers for return value
      const contentDisposition = validateResponse.headers.get('content-disposition');
      let filename = 'download';
      if (contentDisposition && contentDisposition.includes('filename=')) {
        filename = contentDisposition.split('filename=')[1]?.replace(/"/g, '') || 'download';
      }
      
      return { fileName: filename, success: true };
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
      case 'images': return <Image className="h-5 w-5 text-green-600" />;
      case 'lecture_notes': return <GraduationCap className="h-5 w-5 text-purple-600" />;
      case 'articles': return <Newspaper className="h-5 w-5 text-blue-600" />;
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

  const ContentPreview = ({ content, className = "" }: { content: any; className?: string }) => {
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const isPdf = content.fileType === 'application/pdf';
    const isImage = content.category === 'images' || content.fileType?.startsWith('image/');
    const previewUrl = `/api/content/${content.id}/preview`;

    useEffect(() => {
      if (!isPdf) return;
      let cancelled = false;

      (async () => {
        try {
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

          const loadingTask = pdfjsLib.getDocument(previewUrl);
          const pdf = await loadingTask.promise;
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 1 });

          const scale = 200 / viewport.width;
          const scaledViewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = scaledViewport.width;
          canvas.height = scaledViewport.height;
          const ctx = canvas.getContext('2d');
          if (!ctx || cancelled) return;

          await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
          if (cancelled) return;

          const dataUrl = canvas.toDataURL('image/png');
          setImgSrc(dataUrl);
          setLoading(false);
        } catch (err: any) {
          console.error('PDF preview error:', err?.message || err?.name || JSON.stringify(err) || err);
          if (!cancelled) {
            setError(true);
            setLoading(false);
          }
        }
      })();

      return () => { cancelled = true; };
    }, [isPdf, previewUrl]);

    if (isImage) {
      return (
        <div className={`overflow-hidden rounded-md bg-gray-100 flex items-center justify-center ${className}`}>
          <img
            src={previewUrl}
            alt={content.originalName}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      );
    }

    if (isPdf) {
      if (error) {
        return (
          <div className={`overflow-hidden rounded-md bg-gray-100 flex items-center justify-center ${className}`}>
            <FileText className="h-8 w-8 text-red-400" />
          </div>
        );
      }
      if (imgSrc) {
        return (
          <div className={`overflow-hidden rounded-md bg-gray-100 flex items-center justify-center ${className}`}>
            <img src={imgSrc} alt={content.originalName} className="w-full h-full object-cover" />
          </div>
        );
      }
      return (
        <div className={`overflow-hidden rounded-md bg-gray-100 flex items-center justify-center ${className}`}>
          <div className="animate-pulse"><FileText className="h-8 w-8 text-gray-300" /></div>
        </div>
      );
    }

    return (
      <div className={`overflow-hidden rounded-md bg-gray-100 flex items-center justify-center ${className}`}>
        <div className="p-2">{getFileIcon(content.category)}</div>
      </div>
    );
  };

  const resourceSections = [
    { key: 'lecture_notes', label: 'Lecture Notes', icon: GraduationCap, color: 'text-purple-600' },
    { key: 'articles', label: 'Articles / Publications', icon: Newspaper, color: 'text-blue-600' },
    { key: 'documents', label: 'Documents', icon: FileText, color: 'text-gray-600' },
    { key: 'images', label: 'Images', icon: Image, color: 'text-green-600' },
  ];

  const groupedContent = speakerContent?.reduce((acc: any, content: any) => {
    const category = content.category || 'documents';
    if (!acc[category]) acc[category] = [];
    acc[category].push(content);
    return acc;
  }, {}) || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {speaker && (
        <SEOHead
          title={`${speaker.name} - ${speaker.title}`}
          description={`${speaker.bio.substring(0, 155)}... Book ${speaker.name} for your next healthcare event. ${speaker.expertise.slice(0, 3).join(", ")}.`}
          keywords={`${speaker.name}, ${speaker.expertise.join(", ")}, healthcare speaker, medical speaker, ${speaker.location}`}
          ogImage={speaker.imageUrl}
          ogType="profile"
          author={speaker.name}
          canonicalUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/speaker/${speaker.slug}`}
          structuredData={{
            ...generateSpeakerStructuredData({
              name: speaker.name,
              title: speaker.title,
              bio: speaker.bio,
              imageUrl: speaker.imageUrl,
              location: speaker.location,
              email: speaker.email,
              phone: speaker.phone || undefined,
              website: speaker.website || undefined,
              expertise: speaker.expertise,
              overallRating: speaker.overallRating || undefined,
              reviewCount: speaker.reviewCount || undefined,
            }),
            "@graph": [
              generateSpeakerStructuredData({
                name: speaker.name,
                title: speaker.title,
                bio: speaker.bio,
                imageUrl: speaker.imageUrl,
                location: speaker.location,
                email: speaker.email,
                phone: speaker.phone || undefined,
                website: speaker.website || undefined,
                expertise: speaker.expertise,
                overallRating: speaker.overallRating || undefined,
                reviewCount: speaker.reviewCount || undefined,
              }),
              generateBreadcrumbStructuredData([
                { name: "Home", url: typeof window !== "undefined" ? window.location.origin : "" },
                { name: "Speakers", url: `${typeof window !== "undefined" ? window.location.origin : ""}/speakers` },
                { name: speaker.name, url: `${typeof window !== "undefined" ? window.location.origin : ""}/speaker/${speaker.slug}` },
              ]),
            ],
          }}
        />
      )}
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
                        <TierBadge tier={speaker.subscriptionTier as "basic" | "pro" | "premier"} />
                        {speaker.sdsBadge === 'sds_faculty' && (
                          <Badge className="bg-purple-600 text-white hover:bg-purple-700">
                            SDS Faculty
                          </Badge>
                        )}
                        {speaker.sdsBadge === 'sds' && (
                          <Badge className="bg-indigo-500 text-white hover:bg-indigo-600">
                            SDS
                          </Badge>
                        )}
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
                    </div>
                    
                    <p className="text-xl text-primary font-semibold mb-3">{speaker.title}</p>
                    
                    <div className="flex items-center justify-center md:justify-start gap-6 mb-4">
                      {!speaker.hideRatings && (
                        <div className="flex items-center">
                          <StarRating rating={speaker.overallRating || "0"} size="lg" className="mr-2" />
                          <span className="font-semibold">{parseFloat(speaker.overallRating || "0").toFixed(1)}</span>
                          <span className="text-gray-600 ml-1">({speaker.reviewCount} reviews)</span>
                        </div>
                      )}
                      

                    </div>

                    {!speaker.hideRatings && (
                      <div className="mb-4">
                        <Button 
                          onClick={() => {
                            if (isAuthenticated) {
                              setIsReviewOpen(true);
                            } else {
                              window.location.href = "/auth";
                            }
                          }}
                          className="bg-primary hover:bg-blue-700 text-white"
                        >
                          {isAuthenticated ? (
                            <>
                              <Star className="w-4 h-4 mr-2" />
                              Leave a Review
                            </>
                          ) : (
                            <>
                              <LogIn className="w-4 h-4 mr-2" />
                              Login to leave a review
                            </>
                          )}
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
                      <div onClick={() => tracking.trackShareClick()}>
                        <SocialShare
                          url={window.location.href}
                          title={`${speaker.name} - ${speaker.title}`}
                          description={`Book ${speaker.name} for your next healthcare event. ${speaker.expertise.slice(0, 3).join(", ")}.`}
                        />
                      </div>
                      
                      {/* Social Media Icons (Premier: all, Pro: selected only) */}
                      {!speaker.hideSocial && (
                        ((speaker.subscriptionTier ?? 'basic') === 'premier' && (speaker.instagramHandle || speaker.linkedinHandle || speaker.facebookHandle || speaker.xHandle || speaker.tiktokHandle || (speaker.socialMedia && speaker.socialMedia.length > 0))) ||
                        ((speaker.subscriptionTier ?? 'basic') === 'pro' && speaker.selectedSocialPlatform && (
                          (speaker.selectedSocialPlatform === 'instagram' && speaker.instagramHandle) ||
                          (speaker.selectedSocialPlatform === 'linkedin' && speaker.linkedinHandle) ||
                          (speaker.selectedSocialPlatform === 'facebook' && speaker.facebookHandle) ||
                          (speaker.selectedSocialPlatform === 'x' && speaker.xHandle) ||
                          (speaker.selectedSocialPlatform === 'tiktok' && speaker.tiktokHandle)
                        ))
                      ) && (
                        <div className="flex items-center gap-2 ml-4">
                          {speaker.instagramHandle && (
                            speaker.subscriptionTier === 'premier' || (speaker.subscriptionTier === 'pro' && speaker.selectedSocialPlatform === 'instagram')
                          ) && (
                            <a 
                              href={speaker.instagramHandle.includes('instagram.com') ? speaker.instagramHandle : `https://instagram.com/${speaker.instagramHandle}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={() => tracking.trackSocialClick('instagram')}
                              className="text-gray-500 hover:text-pink-600 transition-colors"
                              title={`Follow ${speaker.name} on Instagram`}
                            >
                              <FaInstagram className="w-4 h-4" />
                            </a>
                          )}
                          {speaker.linkedinHandle && (
                            speaker.subscriptionTier === 'premier' || (speaker.subscriptionTier === 'pro' && speaker.selectedSocialPlatform === 'linkedin')
                          ) && (
                            <a 
                              href={speaker.linkedinHandle.includes('linkedin.com') ? speaker.linkedinHandle : `https://linkedin.com/in/${speaker.linkedinHandle}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={() => tracking.trackSocialClick('linkedin')}
                              className="text-gray-500 hover:text-blue-600 transition-colors"
                              title={`Connect with ${speaker.name} on LinkedIn`}
                            >
                              <FaLinkedin className="w-4 h-4" />
                            </a>
                          )}
                          {speaker.facebookHandle && (
                            speaker.subscriptionTier === 'premier' || (speaker.subscriptionTier === 'pro' && speaker.selectedSocialPlatform === 'facebook')
                          ) && (
                            <a 
                              href={speaker.facebookHandle.includes('facebook.com') ? speaker.facebookHandle : `https://facebook.com/${speaker.facebookHandle}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={() => tracking.trackSocialClick('facebook')}
                              className="text-gray-500 hover:text-blue-700 transition-colors"
                              title={`Follow ${speaker.name} on Facebook`}
                            >
                              <FaFacebook className="w-4 h-4" />
                            </a>
                          )}
                          {speaker.xHandle && (
                            speaker.subscriptionTier === 'premier' || (speaker.subscriptionTier === 'pro' && speaker.selectedSocialPlatform === 'x')
                          ) && (
                            <a 
                              href={speaker.xHandle.includes('x.com') || speaker.xHandle.includes('twitter.com') ? speaker.xHandle : `https://x.com/${speaker.xHandle}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={() => tracking.trackSocialClick('x')}
                              className="text-gray-500 hover:text-gray-900 transition-colors"
                              title={`Follow ${speaker.name} on X`}
                            >
                              <FaXTwitter className="w-4 h-4" />
                            </a>
                          )}
                          {speaker.tiktokHandle && (
                            speaker.subscriptionTier === 'premier' || (speaker.subscriptionTier === 'pro' && speaker.selectedSocialPlatform === 'tiktok')
                          ) && (
                            <a 
                              href={speaker.tiktokHandle.includes('tiktok.com') ? speaker.tiktokHandle : `https://tiktok.com/@${speaker.tiktokHandle}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={() => tracking.trackSocialClick('tiktok')}
                              className="text-gray-500 hover:text-gray-900 transition-colors"
                              title={`Follow ${speaker.name} on TikTok`}
                            >
                              <FaTiktok className="w-4 h-4" />
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
                                  onClick={() => tracking.trackSocialClick('instagram')}
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
                                  onClick={() => tracking.trackSocialClick('linkedin')}
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
                                  onClick={() => tracking.trackSocialClick('facebook')}
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
                                  onClick={() => tracking.trackSocialClick('x')}
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
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              {(() => {
                const hasEvents = speakerUpcomingEvents && speakerUpcomingEvents.length > 0;
                // Use static Tailwind classes so purging doesn't remove them
                const colsClass =
                  speaker.hideRatings && !hasEvents ? 'grid-cols-4'
                  : !speaker.hideRatings && !hasEvents ? 'grid-cols-5'
                  : speaker.hideRatings && hasEvents ? 'grid-cols-5'
                  : 'grid-cols-6'; // !hideRatings && hasEvents
                return (
                  <TabsList className={`grid w-full ${colsClass}`}>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="experience">Experience</TabsTrigger>
                    <TabsTrigger value="topics">Topics</TabsTrigger>
                    <TabsTrigger value="resources">Speaker Resources</TabsTrigger>
                    {hasEvents && <TabsTrigger value="events">Events</TabsTrigger>}
                    {!speaker.hideRatings && <TabsTrigger value="reviews">Reviews</TabsTrigger>}
                  </TabsList>
                );
              })()}

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed mb-6">{speaker.bio}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Speaking Topics</h3>
                        <div className="flex flex-wrap gap-2">
                          {topicsLoading ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                              <span className="text-sm text-muted-foreground">Loading...</span>
                            </div>
                          ) : (
                            speakerTopics?.map((topic: any) => (
                              <Badge 
                                key={topic.id} 
                                variant="secondary"
                                className="cursor-pointer hover:bg-secondary/80 transition-colors"
                                onClick={() => tracking.trackTagClick(topic.name)}
                              >
                                {topic.name}
                              </Badge>
                            )) || []
                          )}
                          {(!topicsLoading && (!speakerTopics || speakerTopics.length === 0)) && (
                            <span className="text-sm text-muted-foreground">No topics available</span>
                          )}
                        </div>
                      </div>
                      

                    </div>
                  </CardContent>
                </Card>

                {/* Video Portfolio */}
                <SpeakerVideoPortfolio speakerId={speaker.id} />

                {/* Recent Resources */}
                {speakerContent && speakerContent.length > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FolderOpen className="h-5 w-5" />
                        Recent Resources
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {speakerContent.slice(0, 3).map((content: any) => (
                          <div key={content.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border">
                            <ContentPreview content={content} className="w-14 h-14 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{content.originalName}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(content.fileSize)}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-shrink-0"
                              onClick={async () => {
                                if (!isAuthenticated) {
                                  requireAuth('download');
                                  return;
                                }
                                if (content.requiresAccessCode) {
                                  setSelectedProtectedContent(content);
                                  setIsAccessCodeModalOpen(true);
                                  return;
                                }
                                tracking.trackInteraction('resource_download', content.originalName);
                                const userData = localStorage.getItem('userData');
                                if (!userData) {
                                  requireAuth('download');
                                  return;
                                }
                                let userId;
                                try {
                                  const user = JSON.parse(userData);
                                  userId = user.id;
                                } catch (error) {
                                  requireAuth('download');
                                  return;
                                }
                                try {
                                  const response = await fetch(`/api/content/${content.id}/download`, {
                                    method: 'GET',
                                    headers: { 'X-User-ID': userId }
                                  });
                                  if (response.ok) {
                                    const contentType = response.headers.get('content-type');
                                    if (contentType && contentType.includes('application/json')) {
                                      return;
                                    }
                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = content.originalName || 'download';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    window.URL.revokeObjectURL(url);
                                  } else if (response.status === 401) {
                                    requireAuth('download');
                                  }
                                } catch (error) {
                                  console.error('Download error:', error);
                                }
                              }}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              {!isAuthenticated ? "Login" : content.requiresAccessCode ? "Access Code" : "Download"}
                            </Button>
                          </div>
                        ))}
                        {speakerContent.length > 3 && (
                          <div className="pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => setActiveTab("resources")}
                            >
                              View All {speakerContent.length} Resources
                            </Button>
                          </div>
                        )}
                      </div>
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
                    <p className="text-muted-foreground">Areas of expertise and specialized knowledge</p>
                  </CardHeader>
                  <CardContent>
                    {topicsLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2 text-muted-foreground">Loading topics...</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {speakerTopics?.map((topic: any) => (
                          <Badge key={topic.id} variant="secondary" className="text-sm px-3 py-1">
                            {topic.name}
                          </Badge>
                        )) || []}
                        {(!speakerTopics || speakerTopics.length === 0) && (
                          <p className="text-muted-foreground">No specific topics available for this speaker.</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Upcoming Events Tab */}
              {speakerUpcomingEvents && speakerUpcomingEvents.length > 0 && (
                <TabsContent value="events">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Upcoming Events
                      </CardTitle>
                      <p className="text-muted-foreground">Speaking engagements and upcoming appearances</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {speakerUpcomingEvents.map((event: SpeakerEvent) => (
                          <div key={event.id} className="border rounded-lg overflow-hidden">
                            {(event as any).imageUrl && (
                              <img
                                src={(event as any).imageUrl}
                                alt={event.eventName}
                                className="w-full h-48 object-cover"
                              />
                            )}
                            <div className="flex items-start gap-4 p-4">
                              <div className="flex-shrink-0 text-center min-w-[60px]">
                                <div className="bg-primary/10 rounded-lg p-2">
                                  <Calendar className="h-5 w-5 text-primary mx-auto" />
                                  <p className="text-xs font-medium text-primary mt-1">
                                    {new Date(event.eventDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </p>
                                </div>
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className="font-semibold">{event.eventName}</p>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span>{new Date(event.eventDate + 'T00:00:00').getFullYear()}</span>
                                  {event.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3.5 w-3.5" /> {event.location}
                                    </span>
                                  )}
                                </div>
                                {event.eventUrl && (
                                  <a
                                    href={/^https?:\/\//i.test(event.eventUrl) ? event.eventUrl : `https://${event.eventUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" /> Event details
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

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

                  {(speakerContent && speakerContent.length > 0) || (videoLinksData && videoLinksData.links.length > 0) ? (
                    <div className="space-y-6">
                      {resourceSections
                        .filter(sec => groupedContent[sec.key] && groupedContent[sec.key].length > 0)
                        .map((sec) => {
                          const SectionIcon = sec.icon;
                          const contents = groupedContent[sec.key];
                          return (
                        <Card key={sec.key}>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <SectionIcon className={`h-5 w-5 ${sec.color}`} />
                              {sec.label}
                              <Badge variant="outline">{contents.length} {contents.length === 1 ? 'file' : 'files'}</Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="px-6 py-4">
                            <div className="flex flex-wrap gap-3">
                              {contents.map((content: any) => (
                                <div key={content.id} className="flex flex-col items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-2.5 hover:shadow-md transition-shadow w-36 h-44">
                                  <div className="flex-1 flex flex-col items-center justify-center w-full">
                                    <ContentPreview content={content} className="w-full h-20 mb-1" />
                                    <h4 className="font-medium text-gray-900 text-[11px] text-center line-clamp-2 w-full leading-tight">{content.originalName}</h4>
                                    <span className="text-[9px] text-gray-500 mt-0.5">{formatFileSize(content.fileSize)}</span>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      if (!isAuthenticated) {
                                        requireAuth('download');
                                        return;
                                      }
                                      if (content.requiresAccessCode) {
                                        setSelectedProtectedContent(content);
                                        setIsAccessCodeModalOpen(true);
                                        return;
                                      }
                                      tracking.trackInteraction('resource_download', content.originalName);
                                      const userData = localStorage.getItem('userData');
                                      if (!userData) {
                                        requireAuth('download');
                                        return;
                                      }
                                      let userId;
                                      try {
                                        const user = JSON.parse(userData);
                                        userId = user.id;
                                      } catch (error) {
                                        requireAuth('download');
                                        return;
                                      }
                                      try {
                                        const response = await fetch(`/api/content/${content.id}/download`, {
                                          method: 'GET',
                                          headers: { 'X-User-ID': userId }
                                        });
                                        if (response.ok) {
                                          const contentType = response.headers.get('content-type');
                                          if (contentType && contentType.includes('application/json')) {
                                            return;
                                          }
                                          const blob = await response.blob();
                                          const url = window.URL.createObjectURL(blob);
                                          const link = document.createElement('a');
                                          link.href = url;
                                          link.download = content.originalName || 'download';
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                          window.URL.revokeObjectURL(url);
                                        } else if (response.status === 401) {
                                          requireAuth('download');
                                        } else {
                                          console.error('Download failed:', response.statusText);
                                        }
                                      } catch (error) {
                                        console.error('Download error:', error);
                                      }
                                    }}
                                    className="flex items-center gap-0.5 mt-1.5 w-full justify-center text-[10px] h-6 px-1"
                                  >
                                    <Download className="h-2.5 w-2.5" />
                                    {!isAuthenticated ? "Sign In" : content.requiresAccessCode ? "Access Code" : "Download"}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                          );
                        })}

                      {videoLinksData && videoLinksData.links.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Video className="h-5 w-5 text-red-600" />
                              Videos
                              <Badge variant="outline">{videoLinksData.links.length} {videoLinksData.links.length === 1 ? 'video' : 'videos'}</Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="px-6 py-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              {videoLinksData.links.map((link) => {
                                const thumbnail = link.thumbnailUrl || getVideoThumbnail(link.url);
                                return (
                                  <a
                                    key={link.id}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => tracking.trackInteraction('video_link_click', link.title)}
                                    className="block"
                                  >
                                    <div className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow overflow-hidden group cursor-pointer">
                                      {thumbnail ? (
                                        <div className="relative aspect-video bg-gray-100">
                                          <img
                                            src={thumbnail}
                                            alt={link.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              const target = e.target as HTMLImageElement;
                                              target.style.display = 'none';
                                              target.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                                              const fallback = document.createElement('div');
                                              fallback.className = 'p-4 bg-red-100 rounded-lg';
                                              fallback.innerHTML = '<svg class="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
                                              target.parentElement!.appendChild(fallback);
                                            }}
                                          />
                                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="bg-white/90 rounded-full p-3">
                                              <Video className="h-6 w-6 text-red-600" />
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="aspect-video bg-gray-100 flex items-center justify-center">
                                          <div className="p-4 bg-red-100 rounded-lg">
                                            <Video className="h-8 w-8 text-red-600" />
                                          </div>
                                        </div>
                                      )}
                                      <div className="p-4">
                                        <h4 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">{link.title}</h4>
                                        {link.description && (
                                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{link.description}</p>
                                        )}
                                      </div>
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      )}
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
                          if (isAuthenticated) {
                            setIsReviewOpen(true);
                          } else {
                            window.location.href = "/auth";
                          }
                        }}
                      >
                        {isAuthenticated ? (
                          <>
                            <Star className="w-4 h-4 mr-2" />
                            Leave a Review
                          </>
                        ) : (
                          <>
                            <LogIn className="w-4 h-4 mr-2" />
                            Login to leave a review
                          </>
                        )}
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
                                  {(review.reviewerTitle || review.reviewerCompany) && (
                                    <p className="text-sm text-gray-600">
                                      {[review.reviewerTitle, review.reviewerCompany].filter(Boolean).join(" at ")}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center">
                                  <StarRating rating={review.overallRating || "0"} size="md" className="mr-2" />
                                  <span className="text-sm font-medium">{parseFloat(review.overallRating || "0").toFixed(1)}/5</span>
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

            {/* Recent Reviews */}
            {!speaker.hideRatings && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Reviews</CardTitle>
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
                        <div key={review.id} className="border-l-4 border-primary bg-gray-50 p-3 rounded-r-lg">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <h5 className="font-semibold text-sm">{review.reviewerName}</h5>
                              <p className="text-xs text-gray-600">{review.reviewerTitle}</p>
                            </div>
                            <div className="flex items-center">
                              <StarRating rating={review.overallRating || "0"} size="sm" className="mr-1" />
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm line-clamp-2">"{review.comment}"</p>
                          <div className="text-xs text-gray-500 mt-1">
                            {review.eventType} • {review.eventDate}
                            {review.verified && (
                              <span className="ml-2 inline-flex items-center">
                                <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {reviews.length > 3 && (
                        <div className="pt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full"
                            onClick={() => setActiveTab("reviews")}
                          >
                            View All {reviews.length} Reviews
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <Star className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm mb-1">No reviews yet</p>
                      <Button 
                        onClick={() => {
                          if (isAuthenticated) {
                            setIsReviewOpen(true);
                          } else {
                            window.location.href = "/auth";
                          }
                        }}
                        className="mt-2"
                        size="sm"
                      >
                        {isAuthenticated ? (
                          <>
                            <Star className="w-4 h-4 mr-2" />
                            Leave a Review
                          </>
                        ) : (
                          <>
                            <LogIn className="w-4 h-4 mr-2" />
                            Login to review
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>

      <Footer />

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Leave a Review for {speaker?.name}</DialogTitle>
            <DialogDescription>
              Please rate the speaker in each category and provide detailed feedback about your experience.
            </DialogDescription>
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
                {/* Rating Categories */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Rate Each Category *</h3>
                  <p className="text-sm text-gray-600">Please rate the speaker in each of the following areas:</p>
                  
                  {/* Speaking Style Rating */}
                  <FormField
                    control={reviewForm.control}
                    name="speakingStyleRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Speaking Style</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                className="focus:outline-none"
                                onClick={() => field.onChange(star)}
                              >
                                <Star
                                  className={`w-6 h-6 transition-colors ${
                                    star <= field.value
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="ml-2 text-sm text-gray-600">{field.value}/5</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Podium Presence Rating */}
                  <FormField
                    control={reviewForm.control}
                    name="podiumPresenceRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Podium Presence</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                className="focus:outline-none"
                                onClick={() => field.onChange(star)}
                              >
                                <Star
                                  className={`w-6 h-6 transition-colors ${
                                    star <= field.value
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="ml-2 text-sm text-gray-600">{field.value}/5</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Technical Proficiency Rating */}
                  <FormField
                    control={reviewForm.control}
                    name="technicalProficiencyRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Technical Proficiency</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                className="focus:outline-none"
                                onClick={() => field.onChange(star)}
                              >
                                <Star
                                  className={`w-6 h-6 transition-colors ${
                                    star <= field.value
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="ml-2 text-sm text-gray-600">{field.value}/5</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Content Relevance Rating */}
                  <FormField
                    control={reviewForm.control}
                    name="contentRelevanceRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content Relevance</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                className="focus:outline-none"
                                onClick={() => field.onChange(star)}
                              >
                                <Star
                                  className={`w-6 h-6 transition-colors ${
                                    star <= field.value
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="ml-2 text-sm text-gray-600">{field.value}/5</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Ease of Working Rating */}
                  <FormField
                    control={reviewForm.control}
                    name="easeOfWorkingRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ease of Working</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                className="focus:outline-none"
                                onClick={() => field.onChange(star)}
                              >
                                <Star
                                  className={`w-6 h-6 transition-colors ${
                                    star <= field.value
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="ml-2 text-sm text-gray-600">{field.value}/5</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Visual Design Rating */}
                  <FormField
                    control={reviewForm.control}
                    name="visualDesignRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visual Design</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                className="focus:outline-none"
                                onClick={() => field.onChange(star)}
                              >
                                <Star
                                  className={`w-6 h-6 transition-colors ${
                                    star <= field.value
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              </button>
                            ))}
                            <span className="ml-2 text-sm text-gray-600">{field.value}/5</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={reviewForm.control}
                name="eventName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Annual Healthcare Summit 2025" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                    <FormLabel>Photo from Audience (Optional)</FormLabel>
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
                          Upload a photo of the speaker presenting to your audience (optional)
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
              {authDialogReason === 'download' ? (
                <>
                  <Download className="w-5 h-5 text-[#1e4347]" />
                  Account Required to Download
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5 text-red-500" />
                  Save Your Favorite Speakers
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {authDialogReason === 'download'
                ? "You need a free account to download content from speaker profiles. Sign in or create an account to get started — it only takes a moment."
                : "Create an account or sign in to save speakers to your favorites and access them anytime."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <Button 
              onClick={() => window.location.href = '/auth'}
              className="w-full text-white"
              style={{ backgroundColor: '#1e4347' }}
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
              className="w-full border-[#1e4347] text-[#1e4347] hover:bg-[#1e4347] hover:text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create a Free Account
            </Button>
            
            <div className="text-center text-sm text-gray-600">
              <p>With a free account you can:</p>
              <ul className="mt-2 space-y-1 text-xs text-left inline-block">
                {authDialogReason === 'download' ? (
                  <>
                    <li>• Download resources from speaker profiles</li>
                    <li>• Save your favorite speakers</li>
                    <li>• Leave reviews and ratings</li>
                    <li>• Track your download history</li>
                  </>
                ) : (
                  <>
                    <li>• Save your favorite speakers</li>
                    <li>• Download speaker resources</li>
                    <li>• Leave reviews and ratings</li>
                    <li>• Get personalized recommendations</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}