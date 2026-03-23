import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip as ShadcnTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import StorageUsage from "@/components/StorageUsage";
import { useTierLimit, useTierLimits, getTierLimitValue, isWithinLimit, isNearLimit, getUsagePercentage, formatTierLimit } from "@/hooks/useTierLimits";
import { cn } from "@/lib/utils";
// import { useAuth } from "@/providers/AuthProvider";
import { 
  User, 
  Edit3, 
  Save, 
  Eye, 
  Star, 
  Calendar, 
  MapPin, 
  Globe, 
  Award,
  BookOpen,
  Languages,
  Building,
  ExternalLink,
  Home,
  Crown,
  Check,
  Zap,
  TrendingUp,
  Upload,
  FileText,
  Image,
  Video,
  Music,
  Download,
  Trash2,
  Plus,
  EyeOff,
  Camera,
  Lock,
  AlertTriangle,
  Clock,
  Heart,
  Share2,
  Search,
  X
} from "lucide-react";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import QRCodeStyling from 'qr-code-styling';
import devRightLogo from '@assets/DevRight_icon_-_Black_1766077810725.png';

// Styled QR Code Component with circular dots
function StyledQRCode({ value, logoSrc, speakerName }: { value: string; logoSrc: string; speakerName?: string }) {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    if (!qrCodeRef.current) {
      qrCodeRef.current = new QRCodeStyling({
        width: 180,
        height: 180,
        type: 'svg',
        data: value,
        image: logoSrc,
        margin: 10,
        qrOptions: {
          errorCorrectionLevel: 'H' // High error correction for better scanning
        },
        dotsOptions: {
          color: '#1e4347',
          type: 'rounded' // Rounded squares - scannable and looks nice
        },
        cornersSquareOptions: {
          color: '#1e4347',
          type: 'extra-rounded'
        },
        cornersDotOptions: {
          color: '#1e4347',
          type: 'dot'
        },
        backgroundOptions: {
          color: '#ffffff',
        },
        imageOptions: {
          crossOrigin: 'anonymous',
          margin: 8,
          imageSize: 0.3,
          hideBackgroundDots: true
        }
      });
    }
    
    if (qrRef.current && qrRef.current.childNodes.length === 0) {
      qrCodeRef.current.append(qrRef.current);
    }
  }, [value, logoSrc]);

  useEffect(() => {
    if (qrCodeRef.current) {
      qrCodeRef.current.update({ data: value });
    }
  }, [value]);

  const handleDownload = async () => {
    // Create high-resolution QR for download
    const downloadQR = new QRCodeStyling({
      width: 1024,
      height: 1024,
      type: 'canvas',
      data: value,
      image: logoSrc,
      margin: 40,
      qrOptions: {
        errorCorrectionLevel: 'H' // High error correction for better scanning
      },
      dotsOptions: {
        color: '#1e4347',
        type: 'rounded' // Rounded squares - scannable and looks nice
      },
      cornersSquareOptions: {
        color: '#1e4347',
        type: 'extra-rounded'
      },
      cornersDotOptions: {
        color: '#1e4347',
        type: 'dot'
      },
      backgroundOptions: {
        color: '#ffffff',
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 20,
        imageSize: 0.3,
        hideBackgroundDots: true
      }
    });
    
    downloadQR.download({
      name: `${speakerName?.replace(/\s+/g, '-') || 'speaker'}-qr-code`,
      extension: 'png'
    });
  };

  return (
    <div className="space-y-4">
      <div 
        className="flex justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border shadow-sm" 
        data-testid="qr-code-container"
      >
        <div ref={qrRef} />
      </div>
      <Button
        variant="outline"
        className="w-full"
        onClick={handleDownload}
        data-testid="button-download-qr"
      >
        <Download className="h-4 w-4 mr-2" />
        Download QR Code
      </Button>
    </div>
  );
}

export default function SpeakerDashboard() {
  // const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [selectedContentForAccessCodes, setSelectedContentForAccessCodes] = useState<any>(null);
  const [newAccessCode, setNewAccessCode] = useState({
    code: '',
    description: '',
    expiresAt: '',
    maxUses: ''
  });
  
  // Reviews pagination and expand/collapse state
  const [currentReviewPage, setCurrentReviewPage] = useState(1);
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());
  const reviewsPerPage = 10;
  
  // Topics management state
  const [isEditingTopics, setIsEditingTopics] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
  const [topicSearchTerm, setTopicSearchTerm] = useState('');
  const [topicCategoryFilter, setTopicCategoryFilter] = useState<string>('all');
  
  // New achievement state
  const [newAchievement, setNewAchievement] = useState('');
  
  // Change password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  
  // Cancel subscription state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationData, setCancellationData] = useState({
    primaryReason: '',
    wouldRecommend: '',
    missingFeatures: '',
    additionalFeedback: ''
  });

  // Video links state
  const [showAddVideoLinkDialog, setShowAddVideoLinkDialog] = useState(false);
  const [editingVideoLink, setEditingVideoLink] = useState<{id: number; title: string; url: string; description: string | null} | null>(null);
  const [newVideoLink, setNewVideoLink] = useState({ title: '', url: '', description: '' });

  // Analytics time range state
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<string>('all');

  // Helper functions for reviews
  const toggleReviewExpanded = (reviewId: number) => {
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReviews(newExpanded);
  };

  const getPaginatedReviews = (reviews: any[]) => {
    const startIndex = (currentReviewPage - 1) * reviewsPerPage;
    const endIndex = startIndex + reviewsPerPage;
    return reviews.slice(startIndex, endIndex);
  };

  const getTotalReviewPages = (reviews: any[]) => {
    return Math.ceil(reviews.length / reviewsPerPage);
  };


  // Download handler that properly handles errors
  const handleDownload = async (contentId: number, originalName: string) => {
    try {
      const userData = getUserData();
      const response = await fetch(`/api/content/${contentId}/download`, {
        method: 'GET',
        credentials: 'include', // Include session cookies
        headers: {
          'X-User-ID': userData?.id || localStorage.getItem('userId') || ''
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({
          title: "Download Failed",
          description: errorData.details || errorData.error || "Failed to download file",
          variant: "destructive",
        });
        return;
      }

      // Create download blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `"${originalName}" is now downloading`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Error",
        description: "An unexpected error occurred while downloading the file",
        variant: "destructive",
      });
    }
  };

  // Get user data from localStorage
  const getUserData = () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  };

  const user = getUserData();

  // Fetch speaker profile data
  const { data: speakerProfile, isLoading } = useQuery({
    queryKey: ['/api/speakers/by-user', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/speakers/by-user/${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch speaker profile');
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch tier limits for current speaker's tier
  const { data: tierLimits } = useTierLimit(speakerProfile?.subscriptionTier || 'basic');

  // Helper to count words in bio
  const countWords = (text: string) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Get current bio word count and limit
  const bioWordCount = countWords(editForm.bio || speakerProfile?.bio || '');
  const bioWordLimit = getTierLimitValue(tierLimits, 'bioWordLimit');
  const bioOverLimit = bioWordLimit !== null && !isWithinLimit(bioWordCount, bioWordLimit);
  const bioNearLimit = bioWordLimit !== null && isNearLimit(bioWordCount, bioWordLimit, 0.9);

  // Get topic count and limit
  const topicLimit = getTierLimitValue(tierLimits, 'topicLimit');
  
  // Get upload limit (count calculated after speakerContent query)
  const uploadLimit = getTierLimitValue(tierLimits, 'uploadLimit');
  
  // Get storage limit in MB
  const storageLimitMb = tierLimits?.storageLimitMb || null;

  // Fetch speaker analytics for Premier tier speakers
  const { data: speakerAnalytics } = useQuery({
    queryKey: ['/api/analytics/speaker', speakerProfile?.id, analyticsTimeframe],
    queryFn: async () => {
      if (!speakerProfile?.id) return null;
      const url = analyticsTimeframe === 'all' 
        ? `/api/analytics/speaker/${speakerProfile.id}`
        : `/api/analytics/speaker/${speakerProfile.id}?timeframe=${analyticsTimeframe}`;
      const response = await fetch(url, {
        headers: {
          'X-User-ID': user?.id || ''
        },
        credentials: 'include'
      });
      if (!response.ok) {
        // Return null for non-Premier speakers or access denied
        return null;
      }
      return response.json();
    },
    enabled: !!speakerProfile?.id,
  });
  
  // Map analytics data to match previous userStats structure
  // For non-Premier tiers, only profileViews is shown - everything else is zeroed out
  const isPremier = speakerProfile?.subscriptionTier === 'premier';
  const defaultStats = { 
    profileViews: 0, 
    emailClicks: 0, 
    phoneClicks: 0, 
    websiteClicks: 0,
    searchAppearances: 0,
    socialClicks: 0,
    shareClicks: 0,
    favoritesCount: 0,
    reviewsCount: 0,
    avgTimeOnProfile: 0,
    downloads: [],
    totalDownloads: 0,
    engagementClicks: 0,
    discoverySources: {
      search: 0,
      category: 0,
      featured: 0,
      direct: 0
    },
    socialClicksByPlatform: {
      instagram: 0,
      facebook: 0,
      x: 0,
      linkedin: 0,
      tiktok: 0
    },
    interactionsOverTime: [],
    last7Days: { views: 0, clicks: 0, shares: 0, downloads: 0 }
  };
  
  // For Premier: show all real data. For Basic/Pro: only show profileViews, zero everything else
  const userStats = isPremier 
    ? (speakerAnalytics || defaultStats)
    : { 
        ...defaultStats, 
        profileViews: speakerAnalytics?.profileViews || 0 
      };

  const { data: speakerReviews } = useQuery({
    queryKey: ['/api/speakers/reviews', speakerProfile?.id],
    queryFn: async () => {
      const response = await fetch(`/api/speakers/${speakerProfile?.id}/reviews`);
      if (!response.ok) throw new Error('Failed to fetch speaker reviews');
      return response.json();
    },
    enabled: !!speakerProfile?.id,
  });

  // Fetch speaker topics
  const { data: speakerTopics, refetch: refetchSpeakerTopics } = useQuery({
    queryKey: ['/api/speakers/topics', speakerProfile?.id],
    queryFn: async () => {
      const response = await fetch(`/api/speakers/${speakerProfile?.id}/topics`);
      if (!response.ok) throw new Error('Failed to fetch speaker topics');
      return response.json();
    },
    enabled: !!speakerProfile?.id,
  });

  // Fetch all available topics
  const { data: allTopics } = useQuery({
    queryKey: ['/api/topics'],
    queryFn: async () => {
      const response = await fetch('/api/topics');
      if (!response.ok) throw new Error('Failed to fetch topics');
      return response.json();
    },
  });

  // Fetch speaker content
  const { data: speakerContent, refetch: refetchContent } = useQuery({
    queryKey: ['/api/speakers/content/all', speakerProfile?.id],
    queryFn: async () => {
      const response = await fetch(`/api/speakers/${speakerProfile?.id}/content/all`);
      if (!response.ok) throw new Error('Failed to fetch speaker content');
      return response.json();
    },
    enabled: !!speakerProfile?.id,
  });

  // Calculate upload count after speakerContent is defined
  const currentUploadCount = speakerContent?.length || 0;

  // Fetch storage usage (Phase 2)
  const { data: storageUsage } = useQuery({
    queryKey: ['/api/speakers/storage', speakerProfile?.id],
    queryFn: async () => {
      const response = await fetch(`/api/speakers/${speakerProfile?.id}/storage`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch storage usage');
      return response.json();
    },
    enabled: !!speakerProfile?.id,
  });

  // Fetch access codes for selected content
  const { data: accessCodes, refetch: refetchAccessCodes } = useQuery({
    queryKey: ['/api/content/access-codes', selectedContentForAccessCodes?.id],
    queryFn: async () => {
      const userData = getUserData();
      const response = await fetch(`/api/content/${selectedContentForAccessCodes?.id}/access-codes`, {
        headers: {
          'X-User-ID': userData?.id || localStorage.getItem('userId') || ''
        }
      });
      if (!response.ok) throw new Error('Failed to fetch access codes');
      return response.json();
    },
    enabled: !!selectedContentForAccessCodes?.id,
  });

  // Fetch download analytics
  const { data: downloadAnalytics } = useQuery({
    queryKey: ['/api/speakers/downloads', speakerProfile?.id],
    queryFn: async () => {
      const userData = getUserData();
      const response = await fetch(`/api/speakers/${speakerProfile?.id}/downloads`, {
        headers: {
          'X-User-ID': userData?.id || localStorage.getItem('userId') || ''
        }
      });
      if (!response.ok) throw new Error('Failed to fetch download analytics');
      return response.json();
    },
    enabled: !!speakerProfile?.id,
  });

  // Fetch video links for speaker dashboard (all links, not just visible)
  const { data: videoLinksData, refetch: refetchVideoLinks } = useQuery<{
    links: Array<{ id: number; speakerId: number; title: string; url: string; description: string | null; position: number; isVisible: boolean }>;
    tier: string;
    visibleCount: number;
    maxLinks: number;
    currentCount: number;
    currentVisibleCount: number;
  }>({
    queryKey: ['/api/speakers/video-links/all', speakerProfile?.id],
    queryFn: async () => {
      const userData = getUserData();
      const response = await fetch(`/api/speakers/${speakerProfile?.id}/video-links/all`, {
        headers: {
          'X-User-ID': userData?.id || localStorage.getItem('userId') || ''
        }
      });
      if (!response.ok) throw new Error('Failed to fetch video links');
      return response.json();
    },
    enabled: !!speakerProfile?.id,
  });

  // Fetch subscription status
  const { data: subscriptionStatus } = useQuery<{
    tier: string;
    status: string;
    periodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    cancelledAt: Date | null;
  }>({
    queryKey: ["/api/subscriptions/status", speakerProfile?.id],
    enabled: !!speakerProfile?.id,
  });

  // Fetch all tier limits for subscription tab display
  const { data: allTierLimits, isLoading: allTierLimitsLoading } = useTierLimits();

  // Update speaker profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/speakers/${speakerProfile?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/speakers/by-user', user?.id] });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your speaker profile has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // File upload mutation
  const uploadContentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Get user token for authentication
      const userToken = localStorage.getItem('userToken');
      
      const headers: Record<string, string> = {};
      if (userToken) {
        headers['X-User-ID'] = userToken;
      }
      
      const response = await fetch(`/api/speakers/${speakerProfile?.id}/content`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include', // Include session cookie
      });
      if (!response.ok) throw new Error('Failed to upload content');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/speakers/content/all', speakerProfile?.id] });
      refetchContent();
      toast({
        title: "Content Uploaded",
        description: "Your file has been uploaded successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: async (contentId: number) => {
      const response = await fetch(`/api/content/${contentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete content');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/speakers/content/all', speakerProfile?.id] });
      refetchContent();
      toast({
        title: "Content Deleted",
        description: "Your file has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update content mutation
  const updateContentMutation = useMutation({
    mutationFn: async ({ contentId, isPublic }: { contentId: number; isPublic: boolean }) => {
      const response = await fetch(`/api/content/${contentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublic }),
      });
      if (!response.ok) throw new Error('Failed to update content visibility');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/speakers/content/all', speakerProfile?.id] });
      refetchContent();
      toast({
        title: "Visibility Updated",
        description: "Content visibility has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update content visibility. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create access code mutation
  const createAccessCodeMutation = useMutation({
    mutationFn: async (data: any) => {
      const userData = getUserData();
      const response = await fetch(`/api/content/${selectedContentForAccessCodes?.id}/access-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userData?.id || localStorage.getItem('userId') || ''
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create access code');
      return response.json();
    },
    onSuccess: () => {
      refetchAccessCodes();
      setNewAccessCode({ code: '', description: '', expiresAt: '', maxUses: '' });
      toast({
        title: "Access Code Created",
        description: "New access code has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create access code. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create video link mutation
  const createVideoLinkMutation = useMutation({
    mutationFn: async (data: { title: string; url: string; description?: string }) => {
      const userData = getUserData();
      const response = await fetch(`/api/speakers/${speakerProfile?.id}/video-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userData?.id || localStorage.getItem('userId') || ''
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create video link');
      }
      return response.json();
    },
    onSuccess: () => {
      refetchVideoLinks();
      setShowAddVideoLinkDialog(false);
      setNewVideoLink({ title: '', url: '', description: '' });
      toast({
        title: "Video Link Added",
        description: "Your video link has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Video Link",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update video link mutation
  const updateVideoLinkMutation = useMutation({
    mutationFn: async ({ linkId, data }: { linkId: number; data: { title?: string; url?: string; description?: string } }) => {
      const userData = getUserData();
      const response = await fetch(`/api/video-links/${linkId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userData?.id || localStorage.getItem('userId') || ''
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update video link');
      }
      return response.json();
    },
    onSuccess: () => {
      refetchVideoLinks();
      setEditingVideoLink(null);
      toast({
        title: "Video Link Updated",
        description: "Your video link has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Video Link",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete video link mutation
  const deleteVideoLinkMutation = useMutation({
    mutationFn: async (linkId: number) => {
      const userData = getUserData();
      const response = await fetch(`/api/video-links/${linkId}`, {
        method: 'DELETE',
        headers: {
          'X-User-ID': userData?.id || localStorage.getItem('userId') || ''
        },
      });
      if (!response.ok) throw new Error('Failed to delete video link');
      return response.json();
    },
    onSuccess: () => {
      refetchVideoLinks();
      toast({
        title: "Video Link Deleted",
        description: "Your video link has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete video link. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle video link visibility mutation
  const toggleVideoVisibilityMutation = useMutation({
    mutationFn: async (linkId: number) => {
      const userData = getUserData();
      const response = await fetch(`/api/video-links/${linkId}/toggle-visibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userData?.id || localStorage.getItem('userId') || ''
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle visibility');
      }
      return response.json();
    },
    onSuccess: (data) => {
      refetchVideoLinks();
      toast({
        title: data.isVisible ? "Video Now Visible" : "Video Hidden",
        description: data.isVisible 
          ? "This video will now appear on your public profile." 
          : "This video is now hidden from your public profile.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Toggle Visibility",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (data: typeof cancellationData) => {
      return await apiRequest("POST", "/api/subscriptions/cancel", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/status", speakerProfile?.id] });
      setShowCancelDialog(false);
      setCancellationData({
        primaryReason: '',
        wouldRecommend: '',
        missingFeatures: '',
        additionalFeedback: ''
      });
      toast({
        title: "Subscription Canceled",
        description: "Your subscription will be canceled at the end of the current billing period.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordForm) => {
      return await apiRequest("POST", "/api/auth/change-password", data);
    },
    onSuccess: () => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordSection(false);
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password. Please check your current password and try again.",
        variant: "destructive",
      });
    },
  });

  // Reactivate subscription mutation
  const reactivateSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/subscriptions/reactivate", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/status", speakerProfile?.id] });
      toast({
        title: "Subscription Reactivated",
        description: "Your subscription has been reactivated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Reactivation Failed",
        description: error.message || "Failed to reactivate subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update speaker topics mutation
  const updateTopicsMutation = useMutation({
    mutationFn: async (topicIds: number[]) => {
      const response = await fetch(`/api/speakers/${speakerProfile?.id}/topics`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topicIds }),
      });
      if (!response.ok) throw new Error('Failed to update topics');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/speakers/topics', speakerProfile?.id] });
      refetchSpeakerTopics();
      setIsEditingTopics(false);
      toast({
        title: "Topics Updated",
        description: "Your speaking topics have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update topics. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle content visibility
  const toggleContentVisibility = (contentId: number, isPublic: boolean) => {
    updateContentMutation.mutate({ contentId, isPublic });
  };

  useEffect(() => {
    if (speakerProfile && !editForm.name) {
      setEditForm({
        ...speakerProfile,
        achievements: speakerProfile.achievements || []
      });
    }
  }, [speakerProfile]);

  // Initialize selected topics when speaker topics are loaded
  useEffect(() => {
    if (speakerTopics && !isEditingTopics) {
      setSelectedTopics(speakerTopics.map((topic: any) => topic.id));
    }
  }, [speakerTopics, isEditingTopics]);

  // Topics management handlers
  const handleEditTopics = () => {
    setIsEditingTopics(true);
    setSelectedTopics(speakerTopics?.map((topic: any) => topic.id) || []);
  };

  const handleTopicToggle = (topicId: number) => {
    setSelectedTopics(prev => {
      const isRemoving = prev.includes(topicId);
      
      // Allow removal
      if (isRemoving) {
        return prev.filter(id => id !== topicId);
      }
      
      // Check limit when adding
      const currentCount = prev.length;
      if (topicLimit !== null && currentCount >= topicLimit) {
        toast({
          title: "Topic Limit Reached",
          description: `You've reached the ${topicLimit}-topic limit for your ${speakerProfile?.subscriptionTier || 'Basic'} tier. Remove a topic or upgrade to add more.`,
          variant: "destructive",
        });
        return prev;
      }
      
      return [...prev, topicId];
    });
  };

  const handleCancelTopicsEdit = () => {
    setIsEditingTopics(false);
    setSelectedTopics(speakerTopics?.map((topic: any) => topic.id) || []);
    setTopicSearchTerm('');
    setTopicCategoryFilter('all');
  };

  const handleSaveTopics = () => {
    // Defensive check: prevent saving when over limit
    if (topicLimit !== null && selectedTopics.length > topicLimit) {
      toast({
        title: "Too Many Topics",
        description: `You have ${selectedTopics.length} topics selected, but your ${speakerProfile?.subscriptionTier || 'Basic'} tier allows only ${topicLimit}. Please remove ${selectedTopics.length - topicLimit} topic(s) before saving.`,
        variant: "destructive",
      });
      return;
    }
    updateTopicsMutation.mutate(selectedTopics);
  };

  const handleAddAchievement = () => {
    if (newAchievement.trim()) {
      const currentAchievements = editForm.achievements || [];
      setEditForm({
        ...editForm,
        achievements: [...currentAchievements, newAchievement.trim()]
      });
      setNewAchievement('');
    }
  };

  // Render upload usage status with color-coded feedback (storage-based only)
  const renderUploadUsage = () => {
    const uploadCount = currentUploadCount;
    
    // Calculate total storage used in bytes from all uploaded files
    const totalStorageBytes = speakerContent?.reduce((sum: number, content: any) => sum + (content.fileSize || 0), 0) || 0;
    const totalStorageMB = totalStorageBytes / (1024 * 1024);
    const totalStorageMBFormatted = totalStorageMB.toFixed(2);
    
    // Storage-based limits only
    const storageApproaching = storageLimitMb !== null && totalStorageMB >= (storageLimitMb * 0.9);
    const storageAtLimit = storageLimitMb !== null && totalStorageMB >= storageLimitMb;
    
    const statusColor = storageAtLimit
      ? 'text-red-600'
      : storageApproaching
        ? 'text-amber-500'
        : 'text-emerald-600';

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium text-gray-600" data-testid="text-upload-usage">
            {uploadCount} files uploaded
          </p>
          <p className={cn('text-sm font-medium', statusColor)} data-testid="text-storage-usage">
            {totalStorageMBFormatted} MB{storageLimitMb !== null ? ` / ${storageLimitMb} MB` : ' used'}
          </p>
        </div>
        {storageApproaching && (
          <Alert variant={storageAtLimit ? 'destructive' : 'default'} data-testid="alert-storage-limit">
            <AlertTitle>{storageAtLimit ? 'Storage limit reached' : 'Approaching storage limit'}</AlertTitle>
            <AlertDescription>
              {storageAtLimit
                ? `Your ${speakerProfile?.subscriptionTier ?? 'current'} plan storage is full. Delete files to upload more or `
                : `You're using ${((totalStorageMB / (storageLimitMb || 1)) * 100).toFixed(0)}% of your storage. `} 
              {speakerProfile?.subscriptionTier !== 'premier' && (
                <Link href="/subscription-upgrade" className="underline font-medium" data-testid="link-upgrade-uploads">
                  Upgrade your plan
                </Link>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  // Render topic usage status with color-coded feedback
  const renderTopicUsage = (variant: 'edit' | 'view') => {
    const topicCount = variant === 'edit' ? selectedTopics.length : (speakerTopics?.length || 0);
    const limit = topicLimit;
    const approachingLimit = limit !== null && topicCount >= Math.max(1, limit - 1);
    const overLimit = limit !== null && topicCount > limit;
    const statusColor = limit === null
      ? 'text-emerald-600'
      : overLimit
        ? 'text-red-600'
        : approachingLimit
          ? 'text-amber-500'
          : 'text-emerald-600';
    const label = limit === null
      ? `${topicCount} topics`
      : `${topicCount} / ${limit} topics`;

    return (
      <div className="space-y-2">
        <p className={cn('text-sm font-medium', statusColor)} data-testid={`text-topic-usage-${variant}`}>
          {label}
          {limit !== null && overLimit && ` — over by ${topicCount - limit}`}
        </p>
        {variant === 'edit' && (approachingLimit || overLimit) && (
          <Alert variant={overLimit ? 'destructive' : 'default'} data-testid="alert-topic-limit">
            <AlertTitle>{overLimit ? 'Topic limit exceeded' : 'Approaching your topic limit'}</AlertTitle>
            <AlertDescription>
              {overLimit
                ? `Your ${speakerProfile?.subscriptionTier ?? 'current'} plan allows ${limit} topics. Remove ${topicCount - limit} topic${topicCount - limit > 1 ? 's' : ''} or `
                : 'You have one slot left. '} 
              {speakerProfile?.subscriptionTier !== 'premier' && (
                <Link href="/subscription-upgrade" className="underline font-medium" data-testid="link-upgrade-plan">
                  Upgrade your plan
                </Link>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  const handleSave = () => {
    // Validate bio word count before saving
    if (bioOverLimit) {
      toast({
        title: "Bio Too Long",
        description: `Your bio exceeds the ${bioWordLimit}-word limit for your ${speakerProfile?.subscriptionTier || 'Basic'} tier. Please shorten it before saving.`,
        variant: "destructive",
      });
      return;
    }
    
    // Filter out social media fields based on tier
    const formData = { ...editForm };
    const tier = speakerProfile?.subscriptionTier ?? 'basic';
    
    if (tier === 'basic') {
      // Basic tier: no social media allowed
      delete formData.instagramHandle;
      delete formData.linkedinHandle;
      delete formData.facebookHandle;
      delete formData.xHandle;
      delete formData.tiktokHandle;
      delete formData.selectedSocialPlatform;
    } else if (tier === 'pro') {
      // Pro tier: only allow the selected platform
      const selectedPlatform = formData.selectedSocialPlatform || speakerProfile?.selectedSocialPlatform;
      if (selectedPlatform !== 'instagram') delete formData.instagramHandle;
      if (selectedPlatform !== 'linkedin') delete formData.linkedinHandle;
      if (selectedPlatform !== 'facebook') delete formData.facebookHandle;
      if (selectedPlatform !== 'x') delete formData.xHandle;
      if (selectedPlatform !== 'tiktok') delete formData.tiktokHandle;
    }
    // Premier tier: all social media fields allowed
    
    updateProfileMutation.mutate(formData);
  };

  const handleStartEdit = () => {
    setEditForm({
      ...speakerProfile,
      achievements: speakerProfile.achievements || []
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditForm(speakerProfile);
    setIsEditing(false);
  };

  // File upload handling
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check upload limit before proceeding
    
    // Check storage limit before uploading
    const totalStorageBytes = speakerContent?.reduce((sum: number, content: any) => sum + (content.fileSize || 0), 0) || 0;
    const totalStorageMB = totalStorageBytes / (1024 * 1024);
    const newFileSizeMB = file.size / (1024 * 1024);
    
    if (storageLimitMb !== null && (totalStorageMB + newFileSizeMB) > storageLimitMb) {
      const remainingMB = (storageLimitMb - totalStorageMB).toFixed(2);
      toast({
        title: "Storage Limit Exceeded",
        description: `This file would exceed your ${storageLimitMb} MB storage limit. You have ${remainingMB} MB remaining. Delete some files or upgrade your plan.`,
        variant: "destructive",
      });
      // Reset file input
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', `${file.name}`);
    formData.append('category', getFileCategory(file.type));
    formData.append('isPublic', 'true'); // Default to public so files appear on speaker profile

    uploadContentMutation.mutate(formData);
    // Reset file input
    event.target.value = '';
  };

  const getFileCategory = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'document';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
    return 'document';
  };

  const getFileIcon = (category: string) => {
    switch (category) {
      case 'image': return <Image className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'audio': return <Music className="h-5 w-5" />;
      case 'presentation': return <BookOpen className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!speakerProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Speaker Profile Not Found</h2>
              <p className="text-gray-600 mb-6">
                Your speaker profile hasn't been created yet or there was an issue loading it.
              </p>
              <Button onClick={() => window.location.href = '/for-speakers'}>
                Apply to Become a Speaker
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={speakerProfile.imageUrl} alt={speakerProfile.name} />
                <AvatarFallback>{speakerProfile.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Speaker Dashboard</h1>
                <p className="text-gray-600">Welcome back, {speakerProfile.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => window.open(`/speakers/${speakerProfile.slug}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Public Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({speakerReviews?.length || 0})</TabsTrigger>
            <TabsTrigger value="stats">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="content">My Content</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          <User className="h-5 w-5 mr-2" />
                          Speaker Profile
                        </CardTitle>
                        <CardDescription>
                          {isEditing ? "Edit your speaker information" : "Your public speaker profile information"}
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => isEditing ? handleCancel() : handleStartEdit()}
                        className={isEditing ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
                      >
                        {isEditing ? (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit Profile
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Headshot Upload Section */}
                    <div className="border-b pb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <Camera className="h-5 w-5 mr-2" />
                          Profile Headshot
                        </h3>
                      </div>
                      <div className="flex items-start gap-6">
                        <div className="flex flex-col items-center">
                          <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                            <AvatarImage src={speakerProfile.imageUrl} alt={speakerProfile.name} />
                            <AvatarFallback className="text-xl font-semibold bg-blue-500 text-white">
                              {speakerProfile.name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          {isEditing && (
                            <div className="mt-3 space-y-2">
                              <div className="space-y-2">
                                <input
                                  id="headshot-upload"
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    
                                    // Check file size (10MB limit)
                                    if (file.size > 10 * 1024 * 1024) {
                                      toast({
                                        title: "File Too Large",
                                        description: "Please select an image smaller than 10MB.",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    
                                    // Convert to base64
                                    const reader = new FileReader();
                                    reader.onload = async (event) => {
                                      const base64 = event.target?.result as string;
                                      try {
                                        const data = await apiRequest("PUT", `/api/speakers/${speakerProfile.id}/headshot`, {
                                          headshotData: base64,
                                        });
                                        
                                        if (data.success) {
                                          toast({
                                            title: "Headshot Updated",
                                            description: "Your profile headshot has been successfully updated!",
                                          });
                                          
                                          // Update the editForm to preserve the new imageUrl when saving changes
                                          setEditForm({...editForm, imageUrl: data.speaker.imageUrl});
                                          
                                          // Invalidate and refetch speaker data AND user profile data for sync
                                          queryClient.invalidateQueries({ queryKey: ['/api/speakers/by-user', user?.id] });
                                          queryClient.invalidateQueries({ queryKey: ['/api/users', user?.id] });
                                        }
                                      } catch (error) {
                                        toast({
                                          title: "Upload Failed",
                                          description: "Failed to update headshot. Please try again.",
                                          variant: "destructive",
                                        });
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }}
                                />
                                <Button
                                  type="button"
                                  onClick={() => document.getElementById('headshot-upload')?.click()}
                                  className="w-full bg-blue-500 text-white hover:bg-blue-600"
                                >
                                  <Camera className="h-4 w-4 mr-2" />
                                  Upload Photo
                                </Button>
                              </div>
                              {speakerProfile.imageUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      const data = await apiRequest("DELETE", `/api/speakers/${speakerProfile.id}/headshot`);
                                      
                                      if (data.success) {
                                        toast({
                                          title: "Headshot Removed",
                                          description: "Your profile headshot has been removed.",
                                        });
                                        
                                        // Update the editForm to preserve the removal when saving changes
                                        setEditForm({...editForm, imageUrl: "/placeholder-avatar.png"});
                                        
                                        // Invalidate and refetch speaker data
                                        queryClient.invalidateQueries({ queryKey: ['/api/speakers/by-user', user?.id] });
                                      }
                                    } catch (error) {
                                      toast({
                                        title: "Remove Failed",
                                        description: "Failed to remove headshot. Please try again.",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                  className="w-full text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove Photo
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-600">
                            <p className="mb-2">
                              <strong>Photo Guidelines:</strong>
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-gray-500">
                              <li>Professional headshot recommended</li>
                              <li>High-resolution image (at least 400x400 pixels)</li>
                              <li>Clear view of face with good lighting</li>
                              <li>Neutral or professional background</li>
                              <li>File size limit: 10MB</li>
                              <li>Supported formats: JPG, PNG, WebP</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        {isEditing ? (
                          <Input
                            id="name"
                            value={editForm.name || ''}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          />
                        ) : (
                          <p className="text-gray-900 font-medium">{speakerProfile.name}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="title">Professional Title</Label>
                        {isEditing ? (
                          <Input
                            id="title"
                            value={editForm.title || ''}
                            onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                          />
                        ) : (
                          <p className="text-gray-900 font-medium">{speakerProfile.title}</p>
                        )}
                      </div>
                    </div>

                    {/* Biography */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <Label htmlFor="bio">Biography</Label>
                        {isEditing && bioWordLimit !== null && (
                          <span
                            className={`text-sm ${
                              bioOverLimit
                                ? 'text-red-600 font-semibold'
                                : bioNearLimit
                                ? 'text-yellow-600'
                                : 'text-gray-500'
                            }`}
                            data-testid="bio-word-count"
                          >
                            {bioWordCount} / {bioWordLimit} words
                            {bioOverLimit && ' (exceeds limit)'}
                          </span>
                        )}
                      </div>
                      {isEditing ? (
                        <div>
                          <Textarea
                            id="bio"
                            data-testid="textarea-bio"
                            rows={4}
                            value={editForm.bio || ''}
                            onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                            placeholder="Tell people about your experience and expertise..."
                            className={bioOverLimit ? 'border-red-500 focus-visible:ring-red-500' : ''}
                          />
                          {bioOverLimit && (
                            <p className="text-sm text-red-600 mt-1">
                              Your bio exceeds the {bioWordLimit}-word limit for the {speakerProfile?.subscriptionTier || 'Basic'} tier. 
                              {speakerProfile?.subscriptionTier === 'basic' && (
                                <Link href="/subscription-upgrade" className="underline ml-1">
                                  Upgrade to Pro
                                </Link>
                              )}
                              {speakerProfile?.subscriptionTier === 'pro' && (
                                <Link href="/subscription-upgrade" className="underline ml-1">
                                  Upgrade to Premier
                                </Link>
                              )}
                            </p>
                          )}
                          {bioNearLimit && !bioOverLimit && (
                            <p className="text-sm text-yellow-600 mt-1">
                              You're approaching the word limit ({Math.round(getUsagePercentage(bioWordCount, bioWordLimit) || 0)}% used)
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-700 mt-2">{speakerProfile.bio}</p>
                      )}
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        {isEditing ? (
                          <Input
                            id="email"
                            type="email"
                            value={editForm.email || ''}
                            onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          />
                        ) : (
                          <p className="text-gray-900 font-medium">{speakerProfile.email}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        {isEditing ? (
                          <Input
                            id="phone"
                            value={editForm.phone || ''}
                            onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                          />
                        ) : (
                          <p className="text-gray-900 font-medium">{speakerProfile.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {((speakerProfile?.subscriptionTier ?? 'basic') === 'pro' || (speakerProfile?.subscriptionTier ?? 'basic') === 'premier') && (
                        <div>
                          <Label htmlFor="website">Website</Label>
                          {isEditing ? (
                            <Input
                              id="website"
                              value={editForm.website || ''}
                              onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                            />
                          ) : (
                            <p className="text-gray-900 font-medium">{speakerProfile.website}</p>
                          )}
                        </div>
                      )}
                      <div>
                        <Label htmlFor="location">Location</Label>
                        {isEditing ? (
                          <Input
                            id="location"
                            value={editForm.location || ''}
                            onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                          />
                        ) : (
                          <p className="text-gray-900 font-medium">{speakerProfile.location}</p>
                        )}
                      </div>
                    </div>

                    {/* Social Media Links - Tier-based access */}
                    <>
                      {/* Basic tier: Upgrade message */}
                      {(speakerProfile?.subscriptionTier ?? 'basic') === 'basic' && (
                        <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                          <div className="flex items-center gap-3">
                            <Lock className="h-5 w-5 text-amber-600 flex-shrink-0" />
                            <div>
                              <h4 className="font-medium text-amber-900">Social Media Links Locked</h4>
                              <p className="text-sm text-amber-700 mt-1">
                                Upgrade your subscription to display your social media handles on your public speaker profile. 
                                <button 
                                  onClick={() => setActiveTab("subscription")} 
                                  className="underline font-medium ml-1 hover:text-amber-900"
                                >
                                  View upgrade options
                                </button>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Pro tier: Select one platform */}
                      {(speakerProfile?.subscriptionTier ?? 'basic') === 'pro' && (
                        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-blue-900">Social Media Platform</h4>
                              <p className="text-sm text-blue-700">Pro members can select one social media platform. <Link href="/subscription-upgrade" className="underline font-medium">Upgrade to Premier</Link> for all platforms.</p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {[
                              { value: 'instagram', label: 'Instagram' },
                              { value: 'linkedin', label: 'LinkedIn' },
                              { value: 'facebook', label: 'Facebook' },
                              { value: 'x', label: 'X (Twitter)' },
                              { value: 'tiktok', label: 'TikTok' },
                            ].map((platform) => {
                              const selected = (isEditing ? (editForm.selectedSocialPlatform || speakerProfile?.selectedSocialPlatform) : speakerProfile?.selectedSocialPlatform) === platform.value;
                              return (
                                <button
                                  key={platform.value}
                                  type="button"
                                  onClick={() => {
                                    if (isEditing) {
                                      setEditForm({...editForm, selectedSocialPlatform: platform.value});
                                    } else {
                                      updateProfileMutation.mutate({ selectedSocialPlatform: platform.value });
                                    }
                                  }}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                                    selected
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                  }`}
                                >
                                  {selected && <Check className="h-4 w-4" />}
                                  {platform.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Social Media Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Instagram */}
                        <div>
                          <Label htmlFor="instagramHandle" className={
                            (speakerProfile?.subscriptionTier ?? 'basic') === 'premier' ? '' :
                            (speakerProfile?.subscriptionTier ?? 'basic') === 'pro' && (editForm.selectedSocialPlatform || speakerProfile?.selectedSocialPlatform) === 'instagram' ? '' :
                            'text-gray-400'
                          }>
                            Instagram Profile Link
                            {(speakerProfile?.subscriptionTier ?? 'basic') === 'basic' && <Lock className="h-3 w-3 inline ml-1" />}
                            {(speakerProfile?.subscriptionTier ?? 'basic') === 'pro' && (editForm.selectedSocialPlatform || speakerProfile?.selectedSocialPlatform) !== 'instagram' && <Lock className="h-3 w-3 inline ml-1" />}
                          </Label>
                          {isEditing && (
                            (speakerProfile?.subscriptionTier ?? 'basic') === 'premier' ||
                            ((speakerProfile?.subscriptionTier ?? 'basic') === 'pro' && (editForm.selectedSocialPlatform || speakerProfile?.selectedSocialPlatform) === 'instagram')
                          ) ? (
                            <Input
                              id="instagramHandle"
                              value={editForm.instagramHandle || ''}
                              onChange={(e) => setEditForm({...editForm, instagramHandle: e.target.value})}
                              placeholder="https://instagram.com/yourprofile"
                              data-testid="input-instagram-handle"
                            />
                          ) : (speakerProfile?.subscriptionTier ?? 'basic') === 'basic' ? (
                            <Input
                              id="instagramHandle"
                              value={speakerProfile?.instagramHandle || ''}
                              placeholder="Upgrade to Pro to edit"
                              disabled
                              className="opacity-50 cursor-not-allowed"
                              data-testid="input-instagram-handle-locked"
                            />
                          ) : (speakerProfile?.subscriptionTier ?? 'basic') === 'pro' && (editForm.selectedSocialPlatform || speakerProfile?.selectedSocialPlatform) !== 'instagram' ? (
                            <Input
                              id="instagramHandle"
                              value={speakerProfile?.instagramHandle || ''}
                              placeholder={speakerProfile?.selectedSocialPlatform ? "Select this platform to edit" : "Select a platform above"}
                              disabled
                              className="opacity-50 cursor-not-allowed"
                              data-testid="input-instagram-handle-locked"
                            />
                          ) : (
                            <p className="text-gray-900 font-medium">
                              {speakerProfile?.instagramHandle ? (
                                speakerProfile.instagramHandle.includes('instagram.com') ? (
                                  <a href={speakerProfile.instagramHandle} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    {speakerProfile.instagramHandle}
                                  </a>
                                ) : speakerProfile.instagramHandle
                              ) : 'Not provided'}
                            </p>
                          )}
                        </div>

                        {/* LinkedIn */}
                        <div>
                          <Label htmlFor="linkedinHandle" className={
                            (speakerProfile?.subscriptionTier ?? 'basic') === 'premier' ? '' :
                            (speakerProfile?.subscriptionTier ?? 'basic') === 'pro' && (editForm.selectedSocialPlatform || speakerProfile?.selectedSocialPlatform) === 'linkedin' ? '' :
                            'text-gray-400'
                          }>
                            LinkedIn Profile Link
                            {(speakerProfile?.subscriptionTier ?? 'basic') === 'basic' && <Lock className="h-3 w-3 inline ml-1" />}
                            {(speakerProfile?.subscriptionTier ?? 'basic') === 'pro' && (editForm.selectedSocialPlatform || speakerProfile?.selectedSocialPlatform) !== 'linkedin' && <Lock className="h-3 w-3 inline ml-1" />}
                          </Label>
                          {isEditing && (
                            (speakerProfile?.subscriptionTier ?? 'basic') === 'premier' ||
                            ((speakerProfile?.subscriptionTier ?? 'basic') === 'pro' && (editForm.selectedSocialPlatform || speakerProfile?.selectedSocialPlatform) === 'linkedin')
                          ) ? (
                            <Input
                              id="linkedinHandle"
                              value={editForm.linkedinHandle || ''}
                              onChange={(e) => setEditForm({...editForm, linkedinHandle: e.target.value})}
                              placeholder="https://linkedin.com/in/yourprofile"
                              data-testid="input-linkedin-handle"
                            />
                          ) : (speakerProfile?.subscriptionTier ?? 'basic') === 'basic' ? (
                            <Input
                              id="linkedinHandle"
                              value={speakerProfile?.linkedinHandle || ''}
                              placeholder="Upgrade to Pro to edit"
                              disabled
                              className="opacity-50 cursor-not-allowed"
                              data-testid="input-linkedin-handle-locked"
                            />
                          ) : (speakerProfile?.subscriptionTier ?? 'basic') === 'pro' && (editForm.selectedSocialPlatform || speakerProfile?.selectedSocialPlatform) !== 'linkedin' ? (
                            <Input
                              id="linkedinHandle"
                              value={speakerProfile?.linkedinHandle || ''}
                              placeholder={speakerProfile?.selectedSocialPlatform ? "Select this platform to edit" : "Select a platform above"}
                              disabled
                              className="opacity-50 cursor-not-allowed"
                              data-testid="input-linkedin-handle-locked"
                            />
                          ) : (
                            <p className="text-gray-900 font-medium">
                              {speakerProfile?.linkedinHandle ? (
                                speakerProfile.linkedinHandle.includes('linkedin.com') ? (
                                  <a href={speakerProfile.linkedinHandle} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    {speakerProfile.linkedinHandle}
                                  </a>
                                ) : speakerProfile.linkedinHandle
                              ) : 'Not provided'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Facebook */}
                        <div>
                          <Label htmlFor="facebookHandle" className={
                            (speakerProfile?.subscriptionTier ?? 'basic') === 'premier' ? '' :
                            (speakerProfile?.subscriptionTier ?? 'basic') === 'pro' && (editForm.selectedSocialPlatform || speakerProfile?.selectedSocialPlatform) === 'facebook' ? '' :
                            'text-gray-400'
                          }>
                            Facebook Profile Link
                            {(speakerProfile?.subscriptionTier ?? 'basic') === 'basic' && <Lock className="h-3 w-3 inline ml-1" />}
                            {(speakerProfile?.subscriptionTier ?? 'basic') === 'pro' && (editForm.selectedSocialPlatform || speakerProfile?.selectedSocialPlatform) !== 'facebook' && <Lock className="h-3 w-3 inline ml-1" />}
                          </Label>
                          {isEditing && (
                            (speakerProfile?.subscriptionTier ?? 'basic') === 'premier' ||
                            ((speakerProfile?.subscriptionTier ?? 'basic') === 'pro' && (editForm.selectedSocialPlatform || speakerProfile?.selectedSocialPlatform) === 'facebook')
                          ) ? (
                            <Input
                              id="facebookHandle"
                              value={editForm.facebookHandle || ''}
                              onChange={(e) => setEditForm({...editForm, facebookHandle: e.target.value})}
                              placeholder="https://facebook.com/yourprofile"
                              data-testid="input-facebook-handle"
                            />
                          ) : (speakerProfile?.subscriptionTier ?? 'basic') === 'basic' ? (
                            <Input
                              id="facebookHandle"
                              value={speakerProfile?.facebookHandle || ''}
                              placeholder="Upgrade to Pro to edit"
                              disabled
                              className="opacity-50 cursor-not-allowed"
                              data-testid="input-facebook-handle-locked"
                            />
                          ) : (speakerProfile?.subscriptionTier ?? 'basic') === 'pro' && (editForm.selectedSocialPlatform || speakerProfile?.selectedSocialPlatform) !== 'facebook' ? (
                            <Input
                              id="facebookHandle"
                              value={speakerProfile?.facebookHandle || ''}
                              placeholder={speakerProfile?.selectedSocialPlatform ? "Select this platform to edit" : "Select a platform above"}
                              disabled
                              className="opacity-50 cursor-not-allowed"
                              data-testid="input-facebook-handle-locked"
                            />
                          ) : (
                            <p className="text-gray-900 font-medium">
                              {speakerProfile?.facebookHandle ? (
                                speakerProfile.facebookHandle.includes('facebook.com') ? (
                                  <a href={speakerProfile.facebookHandle} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    {speakerProfile.facebookHandle}
                                  </a>
                                ) : speakerProfile.facebookHandle
                              ) : 'Not provided'}
                            </p>
                          )}
                        </div>

                        {/* X (Twitter) */}
                        <div>
                          <Label htmlFor="xHandle" className={
                            (speakerProfile?.subscriptionTier ?? 'basic') === 'premier' ? '' :
                            (speakerProfile?.subscriptionTier ?? 'basic') === 'pro' && (editForm.selectedSocialPlatform || speakerProfile?.selectedSocialPlatform) === 'x' ? '' :
                            'text-gray-400'
                          }>
                            X (Twitter) Profile Link
                            {(speakerProfile?.subscriptionTier ?? 'basic') === 'basic' && <Lock className="h-3 w-3 inline ml-1" />}
                            {(speakerProfile?.subscriptionTier ?? 'basic') === 'pro' && (editForm.selectedSocialPlatform || speakerProfile?.selectedSocialPlatform) !== 'x' && <Lock className="h-3 w-3 inline ml-1" />}
                          </Label>
                          {isEditing && (
                            (speakerProfile?.subscriptionTier ?? 'basic') === 'premier' ||
                            ((speakerProfile?.subscriptionTier ?? 'basic') === 'pro' && (editForm.selectedSocialPlatform || speakerProfile?.selectedSocialPlatform) === 'x')
                          ) ? (
                            <Input
                              id="xHandle"
                              value={editForm.xHandle || ''}
                              onChange={(e) => setEditForm({...editForm, xHandle: e.target.value})}
                              placeholder="https://x.com/yourprofile"
                              data-testid="input-x-handle"
                            />
                          ) : (speakerProfile?.subscriptionTier ?? 'basic') === 'basic' ? (
                            <Input
                              id="xHandle"
                              value={speakerProfile?.xHandle || ''}
                              placeholder="Upgrade to Pro to edit"
                              disabled
                              className="opacity-50 cursor-not-allowed"
                              data-testid="input-x-handle-locked"
                            />
                          ) : (speakerProfile?.subscriptionTier ?? 'basic') === 'pro' && (editForm.selectedSocialPlatform || speakerProfile?.selectedSocialPlatform) !== 'x' ? (
                            <Input
                              id="xHandle"
                              value={speakerProfile?.xHandle || ''}
                              placeholder={speakerProfile?.selectedSocialPlatform ? "Select this platform to edit" : "Select a platform above"}
                              disabled
                              className="opacity-50 cursor-not-allowed"
                              data-testid="input-x-handle-locked"
                            />
                          ) : (
                            <p className="text-gray-900 font-medium">
                              {speakerProfile?.xHandle ? (
                                speakerProfile.xHandle.includes('x.com') || speakerProfile.xHandle.includes('twitter.com') ? (
                                  <a href={speakerProfile.xHandle} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    {speakerProfile.xHandle}
                                  </a>
                                ) : speakerProfile.xHandle
                              ) : 'Not provided'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* TikTok Field */}
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label htmlFor="tiktokHandle" className={
                            (speakerProfile?.subscriptionTier ?? 'basic') === 'premier' ? '' :
                            (speakerProfile?.subscriptionTier ?? 'basic') === 'pro' && (editForm.selectedSocialPlatform || speakerProfile?.selectedSocialPlatform) === 'tiktok' ? '' :
                            'text-gray-400'
                          }>
                            TikTok Profile Link
                            {(speakerProfile?.subscriptionTier ?? 'basic') === 'basic' && <Lock className="h-3 w-3 inline ml-1" />}
                            {(speakerProfile?.subscriptionTier ?? 'basic') === 'pro' && (editForm.selectedSocialPlatform || speakerProfile?.selectedSocialPlatform) !== 'tiktok' && <Lock className="h-3 w-3 inline ml-1" />}
                          </Label>
                          {isEditing && (
                            (speakerProfile?.subscriptionTier ?? 'basic') === 'premier' ||
                            ((speakerProfile?.subscriptionTier ?? 'basic') === 'pro' && (editForm.selectedSocialPlatform || speakerProfile?.selectedSocialPlatform) === 'tiktok')
                          ) ? (
                            <Input
                              id="tiktokHandle"
                              value={editForm.tiktokHandle || ''}
                              onChange={(e) => setEditForm({...editForm, tiktokHandle: e.target.value})}
                              placeholder="https://tiktok.com/@yourprofile"
                              data-testid="input-tiktok-handle"
                            />
                          ) : (speakerProfile?.subscriptionTier ?? 'basic') === 'basic' ? (
                            <Input
                              id="tiktokHandle"
                              value={speakerProfile?.tiktokHandle || ''}
                              placeholder="Upgrade to Pro to edit"
                              disabled
                              className="opacity-50 cursor-not-allowed"
                              data-testid="input-tiktok-handle-locked"
                            />
                          ) : (speakerProfile?.subscriptionTier ?? 'basic') === 'pro' && (editForm.selectedSocialPlatform || speakerProfile?.selectedSocialPlatform) !== 'tiktok' ? (
                            <Input
                              id="tiktokHandle"
                              value={speakerProfile?.tiktokHandle || ''}
                              placeholder={speakerProfile?.selectedSocialPlatform ? "Select this platform to edit" : "Select a platform above"}
                              disabled
                              className="opacity-50 cursor-not-allowed"
                              data-testid="input-tiktok-handle-locked"
                            />
                          ) : (
                            <p className="text-gray-900 font-medium">
                              {speakerProfile?.tiktokHandle ? (
                                speakerProfile.tiktokHandle.includes('tiktok.com') ? (
                                  <a href={speakerProfile.tiktokHandle} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    {speakerProfile.tiktokHandle}
                                  </a>
                                ) : speakerProfile.tiktokHandle
                              ) : 'Not provided'}
                            </p>
                          )}
                        </div>
                      </div>
                    </>

                    {/* Professional Achievements Section */}
                    <div className="pt-6 border-t">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Award className="h-5 w-5 mr-2" />
                          Professional Achievements
                        </h3>
                        
                        {/* Display achievements */}
                        <div className="space-y-3 mb-4">
                          {(isEditing ? editForm.achievements : speakerProfile.achievements)?.length > 0 ? (
                            (isEditing ? editForm.achievements : speakerProfile.achievements).map((achievement: string, index: number) => (
                              <div key={index} className="flex items-start p-3 bg-gray-50 rounded-lg">
                                <Award className="h-5 w-5 text-accent mt-0.5 mr-3 flex-shrink-0" />
                                <span className="text-gray-700 flex-1">{achievement}</span>
                                {isEditing && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const updatedAchievements = editForm.achievements?.filter((_: string, i: number) => i !== index) || [];
                                      setEditForm({...editForm, achievements: updatedAchievements});
                                    }}
                                    className="text-red-600 hover:text-red-700 ml-2"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 italic">No achievements listed</p>
                          )}
                        </div>

                        {/* Add achievement form when editing */}
                        {isEditing && (
                          <div className="border-t pt-4">
                            <div className="flex space-x-2">
                              <Input
                                placeholder="Enter a new achievement..."
                                value={newAchievement}
                                onChange={(e) => setNewAchievement(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddAchievement();
                                  }
                                }}
                              />
                              <Button
                                onClick={handleAddAchievement}
                                disabled={!newAchievement.trim()}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Save/Cancel Buttons */}
                    {isEditing && (
                      <div className="flex space-x-3 pt-4 border-t">
                        <Button
                          onClick={handleSave}
                          disabled={updateProfileMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {updateProfileMutation.isPending ? (
                            <>
                              <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                        <Button variant="outline" onClick={handleCancel}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Profile Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Star className="h-5 w-5 mr-2" />
                      Profile Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Rating</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{speakerProfile.rating?.toFixed(1) || 'No ratings'}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Reviews</span>
                      <span className="font-medium">{speakerProfile.totalReviews || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Profile Views</span>
                      <span className="font-medium">{userStats?.profileViews || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Featured</span>
                      <Badge variant={speakerProfile.featured ? "default" : "secondary"}>
                        {speakerProfile.featured ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* QR Code - Premier Only */}
                {isPremier && speakerProfile?.slug && (
                  <Card data-testid="card-qr-code">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Share2 className="h-5 w-5 mr-2" />
                        Profile QR Code
                      </CardTitle>
                      <CardDescription>
                        Share your profile instantly
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <StyledQRCode 
                        value={`https://thespeakersphere.com/speakers/${speakerProfile.slug}`}
                        logoSrc={devRightLogo}
                        speakerName={speakerProfile.name}
                      />
                      <p className="text-xs text-center text-gray-500" data-testid="text-qr-description">
                        Scan to view your public speaker profile
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Languages */}
                {speakerProfile.languages && speakerProfile.languages.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Languages className="h-5 w-5 mr-2" />
                        Languages
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {speakerProfile.languages.map((lang: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Speaking Topics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <BookOpen className="h-5 w-5 mr-2" />
                        Speaking Topics
                      </div>
                      {!isEditingTopics && (
                        <Button variant="ghost" size="sm" onClick={handleEditTopics}>
                          <Edit3 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditingTopics ? (
                      <div className="space-y-4">
                        {/* Search and Category Filter */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search topics..."
                              value={topicSearchTerm}
                              onChange={(e) => setTopicSearchTerm(e.target.value)}
                              className="pl-9"
                              data-testid="input-topic-search"
                            />
                          </div>
                          <Select value={topicCategoryFilter} onValueChange={setTopicCategoryFilter}>
                            <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-topic-category">
                              <SelectValue placeholder="Filter by category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Categories</SelectItem>
                              {(Array.from(new Set(allTopics?.map((t: any) => t.category).filter(Boolean) || [])) as string[]).sort().map((category: string) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Selected Topics Chips */}
                        {selectedTopics.length > 0 && (
                          <div className="border rounded-lg p-3 bg-gray-50">
                            <p className="text-xs font-medium text-gray-500 mb-2">Selected Topics ({selectedTopics.length}{topicLimit !== null ? `/${topicLimit}` : ''}):</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedTopics.map((topicId) => {
                                const topic = allTopics?.find((t: any) => t.id === topicId);
                                if (!topic) return null;
                                return (
                                  <span
                                    key={topicId}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-white border rounded-full text-xs"
                                  >
                                    {topic.name}
                                    <button
                                      type="button"
                                      onClick={() => handleTopicToggle(topicId)}
                                      className="ml-0.5 hover:bg-gray-200 rounded-full p-0.5"
                                    >
                                      <X className="h-3 w-3 text-gray-500" />
                                    </button>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Topics List */}
                        <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3">
                          {(() => {
                            const filteredTopics = allTopics?.filter((topic: any) => {
                              const matchesSearch = !topicSearchTerm || 
                                topic.name.toLowerCase().includes(topicSearchTerm.toLowerCase());
                              const matchesCategory = topicCategoryFilter === 'all' || 
                                topic.category === topicCategoryFilter;
                              return matchesSearch && matchesCategory;
                            }) || [];
                            
                            if (filteredTopics.length === 0) {
                              return (
                                <p className="text-sm text-gray-500 text-center py-4">
                                  No topics found matching your search.
                                </p>
                              );
                            }
                            
                            return filteredTopics.map((topic: any) => (
                              <div key={topic.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`topic-${topic.id}`}
                                  checked={selectedTopics.includes(topic.id)}
                                  onChange={() => handleTopicToggle(topic.id)}
                                  className="rounded border-gray-300"
                                />
                                <label
                                  htmlFor={`topic-${topic.id}`}
                                  className="text-sm cursor-pointer flex-1"
                                >
                                  {topic.name}
                                  {topic.category && (
                                    <span className="text-xs text-gray-500 ml-2">
                                      ({topic.category})
                                    </span>
                                  )}
                                </label>
                              </div>
                            ));
                          })()}
                        </div>
                        {/* Near-limit warning for topics */}
                        {topicLimit !== null && isNearLimit(selectedTopics.length, topicLimit) && selectedTopics.length < topicLimit && (
                          <Alert className="border-amber-500 bg-amber-50">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <AlertTitle className="text-amber-900">Approaching Topic Limit</AlertTitle>
                            <AlertDescription className="text-amber-800">
                              You have {topicLimit - selectedTopics.length} topic{topicLimit - selectedTopics.length !== 1 ? 's' : ''} remaining on your {speakerProfile?.subscriptionTier || 'Basic'} plan.
                              {(speakerProfile?.subscriptionTier ?? 'basic') !== 'premier' && (
                                <> <Link href="/subscription-upgrade" className="underline font-medium">Upgrade to add more topics</Link>.</>
                              )}
                            </AlertDescription>
                          </Alert>
                        )}
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={handleSaveTopics}
                            disabled={updateTopicsMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                            data-testid="button-save-topics"
                          >
                            {updateTopicsMutation.isPending ? (
                              <>
                                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-1" />
                                Save
                              </>
                            )}
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleCancelTopicsEdit}>
                            Cancel
                          </Button>
                        </div>
                        {renderTopicUsage('edit')}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {speakerTopics && speakerTopics.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {speakerTopics.map((topic: any) => (
                              <Badge key={topic.id} variant="outline" className="text-xs">
                                {topic.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No speaking topics selected</p>
                        )}
                        {renderTopicUsage('view')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Change Password Section */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center text-lg">
                      <Lock className="h-5 w-5 mr-2" />
                      Account Security
                    </CardTitle>
                    <CardDescription>Update your login password</CardDescription>
                  </div>
                  {!showPasswordSection && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPasswordSection(true)}
                    >
                      Change Password
                    </Button>
                  )}
                </div>
              </CardHeader>
              {showPasswordSection && (
                <CardContent>
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Enter your current password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="At least 6 characters"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Re-enter your new password"
                      />
                    </div>
                    {passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                      <p className="text-sm text-red-500">Passwords do not match</p>
                    )}
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={() => changePasswordMutation.mutate(passwordForm)}
                        disabled={
                          changePasswordMutation.isPending ||
                          !passwordForm.currentPassword ||
                          !passwordForm.newPassword ||
                          passwordForm.newPassword.length < 6 ||
                          passwordForm.newPassword !== passwordForm.confirmPassword
                        }
                        className="bg-[#1e4347] hover:bg-[#2a5a5f]"
                      >
                        {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowPasswordSection(false);
                          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Reviews</CardTitle>
                <CardDescription>See what people are saying about your speaking</CardDescription>
              </CardHeader>
              <CardContent>
                {speakerReviews && speakerReviews.length > 0 ? (
                  <div className="space-y-4">
                    {/* Reviews Summary */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Showing {Math.min(reviewsPerPage, speakerReviews.length - (currentReviewPage - 1) * reviewsPerPage)} of {speakerReviews.length} reviews
                      </p>
                    </div>

                    {/* Paginated Reviews */}
                    {getPaginatedReviews(speakerReviews).map((review: any) => (
                      <div key={review.id} className="border rounded-lg bg-white shadow-sm">
                        {/* Collapsed Header */}
                        <div 
                          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => toggleReviewExpanded(review.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= review.overallRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="font-semibold">{review.overallRating}/5</span>
                              <span className="text-sm text-gray-600">by {review.reviewerName}</span>
                              <Badge 
                                variant={review.approvalStatus === 'approved' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {review.approvalStatus === 'approved' ? 'Approved' : 'Pending'}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                              <Button variant="ghost" size="sm">
                                {expandedReviews.has(review.id) ? (
                                  <>
                                    <EyeOff className="h-4 w-4 mr-1" />
                                    Collapse
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-4 w-4 mr-1" />
                                    Expand
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {expandedReviews.has(review.id) && (
                          <div className="border-t p-4 space-y-4">
                            {/* Reviewer Information */}
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <h4 className="font-semibold text-gray-900 mb-2">Reviewer</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                <div><span className="font-medium">Name:</span> {review.reviewerName}</div>
                                <div><span className="font-medium">Title:</span> {review.reviewerTitle}</div>
                                <div><span className="font-medium">Company:</span> {review.reviewerCompany}</div>
                              </div>
                            </div>

                            {/* Event Details */}
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <h4 className="font-semibold text-gray-900 mb-2">Event Details</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div><span className="font-medium">Event Type:</span> {review.eventType}</div>
                                <div><span className="font-medium">Event Date:</span> {new Date(review.eventDate).toLocaleDateString()}</div>
                              </div>
                            </div>

                            {/* Detailed Ratings */}
                            <div className="p-3 bg-green-50 rounded-lg">
                              <h4 className="font-semibold text-gray-900 mb-3">Detailed Ratings</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center justify-between">
                                  <span>Speaking Style:</span>
                                  <div className="flex items-center space-x-2">
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`h-4 w-4 ${
                                            star <= review.speakingStyleRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="font-medium">{review.speakingStyleRating}/5</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Podium Presence:</span>
                                  <div className="flex items-center space-x-2">
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`h-4 w-4 ${
                                            star <= review.podiumPresenceRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="font-medium">{review.podiumPresenceRating}/5</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Technical Proficiency:</span>
                                  <div className="flex items-center space-x-2">
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`h-4 w-4 ${
                                            star <= review.technicalProficiencyRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="font-medium">{review.technicalProficiencyRating}/5</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Content Relevance:</span>
                                  <div className="flex items-center space-x-2">
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`h-4 w-4 ${
                                            star <= review.contentRelevanceRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="font-medium">{review.contentRelevanceRating}/5</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Ease of Working:</span>
                                  <div className="flex items-center space-x-2">
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`h-4 w-4 ${
                                            star <= review.easeOfWorkingRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="font-medium">{review.easeOfWorkingRating}/5</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Visual Design:</span>
                                  <div className="flex items-center space-x-2">
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`h-4 w-4 ${
                                            star <= review.visualDesignRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="font-medium">{review.visualDesignRating}/5</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Review Comment */}
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Review Comments</h4>
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                              </div>
                            </div>

                            {/* Status and Verification */}
                            <div className="flex items-center justify-between pt-2">
                              <Badge 
                                variant={review.approvalStatus === 'approved' ? 'default' : 'secondary'}
                                className="flex items-center space-x-1"
                              >
                                <Check className="h-3 w-3" />
                                <span>{review.approvalStatus === 'approved' ? 'Approved Review' : 'Pending Review'}</span>
                              </Badge>
                              {review.verified && (
                                <Badge variant="outline" className="flex items-center space-x-1">
                                  <Crown className="h-3 w-3" />
                                  <span>Verified</span>
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Pagination */}
                    {getTotalReviewPages(speakerReviews) > 1 && (
                      <div className="mt-6 flex items-center justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentReviewPage(Math.max(1, currentReviewPage - 1))}
                          disabled={currentReviewPage === 1}
                        >
                          Previous
                        </Button>
                        
                        <div className="flex space-x-1">
                          {Array.from({ length: getTotalReviewPages(speakerReviews) }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={currentReviewPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentReviewPage(page)}
                              className="min-w-[40px]"
                            >
                              {page}
                            </Button>
                          ))}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentReviewPage(Math.min(getTotalReviewPages(speakerReviews), currentReviewPage + 1))}
                          disabled={currentReviewPage === getTotalReviewPages(speakerReviews)}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No reviews yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="stats">
            <div className="space-y-6">
              {/* Time Range Selector */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Time Period:</span>
                  <Select value={analyticsTimeframe} onValueChange={setAnalyticsTimeframe}>
                    <SelectTrigger className="w-[160px]" data-testid="select-analytics-timeframe">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="7d">Last Week</SelectItem>
                      <SelectItem value="30d">Last Month</SelectItem>
                      <SelectItem value="90d">Last 3 Months</SelectItem>
                      <SelectItem value="180d">Last 6 Months</SelectItem>
                      <SelectItem value="365d">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* All-Time Profile Views - Always visible and working for all tiers */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {analyticsTimeframe === 'all' ? 'All-Time Stats' : 
                   analyticsTimeframe === '7d' ? 'Last Week Stats' :
                   analyticsTimeframe === '30d' ? 'Last Month Stats' :
                   analyticsTimeframe === '90d' ? 'Last 3 Months Stats' :
                   analyticsTimeframe === '180d' ? 'Last 6 Months Stats' :
                   'Last Year Stats'}
                </h2>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Eye className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-3xl font-bold">{userStats?.profileViews || 0}</div>
                    <div className="text-sm text-gray-600">
                      {analyticsTimeframe === 'all' ? 'All-Time' : 
                       analyticsTimeframe === '7d' ? 'Last Week' :
                       analyticsTimeframe === '30d' ? 'Last Month' :
                       analyticsTimeframe === '90d' ? 'Last 3 Months' :
                       analyticsTimeframe === '180d' ? 'Last 6 Months' :
                       'Last Year'} Profile Views
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Premium Analytics Sections - Greyed out for Basic tier only */}
              <div className={cn(
                "space-y-6",
                (speakerProfile?.subscriptionTier ?? 'basic') === 'basic' && "opacity-50 pointer-events-none select-none"
              )}>
                {/* Overview Metrics */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Clock className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
                        <div className="text-2xl font-bold">
                          {userStats?.avgTimeOnProfile ? `${Math.floor(userStats.avgTimeOnProfile / 60)}:${(userStats.avgTimeOnProfile % 60).toString().padStart(2, '0')}` : '0:00'}
                        </div>
                        <div className="text-sm text-gray-600">Avg Time on Profile</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Heart className="h-8 w-8 mx-auto mb-2 text-red-600" />
                        <div className="text-2xl font-bold">{userStats?.favoritesCount || 0}</div>
                        <div className="text-sm text-gray-600">Favorites</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Star className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                        <div className="text-2xl font-bold">{userStats?.reviewsCount || 0}</div>
                        <div className="text-sm text-gray-600">Reviews</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Download className="h-8 w-8 mx-auto mb-2 text-green-600" />
                        <div className="text-2xl font-bold">{userStats?.totalDownloads || 0}</div>
                        <div className="text-sm text-gray-600">Content Downloads</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Share2 className="h-8 w-8 mx-auto mb-2 text-cyan-600" />
                        <div className="text-2xl font-bold">{userStats?.shareClicks || 0}</div>
                        <div className="text-sm text-gray-600">Profile Shares</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Globe className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                        <div className="text-2xl font-bold">{userStats?.websiteClicks || 0}</div>
                        <div className="text-sm text-gray-600">Website Clicks</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 text-center">
                        <Search className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                        <div className="text-2xl font-bold">{userStats?.searchAppearances || 0}</div>
                        <div className="text-sm text-gray-600">Search Appearances</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 text-center">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                        <div className="text-2xl font-bold">{userStats?.engagementClicks || 0}</div>
                        <div className="text-sm text-gray-600">Engagement Clicks</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Interactions Over Time Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Interactions Over Time
                    </CardTitle>
                    <CardDescription>
                      Profile views and engagement {
                        analyticsTimeframe === 'all' ? 'over all time' : 
                        analyticsTimeframe === '7d' ? 'over the past week' :
                        analyticsTimeframe === '30d' ? 'over the past month' :
                        analyticsTimeframe === '90d' ? 'over the past 3 months' :
                        analyticsTimeframe === '180d' ? 'over the past 6 months' :
                        'over the past year'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={userStats?.interactionsOverTime || [
                          { date: 'Week 1', views: 0, clicks: 0 },
                          { date: 'Week 2', views: 0, clicks: 0 },
                          { date: 'Week 3', views: 0, clicks: 0 },
                          { date: 'Week 4', views: 0, clicks: 0 }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} name="Profile Views" />
                          <Line type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={2} name="Engagement Clicks" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Two Column Layout for Social and Discovery */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Social Engagement Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-purple-600" />
                        Social Engagement
                      </CardTitle>
                      <CardDescription>Clicks on your social media links</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs font-bold">IG</span>
                            </div>
                            <span className="font-medium">Instagram</span>
                          </div>
                          <span className="text-lg font-bold">{userStats?.socialClicksByPlatform?.instagram || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs font-bold">FB</span>
                            </div>
                            <span className="font-medium">Facebook</span>
                          </div>
                          <span className="text-lg font-bold">{userStats?.socialClicksByPlatform?.facebook || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs font-bold">X</span>
                            </div>
                            <span className="font-medium">X (Twitter)</span>
                          </div>
                          <span className="text-lg font-bold">{userStats?.socialClicksByPlatform?.x || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs font-bold">in</span>
                            </div>
                            <span className="font-medium">LinkedIn</span>
                          </div>
                          <span className="text-lg font-bold">{userStats?.socialClicksByPlatform?.linkedin || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center border border-gray-700">
                              <span className="text-white text-xs font-bold">TT</span>
                            </div>
                            <span className="font-medium text-white">TikTok</span>
                          </div>
                          <span className="text-lg font-bold text-white">{userStats?.socialClicksByPlatform?.tiktok || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* How People Find You Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-green-600" />
                        How People Find You
                      </CardTitle>
                      <CardDescription>Discovery sources for your profile</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Search className="h-5 w-5 text-green-600" />
                            <span className="font-medium">Search Results</span>
                          </div>
                          <span className="text-lg font-bold">{userStats?.discoverySources?.search || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-purple-600" />
                            <span className="font-medium">Category Browse</span>
                          </div>
                          <span className="text-lg font-bold">{userStats?.discoverySources?.category || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-600" />
                            <span className="font-medium">Featured Section</span>
                          </div>
                          <span className="text-lg font-bold">{userStats?.discoverySources?.featured || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <ExternalLink className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">Direct Link</span>
                          </div>
                          <span className="text-lg font-bold">{userStats?.discoverySources?.direct || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Last 7 Days Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-teal-600" />
                      Last 7 Days
                    </CardTitle>
                    <CardDescription>Your recent activity summary</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{userStats?.last7Days?.views || 0}</div>
                        <div className="text-sm text-gray-600">Views</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{userStats?.last7Days?.clicks || 0}</div>
                        <div className="text-sm text-gray-600">Clicks</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{userStats?.last7Days?.shares || 0}</div>
                        <div className="text-sm text-gray-600">Shares</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{userStats?.last7Days?.downloads || 0}</div>
                        <div className="text-sm text-gray-600">Downloads</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Downloads - Premier only */}
                <Card className={(speakerProfile?.subscriptionTier ?? 'basic') !== 'premier' ? 'relative' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5 text-green-600" />
                      Recent Downloads
                      {(speakerProfile?.subscriptionTier ?? 'basic') !== 'premier' && (
                        <Lock className="h-4 w-4 text-gray-400" />
                      )}
                    </CardTitle>
                    <CardDescription>Content downloaded from your profile</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(speakerProfile?.subscriptionTier ?? 'basic') === 'premier' ? (
                      userStats?.downloads && userStats.downloads.length > 0 ? (
                        <div className="space-y-3">
                          {userStats.downloads.slice(0, 5).map((download: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-gray-500" />
                                <div>
                                  <div className="font-medium">{download.fileName || 'Unknown File'}</div>
                                  <div className="text-sm text-gray-500">{download.downloadedAt || 'Recently'}</div>
                                </div>
                              </div>
                              <Badge variant="secondary">{download.count || 1} downloads</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Download className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>No downloads yet</p>
                          <p className="text-sm">When visitors download your content, it will appear here</p>
                        </div>
                      )
                    ) : (
                      <div className="space-y-4">
                        {/* Pro tier message */}
                        <Alert className="bg-amber-50 border-amber-200">
                          <Lock className="h-4 w-4 text-amber-600" />
                          <AlertTitle className="text-amber-800">Download Analytics Not Available</AlertTitle>
                          <AlertDescription className="text-amber-700">
                            As a Pro member, you can create and share Access Codes, but you cannot see who downloads your content. 
                            <Link href="/subscription-upgrade" className="underline font-medium ml-1">Upgrade to Premier</Link> to unlock download tracking and see exactly who accesses your content.
                          </AlertDescription>
                        </Alert>
                        {/* Blurred placeholder */}
                        <div className="relative">
                          <div className="space-y-3 blur-sm pointer-events-none select-none opacity-50">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-gray-400" />
                                <div>
                                  <div className="font-medium text-gray-400">Sample Document.pdf</div>
                                  <div className="text-sm text-gray-300">Dec 15, 2025</div>
                                </div>
                              </div>
                              <Badge variant="secondary" className="opacity-50">3 downloads</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-gray-400" />
                                <div>
                                  <div className="font-medium text-gray-400">Presentation.pdf</div>
                                  <div className="text-sm text-gray-300">Dec 14, 2025</div>
                                </div>
                              </div>
                              <Badge variant="secondary" className="opacity-50">5 downloads</Badge>
                            </div>
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                            <div className="text-center p-4">
                              <Lock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm text-gray-600 font-medium">Premier feature</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Upgrade prompt for Basic tier only */}
              {(speakerProfile?.subscriptionTier ?? 'basic') === 'basic' && (
                <div className="mt-6">
                  <UpgradePrompt 
                    feature="analytics"
                    currentTier={(speakerProfile?.subscriptionTier ?? 'basic') as "basic" | "pro" | "premier"}
                    onUpgradeClick={() => setActiveTab("subscription")}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          {/* My Content Tab */}
          <TabsContent value="content">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">My Content</h2>
                  <p className="text-gray-600 mt-2">
                    Manage your documents, presentations, media files, and other content
                  </p>
                </div>
                <div>
                  <input
                    type="file"
                    id="fileUpload"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.mp4,.mov,.mp3,.wav"
                  />
                  <Button
                    onClick={() => document.getElementById('fileUpload')?.click()}
                    disabled={uploadContentMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {uploadContentMutation.isPending ? 'Uploading...' : 'Upload File'}
                  </Button>
                </div>
              </div>

              {/* File Upload Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => document.getElementById('pdfUpload')?.click()}
                >
                  <CardContent className="p-6 text-center">
                    <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload PDF</h3>
                    <p className="text-sm text-gray-600">Documents, presentations, guides</p>
                    <input
                      type="file"
                      id="pdfUpload"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf"
                    />
                  </CardContent>
                </Card>

                <Card 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => document.getElementById('imageUpload')?.click()}
                >
                  <CardContent className="p-6 text-center">
                    <Image className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Images</h3>
                    <p className="text-sm text-gray-600">Photos, diagrams, charts</p>
                    <input
                      type="file"
                      id="imageUpload"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".jpg,.jpeg,.png,.gif"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Upload Usage Status */}
              <div className="mt-6">
                {renderUploadUsage()}
              </div>

              {/* Uploaded Content Section */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900">Uploaded Content</h3>
                    <p className="text-gray-600 mt-1">
                      Manage and organize your uploaded files. Toggle visibility to control what appears on your public profile.
                    </p>
                  </div>
                </div>

                {speakerContent && speakerContent.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {speakerContent.map((content: any) => (
                      <div key={content.id} className="flex flex-col items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-2.5 hover:shadow-md transition-shadow relative group w-36 h-36">
                        <div className="absolute top-1 right-1">
                          {content.isPublic ? (
                            <Badge variant="outline" className="text-[8px] px-1 py-0 text-green-600 border-green-600 bg-white">Public</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[8px] px-1 py-0 text-gray-500 border-gray-400 bg-white">Private</Badge>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center w-full pt-2">
                          <div className="p-1.5 bg-white rounded-md shadow-sm mb-1">
                            {getFileIcon(content.category)}
                          </div>
                          <h4 className="font-medium text-gray-900 text-[11px] text-center line-clamp-2 w-full leading-tight">{content.originalName}</h4>
                          <span className="text-[9px] text-gray-500 mt-0.5">{formatFileSize(content.fileSize)}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleContentVisibility(content.id, !content.isPublic)}
                            disabled={updateContentMutation.isPending}
                            className="flex-1 text-[9px] h-6 px-1"
                          >
                            {content.isPublic ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteContentMutation.mutate(content.id)}
                            disabled={deleteContentMutation.isPending}
                            className="text-[9px] h-6 px-1.5 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <FileText className="h-8 w-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No Content Uploaded Yet</h4>
                      <p className="text-gray-600 mb-4">
                        Start by uploading your first file using the upload cards above.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Content Management Section */}
              {speakerContent && speakerContent.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Content Management</h3>
                      <p className="text-gray-600 mt-1">
                        Control the visibility of your uploaded content. Public content appears on your speaker profile for potential clients to view and download.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Eye className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Public Content</p>
                        <p className="text-gray-600">Visible on your speaker profile for everyone to see and download</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <EyeOff className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Private Content</p>
                        <p className="text-gray-600">Only visible to you in this dashboard</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Content List */}
              <div className="space-y-4">
                {speakerContent && speakerContent.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {speakerContent.map((content: any) => (
                      <div key={content.id} className="flex flex-col items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-2 hover:shadow-md transition-shadow relative w-36 h-36">
                        <div className="absolute top-1 left-1 flex gap-0.5">
                          {content.isPublic ? (
                            <Badge variant="outline" className="text-[7px] px-0.5 py-0 text-green-600 border-green-600 bg-white leading-tight">Public</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[7px] px-0.5 py-0 text-gray-500 border-gray-400 bg-white leading-tight">Private</Badge>
                          )}
                          {content.requiresAccessCode && (
                            <Badge variant="outline" className="text-[7px] px-0.5 py-0 text-blue-600 border-blue-600 bg-white leading-tight">Code</Badge>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center w-full pt-3">
                          <div className="p-1 bg-white rounded-md shadow-sm mb-1">
                            {getFileIcon(content.category)}
                          </div>
                          <h4 className="font-medium text-gray-900 text-[11px] text-center line-clamp-2 w-full leading-tight">{content.originalName}</h4>
                          <span className="text-[9px] text-gray-500 mt-0.5">{formatFileSize(content.fileSize)}</span>
                        </div>
                        <div className="flex items-center gap-0.5 mt-1 w-full justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleContentVisibility(content.id, !content.isPublic)}
                            disabled={updateContentMutation.isPending}
                            className={cn("h-5 w-5 p-0", content.isPublic ? "text-orange-600 border-orange-600" : "text-green-600 border-green-600")}
                            title={content.isPublic ? "Make Private" : "Make Public"}
                          >
                            {content.isPublic ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
                          </Button>
                          <TooltipProvider>
                            <ShadcnTooltip delayDuration={100}>
                              <TooltipTrigger asChild>
                                <span className="inline-block">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={(speakerProfile?.subscriptionTier ?? 'basic') === 'basic'}
                                    onClick={() => {
                                      if ((speakerProfile?.subscriptionTier ?? 'basic') === 'basic') {
                                        toast({ title: "Pro Feature", description: "Access codes are available on the Pro plan.", variant: "default" });
                                      } else {
                                        setSelectedContentForAccessCodes(content);
                                      }
                                    }}
                                    className={cn("h-5 w-5 p-0 text-blue-600 border-blue-600", (speakerProfile?.subscriptionTier ?? 'basic') === 'basic' && "opacity-50 pointer-events-none")}
                                  >
                                    <Zap className="h-2.5 w-2.5" />
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs text-center p-2">
                                {(speakerProfile?.subscriptionTier ?? 'basic') === 'basic' ? (
                                  <p className="text-xs"><strong>Access Codes</strong> — Upgrade to Pro to unlock.</p>
                                ) : (
                                  <p className="text-xs">Manage Access Codes</p>
                                )}
                              </TooltipContent>
                            </ShadcnTooltip>
                          </TooltipProvider>
                          <Button variant="outline" size="sm" onClick={() => handleDownload(content.id, content.originalName)} title="Download" className="h-5 w-5 p-0">
                            <Download className="h-2.5 w-2.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteContentMutation.mutate(content.id)}
                            disabled={deleteContentMutation.isPending}
                            className="h-5 w-5 p-0 text-red-500 border-red-500"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Content Yet</h3>
                      <p className="text-gray-600 mb-6">
                        Start by uploading your first document, presentation, or media file
                      </p>
                      <Button
                        onClick={() => document.getElementById('fileUpload')?.click()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Upload Your First File
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Video Links Section */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900">Video Links</h3>
                    <p className="text-gray-600 mt-1">
                      Add links to your speaking videos on YouTube, Vimeo, or other platforms.
                      {videoLinksData && (
                        <span className="text-sm ml-2">
                          ({videoLinksData.currentCount}/{videoLinksData.maxLinks} slots used, {videoLinksData.visibleCount} visible publicly)
                        </span>
                      )}
                    </p>
                  </div>
                  {(speakerProfile?.subscriptionTier === 'pro' || speakerProfile?.subscriptionTier === 'premier') && (
                    <Dialog open={showAddVideoLinkDialog} onOpenChange={setShowAddVideoLinkDialog}>
                      <DialogTrigger asChild>
                        <Button
                          disabled={videoLinksData && videoLinksData.currentCount >= videoLinksData.maxLinks}
                          className="bg-blue-600 hover:bg-blue-700"
                          data-testid="button-add-video-link"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Video Link
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Video Link</DialogTitle>
                          <DialogDescription>
                            Add a link to a speaking video on YouTube, Vimeo, or other platforms.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="videoTitle">Title *</Label>
                            <Input
                              id="videoTitle"
                              placeholder="e.g., Keynote at Healthcare Summit 2024"
                              value={newVideoLink.title}
                              onChange={(e) => setNewVideoLink({...newVideoLink, title: e.target.value})}
                              data-testid="input-video-title"
                            />
                          </div>
                          <div>
                            <Label htmlFor="videoUrl">Video URL *</Label>
                            <Input
                              id="videoUrl"
                              placeholder="https://youtube.com/watch?v=..."
                              value={newVideoLink.url}
                              onChange={(e) => setNewVideoLink({...newVideoLink, url: e.target.value})}
                              data-testid="input-video-url"
                            />
                          </div>
                          <div>
                            <Label htmlFor="videoDescription">Description (optional)</Label>
                            <Textarea
                              id="videoDescription"
                              placeholder="Brief description of the video..."
                              value={newVideoLink.description}
                              onChange={(e) => setNewVideoLink({...newVideoLink, description: e.target.value})}
                              data-testid="input-video-description"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setShowAddVideoLinkDialog(false)}>
                            Cancel
                          </Button>
                          <Button
                            onClick={() => createVideoLinkMutation.mutate(newVideoLink)}
                            disabled={!newVideoLink.title || !newVideoLink.url || createVideoLinkMutation.isPending}
                            data-testid="button-save-video-link"
                          >
                            {createVideoLinkMutation.isPending ? 'Adding...' : 'Add Video Link'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {/* Basic tier upgrade prompt */}
                {(speakerProfile?.subscriptionTier ?? 'basic') === 'basic' && (
                  <Card className="bg-gray-50 border-dashed">
                    <CardContent className="p-6 text-center">
                      <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Video Links Available on Pro & Premier</h4>
                      <p className="text-gray-600 mb-4">
                        Upgrade to showcase your speaking videos and reach more potential clients.
                      </p>
                      <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setActiveTab("subscription")}>
                        <Crown className="h-4 w-4 mr-2" />
                        View Upgrade Options
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Pro/Premier video links list */}
                {(speakerProfile?.subscriptionTier === 'pro' || speakerProfile?.subscriptionTier === 'premier') && (
                  <>
                    {videoLinksData && videoLinksData.links.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 mb-2">
                          {videoLinksData.currentVisibleCount}/{videoLinksData.visibleCount} visible slots used
                        </p>
                        {videoLinksData.links.map((link) => (
                          <Card key={link.id} className={cn(
                            "hover:shadow-md transition-shadow",
                            !link.isVisible && "opacity-60 border-dashed"
                          )}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                  <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                                    <Video className="h-5 w-5 text-red-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    {editingVideoLink?.id === link.id ? (
                                      <div className="space-y-2">
                                        <Input
                                          value={editingVideoLink.title}
                                          onChange={(e) => setEditingVideoLink({...editingVideoLink, title: e.target.value})}
                                          placeholder="Video title"
                                          data-testid={`input-edit-title-${link.id}`}
                                        />
                                        <Input
                                          value={editingVideoLink.url}
                                          onChange={(e) => setEditingVideoLink({...editingVideoLink, url: e.target.value})}
                                          placeholder="Video URL"
                                          data-testid={`input-edit-url-${link.id}`}
                                        />
                                        <Textarea
                                          value={editingVideoLink.description || ''}
                                          onChange={(e) => setEditingVideoLink({...editingVideoLink, description: e.target.value})}
                                          placeholder="Description (optional)"
                                          rows={2}
                                          data-testid={`input-edit-description-${link.id}`}
                                        />
                                      </div>
                                    ) : (
                                      <>
                                        <h4 className="font-medium text-gray-900 truncate">{link.title}</h4>
                                        <a 
                                          href={link.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="text-sm text-blue-600 hover:underline truncate block"
                                        >
                                          {link.url}
                                        </a>
                                        {link.description && (
                                          <p className="text-sm text-gray-500 mt-1 truncate">{link.description}</p>
                                        )}
                                      </>
                                    )}
                                  </div>
                                  {!link.isVisible && (
                                    <Badge variant="outline" className="text-gray-500 border-gray-400 flex-shrink-0">
                                      Hidden
                                    </Badge>
                                  )}
                                  {link.isVisible && (
                                    <Badge variant="outline" className="text-green-600 border-green-600 flex-shrink-0">
                                      Visible
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                  {editingVideoLink?.id === link.id ? (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          updateVideoLinkMutation.mutate({
                                            linkId: link.id,
                                            data: {
                                              title: editingVideoLink.title,
                                              url: editingVideoLink.url,
                                              description: editingVideoLink.description || undefined
                                            }
                                          });
                                        }}
                                        disabled={updateVideoLinkMutation.isPending}
                                        data-testid={`button-save-edit-${link.id}`}
                                      >
                                        <Save className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingVideoLink(null)}
                                      >
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const atLimit = (videoLinksData?.currentVisibleCount ?? 0) >= (videoLinksData?.visibleCount ?? 0);
                                          if (!link.isVisible && atLimit) {
                                            toast({
                                              title: "Visibility Limit Reached",
                                              description: `You can only have ${videoLinksData?.visibleCount} videos visible on your ${speakerProfile?.subscriptionTier} plan. Hide another video first.`,
                                              variant: "destructive"
                                            });
                                            return;
                                          }
                                          toggleVideoVisibilityMutation.mutate(link.id);
                                        }}
                                        disabled={toggleVideoVisibilityMutation.isPending || (!link.isVisible && (videoLinksData?.currentVisibleCount ?? 0) >= (videoLinksData?.visibleCount ?? 0))}
                                        title={link.isVisible ? "Hide from public profile" : ((videoLinksData?.currentVisibleCount ?? 0) >= (videoLinksData?.visibleCount ?? 0) ? "Visibility limit reached" : "Show on public profile")}
                                        data-testid={`button-toggle-visibility-${link.id}`}
                                      >
                                        {link.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingVideoLink({
                                          id: link.id,
                                          title: link.title,
                                          url: link.url,
                                          description: link.description
                                        })}
                                        data-testid={`button-edit-video-${link.id}`}
                                      >
                                        <Edit3 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(link.url, '_blank')}
                                        title="Open video in new tab"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => deleteVideoLinkMutation.mutate(link.id)}
                                        disabled={deleteVideoLinkMutation.isPending}
                                        className="text-red-600 border-red-600 hover:bg-red-50"
                                        data-testid={`button-delete-video-${link.id}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {videoLinksData.currentCount > videoLinksData.visibleCount && (
                          <p className="text-sm text-amber-600 mt-2">
                            {videoLinksData.currentCount - videoLinksData.visibleCount} video(s) are hidden from your public profile. 
                            {speakerProfile?.subscriptionTier === 'pro' && ' Upgrade to Premier to show up to 5 videos.'}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">No Video Links Yet</h4>
                          <p className="text-gray-600 mb-4">
                            Add links to your speaking videos to showcase your presentation style.
                          </p>
                          <Button
                            onClick={() => setShowAddVideoLinkDialog(true)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Video Link
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription">
            <div className="space-y-6">
              {/* Storage Usage Card (Phase 2) */}
              {storageUsage && (
                <StorageUsage {...storageUsage} />
              )}

              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {subscriptionStatus?.tier === 'premier' 
                    ? 'Your Premier Plan' 
                    : subscriptionStatus?.tier === 'pro'
                    ? 'Your Pro Plan'
                    : 'Choose Your Speaker Plan'}
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  {subscriptionStatus?.tier === 'premier'
                    ? "You're on our top tier with maximum visibility and all premium features"
                    : subscriptionStatus?.tier === 'pro'
                    ? "You're on the Pro plan. Upgrade to Premier for maximum exposure and elite speaker benefits"
                    : "Unlock premium features and boost your visibility with our professional speaker subscription plans"}
                </p>
                {subscriptionStatus && subscriptionStatus.tier !== 'basic' && (
                  <div className="mt-4">
                    <Badge className={
                      subscriptionStatus.tier === 'premier'
                        ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-lg px-6 py-2"
                        : "bg-blue-600 text-white text-lg px-6 py-2"
                    }>
                      Current: {subscriptionStatus.tier.charAt(0).toUpperCase() + subscriptionStatus.tier.slice(1)}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Manage Subscription Card - Show for Pro/Premier users */}
              {subscriptionStatus && (subscriptionStatus.tier === 'pro' || subscriptionStatus.tier === 'premier') && subscriptionStatus.status === 'active' && (
                <Card className="max-w-2xl mx-auto mb-8">
                  <CardHeader>
                    <CardTitle className="text-xl">Manage Your Subscription</CardTitle>
                    <CardDescription>
                      {subscriptionStatus.cancelledAt 
                        ? "Your subscription has been cancelled but you still have access until the end of your billing period."
                        : "Your subscription is currently active. You can cancel it at any time."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        {subscriptionStatus.cancelledAt ? (
                          <>
                            <Alert className="mb-4">
                              <AlertTitle>Subscription Cancelled</AlertTitle>
                              <AlertDescription>
                                Your subscription was cancelled on {new Date(subscriptionStatus.cancelledAt).toLocaleDateString()}.
                                You'll continue to have access until your current period ends.
                              </AlertDescription>
                            </Alert>
                            {subscriptionStatus.periodEnd && (
                              <p className="text-sm text-gray-500">
                                Access until: {new Date(subscriptionStatus.periodEnd).toLocaleDateString()}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-gray-600 mb-1">
                              If you cancel, you'll have access until the end of your current billing period.
                            </p>
                            {subscriptionStatus.periodEnd && (
                              <p className="text-sm text-gray-500">
                                Current period ends: {new Date(subscriptionStatus.periodEnd).toLocaleDateString()}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      {subscriptionStatus.cancelledAt ? (
                        <Button
                          onClick={() => reactivateSubscriptionMutation.mutate()}
                          disabled={reactivateSubscriptionMutation.isPending}
                          className="ml-4"
                          data-testid="button-reactivate-subscription"
                        >
                          {reactivateSubscriptionMutation.isPending ? "Processing..." : "Reactivate Subscription"}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => setShowCancelDialog(true)}
                          className="ml-4"
                          data-testid="button-cancel-subscription"
                        >
                          Cancel Subscription
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Cancel Subscription Dialog */}
              <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>We're Sorry to See You Go</DialogTitle>
                    <DialogDescription>
                      Your feedback helps us improve. Please take a moment to answer a few quick questions.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 mt-4">
                    {/* Question 1: Primary Reason */}
                    <div className="space-y-2">
                      <Label htmlFor="primary-reason">What's your main reason for canceling? *</Label>
                      <Select
                        value={cancellationData.primaryReason}
                        onValueChange={(value) => setCancellationData({...cancellationData, primaryReason: value})}
                      >
                        <SelectTrigger id="primary-reason" data-testid="select-primary-reason">
                          <SelectValue placeholder="Select a reason..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="too_expensive">Too expensive</SelectItem>
                          <SelectItem value="not_using_enough">Not using it enough</SelectItem>
                          <SelectItem value="missing_features">Missing features I need</SelectItem>
                          <SelectItem value="found_alternative">Found a better alternative</SelectItem>
                          <SelectItem value="technical_issues">Technical issues</SelectItem>
                          <SelectItem value="other">Other reason</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Question 2: Missing Features (conditional) */}
                    {cancellationData.primaryReason === 'missing_features' && (
                      <div className="space-y-2">
                        <Label htmlFor="missing-features">What features are you looking for?</Label>
                        <Textarea
                          id="missing-features"
                          placeholder="Tell us what features would make you stay..."
                          value={cancellationData.missingFeatures}
                          onChange={(e) => setCancellationData({...cancellationData, missingFeatures: e.target.value})}
                          rows={3}
                          maxLength={200}
                          data-testid="textarea-missing-features"
                        />
                        <p className="text-xs text-gray-500">
                          {cancellationData.missingFeatures.length} / 200 characters
                        </p>
                      </div>
                    )}

                    {/* Question 3: Would Recommend */}
                    <div className="space-y-3">
                      <Label>Would you recommend SpeakerSphere to a colleague?</Label>
                      <RadioGroup
                        value={cancellationData.wouldRecommend}
                        onValueChange={(value) => setCancellationData({...cancellationData, wouldRecommend: value})}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="recommend-yes" data-testid="radio-recommend-yes" />
                          <Label htmlFor="recommend-yes" className="font-normal cursor-pointer">Yes, I would recommend it</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="maybe" id="recommend-maybe" data-testid="radio-recommend-maybe" />
                          <Label htmlFor="recommend-maybe" className="font-normal cursor-pointer">Maybe, it depends</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="recommend-no" data-testid="radio-recommend-no" />
                          <Label htmlFor="recommend-no" className="font-normal cursor-pointer">No, I wouldn't recommend it</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Question 4: Additional Feedback (Optional) */}
                    <div className="space-y-2">
                      <Label htmlFor="additional-feedback">Any other feedback? (Optional)</Label>
                      <Textarea
                        id="additional-feedback"
                        placeholder="Share any additional thoughts or suggestions..."
                        value={cancellationData.additionalFeedback}
                        onChange={(e) => setCancellationData({...cancellationData, additionalFeedback: e.target.value})}
                        rows={4}
                        maxLength={500}
                        data-testid="textarea-additional-feedback"
                      />
                      <p className="text-xs text-gray-500">
                        {cancellationData.additionalFeedback.length} / 500 characters
                      </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCancelDialog(false);
                          setCancellationData({
                            primaryReason: '',
                            wouldRecommend: '',
                            missingFeatures: '',
                            additionalFeedback: ''
                          });
                        }}
                        disabled={cancelSubscriptionMutation.isPending}
                      >
                        Keep Subscription
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => cancelSubscriptionMutation.mutate(cancellationData)}
                        disabled={!cancellationData.primaryReason || cancelSubscriptionMutation.isPending}
                        data-testid="button-confirm-cancel"
                      >
                        {cancelSubscriptionMutation.isPending ? "Processing..." : "Cancel Subscription"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Always show all three tiers for comparison */}
              <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
                {/* Basic Plan - FREE */}
                <Card className="border-gray-200 hover:border-gray-300 transition-colors">
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-gray-100 rounded-full">
                        <User className="h-8 w-8 text-gray-600" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Basic</CardTitle>
                    <CardDescription className="text-lg">Get started for free</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-gray-900">Free</span>
                      <span className="text-gray-600">/forever</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      {!allTierLimitsLoading && allTierLimits && (
                        <>
                          {/* Profile Limits */}
                          <div className="flex items-start space-x-3">
                            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 font-semibold">{formatTierLimit(allTierLimits, 'basic', 'bioWordLimit')}</span>
                          </div>
                          <div className="flex items-start space-x-3">
                            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 font-semibold">{formatTierLimit(allTierLimits, 'basic', 'topicLimit')}</span>
                          </div>
                          <div className="flex items-start space-x-3">
                            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 font-semibold">{formatTierLimit(allTierLimits, 'basic', 'storageLimitMb')}</span>
                          </div>
                        </>
                      )}
                      {/* Basic Features */}
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Basic profile listing</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Standard search visibility</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Email support</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Basic analytics</span>
                      </div>
                    </div>
                    {subscriptionStatus?.tier === 'basic' ? (
                      <Button className="w-full bg-gray-400 cursor-not-allowed" disabled data-testid="button-current-plan">
                        Current Plan
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>

                {/* Pro Plan - Most Popular */}
                <Card className="border-blue-300 border-2 relative hover:border-blue-400 transition-colors">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1 text-sm font-medium">
                      Most Popular
                    </Badge>
                  </div>
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <Star className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Pro</CardTitle>
                    <CardDescription className="text-lg">Pro speaker status</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-gray-900">$29</span>
                      <span className="text-gray-600">/month</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">or $290/year (save $58)</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      {!allTierLimitsLoading && allTierLimits && (
                        <>
                          {/* Profile Limits */}
                          <div className="flex items-start space-x-3">
                            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 font-semibold">{formatTierLimit(allTierLimits, 'pro', 'bioWordLimit')}</span>
                          </div>
                          <div className="flex items-start space-x-3">
                            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 font-semibold">{formatTierLimit(allTierLimits, 'pro', 'topicLimit')}</span>
                          </div>
                          <div className="flex items-start space-x-3">
                            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 font-semibold">{formatTierLimit(allTierLimits, 'pro', 'uploadLimit')}</span>
                          </div>
                          <div className="flex items-start space-x-3">
                            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 font-semibold">{formatTierLimit(allTierLimits, 'pro', 'storageLimitMb')}</span>
                          </div>
                        </>
                      )}
                      {/* Pro Features */}
                      <div className="text-sm font-medium text-blue-700 mb-2">Everything in Basic, plus:</div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Pro speaker badge</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Enhanced homepage rotation</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Priority search placement</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Advanced analytics dashboard</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Admin-managed inquiries</span>
                      </div>
                    </div>
                    {subscriptionStatus?.tier === 'pro' ? (
                      <Button className="w-full bg-gray-400 cursor-not-allowed" disabled data-testid="button-current-plan">
                        Current Plan
                      </Button>
                    ) : subscriptionStatus?.tier === 'premier' ? (
                      null
                    ) : (
                      <Link href="/subscription/upgrade">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700" data-testid="button-upgrade-pro">
                          Upgrade to Pro
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>

                {/* Premier Plan */}
                <Card className="border-yellow-300 hover:border-yellow-400 transition-colors">
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-yellow-100 rounded-full">
                        <Crown className="h-8 w-8 text-yellow-600" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Premier</CardTitle>
                    <CardDescription className="text-lg">Elite speaker experience</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-gray-900">$99</span>
                      <span className="text-gray-600">/month</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">or $990/year (save $198)</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      {!allTierLimitsLoading && allTierLimits && (
                        <>
                          {/* Profile Limits */}
                          <div className="flex items-start space-x-3">
                            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 font-semibold">{formatTierLimit(allTierLimits, 'premier', 'bioWordLimit')}</span>
                          </div>
                          <div className="flex items-start space-x-3">
                            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 font-semibold">{formatTierLimit(allTierLimits, 'premier', 'topicLimit')}</span>
                          </div>
                          <div className="flex items-start space-x-3">
                            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 font-semibold">{formatTierLimit(allTierLimits, 'premier', 'uploadLimit')}</span>
                          </div>
                          <div className="flex items-start space-x-3">
                            <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 font-semibold">{formatTierLimit(allTierLimits, 'premier', 'storageLimitMb')}</span>
                          </div>
                        </>
                      )}
                      {/* Premier Features */}
                      <div className="text-sm font-medium text-yellow-700 mb-2">Everything in Pro, plus:</div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Premier speaker badge</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Top homepage placement</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Maximum search visibility</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Premium analytics suite</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Direct client inquiries</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">24/7 priority support</span>
                      </div>
                    </div>
                    {subscriptionStatus?.tier === 'premier' ? (
                      <Button className="w-full bg-gray-400 cursor-not-allowed" disabled data-testid="button-current-plan">
                        Current Plan
                      </Button>
                    ) : (
                      <Link href="/subscription/upgrade">
                        <Button className="w-full bg-yellow-600 hover:bg-yellow-700" data-testid="button-upgrade-premier">
                          Upgrade to Premier
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Additional Info Section */}
              <div className="mt-12 bg-gray-50 rounded-lg p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Why Subscribe?</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <TrendingUp className="h-12 w-12 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Increased Visibility</h4>
                    <p className="text-gray-600">Get more exposure and reach the right clients with priority placement in search results.</p>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <Zap className="h-12 w-12 text-green-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Advanced Tools</h4>
                    <p className="text-gray-600">Access powerful analytics, portfolio management, and direct client communication tools.</p>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <Award className="h-12 w-12 text-purple-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Professional Status</h4>
                    <p className="text-gray-600">Build credibility with professional badges and premium branding on your profile.</p>
                  </div>
                </div>
                <div className="text-center mt-8">
                  <p className="text-sm text-gray-600">
                    All plans include a 14-day free trial. Cancel anytime. Need a custom enterprise plan? 
                    <Link href="/contact" className="text-blue-600 hover:text-blue-800 ml-1">Contact us</Link>
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {/* Access Code Management Modal */}
      <Dialog open={!!selectedContentForAccessCodes} onOpenChange={(open) => !open && setSelectedContentForAccessCodes(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Access Codes</DialogTitle>
            <DialogDescription>
              Create and manage access codes for "{selectedContentForAccessCodes?.originalName}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Pro tier analytics limitation message */}
            {(speakerProfile?.subscriptionTier ?? 'basic') === 'pro' && (
              <Alert className="bg-amber-50 border-amber-200">
                <Lock className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Download Analytics Not Available</AlertTitle>
                <AlertDescription className="text-amber-700">
                  As a Pro member, you can create and share Access Codes, but you cannot see who downloads your content. 
                  <Link href="/subscription-upgrade" className="underline font-medium ml-1">Upgrade to Premier</Link> to unlock download tracking and see exactly who accesses your content.
                </AlertDescription>
              </Alert>
            )}
            {/* Create New Access Code */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create New Access Code</CardTitle>
                <CardDescription>
                  Generate a 4-letter code that users can use to access this content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accessCode">4-Letter Code</Label>
                    <Input
                      id="accessCode"
                      placeholder="e.g., ABCD"
                      value={newAccessCode.code}
                      onChange={(e) => setNewAccessCode({...newAccessCode, code: e.target.value.toUpperCase().slice(0, 4)})}
                      maxLength={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      placeholder="e.g., For lecture attendees"
                      value={newAccessCode.description}
                      onChange={(e) => setNewAccessCode({...newAccessCode, description: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                    <Input
                      id="expiresAt"
                      type="datetime-local"
                      value={newAccessCode.expiresAt}
                      onChange={(e) => setNewAccessCode({...newAccessCode, expiresAt: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxUses">Max Uses (Optional)</Label>
                    <Input
                      id="maxUses"
                      type="number"
                      placeholder="Leave empty for unlimited"
                      value={newAccessCode.maxUses}
                      onChange={(e) => setNewAccessCode({...newAccessCode, maxUses: e.target.value})}
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => createAccessCodeMutation.mutate({
                    accessCode: newAccessCode.code,
                    description: newAccessCode.description,
                    expiresAt: newAccessCode.expiresAt || null,
                    maxUses: newAccessCode.maxUses ? parseInt(newAccessCode.maxUses) : null
                  })}
                  disabled={!newAccessCode.code || createAccessCodeMutation.isPending}
                  className="w-full"
                >
                  {createAccessCodeMutation.isPending ? "Creating..." : "Create Access Code"}
                </Button>
              </CardContent>
            </Card>

            {/* Existing Access Codes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Existing Access Codes</CardTitle>
              </CardHeader>
              <CardContent>
                {accessCodes && accessCodes.length > 0 ? (
                  <div className="space-y-3">
                    {accessCodes.map((code: any) => (
                      <div key={code.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <Badge variant="outline" className="text-lg font-mono">
                              {code.accessCode}
                            </Badge>
                            <div>
                              <p className="font-medium">{code.description || "No description"}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>Uses: {code.currentUses || 0}{code.maxUses ? `/${code.maxUses}` : ''}</span>
                                {code.expiresAt && (
                                  <span>Expires: {new Date(code.expiresAt).toLocaleDateString()}</span>
                                )}
                                <span className={code.isActive ? "text-green-600" : "text-red-600"}>
                                  {code.isActive ? "Active" : "Inactive"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No access codes created yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Download Analytics for this Content */}
            <Card className={(speakerProfile?.subscriptionTier ?? 'basic') !== 'premier' ? 'relative' : ''}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  Download Analytics
                  {(speakerProfile?.subscriptionTier ?? 'basic') !== 'premier' && (
                    <Lock className="h-4 w-4 text-gray-400" />
                  )}
                </CardTitle>
                {(speakerProfile?.subscriptionTier ?? 'basic') === 'premier' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const userData = getUserData();
                        const response = await fetch(`/api/speakers/${speakerProfile?.id}/downloads/export`, {
                          headers: {
                            'X-User-ID': userData?.id || localStorage.getItem('userId') || ''
                          }
                        });
                        if (!response.ok) {
                          throw new Error('Failed to export');
                        }
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `download-analytics-${new Date().toISOString().split('T')[0]}.xlsx`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                        toast({ title: "Export Complete", description: "Download analytics exported successfully." });
                      } catch (error) {
                        toast({ title: "Export Failed", description: "Failed to export download analytics.", variant: "destructive" });
                      }
                    }}
                    data-testid="button-export-downloads"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export All Downloads
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {(speakerProfile?.subscriptionTier ?? 'basic') === 'premier' ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {downloadAnalytics && downloadAnalytics
                      .filter((download: any) => download.contentId === selectedContentForAccessCodes?.id)
                      .map((download: any) => (
                        <div key={download.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium">{download.userName}</p>
                            <p className="text-sm text-gray-500">{download.userEmail}</p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p>{new Date(download.downloadedAt).toLocaleDateString()}</p>
                            {download.accessCodeId && <p>Used access code</p>}
                          </div>
                        </div>
                      ))}
                    {(!downloadAnalytics || downloadAnalytics.filter((d: any) => d.contentId === selectedContentForAccessCodes?.id).length === 0) && (
                      <div className="text-center py-4 text-gray-500">No downloads yet</div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    {/* Blurred placeholder content */}
                    <div className="space-y-3 blur-sm pointer-events-none select-none opacity-50">
                      <div className="flex items-center justify-between p-3 border rounded bg-gray-50">
                        <div>
                          <p className="font-medium text-gray-400">John Smith</p>
                          <p className="text-sm text-gray-300">john@example.com</p>
                        </div>
                        <div className="text-right text-sm text-gray-300">
                          <p>Dec 15, 2025</p>
                          <p>Used access code</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded bg-gray-50">
                        <div>
                          <p className="font-medium text-gray-400">Jane Doe</p>
                          <p className="text-sm text-gray-300">jane@example.com</p>
                        </div>
                        <div className="text-right text-sm text-gray-300">
                          <p>Dec 14, 2025</p>
                          <p>Used access code</p>
                        </div>
                      </div>
                    </div>
                    {/* Overlay with upgrade message */}
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                      <div className="text-center p-4">
                        <Lock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600 font-medium">Premier feature</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}