import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, MessageSquare, Star, TrendingUp, LogOut, Settings, BarChart3, FolderOpen, MousePointer, Eye, EyeOff, ExternalLink, Mail, Phone, Globe, Share2, Edit, Trash2, AlertTriangle, Home, Download, Plus, UserCheck, Upload, UserPlus, Link as LinkIcon, FileText, Save, CheckCircle, XCircle, ChevronUp, ChevronDown, CreditCard, Send } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AnalyticsDashboard from "@/components/analytics-dashboard";
import { SpeakerInteractionAnalytics } from "@/components/speaker-interaction-analytics";
import { DetailedSpeakerAnalytics } from "@/components/detailed-speaker-analytics";
import { ObjectUploader } from "@/components/ObjectUploader";
import { SubscriptionFeaturesManager } from "@/components/subscription-features-manager";
import { SpeakerSubscriptionsView } from "@/components/speaker-subscriptions-view";
import type { User, Speaker, Category, Inquiry } from "@shared/schema";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [adminEmail, setAdminEmail] = useState("");
  const [editingSpeaker, setEditingSpeaker] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletionType, setDeletionType] = useState<"immediate" | "retention">("retention");
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [selectedTopicsForCategory, setSelectedTopicsForCategory] = useState<Set<number>>(new Set());
  const [isTopicCategoryDialogOpen, setIsTopicCategoryDialogOpen] = useState(false);
  const [topicCategoryFilter, setTopicCategoryFilter] = useState("");
  const [selectedCategoryForTopics, setSelectedCategoryForTopics] = useState<any>(null);
  const [newTopic, setNewTopic] = useState({ name: "", category: "" });
  const [isTopicCreationExpanded, setIsTopicCreationExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isCategoryEditDialogOpen, setIsCategoryEditDialogOpen] = useState(false);
  const [categoryAssignments, setCategoryAssignments] = useState<{[key: string]: boolean}>({});
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [speakerAssignmentCategory, setSpeakerAssignmentCategory] = useState<any>(null);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState("");
  const [feeRangeVisible, setFeeRangeVisible] = useState(false);
  const [applicationStatusFilter, setApplicationStatusFilter] = useState("all");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  
  // Category deletion confirmation modal state
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
  
  // Handle opening image modal
  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };
  
  // Handle category deletion confirmation
  const handleDeleteCategory = (category: any) => {
    setCategoryToDelete(category);
    setConfirmDeleteOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (!categoryToDelete) return;
    deleteCategoryMutation.mutate(categoryToDelete.id, {
      onSuccess: () => {
        setConfirmDeleteOpen(false);
        setCategoryToDelete(null);
      }
    });
  };
  
  // Admin speakers filter states
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // User management states
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userFilterRole, setUserFilterRole] = useState("all");
  const [userFilterStatus, setUserFilterStatus] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isBulkActionDialogOpen, setIsBulkActionDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState("");
  
  // Manual Add Speaker Dialog states
  const [isManualAddDialogOpen, setIsManualAddDialogOpen] = useState(false);
  const [manualSpeakerData, setManualSpeakerData] = useState({
    name: "",
    title: "",
    bio: "",
    email: "",
    phone: "",
    website: "",
    location: "",
    category: "",
    expertise: "",
    imageUrl: "",
    verified: false,
    featured: false
  });

  // Bulk import state
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  
  // Duplicate checking state
  const [duplicateCheckDialogOpen, setDuplicateCheckDialogOpen] = useState(false);
  const [overrideConfirmDialogOpen, setOverrideConfirmDialogOpen] = useState(false);

  // Inquiry states
  const [selectedInquiryId, setSelectedInquiryId] = useState<number | null>(null);
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState("all");
  const [inquirySearchQuery, setInquirySearchQuery] = useState("");
  const [currentApplication, setCurrentApplication] = useState<any>(null);
  const [potentialDuplicates, setPotentialDuplicates] = useState<any[]>([]);
  const [selectedExistingSpeaker, setSelectedExistingSpeaker] = useState<number | null>(null);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [actionType, setActionType] = useState<'create_new' | 'add_to_existing' | null>(null);
  const [selectedApplicationDetails, setSelectedApplicationDetails] = useState<any>(null);
  const [isEditingApplication, setIsEditingApplication] = useState(false);
  const [editableApplicationData, setEditableApplicationData] = useState<any>(null);
  const [approvedApplicationCredentials, setApprovedApplicationCredentials] = useState<{[key: number]: {email: string, password: string}}>({});
  
  const { toast } = useToast();

  // Initialize credentials for already approved applications
  useEffect(() => {
    // Set known credentials for approved applications
    setApprovedApplicationCredentials({
      4: { email: "jane.smith@example.com", password: "18Xqphfgh4cI" }, // Jane Smith
      9: { email: "rpinzon@devright.com", password: "casfjWM9Apbt" }    // Rafael Pinzon
    });
  }, []);

  // Fetch all inquiries
  const { data: inquiries = [], isLoading: inquiriesLoading } = useQuery<(Inquiry & { speakerName?: string })[]>({
    queryKey: ["/api/admin/inquiries"],
    queryFn: async () => {
      const response = await fetch("/api/admin/inquiries");
      if (!response.ok) throw new Error("Failed to fetch inquiries");
      return response.json();
    },
  });

  // Update inquiry status mutation
  const updateInquiryStatusMutation = useMutation({
    mutationFn: async ({ inquiryId, status, adminNotes }: { inquiryId: number; status: string; adminNotes?: string }) => {
      const response = await fetch(`/api/admin/inquiries/${inquiryId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes }),
      });
      if (!response.ok) throw new Error('Failed to update inquiry status');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Inquiry status updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inquiries"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update inquiry status", variant: "destructive" });
    },
  });

  // Fetch all reviews and separate them by status
  const { data: allReviews } = useQuery({
    queryKey: ["/api/admin/all-reviews"],
    queryFn: async () => {
      const response = await fetch("/api/admin/all-reviews");
      if (!response.ok) throw new Error("Failed to fetch reviews");
      return response.json();
    },
  });

  // Separate reviews by status
  const pendingReviews = allReviews?.filter((review: any) => review.approvalStatus === 'pending') || [];
  const approvedReviews = allReviews?.filter((review: any) => review.approvalStatus === 'approved') || [];
  const rejectedReviews = allReviews?.filter((review: any) => review.approvalStatus === 'rejected') || [];

  // Review approval mutations
  const approveReviewMutation = useMutation({
    mutationFn: async ({ reviewId, adminNotes }: { reviewId: number; adminNotes?: string }) => {
      const response = await fetch(`/api/admin/reviews/${reviewId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes }),
      });
      if (!response.ok) throw new Error('Failed to approve review');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Review approved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-reviews"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve review", variant: "destructive" });
    },
  });

  const rejectReviewMutation = useMutation({
    mutationFn: async ({ reviewId, adminNotes }: { reviewId: number; adminNotes?: string }) => {
      const response = await fetch(`/api/admin/reviews/${reviewId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes }),
      });
      if (!response.ok) throw new Error('Failed to reject review');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Review rejected successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-reviews"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject review", variant: "destructive" });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: number) => {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete review');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Review deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-reviews"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete review", variant: "destructive" });
    },
  });

  // Check authentication on component mount
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("adminAuthenticated");
    const email = localStorage.getItem("adminEmail");
    
    if (!isAuthenticated || isAuthenticated !== "true") {
      setLocation("/admin-login");
      return;
    }
    
    if (email) {
      setAdminEmail(email);
    }

    // Load fee range visibility setting
    const feeRangeVisibleSetting = localStorage.getItem("adminFeeRangeVisible");
    setFeeRangeVisible(feeRangeVisibleSetting === "true");
  }, [setLocation]);

  // Use admin endpoint to get all speakers including hidden ones
  const { data: speakers } = useQuery({
    queryKey: ["/api/admin/speakers"],
    queryFn: async () => {
      const response = await fetch("/api/admin/speakers");
      if (!response.ok) throw new Error("Failed to fetch speakers");
      return response.json();
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Query for all topics
  const { data: topics } = useQuery({
    queryKey: ["/api/admin/topics"],
    queryFn: async () => {
      const response = await fetch("/api/admin/topics");
      if (!response.ok) throw new Error("Failed to fetch topics");
      return response.json();
    },
  });

  const { data: users } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/admin/user-stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/user-stats");
      if (!response.ok) throw new Error("Failed to fetch user stats");
      return response.json();
    },
  });

  const { data: applications } = useQuery({
    queryKey: ["/api/admin/speaker-applications"],
    queryFn: async () => {
      const response = await fetch("/api/admin/speaker-applications");
      if (!response.ok) throw new Error("Failed to fetch speaker applications");
      return response.json();
    },
  });

  const { data: speakerAccounts } = useQuery({
    queryKey: ["/api/admin/speaker-accounts"],
    queryFn: async () => {
      const response = await fetch("/api/admin/speaker-accounts");
      if (!response.ok) throw new Error("Failed to fetch speaker accounts");
      return response.json();
    },
  });

  // Memoize application filtering and counts to prevent performance issues during tab switching
  const applicationCounts = useMemo(() => {
    if (!applications) return { pending: 0, under_review: 0, approved: 0, rejected: 0, all: 0 };
    
    const counts = {
      pending: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
      all: applications.length
    };
    
    applications.forEach((app: any) => {
      if (app.status === 'pending') counts.pending++;
      else if (app.status === 'under_review') counts.under_review++;
      else if (app.status === 'approved') counts.approved++;
      else if (app.status === 'rejected') counts.rejected++;
    });
    
    return counts;
  }, [applications]);

  const filteredApplications = useMemo(() => {
    if (!applications) return [];
    
    if (applicationStatusFilter === "all") {
      return applications;
    }
    
    return applications.filter((app: any) => app.status === applicationStatusFilter);
  }, [applications, applicationStatusFilter]);

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    localStorage.removeItem("adminEmail");
    // Clear remembered credentials on explicit logout
    localStorage.removeItem("adminRememberMe");
    localStorage.removeItem("adminRememberedEmail");
    localStorage.removeItem("adminRememberedPassword");
    setLocation("/");
  };

  const handleReturnHome = () => {
    setLocation("/");
  };

  const handleEditSpeaker = (speaker: any) => {
    setEditingSpeaker({ ...speaker });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
    setDeletePassword("");
    setDeleteError("");
  };

  // Update speaker mutation
  const updateSpeakerMutation = useMutation({
    mutationFn: async (updatedSpeaker: any) => {
      const response = await fetch(`/api/admin/speakers/${updatedSpeaker.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSpeaker),
      });
      if (!response.ok) throw new Error('Failed to update speaker');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Speaker updated successfully" });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/speakers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/speakers"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update speaker", variant: "destructive" });
    },
  });

  // Delete speaker mutation
  const deleteSpeakerMutation = useMutation({
    mutationFn: async ({ speakerId, password, deletionType }: { speakerId: number; password: string; deletionType: "immediate" | "retention" }) => {
      const response = await fetch(`/api/admin/speakers/${speakerId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword: password, deletionType }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete speaker');
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      const message = variables.deletionType === "immediate" 
        ? "Speaker permanently deleted" 
        : "Speaker deleted with 14-day retention";
      toast({ 
        title: "Speaker Deleted", 
        description: message
      });
      setIsDeleteDialogOpen(false);
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/speakers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/speakers"] });
    },
    onError: (error: any) => {
      setDeleteError(error.message);
    },
  });

  // Send credentials mutation
  const sendCredentialsMutation = useMutation({
    mutationFn: async (speakerId: number) => {
      const response = await fetch(`/api/admin/speakers/${speakerId}/send-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send credentials');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Credentials Generated", 
        description: `Email: ${data.credentials.email} | Password: ${data.credentials.password}`,
        duration: 10000
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to send credentials", 
        variant: "destructive" 
      });
    },
  });

  // Delete application mutation  
  const deleteApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, adminPassword }: { applicationId: number; adminPassword: string }) => {
      const response = await fetch(`/api/admin/speaker-applications/${applicationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete application');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Application Deleted", 
        description: "Speaker application has been permanently deleted" 
      });
      setIsDeleteDialogOpen(false);
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/speaker-applications"] });
    },
    onError: (error: any) => {
      setDeleteError(error.message);
    },
  });

  const handleDeleteConfirm = () => {
    if (!deletePassword.trim()) {
      setDeleteError("Password is required");
      return;
    }
    
    // Check if we're deleting an application
    if (editingSpeaker.isApplication) {
      deleteApplicationMutation.mutate({ 
        applicationId: editingSpeaker.id, 
        adminPassword: deletePassword 
      });
    }
    // Check if we're deleting a user (users have email property, speakers have title/name)
    else if (editingSpeaker.email && typeof editingSpeaker.id === 'string') {
      deleteUserMutation.mutate({ 
        userId: editingSpeaker.id, 
        adminPassword: deletePassword 
      });
    } else {
      deleteSpeakerMutation.mutate({ 
        speakerId: editingSpeaker.id, 
        password: deletePassword,
        deletionType: deletionType
      });
    }
  };

  const handleSaveSpeaker = () => {
    updateSpeakerMutation.mutate(editingSpeaker);
  };

  // Manual Add Speaker mutation
  const addSpeakerMutation = useMutation({
    mutationFn: async (speakerData: any) => {
      const response = await fetch('/api/admin/speakers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...speakerData,
          slug: speakerData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        }),
      });
      if (!response.ok) throw new Error('Failed to add speaker');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Speaker added successfully" });
      setIsManualAddDialogOpen(false);
      setManualSpeakerData({
        name: "",
        title: "",
        bio: "",
        email: "",
        phone: "",
        website: "",
        location: "",
        category: "",
        expertise: "",
        imageUrl: "",
        verified: false,
        featured: false
      });
      queryClient.invalidateQueries({ queryKey: ["/api/speakers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/speakers"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add speaker", variant: "destructive" });
    },
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (category: { name: string; description: string }) => {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });
      if (!response.ok) throw new Error('Failed to add category');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Category added successfully" });
      setNewCategory({ name: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add category", variant: "destructive" });
    },
  });

  // Topic category assignment mutation
  const updateTopicCategoryMutation = useMutation({
    mutationFn: async ({ topicId, category }: { topicId: number; category: string | null }) => {
      const response = await fetch(`/api/admin/topics/${topicId}/category`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });
      if (!response.ok) throw new Error('Failed to update topic category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/topics"] });
      toast({ title: "Success", description: "Topic category updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update topic category", variant: "destructive" });
    },
  });

  // Bulk update topic categories mutation
  const bulkUpdateTopicCategoriesMutation = useMutation({
    mutationFn: async ({ topicIds, category }: { topicIds: number[]; category: string | null }) => {
      const response = await fetch('/api/admin/topics/bulk-category-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicIds, category }),
      });
      if (!response.ok) throw new Error('Failed to bulk update topic categories');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/topics"] });
      setSelectedTopicsForCategory(new Set());
      setIsTopicCategoryDialogOpen(false);
      toast({ title: "Success", description: `Updated ${data.updatedTopics?.length || 0} topics successfully` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to bulk update topic categories", variant: "destructive" });
    },
  });

  // Create new topic mutation
  const createTopicMutation = useMutation({
    mutationFn: async (topic: { name: string; category: string | null }) => {
      const response = await fetch('/api/admin/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topic),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create topic');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/topics"] });
      setNewTopic({ name: "", category: "" });
      toast({ title: "Success", description: "Topic created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete category');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Category deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
    },
  });

  // Update category assignment mutation
  const updateCategoryAssignmentMutation = useMutation({
    mutationFn: async ({ speakerId, category }: { speakerId: number; category: string | null }) => {
      const response = await fetch(`/api/speakers/${speakerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });
      if (!response.ok) throw new Error('Failed to update speaker category');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/speakers"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update speaker category", variant: "destructive" });
    },
  });

  // User management mutations
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-stats"] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async ({ userId, adminPassword }: { userId: string; adminPassword: string }) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete user");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-stats"] });
      setIsDeleteDialogOpen(false);
      setDeletePassword("");
      setDeleteError("");
      setSelectedUsers(new Set());
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error: Error) => {
      setDeleteError(error.message);
    },
  });

  // Bulk update users mutation
  const bulkUpdateUsersMutation = useMutation({
    mutationFn: async ({ userIds, updates, adminPassword }: { userIds: string[]; updates: any; adminPassword: string }) => {
      const response = await fetch('/api/admin/users/bulk-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds, updates, adminPassword }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to bulk update users');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Bulk Update Complete", 
        description: `Updated ${data.updatedCount} of ${data.totalRequested} users successfully` 
      });
      setIsBulkActionDialogOpen(false);
      setBulkAction("");
      setDeletePassword("");
      setDeleteError("");
      setSelectedUsers(new Set());
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-stats"] });
    },
    onError: (error: Error) => {
      setDeleteError(error.message || "Failed to bulk update users");
    },
  });

  // Bulk import speakers mutation
  const bulkImportSpeakersMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/speakers/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to import speakers');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Bulk Import Complete", 
        description: `Successfully imported ${data.results.successCount} speakers from dental symposium hub.` 
      });
      setIsBulkImporting(false);
      queryClient.invalidateQueries({ queryKey: ["/api/speakers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/speakers"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import speakers",
        variant: "destructive",
      });
      setIsBulkImporting(false);
    },
  });

  // Handle bulk import
  const handleBulkImport = async () => {
    setIsBulkImporting(true);
    bulkImportSpeakersMutation.mutate();
  };

  // Update application mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: number; status: string }) => {
      const response = await fetch(`/api/admin/speaker-applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewedBy: adminEmail }),
      });
      if (!response.ok) throw new Error('Failed to update application');
      return response.json();
    },
    onSuccess: (data, variables) => {
      const statusText = variables.status === 'approved' ? 'approved' : 
                         variables.status === 'rejected' ? 'rejected' : 
                         variables.status === 'under_review' ? 'marked for review' : 'updated';
      toast({ 
        title: "Success", 
        description: `Application ${statusText} successfully${variables.status === 'approved' ? '. Speaker profile will be created.' : ''}` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/speaker-applications"] });
      if (variables.status === 'approved') {
        queryClient.invalidateQueries({ queryKey: ["/api/speakers"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/speakers"] });
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update application", variant: "destructive" });
    },
  });

  // Edit application mutation
  const editApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, updates }: { applicationId: number; updates: any }) => {
      const response = await fetch(`/api/admin/speaker-applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to edit application');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Application updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/speaker-applications"] });
      setIsEditingApplication(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to edit application", variant: "destructive" });
    },
  });

  // Check for duplicate speakers mutation
  const checkDuplicatesMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const response = await fetch(`/api/admin/speaker-applications/${applicationId}/check-duplicates`);
      if (!response.ok) throw new Error('Failed to check for duplicates');
      return response.json();
    },
    onSuccess: (data) => {
      const matches = (data.potentialMatches || []).map((m: any) => ({ ...m, _autoMatch: true }));
      setPotentialDuplicates(matches);
      // Only override actionType if not explicitly set to 'add_to_existing' by "Link to Existing" button
      if (actionType !== 'add_to_existing') {
        if (matches.length > 0) {
          setActionType('add_to_existing');
        } else {
          setActionType('create_new');
        }
      }
      setDuplicateCheckDialogOpen(true);
      setIsCheckingDuplicates(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to check for duplicates", variant: "destructive" });
      setIsCheckingDuplicates(false);
    },
  });

  // Link to existing speaker mutation
  const linkToExistingSpeakerMutation = useMutation({
    mutationFn: async ({ applicationId, existingSpeakerId }: { applicationId: number; existingSpeakerId: number }) => {
      const response = await fetch(`/api/admin/speaker-applications/${applicationId}/link-existing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ existingSpeakerId, reviewedBy: adminEmail }),
      });
      if (!response.ok) throw new Error('Failed to link to existing speaker');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/speaker-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/speakers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/speaker-accounts"] });
      setDuplicateCheckDialogOpen(false);
      setCurrentApplication(null);
      setPotentialDuplicates([]);
      setSelectedExistingSpeaker(null);
      setActionType(null);
      
      toast({
        title: "Application Linked!",
        description: (
          <div className="space-y-3">
            <p>Application linked to existing speaker profile successfully.</p>
            <div className="bg-gray-100 p-3 rounded text-sm">
              <p><strong>Login Details:</strong></p>
              <p>Email: {data.loginInstructions?.email}</p>
              <p>Password: {data.loginInstructions?.password}</p>
            </div>
            <p className="text-xs text-gray-600">Please provide these credentials to the speaker manually.</p>
          </div>
        ),
        duration: 10000,
      });
      
      console.log("Speaker login credentials:", data.loginInstructions);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to link application to existing speaker", variant: "destructive" });
    },
  });

  const approveApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, reviewedBy }: { applicationId: number; reviewedBy: string }) => {
      const response = await fetch(`/api/admin/speaker-applications/${applicationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewedBy }),
      });
      if (!response.ok) throw new Error('Failed to approve application');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/speaker-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/speakers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/speaker-accounts"] });
      setDuplicateCheckDialogOpen(false);
      setCurrentApplication(null);
      setPotentialDuplicates([]);
      setActionType(null);
      
      // Store credentials for display on the application card
      if (data.loginInstructions && currentApplication) {
        setApprovedApplicationCredentials(prev => ({
          ...prev,
          [currentApplication.id]: {
            email: data.loginInstructions.email,
            password: data.loginInstructions.password
          }
        }));
      }
      
      // Show login credentials in toast with copy functionality
      const credentials = `Email: ${data.loginInstructions?.email}\nPassword: ${data.loginInstructions?.password}`;
      
      toast({
        title: "Speaker Account Created!",
        description: (
          <div className="space-y-3">
            <p>Speaker profile created successfully.</p>
            <div className="bg-gray-100 p-3 rounded text-sm">
              <p><strong>Login Details:</strong></p>
              <p>Email: {data.loginInstructions?.email}</p>
              <p>Password: {data.loginInstructions?.password}</p>
            </div>
            <p className="text-xs text-gray-600">Please provide these credentials to the speaker manually.</p>
          </div>
        ),
        duration: 10000, // Show for 10 seconds
      });
      
      console.log("Speaker login credentials:", data.loginInstructions);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve application", variant: "destructive" });
    },
  });

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    
    // Initialize checkbox states for all speakers
    const currentSpeakers = Array.isArray(speakers) ? speakers : [];
    const assignments: {[key: string]: boolean} = {};
    currentSpeakers.forEach((speaker: any) => {
      assignments[speaker.id] = speaker.categories && Array.isArray(speaker.categories) && speaker.categories.includes(category.name);
    });
    setCategoryAssignments(assignments);
    setCategorySearchQuery(""); // Reset search when opening dialog
    setIsCategoryEditDialogOpen(true);
  };

  const toggleCategoryExpansion = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleSpeakerAssignment = (category: any) => {
    setSpeakerAssignmentCategory(category);
    setIsAssignmentDialogOpen(true);
    setAssignmentSearchQuery("");
  };

  // Add state to store speakers by category
  const [speakersByCategory, setSpeakersByCategory] = useState<Record<string, any[]>>({});

  // Function to fetch speakers for a category using the new API endpoint
  const fetchSpeakersInCategory = async (categoryName: string) => {
    try {
      const response = await fetch(`/api/categories/${encodeURIComponent(categoryName)}/speakers`);
      if (!response.ok) throw new Error('Failed to fetch speakers');
      const speakers = await response.json();
      setSpeakersByCategory(prev => ({
        ...prev,
        [categoryName]: speakers
      }));
      return speakers;
    } catch (error) {
      console.error(`Error fetching speakers for category ${categoryName}:`, error);
      return [];
    }
  };

  const getSpeakersInCategory = (categoryName: string) => {
    // Return cached speakers for this category, or empty array if not loaded yet
    return speakersByCategory[categoryName] || [];
  };


  const getUnassignedSpeakers = () => {
    return speakersArray.filter((speaker: any) => 
      !speaker.categories || !Array.isArray(speaker.categories) || speaker.categories.length === 0
    );
  };

  const handleSaveCategoryAssignments = async () => {
    const updatePromises: Promise<any>[] = [];
    
    // Process each speaker assignment change
    Object.entries(categoryAssignments).forEach(([speakerId, isAssigned]) => {
      const speaker = speakersArray.find((s: any) => s.id === parseInt(speakerId));
      if (speaker) {
        const currentlyAssigned = speaker.categories && Array.isArray(speaker.categories) && speaker.categories.includes(editingCategory.name);
        
        if (isAssigned !== currentlyAssigned) {
          // Need to update this speaker
          const newCategory = isAssigned ? editingCategory.name : null;
          updatePromises.push(
            updateCategoryAssignmentMutation.mutateAsync({
              speakerId: parseInt(speakerId),
              category: newCategory
            })
          );
        }
      }
    });

    try {
      await Promise.all(updatePromises);
      toast({ title: "Success", description: `Updated speaker assignments for ${editingCategory.name}` });
      setIsCategoryEditDialogOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update some speaker assignments", variant: "destructive" });
    }
  };

  // Toggle speaker visibility mutation
  const toggleSpeakerVisibilityMutation = useMutation({
    mutationFn: async (speakerId: number) => {
      const response = await fetch(`/api/admin/speakers/${speakerId}/toggle-visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: "Doneright123!" }),
      });
      if (!response.ok) throw new Error('Failed to toggle speaker visibility');
      return response.json();
    },
    onSuccess: (data) => {
      const status = data.speaker.hideProfile ? "hidden" : "visible";
      toast({ 
        title: "Speaker Visibility Updated", 
        description: `Speaker is now ${status} across all domains`,
        variant: data.speaker.hideProfile ? "destructive" : "default"
      });
      // Only invalidate admin speakers query to prevent interference with filtering
      queryClient.invalidateQueries({ queryKey: ["/api/admin/speakers"] });
      // Optionally invalidate public speakers if needed
      queryClient.invalidateQueries({ queryKey: ["/api/speakers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/speakers/featured"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update speaker visibility", variant: "destructive" });
    },
  });

  const handleToggleSpeakerVisibility = (speakerId: number) => {
    toggleSpeakerVisibilityMutation.mutate(speakerId);
  };

  // Toggle contact visibility mutations
  const toggleContactVisibilityMutation = useMutation({
    mutationFn: async ({ speakerId, hideContact }: { speakerId: number; hideContact: boolean }) => {
      const response = await fetch(`/api/admin/speakers/${speakerId}/toggle-contact`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hideContact }),
      });
      if (!response.ok) throw new Error('Failed to toggle contact visibility');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.message,
        description: `Contact information is now ${data.speaker.hideContact ? 'hidden' : 'visible'}`,
        variant: data.speaker.hideContact ? "default" : "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/speakers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/speakers/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/speakers"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update contact visibility", variant: "destructive" });
    },
  });

  // Toggle ratings visibility mutations
  const toggleRatingsVisibilityMutation = useMutation({
    mutationFn: async ({ speakerId, hideRatings }: { speakerId: number; hideRatings: boolean }) => {
      const response = await fetch(`/api/admin/speakers/${speakerId}/toggle-ratings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hideRatings }),
      });
      if (!response.ok) throw new Error('Failed to toggle ratings visibility');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.message,
        description: `Ratings are now ${data.speaker.hideRatings ? 'hidden' : 'visible'}`,
        variant: data.speaker.hideRatings ? "default" : "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/speakers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/speakers/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/speakers"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update ratings visibility", variant: "destructive" });
    },
  });

  // Bulk toggle contact visibility
  const bulkToggleContactMutation = useMutation({
    mutationFn: async ({ speakerIds, hideContact }: { speakerIds: number[]; hideContact: boolean }) => {
      const response = await fetch('/api/admin/speakers/bulk-toggle-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speakerIds, hideContact }),
      });
      if (!response.ok) throw new Error('Failed to bulk toggle contact visibility');
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Bulk Contact Update Complete",
        description: `Contact information ${variables.hideContact ? 'hidden' : 'shown'} for ${variables.speakerIds.length} speakers`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/speakers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/speakers/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/speakers"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to bulk update contact visibility", variant: "destructive" });
    },
  });

  // Bulk toggle ratings visibility
  const bulkToggleRatingsMutation = useMutation({
    mutationFn: async ({ speakerIds, hideRatings }: { speakerIds: number[]; hideRatings: boolean }) => {
      const response = await fetch('/api/admin/speakers/bulk-toggle-ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speakerIds, hideRatings }),
      });
      if (!response.ok) throw new Error('Failed to bulk toggle ratings visibility');
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Bulk Ratings Update Complete",
        description: `Ratings ${variables.hideRatings ? 'hidden' : 'shown'} for ${variables.speakerIds.length} speakers`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/speakers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/speakers/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/speakers"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to bulk update ratings visibility", variant: "destructive" });
    },
  });

  const handleToggleContactVisibility = (speakerId: number, currentHideContact: boolean) => {
    toggleContactVisibilityMutation.mutate({ speakerId, hideContact: !currentHideContact });
  };

  const handleToggleRatingsVisibility = (speakerId: number, currentHideRatings: boolean) => {
    toggleRatingsVisibilityMutation.mutate({ speakerId, hideRatings: !currentHideRatings });
  };

  // Handle application action for the separate speaker management section
  const handleApplicationAction = (applicationId: number, status: string) => {
    if (status === 'approved') {
      // Check for duplicates first before approving
      const application = applications?.find((app: any) => app.id === applicationId);
      if (application) {
        setCurrentApplication(application);
        setIsCheckingDuplicates(true);
        checkDuplicatesMutation.mutate(applicationId);
      }
    } else {
      // Use status update endpoint for other statuses
      updateApplicationMutation.mutate({ applicationId, status });
    }
  };

  const handleCreateNewProfile = () => {
    if (currentApplication) {
      setIsCheckingDuplicates(true);
      checkDuplicatesMutation.mutate(currentApplication.id);
    }
  };

  const handleLinkToExisting = () => {
    if (currentApplication && selectedExistingSpeaker) {
      linkToExistingSpeakerMutation.mutate({
        applicationId: currentApplication.id,
        existingSpeakerId: selectedExistingSpeaker
      });
    }
  };

  const handleOverrideConfirm = () => {
    if (currentApplication) {
      approveApplicationMutation.mutate({
        applicationId: currentApplication.id,
        reviewedBy: adminEmail || 'Admin User'
      });
      setOverrideConfirmDialogOpen(false);
    }
  };

  const handleCreateNewWithOverride = () => {
    if (potentialDuplicates.length > 0) {
      // Show confirmation dialog if duplicates exist
      setDuplicateCheckDialogOpen(false);
      setOverrideConfirmDialogOpen(true);
    } else {
      // No duplicates, proceed normally
      handleCreateNewProfile();
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users?.filter((user: any) => {
    const matchesSearch = userSearchQuery === "" || 
      user.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(userSearchQuery.toLowerCase());
    
    const matchesRole = userFilterRole === "all" || 
      (user.role || 'user').toLowerCase() === userFilterRole.toLowerCase();
    
    const matchesStatus = userFilterStatus === "all" ||
      (userFilterStatus === "active" && user.isActive) ||
      (userFilterStatus === "inactive" && !user.isActive) ||
      (userFilterStatus === "verified" && user.emailVerified) ||
      (userFilterStatus === "unverified" && !user.emailVerified);
    
    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  const handleBulkAction = () => {
    if (!bulkAction || selectedUsers.size === 0) return;
    
    let updates: any = {};
    switch (bulkAction) {
      case "activate":
        updates = { isActive: true };
        break;
      case "deactivate":
        updates = { isActive: false };
        break;
      case "verify":
        updates = { emailVerified: true };
        break;
      case "unverify":
        updates = { emailVerified: false };
        break;
      case "promote":
        updates = { role: "admin" };
        break;
      case "demote":
        updates = { role: "user" };
        break;
    }

    bulkUpdateUsersMutation.mutate({
      userIds: Array.from(selectedUsers),
      updates,
      adminPassword: deletePassword
    });
  };

  // Toggle fee range visibility
  const handleToggleFeeRange = () => {
    const newValue = !feeRangeVisible;
    setFeeRangeVisible(newValue);
    localStorage.setItem("adminFeeRangeVisible", newValue.toString());
    toast({ 
      title: "Settings Updated", 
      description: `Fee Range filter is now ${newValue ? "visible" : "hidden"} on Find Speakers page` 
    });
  };

  // Handle category filter changes
  const handleCategoryFilterChange = (category: string, checked: boolean) => {
    const newCategories = new Set(selectedCategories);
    if (checked) {
      newCategories.add(category);
    } else {
      newCategories.delete(category);
    }
    setSelectedCategories(newCategories);
  };

  // Handle status filter changes
  const handleStatusFilterChange = (status: string, checked: boolean) => {
    const newStatuses = new Set(selectedStatuses);
    if (checked) {
      newStatuses.add(status);
    } else {
      newStatuses.delete(status);
    }
    setSelectedStatuses(newStatuses);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategories(new Set());
    setSelectedStatuses(new Set());
  };



  const speakersArray = Array.isArray(speakers) ? speakers : [];
  const categoriesArray = Array.isArray(categories) ? categories : [];
  
  // Fetch speakers for all categories when categories or topics change
  useEffect(() => {
    if (categoriesArray && categoriesArray.length > 0) {
      categoriesArray.forEach((category: any) => {
        // Only fetch if we don't already have data for this category
        if (!speakersByCategory[category.name]) {
          fetchSpeakersInCategory(category.name);
        }
      });
    }
  }, [categoriesArray, topics, speakersByCategory]); // Re-run when categories or topics change
  
  // Handler to toggle category selection in application editing
  const toggleApplicationCategory = (categoryName: string) => {
    if (!editableApplicationData) return;
    
    const currentCategories = editableApplicationData.selectedCategories || [];
    const updatedCategories = currentCategories.includes(categoryName)
      ? currentCategories.filter((cat: string) => cat !== categoryName)
      : [...currentCategories, categoryName];
    
    setEditableApplicationData({
      ...editableApplicationData,
      selectedCategories: updatedCategories
    });
  };
  
  // Memoize speaker filtering to prevent performance issues with large speaker lists
  const filteredSpeakers = useMemo(() => {
    return speakersArray.filter((speaker: any) => {
      // Search query filter
      const matchesSearch = searchQuery === "" || 
        speaker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        speaker.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        speaker.category?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory = selectedCategories.size === 0 || 
        selectedCategories.has(speaker.category || '');
      
      // Status filter (verified/featured only) - visibility toggle works independently
      const matchesStatus = selectedStatuses.size === 0 || 
        (selectedStatuses.has('verified') && speaker.verified) ||
        (selectedStatuses.has('featured') && speaker.featured);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [speakersArray, searchQuery, selectedCategories, selectedStatuses]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategories, selectedStatuses]);

  // Calculate pagination for filtered speakers
  const totalPages = Math.ceil(filteredSpeakers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSpeakers = useMemo(() => {
    return filteredSpeakers.slice(startIndex, endIndex);
  }, [filteredSpeakers, startIndex, endIndex]);

  // Memoize bulk operation IDs to prevent unnecessary recalculations
  const bulkSpeakerIds = useMemo(() => {
    return filteredSpeakers.map((s: any) => s.id);
  }, [filteredSpeakers]);

  // Memoize category speakers filtering for better performance
  const filteredCategorySpeakers = useMemo(() => {
    return speakersArray.filter((speaker: any) => 
      speaker.name.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
      speaker.title?.toLowerCase().includes(categorySearchQuery.toLowerCase())
    );
  }, [speakersArray, categorySearchQuery]);
  
  // Memoize speaker statistics for better performance
  const speakerStats = useMemo(() => {
    const total = speakersArray.length;
    const verified = speakersArray.filter((s: any) => s.verified).length;
    const featured = speakersArray.filter((s: any) => s.featured).length;
    return { total, verified, featured };
  }, [speakersArray]);

  const { total: totalSpeakers, verified: verifiedSpeakers, featured: featuredSpeakers } = speakerStats;
  const totalCategories = categoriesArray.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-primary">Admin Dashboard</h1>
              <Badge variant="secondary">The Speaker Sphere</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {adminEmail}</span>
              <Button variant="outline" size="sm" onClick={handleReturnHome}>
                <Home className="h-4 w-4 mr-2" />
                Return to Home
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Speakers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSpeakers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Speakers</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{verifiedSpeakers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Featured Speakers</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{featuredSpeakers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCategories}</div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger 
              value="analytics"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-white hover:bg-gray-50 transition-colors"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="speakers"
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white bg-white hover:bg-gray-50 transition-colors"
            >
              Speakers
            </TabsTrigger>
            <TabsTrigger 
              value="inquiries"
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white bg-white hover:bg-gray-50 transition-colors"
            >
              Inquiries
            </TabsTrigger>
            <TabsTrigger 
              value="reviews"
              className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white bg-white hover:bg-gray-50 transition-colors"
            >
              Reviews
            </TabsTrigger>
            <TabsTrigger 
              value="users"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white bg-white hover:bg-gray-50 transition-colors"
            >
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="subscriptions"
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white bg-white hover:bg-gray-50 transition-colors"
              data-testid="tab-subscriptions"
            >
              Subscriptions
            </TabsTrigger>
            <TabsTrigger 
              value="categories"
              className="data-[state=active]:bg-orange-600 data-[state=active]:text-white bg-white hover:bg-gray-50 transition-colors"
            >
              Categories
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="data-[state=active]:bg-gray-600 data-[state=active]:text-white bg-white hover:bg-gray-50 transition-colors"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="speakers" className="space-y-6">
            {/* Application Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-6 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-blue-600" />
                  <div className="text-3xl font-bold text-blue-700 mb-1">
                    {applications?.filter((app: any) => app.status === 'pending').length || 0}
                  </div>
                  <div className="text-sm font-medium text-blue-800">Pending Applications</div>
                  <div className="text-xs text-blue-600 mt-1">Awaiting review</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-6 text-center">
                  <Star className="h-12 w-12 mx-auto mb-3 text-green-600" />
                  <div className="text-3xl font-bold text-green-700 mb-1">
                    {applications?.filter((app: any) => app.status === 'approved').length || 0}
                  </div>
                  <div className="text-sm font-medium text-green-800">Approved Applications</div>
                  <div className="text-xs text-green-600 mt-1">Accounts created</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 mx-auto mb-3 text-purple-600" />
                  <div className="text-3xl font-bold text-purple-700 mb-1">
                    {speakerAccounts?.length || 0}
                  </div>
                  <div className="text-sm font-medium text-purple-800">Registered Accounts</div>
                  <div className="text-xs text-purple-600 mt-1">Speakers with login access</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 text-yellow-600" />
                  <div className="text-3xl font-bold text-yellow-700 mb-1">
                    {speakersArray.filter((s: any) => s.verified).length || 0}
                  </div>
                  <div className="text-sm font-medium text-yellow-800">Verified Speakers</div>
                  <div className="text-xs text-yellow-600 mt-1">Admin approved</div>
                </CardContent>
              </Card>
            </div>

            {/* Applications Management */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-gray-900 flex items-center">
                      <MessageSquare className="h-6 w-6 mr-3 text-blue-600" />
                      Speaker Applications Review
                    </CardTitle>
                    <CardDescription className="text-gray-600 mt-2">
                      Review and manage speaker applications submitted through the "For Speakers" portal
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => window.open('/for-speakers', '_blank')}>
                    View Application Portal →
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Application Status Tabs */}
                <Tabs value={applicationStatusFilter} onValueChange={setApplicationStatusFilter} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="all">All Applications</TabsTrigger>
                    <TabsTrigger value="pending">
                      Pending 
                      <Badge variant="outline" className="ml-2">
                        {applicationCounts.pending}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="under_review">
                      Under Review
                      <Badge variant="outline" className="ml-2">
                        {applicationCounts.under_review}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="approved">
                      Approved
                      <Badge variant="outline" className="ml-2">
                        {applicationCounts.approved}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="rejected">
                      Rejected
                      <Badge variant="outline" className="ml-2">
                        {applicationCounts.rejected}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value={applicationStatusFilter} className="space-y-6">
                    {filteredApplications.length > 0 ? (
                      filteredApplications.map((application: any) => (
                      <div key={application.id} className="p-6 border rounded-xl bg-gradient-to-r from-blue-50 via-white to-purple-50 border-blue-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {application.firstName} {application.lastName}
                              </h3>
                              <Badge className={`${
                                application.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                                application.status === 'approved' ? 'bg-green-100 text-green-800' :
                                application.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
                              </Badge>
                              {application.claimExistingProfile && (
                                <Badge className="bg-amber-100 text-amber-800 border border-amber-300">
                                  Profile Claim
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-gray-600">
                                  <strong>Title:</strong> {application.title}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <strong>Email:</strong> {application.email}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">
                                  <strong>Specialty:</strong> {application.specialty}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <strong>Experience:</strong> {application.yearsExperience} years
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">
                                  <strong>Travel:</strong> {application.travelWillingness}
                                </p>
                                <p className="text-sm text-gray-600">
                                  <strong>Submitted:</strong> {new Date(application.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            {/* Categories */}
                            {application.selectedCategories && application.selectedCategories.length > 0 && (
                              <div className="mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Categories:</p>
                                <div className="flex flex-wrap gap-1">
                                  {application.selectedCategories.map((category: string, index: number) => (
                                    <Badge key={`${category}-${index}`} className="bg-purple-100 text-purple-800 text-xs">
                                      {category}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col space-y-2 ml-6">
                            <Button
                              size="sm"
                              onClick={() => setSelectedApplicationDetails(application)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                            
                            <Button
                              size="sm"
                              onClick={() => {
                                setEditingSpeaker({ id: application.id, name: `${application.firstName} ${application.lastName}`, isApplication: true });
                                setIsDeleteDialogOpen(true);
                                setDeletePassword("");
                                setDeleteError("");
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete App
                            </Button>
                            
                            {application.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setCurrentApplication(application);
                                    setActionType('create_new');
                                    setIsCheckingDuplicates(true);
                                    checkDuplicatesMutation.mutate(application.id);
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1"
                                >
                                  <UserPlus className="h-3 w-3 mr-1" />
                                  Approve & Create
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setCurrentApplication(application);
                                    setActionType('add_to_existing');
                                    setSelectedExistingSpeaker(null);
                                    setIsCheckingDuplicates(true);
                                    checkDuplicatesMutation.mutate(application.id);
                                  }}
                                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1"
                                >
                                  <LinkIcon className="h-3 w-3 mr-1" />
                                  Link to Existing
                                </Button>
                              </>
                            )}

                            {application.status === 'approved' && application.createdSpeakerId && (
                              <Button
                                size="sm"
                                onClick={() => window.open(`/speakers/${application.createdSpeakerId}`, '_blank')}
                                className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1"
                              >
                                <UserCheck className="h-3 w-3 mr-1" />
                                View Speaker Account
                              </Button>
                            )}
                            
                            {/* Show login credentials for approved applications */}
                            {application.status === 'approved' && approvedApplicationCredentials[application.id] && (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm mt-2">
                                <p className="font-medium text-green-800 mb-2">🔑 Speaker Login Credentials:</p>
                                <p className="text-green-700"><strong>Email:</strong> {approvedApplicationCredentials[application.id].email}</p>
                                <p className="text-green-700"><strong>Password:</strong> {approvedApplicationCredentials[application.id].password}</p>
                                <p className="text-xs text-green-600 mt-1">Please provide these credentials to the speaker manually.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                    ) : (
                      <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <MessageSquare className="h-20 w-20 mx-auto mb-6 text-gray-300" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">No applications for this status</h3>
                        <p className="text-gray-500 max-w-lg mx-auto mb-6">
                          {applicationStatusFilter === "all" 
                            ? "Applications will appear here when speakers submit them through the portal."
                            : `No ${applicationStatusFilter.replace('_', ' ')} applications found.`
                          }
                        </p>
                        <Button variant="outline" onClick={() => window.open('/for-speakers', '_blank')}>
                          View Application Portal →
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Existing Speaker Accounts Management */}
            <Card>
              <CardHeader>
                <CardTitle>Existing Speaker Accounts</CardTitle>
                <CardDescription>
                  Speakers who have applied or claimed a profile and have active login credentials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Registered Speakers</h3>
                    <Button onClick={() => setIsManualAddDialogOpen(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add New Speaker
                    </Button>
                  </div>
                  
                  <div className="grid gap-4">
                    {(!speakerAccounts || speakerAccounts.length === 0) ? (
                      <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
                        <UserCheck className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium text-gray-600">No registered speaker accounts yet</p>
                        <p className="text-sm mt-1">Speakers will appear here once they apply through the application form and are approved, or claim an existing profile.</p>
                      </div>
                    ) : (
                      speakerAccounts.map((account: any) => (
                        <div key={account.speakerId} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <img 
                              src={account.speakerImageUrl} 
                              alt={account.speakerName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div>
                              <h4 className="font-medium">{account.speakerName}</h4>
                              <p className="text-sm text-gray-600">{account.speakerTitle}</p>
                              <p className="text-xs text-gray-400">{account.email}</p>
                              {account.tempPassword && (
                                <p className="text-xs text-orange-600 font-mono mt-1">Password: {account.tempPassword}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs capitalize">{account.subscriptionTier}</Badge>
                            {account.lastLogin && (
                              <span className="text-xs text-gray-400">
                                Last login: {new Date(account.lastLogin).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* All Speakers Management */}
                  <div className="mt-8 pt-6 border-t">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">All Speakers</h3>
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Input
                            type="text"
                            placeholder="Search speakers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-64 pl-4 pr-4"
                          />
                        </div>
                        <div className="text-sm text-gray-600">
                          Manage visibility settings for each speaker
                        </div>
                      </div>
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex items-center space-x-4 mb-4 p-4 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Filters:</span>
                      
                      {/* Category Filter */}
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-600 mb-1">Categories</label>
                        <Select>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder={selectedCategories.size > 0 ? `${selectedCategories.size} selected` : "All Categories"} />
                          </SelectTrigger>
                          <SelectContent>
                            {categoriesArray.map((category: any) => (
                              <div key={category.name} className="flex items-center space-x-2 px-2 py-1">
                                <Checkbox
                                  id={`category-${category.name}`}
                                  checked={selectedCategories.has(category.name)}
                                  onCheckedChange={(checked) => handleCategoryFilterChange(category.name, !!checked)}
                                />
                                <label htmlFor={`category-${category.name}`} className="text-sm cursor-pointer">
                                  {category.name}
                                </label>
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status Filter */}
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-600 mb-1">Status</label>
                        <Select>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder={selectedStatuses.size > 0 ? `${selectedStatuses.size} selected` : "All Statuses"} />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="flex items-center space-x-2 px-2 py-1">
                              <Checkbox
                                id="status-verified"
                                checked={selectedStatuses.has('verified')}
                                onCheckedChange={(checked) => handleStatusFilterChange('verified', !!checked)}
                              />
                              <label htmlFor="status-verified" className="text-sm cursor-pointer">
                                Verified
                              </label>
                            </div>
                            <div className="flex items-center space-x-2 px-2 py-1">
                              <Checkbox
                                id="status-featured"
                                checked={selectedStatuses.has('featured')}
                                onCheckedChange={(checked) => handleStatusFilterChange('featured', !!checked)}
                              />
                              <label htmlFor="status-featured" className="text-sm cursor-pointer">
                                Featured
                              </label>
                            </div>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Clear Filters Button */}
                      {(selectedCategories.size > 0 || selectedStatuses.size > 0 || searchQuery) && (
                        <Button variant="outline" size="sm" onClick={clearAllFilters}>
                          Clear All Filters
                        </Button>
                      )}

                      {/* Results Count */}
                      <div className="text-sm text-gray-600">
                        Showing {filteredSpeakers.length} of {speakersArray.length} speakers
                      </div>
                    </div>

                    {/* Bulk Actions */}
                    <div className="flex items-center space-x-2 mb-4 p-4 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Bulk Actions for All Speakers:</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          bulkToggleContactMutation.mutate({ speakerIds: bulkSpeakerIds, hideContact: true });
                        }}
                        disabled={bulkToggleContactMutation.isPending}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Hide All Contact Info
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          bulkToggleContactMutation.mutate({ speakerIds: bulkSpeakerIds, hideContact: false });
                        }}
                        disabled={bulkToggleContactMutation.isPending}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Show All Contact Info
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          bulkToggleRatingsMutation.mutate({ speakerIds: bulkSpeakerIds, hideRatings: true });
                        }}
                        disabled={bulkToggleRatingsMutation.isPending}
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Hide All Ratings
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          bulkToggleRatingsMutation.mutate({ speakerIds: bulkSpeakerIds, hideRatings: false });
                        }}
                        disabled={bulkToggleRatingsMutation.isPending}
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Show All Ratings
                      </Button>
                    </div>
                    
                    <div className="grid gap-4">
                      {paginatedSpeakers.length > 0 ? (
                        paginatedSpeakers.map((speaker: any) => (
                        <div key={speaker.slug} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <img 
                                src={speaker.imageUrl} 
                                alt={speaker.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                              <div>
                                <h4 className="font-medium">{speaker.name}</h4>
                                <p className="text-sm text-gray-600">{speaker.title}</p>
                              </div>
                            </div>

                            {/* Visibility Controls */}
                            <div className="flex items-center space-x-3">
                              {/* Hide Entire Listing */}
                              <div className="flex flex-col items-center group">
                                <button 
                                  className={`p-2 rounded-lg border transition-colors ${
                                    speaker.hideProfile 
                                      ? 'bg-red-100 border-red-300 text-red-700' 
                                      : 'hover:bg-red-50 hover:border-red-200'
                                  }`}
                                  title="Hide entire speaker listing"
                                  onClick={() => updateSpeakerMutation.mutate({
                                    ...speaker,
                                    hideProfile: !speaker.hideProfile
                                  })}
                                >
                                  <EyeOff className="h-4 w-4 text-red-600" />
                                </button>
                                <span className="text-xs text-gray-500 mt-1">Hide Profile</span>
                              </div>

                              {/* Hide Ratings */}
                              <div className="flex flex-col items-center group">
                                <button 
                                  className={`p-2 rounded-lg border transition-colors ${
                                    speaker.hideRatings 
                                      ? 'bg-yellow-100 border-yellow-300 text-yellow-700' 
                                      : 'hover:bg-yellow-50 hover:border-yellow-200'
                                  }`}
                                  title="Hide ratings and reviews"
                                  onClick={() => handleToggleRatingsVisibility(speaker.id, speaker.hideRatings)}
                                >
                                  <Star className="h-4 w-4 text-yellow-600" />
                                </button>
                                <span className="text-xs text-gray-500 mt-1">Hide Ratings</span>
                              </div>

                              {/* Hide Social Icons */}
                              <div className="flex flex-col items-center group">
                                <button 
                                  className={`p-2 rounded-lg border transition-colors ${
                                    speaker.hideSocial 
                                      ? 'bg-blue-100 border-blue-300 text-blue-700' 
                                      : 'hover:bg-blue-50 hover:border-blue-200'
                                  }`}
                                  title="Hide social media icons"
                                  onClick={() => updateSpeakerMutation.mutate({
                                    ...speaker,
                                    hideSocial: !speaker.hideSocial
                                  })}
                                >
                                  <Share2 className="h-4 w-4 text-blue-600" />
                                </button>
                                <span className="text-xs text-gray-500 mt-1">Hide Social</span>
                              </div>

                              {/* Hide Contact Details */}
                              <div className="flex flex-col items-center group">
                                <button 
                                  className={`p-2 rounded-lg border transition-colors ${
                                    speaker.hideContact 
                                      ? 'bg-purple-100 border-purple-300 text-purple-700' 
                                      : 'hover:bg-purple-50 hover:border-purple-200'
                                  }`}
                                  title="Hide contact information"
                                  onClick={() => handleToggleContactVisibility(speaker.id, speaker.hideContact)}
                                >
                                  <Phone className="h-4 w-4 text-purple-600" />
                                </button>
                                <span className="text-xs text-gray-500 mt-1">Hide Contact</span>
                              </div>

                              {/* Separator */}
                              <div className="h-8 w-px bg-gray-300 mx-2"></div>

                              {/* Status Badges and Edit */}
                              <div className="flex items-center space-x-2">
                                {/* Verified Badge - Always Visible and Clickable */}
                                <button
                                  onClick={() => updateSpeakerMutation.mutate({
                                    ...speaker,
                                    verified: !speaker.verified
                                  })}
                                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                                    speaker.verified 
                                      ? 'bg-green-600 text-white hover:bg-green-700' 
                                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                  }`}
                                  title={speaker.verified ? "Click to unverify" : "Click to verify"}
                                >
                                  Verified
                                </button>
                                
                                {/* Featured Override Badge - Manual Control */}
                                <button
                                  onClick={() => updateSpeakerMutation.mutate({
                                    ...speaker,
                                    isFeaturedOverride: !speaker.isFeaturedOverride
                                  })}
                                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                                    speaker.isFeaturedOverride 
                                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                  }`}
                                  title={speaker.isFeaturedOverride ? "Click to remove manual featured status" : "Click to manually feature"}
                                >
                                  Featured Override
                                </button>
                                
                                {/* SDS Badge Selector */}
                                <Select
                                  value={speaker.sdsBadge || "none"}
                                  onValueChange={(value) => updateSpeakerMutation.mutate({
                                    ...speaker,
                                    sdsBadge: value === "none" ? null : value
                                  })}
                                >
                                  <SelectTrigger 
                                    className={`w-32 h-8 text-xs ${
                                      speaker.sdsBadge === 'sds_faculty' 
                                        ? 'bg-amber-500 text-white border-amber-600' 
                                        : speaker.sdsBadge === 'sds'
                                        ? 'bg-orange-500 text-white border-orange-600'
                                        : 'bg-gray-100 border-gray-300'
                                    }`}
                                    data-testid={`select-sds-badge-${speaker.id}`}
                                  >
                                    <SelectValue placeholder="SDS Badge" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">No Badge</SelectItem>
                                    <SelectItem value="sds">SDS</SelectItem>
                                    <SelectItem value="sds_faculty">SDS Faculty</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditSpeaker(speaker)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => sendCredentialsMutation.mutate(speaker.id)}
                                  disabled={!speaker.email || sendCredentialsMutation.isPending}
                                  data-testid={`button-send-credentials-${speaker.id}`}
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Send Credentials
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => {
                                    setEditingSpeaker(speaker);
                                    setIsDeleteDialogOpen(true);
                                    setDeletePassword("");
                                    setDeleteError("");
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Visibility Controls Row */}
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-sm">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-2 h-2 rounded-full ${speaker.hideProfile ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                  <span className="text-gray-600">{speaker.hideProfile ? 'Hidden' : 'Visible'} on all domains</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant={speaker.hideProfile ? "outline" : "destructive"}
                                  size="sm"
                                  onClick={() => handleToggleSpeakerVisibility(speaker.id)}
                                  disabled={toggleSpeakerVisibilityMutation.isPending}
                                >
                                  {speaker.hideProfile ? (
                                    <>
                                      <Eye className="h-4 w-4 mr-1" />
                                      Show Speaker
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff className="h-4 w-4 mr-1" />
                                      Hide Speaker
                                    </>
                                  )}
                                </Button>
                                <div className="text-xs text-gray-500">
                                  Domain Sync
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              Changes sync instantly across your domain and Replit environment
                            </div>
                          </div>
                        </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No speakers found matching "{searchQuery}"</p>
                        </div>
                      )}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center space-x-2 mt-6 pt-4 border-t">
                        <span className="text-sm text-gray-600 mr-4">
                          Showing {startIndex + 1}-{Math.min(endIndex, filteredSpeakers.length)} of {filteredSpeakers.length} speakers
                        </span>
                        
                        {/* Previous Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        
                        {/* Page Numbers */}
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
                            // Show first page, last page, current page, and pages around current
                            const showPage = pageNumber === 1 || 
                                           pageNumber === totalPages || 
                                           Math.abs(pageNumber - currentPage) <= 2;
                            
                            if (!showPage && pageNumber !== 2 && pageNumber !== totalPages - 1) {
                              // Show ellipsis
                              if (pageNumber === 3 && currentPage > 5) {
                                return <span key={pageNumber} className="px-2 text-gray-400">...</span>;
                              }
                              if (pageNumber === totalPages - 2 && currentPage < totalPages - 4) {
                                return <span key={pageNumber} className="px-2 text-gray-400">...</span>;
                              }
                              return null;
                            }
                            
                            return (
                              <Button
                                key={pageNumber}
                                variant={currentPage === pageNumber ? "default" : "outline"}
                                size="sm"
                                className="min-w-[40px]"
                                onClick={() => setCurrentPage(pageNumber)}
                              >
                                {pageNumber}
                              </Button>
                            );
                          })}
                        </div>
                        
                        {/* Next Button */}
                        <Button
                          variant="outline" 
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <TabsContent value="applications" className="space-y-6">
              {/* Applications Management */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-gray-900 flex items-center">
                        <MessageSquare className="h-6 w-6 mr-3 text-blue-600" />
                        Speaker Application Queue
                      </CardTitle>
                      <CardDescription className="text-gray-600 mt-2">
                        Review applications submitted by speakers who want to join the platform
                      </CardDescription>
                    </div>
                    <div className="flex space-x-3">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Applications
                      </Button>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {applications?.length || 0} Total Applications
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {applications && applications.length > 0 ? (
                      applications.map((application: any) => (
                        <div key={application.id} className={`p-6 border rounded-xl transition-shadow hover:shadow-lg ${
                          application.status === 'pending' ? 'bg-gradient-to-r from-blue-50 via-white to-blue-50 border-blue-200' :
                          application.status === 'approved' ? 'bg-gradient-to-r from-green-50 via-white to-green-50 border-green-200' :
                          application.status === 'under_review' ? 'bg-gradient-to-r from-yellow-50 via-white to-yellow-50 border-yellow-200' :
                          'bg-gradient-to-r from-red-50 via-white to-red-50 border-red-200'
                        }`}>
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-bold text-xl text-gray-900">{application.firstName} {application.lastName}</h4>
                                  <p className="text-gray-600 font-medium">{application.title}</p>
                                </div>
                                <Badge 
                                  className={`px-3 py-1 ${
                                    application.status === 'pending' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                    application.status === 'approved' ? 'bg-green-100 text-green-800 border-green-300' :
                                    application.status === 'under_review' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                    'bg-red-100 text-red-800 border-red-300'
                                  }`}
                                >
                                  {application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="space-y-2">
                                  <div className="text-sm">
                                    <span className="font-semibold text-gray-700">📧 Email:</span> 
                                    <span className="text-gray-600 ml-2">{application.email}</span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="font-semibold text-gray-700">🏥 Specialty:</span> 
                                    <span className="text-gray-600 ml-2">{application.specialty}</span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="font-semibold text-gray-700">⏱️ Experience:</span> 
                                    <span className="text-gray-600 ml-2">{application.yearsExperience} years</span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="text-sm">
                                    <span className="font-semibold text-gray-700">📱 Phone:</span> 
                                    <span className="text-gray-600 ml-2">{application.phone || 'Not provided'}</span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="font-semibold text-gray-700">🌐 Website:</span> 
                                    <span className="text-gray-600 ml-2">{application.website || 'Not provided'}</span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="font-semibold text-gray-700">📅 Applied:</span> 
                                    <span className="text-gray-600 ml-2">{new Date(application.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                <div className="text-sm">
                                  <span className="font-semibold text-gray-700">🎯 Speaking Topics:</span> 
                                  <p className="text-gray-600 mt-1">{application.speakingTopics}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                            {application.status === 'pending' && (
                              <>
                                <Button 
                                  onClick={() => {
                                    setCurrentApplication(application);
                                    setIsCheckingDuplicates(true);
                                    checkDuplicatesMutation.mutate(application.id);
                                  }}
                                  disabled={isCheckingDuplicates}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {isCheckingDuplicates ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                      Checking...
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      Approve Application
                                    </>
                                  )}
                                </Button>
                                <Button 
                                  variant="outline"
                                  onClick={() => updateApplicationMutation.mutate({ applicationId: application.id, status: 'under_review' })}
                                  disabled={updateApplicationMutation.isPending}
                                  className="border-yellow-600 text-yellow-700 hover:bg-yellow-50"
                                >
                                  <Star className="h-4 w-4 mr-2" />
                                  Mark for Review
                                </Button>
                                <Button 
                                  variant="outline"
                                  onClick={() => updateApplicationMutation.mutate({ applicationId: application.id, status: 'rejected' })}
                                  disabled={updateApplicationMutation.isPending}
                                  className="border-red-600 text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </>
                            )}
                            
                            {application.status === 'under_review' && (
                              <>
                                <Button 
                                  onClick={() => {
                                    setCurrentApplication(application);
                                    setIsCheckingDuplicates(true);
                                    checkDuplicatesMutation.mutate(application.id);
                                  }}
                                  disabled={isCheckingDuplicates}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {isCheckingDuplicates ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                      Checking...
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      Approve Application
                                    </>
                                  )}
                                </Button>
                                <Button 
                                  variant="outline"
                                  onClick={() => updateApplicationMutation.mutate({ applicationId: application.id, status: 'rejected' })}
                                  disabled={updateApplicationMutation.isPending}
                                  className="border-red-600 text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </>
                            )}
                            
                            <Button 
                              variant="outline"
                              onClick={() => {
                                console.log('View Details clicked for application:', application);
                                setSelectedApplicationDetails(application);
                              }}
                              className="border-blue-600 text-blue-700 hover:bg-blue-50"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => window.open(`mailto:${application.email}`, '_blank')}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Contact Applicant
                            </Button>
                            <Button 
                              variant="destructive"
                              onClick={() => {
                                setEditingSpeaker({ id: application.id, name: `${application.firstName} ${application.lastName}`, isApplication: true });
                                setIsDeleteDialogOpen(true);
                                setDeletePassword("");
                                setDeleteError("");
                              }}
                              size="sm"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Application
                            </Button>
                            {application.status === 'approved' && application.createdSpeakerId && (
                              <Button 
                                variant="outline"
                                onClick={() => {
                                  // Switch to speaker accounts tab
                                  const speakerAccountsTab = document.querySelector('[value="speaker-accounts"]') as HTMLElement;
                                  speakerAccountsTab?.click();
                                }}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                View Speaker Account
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <MessageSquare className="h-20 w-20 mx-auto mb-6 text-gray-300" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">No Speaker Applications</h3>
                        <p className="text-gray-500 max-w-lg mx-auto mb-6">
                          Applications will appear here when speakers submit them through the "For Speakers" portal. Speakers can apply by visiting the dedicated application page.
                        </p>
                        <div className="flex justify-center">
                          <Button variant="outline" onClick={() => window.open('/for-speakers', '_blank')}>
                            View Application Portal →
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="speaker-accounts" className="space-y-8">
              {/* Section Header */}
              <div className="text-center border-b border-gray-200 pb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Speaker Accounts Management</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Manage speakers who joined through the application approval process. These accounts were created from approved speaker applications submitted via the "For Speakers" portal.
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-6 text-center">
                    <UserCheck className="h-12 w-12 mx-auto mb-3 text-green-600" />
                    <div className="text-3xl font-bold text-green-700 mb-1">
                      {applications?.filter((app: any) => app.status === 'approved' && app.createdSpeakerId).length || 0}
                    </div>
                    <div className="text-sm font-medium text-green-800">Application-Based Accounts</div>
                    <div className="text-xs text-green-600 mt-1">From approved applications</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-6 text-center">
                    <Users className="h-12 w-12 mx-auto mb-3 text-blue-600" />
                    <div className="text-3xl font-bold text-blue-700 mb-1">
                      {speakersArray.filter((s: any) => !applications?.some((app: any) => app.createdSpeakerId === s.id)).length || 0}
                    </div>
                    <div className="text-sm font-medium text-blue-800">Manual Accounts</div>
                    <div className="text-xs text-blue-600 mt-1">Added directly by admin</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-6 text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 text-purple-600" />
                    <div className="text-3xl font-bold text-purple-700 mb-1">
                      {speakerAccounts?.length || 0}
                    </div>
                    <div className="text-sm font-medium text-purple-800">Registered Accounts</div>
                    <div className="text-xs text-purple-600 mt-1">Speakers with login access</div>
                  </CardContent>
                </Card>
              </div>

              {/* Application-Based Accounts Section */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-gray-900 flex items-center">
                        <UserCheck className="h-6 w-6 mr-3 text-green-600" />
                        Application-Based Speaker Accounts
                      </CardTitle>
                      <CardDescription className="text-gray-600 mt-2">
                        Speakers who applied through the "For Speakers" portal and were approved by admin review
                      </CardDescription>
                    </div>
                    <div className="flex space-x-3">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Accounts
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleBulkImport}
                        disabled={isBulkImporting}
                      >
                        {isBulkImporting ? (
                          <>
                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                            Importing...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Bulk Import Speakers
                          </>
                        )}
                      </Button>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Manual Add Speaker
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {applications && applications.filter((app: any) => app.status === 'approved' && app.createdSpeakerId).length > 0 ? (
                      // Find speakers created from approved applications
                      applications
                        .filter((app: any) => app.status === 'approved' && app.createdSpeakerId)
                        .map((app: any) => {
                          // Find the corresponding speaker
                          const speaker = speakersArray.find((s: any) => s.id === app.createdSpeakerId);
                          if (!speaker) return null;
                          
                          return (
                            <div key={speaker.id} className="p-6 border rounded-xl bg-gradient-to-r from-green-50 via-white to-blue-50 border-green-200 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-4">
                                  <img 
                                    src={speaker.imageUrl} 
                                    alt={speaker.name}
                                    className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-lg"
                                  />
                                  <div>
                                    <h4 className="font-semibold text-xl text-gray-900">{speaker.name}</h4>
                                    <p className="text-gray-600 font-medium">{speaker.title}</p>
                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                      <span className="flex items-center">
                                        📧 Applied: {new Date(app.createdAt).toLocaleDateString()}
                                      </span>
                                      <span className="flex items-center">
                                        ✅ Approved: {new Date(app.reviewedAt).toLocaleDateString()}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        Application #{app.id}
                                      </span>
                                    </div>
                                    
                                    {/* Login Credentials Section */}
                                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                      <div className="text-sm font-medium text-blue-900 mb-2">
                                        🔐 Login Credentials
                                      </div>
                                      <div className="space-y-1 text-sm">
                                        <div className="flex items-center justify-between">
                                          <span className="text-blue-700 font-medium">Email:</span>
                                          <code className="bg-white px-2 py-1 rounded text-blue-800 border">{app.email}</code>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-blue-700 font-medium">Password:</span>
                                          <div className="flex items-center space-x-2">
                                            {/* Check if user has changed password from original */}
                                            {(() => {
                                              // Find the user associated with this application
                                              const associatedUser = users?.find((u: any) => u.email === app.email && u.speakerId === speaker.id);
                                              

                                              
                                              const hasChangedPassword = associatedUser && associatedUser.updatedAt && 
                                                new Date(associatedUser.updatedAt) > new Date(associatedUser.createdAt);
                                              
                                              const showPasswordChanged = hasChangedPassword;
                                              
                                              if (showPasswordChanged) {
                                                return (
                                                  <div className="flex items-center space-x-2">
                                                    <span className="bg-orange-100 px-2 py-1 rounded text-orange-800 border border-orange-200 font-mono text-sm">
                                                      ⚠️ Password Changed by User
                                                    </span>
                                                    <Button 
                                                      size="sm" 
                                                      variant="ghost"
                                                      className="text-xs h-7 px-2 text-orange-600 hover:text-orange-800"
                                                      onClick={() => {
                                                        alert(`This user has changed their password from the original generated one.\n\nOriginal generated password is no longer valid.\nUser must use their new password to log in.`);
                                                      }}
                                                    >
                                                      ℹ️ Info
                                                    </Button>
                                                  </div>
                                                );
                                              } else {
                                                const originalPassword = (() => {
                                                  const seed = `${app.id}-${app.email}`;
                                                  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
                                                  let result = '';
                                                  for (let i = 0; i < 12; i++) {
                                                    const charIndex = (seed.charCodeAt(i % seed.length) + i) % chars.length;
                                                    result += chars[charIndex];
                                                  }
                                                  return result;
                                                })();
                                                
                                                return (
                                                  <code className="bg-white px-2 py-1 rounded text-blue-800 border font-mono text-sm">
                                                    {originalPassword}
                                                  </code>
                                                );
                                              }
                                            })()}
                                            {(() => {
                                              // Only show copy button if password hasn't been changed
                                              const associatedUser = users?.find((u: any) => u.email === app.email && u.speakerId === speaker.id);
                                              const hasChangedPassword = associatedUser && associatedUser.updatedAt && 
                                                new Date(associatedUser.updatedAt) > new Date(associatedUser.createdAt);
                                              
                                              const showPasswordChanged = hasChangedPassword;
                                              
                                              if (!showPasswordChanged) {
                                                return (
                                                  <Button 
                                                    size="sm" 
                                                    variant="ghost"
                                                    className="text-xs h-7 px-2 text-blue-600 hover:text-blue-800"
                                                    onClick={() => {
                                                      const password = (() => {
                                                        const seed = `${app.id}-${app.email}`;
                                                        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
                                                        let result = '';
                                                        for (let i = 0; i < 12; i++) {
                                                          const charIndex = (seed.charCodeAt(i % seed.length) + i) % chars.length;
                                                          result += chars[charIndex];
                                                        }
                                                        return result;
                                                      })();
                                                      const credentials = `Email: ${app.email}\nPassword: ${password}\nLogin URL: ${window.location.origin}/auth`;
                                                      navigator.clipboard?.writeText(credentials);
                                                      alert(`Login credentials copied to clipboard:\n\nEmail: ${app.email}\nPassword: ${password}`);
                                                    }}
                                                  >
                                                    📋 Copy
                                                  </Button>
                                                );
                                              }
                                              return null;
                                            })()}
                                          </div>
                                        </div>
                                        {(() => {
                                          const associatedUser = users?.find((u: any) => u.email === app.email && u.speakerId === speaker.id);
                                          const hasChangedPassword = associatedUser && associatedUser.updatedAt && 
                                            new Date(associatedUser.updatedAt) > new Date(associatedUser.createdAt);
                                          
                                          const showPasswordChanged = hasChangedPassword;
                                          
                                          if (showPasswordChanged) {
                                            return (
                                              <div className="text-xs text-orange-600 mt-2 p-2 bg-orange-100 rounded border border-orange-200">
                                                ⚠️ <strong>Password Updated:</strong> This user has changed their password. The original generated password is no longer valid.
                                                {associatedUser?.updatedAt && (
                                                  <div className="mt-1 text-orange-500">
                                                    Changed on: {new Date(associatedUser.updatedAt).toLocaleString()}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          } else {
                                            return (
                                              <div className="text-xs text-blue-600 mt-2 p-2 bg-blue-100 rounded">
                                                💡 <strong>Generated Password:</strong> This password is generated based on the application ID and remains consistent. 
                                                Click "Copy" to copy credentials for sharing with the speaker.
                                              </div>
                                            );
                                          }
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end space-y-3">
                                  <Badge className="bg-green-100 text-green-800 border-green-300 px-3 py-1">
                                    <UserCheck className="h-3 w-3 mr-1" />
                                    Application-Based Account
                                  </Badge>
                                  <div className="flex space-x-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => handleEditSpeaker(speaker)}
                                    >
                                      <Edit className="h-4 w-4 mr-1" />
                                      Edit
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => window.open(`/speaker/${speaker.slug}`, '_blank')}
                                    >
                                      <ExternalLink className="h-4 w-4 mr-1" />
                                      View
                                    </Button>
                                    <Button 
                                      variant="destructive" 
                                      size="sm"
                                      onClick={() => {
                                        setEditingSpeaker(speaker);
                                        setIsDeleteDialogOpen(true);
                                        setDeletePassword("");
                                        setDeleteError("");
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Delete
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => handleToggleSpeakerVisibility(speaker.id)}
                                      className={speaker.hideProfile ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}
                                    >
                                      {speaker.hideProfile ? (
                                        <>
                                          <EyeOff className="h-4 w-4 mr-1" />
                                          Hidden
                                        </>
                                      ) : (
                                        <>
                                          <Eye className="h-4 w-4 mr-1" />
                                          Visible
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                        .filter(Boolean) // Remove null entries
                    ) : (
                      <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <UserCheck className="h-20 w-20 mx-auto mb-6 text-gray-300" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">No Application-Based Speaker Accounts</h3>
                        <p className="text-gray-500 max-w-lg mx-auto mb-6">
                          Speaker accounts will appear here when applications are approved and speaker profiles are created through the application review process.
                        </p>
                        <div className="flex justify-center space-x-3">
                          <Button variant="outline" onClick={() => {
                            // Switch to applications tab - you'll need to implement this
                            const applicationsTab = document.querySelector('[value="applications"]') as HTMLElement;
                            applicationsTab?.click();
                          }}>
                            View Pending Applications →
                          </Button>
                          <Button onClick={() => setIsManualAddDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Speaker Manually
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage registered users, view profiles, and handle user accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* User Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-800">Total Users</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900">{userStats?.totalUsers || 0}</div>
                      <div className="text-sm text-blue-600">Registered accounts</div>
                    </div>
                    
                    <div className="p-4 border rounded-lg bg-green-50">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">Active Users</span>
                      </div>
                      <div className="text-2xl font-bold text-green-900">{userStats?.activeUsers || 0}</div>
                      <div className="text-sm text-green-600">Currently active</div>
                    </div>
                    
                    <div className="p-4 border rounded-lg bg-purple-50">
                      <div className="flex items-center space-x-2 mb-2">
                        <Mail className="h-5 w-5 text-purple-600" />
                        <span className="font-medium text-purple-800">Verified</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-900">{userStats?.verifiedUsers || 0}</div>
                      <div className="text-sm text-purple-600">Email verified</div>
                    </div>
                    
                    <div className="p-4 border rounded-lg bg-orange-50">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                        <span className="font-medium text-orange-800">Recent</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-900">{userStats?.recentRegistrations || 0}</div>
                      <div className="text-sm text-orange-600">Last 7 days</div>
                    </div>
                  </div>

                  {/* Advanced Filtering & Search */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <h3 className="text-lg font-medium">User Management</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            const csvContent = users?.map((user: User) => ({
                              name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
                              email: user.email,
                              role: 'User', // Default role since User table doesn't have role field
                              status: user.isActive ? 'Active' : 'Inactive',
                              verified: user.emailVerified ? 'Yes' : 'No',
                              joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'
                            }));
                            const csv = [
                              'Name,Email,Role,Status,Verified,Join Date',
                              ...csvContent?.map((row: any) => Object.values(row).join(',')) || []
                            ].join('\n');
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
                            a.click();
                            toast({
                              title: "Export Complete",
                              description: "User data exported to CSV file",
                            });
                          }}
                        >
                          Export CSV
                        </Button>
                        {selectedUsers.size > 0 && (
                          <Button
                            variant="outline"
                            onClick={() => setIsBulkActionDialogOpen(true)}
                          >
                            Bulk Actions ({selectedUsers.size})
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <Label htmlFor="userSearch">Search Users</Label>
                        <Input
                          id="userSearch"
                          placeholder="Search by name or email..."
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="roleFilter">Filter by Role</Label>
                        <Select value={userFilterRole} onValueChange={setUserFilterRole}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="speaker">Speaker</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="statusFilter">Filter by Status</Label>
                        <Select value={userFilterStatus} onValueChange={setUserFilterStatus}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="verified">Email Verified</SelectItem>
                            <SelectItem value="unverified">Email Unverified</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setUserSearchQuery("");
                            setUserFilterRole("all");
                            setUserFilterStatus("all");
                            setSelectedUsers(new Set());
                          }}
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedUsers.size === filteredUsers?.length && filteredUsers?.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(new Set(filteredUsers?.map((u: User) => u.id) || []));
                            } else {
                              setSelectedUsers(new Set());
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-600">
                          Select All ({filteredUsers?.length || 0} users)
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Showing {filteredUsers?.length || 0} of {users?.length || 0} users
                      </div>
                    </div>
                  </div>
                    
                    <div className="space-y-3">
                      {filteredUsers && filteredUsers.length > 0 ? (
                        filteredUsers.slice(0, 20).map((user: any) => (
                          <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-center space-x-4">
                              <input
                                type="checkbox"
                                checked={selectedUsers.has(user.id)}
                                onChange={(e) => {
                                  const newSelected = new Set(selectedUsers);
                                  if (e.target.checked) {
                                    newSelected.add(user.id);
                                  } else {
                                    newSelected.delete(user.id);
                                  }
                                  setSelectedUsers(newSelected);
                                }}
                                className="rounded"
                              />
                              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {user.firstName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                                </div>
                                <div className="text-sm text-gray-600">{user.email}</div>
                                <div className="text-xs text-gray-500">
                                  Joined: {new Date(user.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <div className="text-right text-sm">
                                <div className="flex items-center space-x-2 mb-1">
                                  {user.emailVerified ? (
                                    <Badge className="bg-green-100 text-green-800 border-green-200">
                                      Verified
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                                      Unverified
                                    </Badge>
                                  )}
                                  
                                  {user.isActive ? (
                                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                      Active
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="border-gray-300 text-gray-600">
                                      Inactive
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="text-xs text-gray-500">
                                  Role: {user.role || 'User'}
                                </div>
                              </div>
                              
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateUserMutation.mutate({
                                    userId: user.id,
                                    updates: { isActive: !user.isActive }
                                  })}
                                  disabled={updateUserMutation.isPending}
                                >
                                  {user.isActive ? (
                                    <>
                                      <EyeOff className="h-4 w-4 mr-1" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-4 w-4 mr-1" />
                                      Activate
                                    </>
                                  )}
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateUserMutation.mutate({
                                    userId: user.id,
                                    updates: { emailVerified: !user.emailVerified }
                                  })}
                                  disabled={updateUserMutation.isPending}
                                >
                                  <Mail className="h-4 w-4 mr-1" />
                                  {user.emailVerified ? 'Unverify' : 'Verify'}
                                </Button>
                                
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setEditingSpeaker({ id: user.id, email: user.email, name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email });
                                    setIsDeleteDialogOpen(true);
                                    setDeletePassword("");
                                    setDeleteError("");
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No users found</p>
                          <p className="text-sm">Users will appear here once they register</p>
                        </div>
                      )}
                    </div>
                    
                    {filteredUsers && filteredUsers.length > 20 && (
                      <div className="text-center py-4">
                        <div className="text-sm text-gray-500">
                          Showing first 20 users of {filteredUsers.length} total
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Management</CardTitle>
                <CardDescription>
                  Manage speaker categories and organize content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Add New Category */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">Add New Category</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        placeholder="Category Name"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                      />
                      <Input
                        placeholder="Description"
                        value={newCategory.description}
                        onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                      />
                      <Button 
                        onClick={() => addCategoryMutation.mutate(newCategory)}
                        disabled={!newCategory.name || !newCategory.description || addCategoryMutation.isPending}
                      >
                        {addCategoryMutation.isPending ? "Adding..." : "Add Category"}
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Current Categories</h3>
                  </div>
                  
                  <div className="grid gap-4">
                    {categoriesArray.map((category: any) => {
                      const categoryId = category.id || category.name;
                      const speakersInCategory = getSpeakersInCategory(category.name);
                      const isExpanded = expandedCategories.has(categoryId);
                      
                      return (
                        <div key={categoryId} className="border rounded-lg">
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center space-x-4">
                              <button
                                onClick={() => toggleCategoryExpansion(categoryId)}
                                className="text-primary hover:text-primary/80 transition-colors"
                              >
                                <FolderOpen className="h-8 w-8" />
                              </button>
                              <div>
                                <h4 className="font-medium">{category.name}</h4>
                                <p className="text-sm text-gray-600">{category.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">
                                {speakersInCategory.length} speakers
                              </Badge>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => toggleCategoryExpansion(categoryId)}
                              >
                                {isExpanded ? 'Collapse' : 'View Speakers'}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSpeakerAssignment(category)}
                              >
                                Manage
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditCategory(category)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteCategory(category)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="border-t bg-gray-50 p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between mb-4">
                                  <h5 className="font-medium text-sm">Speakers in {category.name}</h5>
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleSpeakerAssignment(category)}
                                    className="bg-primary text-white"
                                  >
                                    Add/Remove Speakers
                                  </Button>
                                </div>
                                
                                {speakersInCategory.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {speakersInCategory.map((speaker: any) => (
                                      <div key={speaker.id} className="flex items-center justify-between bg-white p-3 rounded border text-sm">
                                        <div className="flex items-center space-x-2">
                                          <UserCheck className="h-4 w-4 text-green-600" />
                                          <span className="font-medium">{speaker.name}</span>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                          {speaker.verified ? 'Verified' : 'Unverified'}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-gray-500">
                                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">No speakers assigned to this category</p>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="mt-2"
                                      onClick={() => handleSpeakerAssignment(category)}
                                    >
                                      Add Speakers
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inquiries Management */}
          <TabsContent value="inquiries" className="space-y-6">
            {/* Inquiries Management */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Speaker Inquiries</h3>
                <div className="flex gap-2">
                  <Select value={inquiryStatusFilter} onValueChange={setInquiryStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="booked">Booked</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Search inquiries..."
                    value={inquirySearchQuery}
                    onChange={(e) => setInquirySearchQuery(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>

              {inquiriesLoading ? (
                <div className="text-center py-8">Loading inquiries...</div>
              ) : (
                <div className="space-y-4">
                  {inquiries
                    .filter(inquiry => 
                      (inquiryStatusFilter === 'all' || inquiry.status === inquiryStatusFilter) &&
                      (inquirySearchQuery === '' || 
                       inquiry.clientName.toLowerCase().includes(inquirySearchQuery.toLowerCase()) ||
                       inquiry.clientEmail.toLowerCase().includes(inquirySearchQuery.toLowerCase()) ||
                       inquiry.clientCompany?.toLowerCase().includes(inquirySearchQuery.toLowerCase()) ||
                       inquiry.speakerName?.toLowerCase().includes(inquirySearchQuery.toLowerCase())
                      )
                    )
                    .map((inquiry) => (
                      <Card key={inquiry.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge variant={
                                inquiry.status === 'pending' ? 'default' :
                                inquiry.status === 'contacted' ? 'secondary' :
                                inquiry.status === 'booked' ? 'default' :
                                'outline'
                              }>
                                {inquiry.status}
                              </Badge>
                              <span className="font-medium">{inquiry.clientName}</span>
                            </div>
                            <span className="text-sm text-gray-600">
                              {new Date(inquiry.createdAt || '').toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <strong>Client:</strong> {inquiry.clientName}<br />
                              <strong>Email:</strong> {inquiry.clientEmail}<br />
                              <strong>Company:</strong> {inquiry.clientCompany || 'N/A'}
                            </div>
                            <div>
                              <strong>Speaker:</strong> {inquiry.speakerName || 'N/A'}<br />
                              <strong>Event Date:</strong> {inquiry.eventDate ? new Date(inquiry.eventDate).toLocaleDateString() : 'N/A'}<br />
                              <strong>Budget:</strong> {inquiry.budget || 'N/A'}
                            </div>
                          </div>
                          
                          {inquiry.message && (
                            <div className="text-sm">
                              <strong>Message:</strong> {inquiry.message}
                            </div>
                          )}
                          
                          
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateInquiryStatusMutation.mutate({ 
                                inquiryId: inquiry.id, 
                                status: 'contacted' 
                              })}
                            >
                              Mark Contacted
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateInquiryStatusMutation.mutate({ 
                                inquiryId: inquiry.id, 
                                status: 'booked' 
                              })}
                            >
                              Mark Booked
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateInquiryStatusMutation.mutate({ 
                                inquiryId: inquiry.id, 
                                status: 'declined' 
                              })}
                            >
                              Mark Declined
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                    
                  {inquiries.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No inquiries found.
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Reviews Management */}
          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Management</CardTitle>
                <CardDescription>
                  Manage and approve speaker reviews before they appear publicly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="pending" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pending">
                      Pending ({pendingReviews?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="approved">
                      Approved ({approvedReviews?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="rejected">
                      Rejected ({rejectedReviews?.length || 0})
                    </TabsTrigger>
                  </TabsList>

                  {/* Pending Reviews Tab */}
                  <TabsContent value="pending" className="mt-4">
                    <div className="space-y-4">
                      {pendingReviews && pendingReviews.length > 0 ? (
                        pendingReviews.map((review: any) => (
                      <Card key={review.id} className="border-l-4 border-l-yellow-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-3">
                                <Badge variant="secondary">Pending Review</Badge>
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`h-4 w-4 ${i < review.overallRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                                    />
                                  ))}
                                  <span className="text-sm text-gray-600 ml-2">
                                    {review.overallRating}/5 stars
                                  </span>
                                </div>
                              </div>
                              
                              {/* Speaker Information */}
                              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                                <h4 className="font-medium text-sm text-blue-900 mb-2">Review for Speaker:</h4>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                                    {review.speakerImageUrl ? (
                                      <img 
                                        src={review.speakerImageUrl} 
                                        alt={review.speakerName}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-blue-300 flex items-center justify-center text-white font-medium text-xs">
                                        {review.speakerName?.charAt(0)}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-blue-900">{review.speakerName}</p>
                                    <p className="text-xs text-blue-700">Speaker ID: {review.speakerId}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium text-sm text-gray-900">Reviewer Information</h4>
                                  <p className="text-sm text-gray-600">
                                    <strong>{review.reviewerName}</strong>
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {review.reviewerTitle} at {review.reviewerCompany}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Event: {review.eventType} on {review.eventDate}
                                  </p>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium text-sm text-gray-900">Review Comment</h4>
                                  <p className="text-sm text-gray-600 mt-1">
                                    "{review.comment}"
                                  </p>
                                </div>
                              </div>
                              
                              {review.photoUrl && (
                                <div className="mt-4">
                                  <h4 className="font-medium text-sm text-gray-900 mb-2">Submitted Photo:</h4>
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <img 
                                      src={review.photoUrl} 
                                      alt="Review photo"
                                      className="max-w-xs max-h-48 rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 hover:scale-105 transition-all"
                                      onClick={() => openImageModal(review.photoUrl)}
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                      Click image to view full size in popup
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-2 ml-4">
                              <Button 
                                size="sm" 
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => approveReviewMutation.mutate({ 
                                  reviewId: review.id,
                                  adminNotes: "Review approved for publication"
                                })}
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => rejectReviewMutation.mutate({ 
                                  reviewId: review.id,
                                  adminNotes: "Review rejected due to policy violation"
                                })}
                              >
                                Reject
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
                                    deleteReviewMutation.mutate(review.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Star className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No pending reviews found.</p>
                      <p className="text-sm">All reviews have been processed.</p>
                    </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Approved Reviews Tab */}
                  <TabsContent value="approved" className="mt-4">
                    <div className="space-y-4">
                      {approvedReviews && approvedReviews.length > 0 ? (
                        approvedReviews.map((review: any) => (
                          <Card key={review.id} className="border-l-4 border-l-green-500">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Badge variant="default" className="bg-green-600">Approved</Badge>
                                    <div className="flex items-center">
                                      {[...Array(5)].map((_, i) => (
                                        <Star 
                                          key={i} 
                                          className={`h-4 w-4 ${i < review.overallRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                                        />
                                      ))}
                                      <span className="text-sm text-gray-600 ml-2">
                                        {review.overallRating}/5 stars
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Speaker Information */}
                                  <div className="bg-green-50 rounded-lg p-3 mb-4">
                                    <h4 className="font-medium text-sm text-green-900 mb-2">Review for Speaker:</h4>
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                                        {review.speakerImageUrl ? (
                                          <img 
                                            src={review.speakerImageUrl} 
                                            alt={review.speakerName}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full bg-green-300 flex items-center justify-center text-white font-medium text-xs">
                                            {review.speakerName?.charAt(0)}
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <p className="font-medium text-green-900">{review.speakerName}</p>
                                        <p className="text-xs text-green-700">Speaker ID: {review.speakerId}</p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-medium text-sm text-gray-900">Reviewer Information</h4>
                                      <p className="text-sm text-gray-600">
                                        <strong>{review.reviewerName}</strong>
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        {review.reviewerTitle} at {review.reviewerCompany}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Event: {review.eventType} on {review.eventDate}
                                      </p>
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-medium text-sm text-gray-900">Review Comment</h4>
                                      <p className="text-sm text-gray-600 mt-1">
                                        "{review.comment}"
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {review.photoUrl && (
                                    <div className="mt-4">
                                      <h4 className="font-medium text-sm text-gray-900 mb-2">Submitted Photo:</h4>
                                      <div className="bg-gray-50 rounded-lg p-3">
                                        <img 
                                          src={review.photoUrl} 
                                          alt="Review photo"
                                          className="max-w-xs max-h-48 rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 hover:scale-105 transition-all"
                                          onClick={() => openImageModal(review.photoUrl)}
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                          Click image to view full size in popup
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {review.adminNotes && (
                                    <div className="mt-4 bg-green-50 p-3 rounded-lg">
                                      <h4 className="font-medium text-sm text-green-900 mb-1">Admin Notes:</h4>
                                      <p className="text-sm text-green-800">{review.adminNotes}</p>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex justify-end mt-4">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                    onClick={() => {
                                      if (confirm('Are you sure you want to delete this approved review? This action cannot be undone.')) {
                                        deleteReviewMutation.mutate(review.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>No approved reviews found.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Rejected Reviews Tab */}
                  <TabsContent value="rejected" className="mt-4">
                    <div className="space-y-4">
                      {rejectedReviews && rejectedReviews.length > 0 ? (
                        rejectedReviews.map((review: any) => (
                          <Card key={review.id} className="border-l-4 border-l-red-500">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Badge variant="destructive">Rejected</Badge>
                                    <div className="flex items-center">
                                      {[...Array(5)].map((_, i) => (
                                        <Star 
                                          key={i} 
                                          className={`h-4 w-4 ${i < review.overallRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                                        />
                                      ))}
                                      <span className="text-sm text-gray-600 ml-2">
                                        {review.overallRating}/5 stars
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Speaker Information */}
                                  <div className="bg-red-50 rounded-lg p-3 mb-4">
                                    <h4 className="font-medium text-sm text-red-900 mb-2">Review for Speaker:</h4>
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                                        {review.speakerImageUrl ? (
                                          <img 
                                            src={review.speakerImageUrl} 
                                            alt={review.speakerName}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full bg-red-300 flex items-center justify-center text-white font-medium text-xs">
                                            {review.speakerName?.charAt(0)}
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <p className="font-medium text-red-900">{review.speakerName}</p>
                                        <p className="text-xs text-red-700">Speaker ID: {review.speakerId}</p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-medium text-sm text-gray-900">Reviewer Information</h4>
                                      <p className="text-sm text-gray-600">
                                        <strong>{review.reviewerName}</strong>
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        {review.reviewerTitle} at {review.reviewerCompany}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Event: {review.eventType} on {review.eventDate}
                                      </p>
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-medium text-sm text-gray-900">Review Comment</h4>
                                      <p className="text-sm text-gray-600 mt-1">
                                        "{review.comment}"
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {review.photoUrl && (
                                    <div className="mt-4">
                                      <h4 className="font-medium text-sm text-gray-900 mb-2">Submitted Photo:</h4>
                                      <div className="bg-gray-50 rounded-lg p-3">
                                        <img 
                                          src={review.photoUrl} 
                                          alt="Review photo"
                                          className="max-w-xs max-h-48 rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 hover:scale-105 transition-all"
                                          onClick={() => openImageModal(review.photoUrl)}
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                          Click image to view full size in popup
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {review.adminNotes && (
                                    <div className="mt-4 bg-red-50 p-3 rounded-lg">
                                      <h4 className="font-medium text-sm text-red-900 mb-1">Admin Notes:</h4>
                                      <p className="text-sm text-red-800">{review.adminNotes}</p>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex justify-end mt-4">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                    onClick={() => {
                                      if (confirm('Are you sure you want to delete this rejected review? This action cannot be undone.')) {
                                        deleteReviewMutation.mutate(review.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <XCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>No rejected reviews found.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Analytics Overview Banner */}
            <Alert className="bg-blue-50 border-blue-200">
              <BarChart3 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Admin Platform Analytics</p>
                  <p className="text-sm">You're viewing platform-wide analytics for all speakers. This includes total views, engagement metrics, and top performers. Individual speakers can only see their own analytics in their dashboard.</p>
                </div>
              </AlertDescription>
            </Alert>

            {/* Platform Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Platform Overview
                </CardTitle>
                <CardDescription>
                  Total speakers, profile views, contact clicks, and inquiries across the entire platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsDashboard />
              </CardContent>
            </Card>
            
            {/* Individual Speaker Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointer className="h-5 w-5" />
                  Individual Speaker Performance
                </CardTitle>
                <CardDescription>
                  View detailed analytics for each speaker including profile views, contact clicks, video plays, and engagement metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DetailedSpeakerAnalytics />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>
                  Configure platform settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* Category Management */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Category Management</h3>
                    

                    {/* Existing Categories */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Existing Categories</h4>
                      <div className="grid gap-3">
                        {categoriesArray.map((category: any) => (
                          <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium">{category.name}</div>
                              <div className="text-sm text-gray-600">{category.description}</div>
                              <div className="text-xs text-gray-500">
                                {category.speakerCount || 0} speakers • {topics?.filter((t: any) => t.category === category.name).length || 0} topics
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedCategoryForTopics(category);
                                  setIsTopicCategoryDialogOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                Manage Topics
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => deleteCategoryMutation.mutate(category.id)}
                                disabled={deleteCategoryMutation.isPending}
                                className="text-red-600 hover:text-red-700"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Topic Management */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-4">Speaking Topic Management</h3>
                    
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Create New Speaking Topic</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsTopicCreationExpanded(!isTopicCreationExpanded)}
                        >
                          {isTopicCreationExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                      
                      {isTopicCreationExpanded && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="topicName">Topic Name *</Label>
                              <Input
                                id="topicName"
                                placeholder="e.g., Advanced Implant Techniques"
                                value={newTopic.name}
                                onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="topicCategory">Category (Optional)</Label>
                              <Select
                                value={newTopic.category}
                                onValueChange={(value) => setNewTopic({ ...newTopic, category: value === "none" ? "" : value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No Category</SelectItem>
                                  {categoriesArray.map((category: any) => (
                                    <SelectItem key={category.id} value={category.name}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <Button 
                              onClick={() => createTopicMutation.mutate({
                                name: newTopic.name,
                                category: newTopic.category || null
                              })}
                              disabled={!newTopic.name.trim() || createTopicMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {createTopicMutation.isPending ? "Creating..." : "Create Topic"}
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => setNewTopic({ name: "", category: "" })}
                            >
                              Clear
                            </Button>
                          </div>
                          <div className="text-sm text-gray-600">
                            Create a new speaking topic that can be assigned to speakers. Topics help organize speaker expertise areas.
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Topic Statistics */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Topic Overview</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {topics?.length || 0}
                          </div>
                          <div className="text-blue-700">Total Topics</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {topics?.filter((t: any) => t.category).length || 0}
                          </div>
                          <div className="text-green-700">Categorized</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-orange-600">
                            {topics?.filter((t: any) => !t.category).length || 0}
                          </div>
                          <div className="text-orange-700">Uncategorized</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">
                            {categoriesArray.length || 0}
                          </div>
                          <div className="text-purple-700">Categories</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Filter Settings */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-4">Filter Settings</h3>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="font-medium mb-3">Find Speakers Page Filters</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Fee Range Filter</p>
                          <p className="text-sm text-gray-600">Show/hide fee range filter on Find Speakers page</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={feeRangeVisible}
                            onChange={(e) => {
                              const isVisible = e.target.checked;
                              setFeeRangeVisible(isVisible);
                              localStorage.setItem("adminFeeRangeVisible", isVisible.toString());
                              toast({
                                title: "Success",
                                description: `Fee Range filter ${isVisible ? 'enabled' : 'disabled'} on Find Speakers page`,
                              });
                            }}
                            className="sr-only"
                          />
                          <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer ${feeRangeVisible ? 'bg-blue-600' : 'bg-gray-200'} relative transition-colors duration-200`}>
                            <div className={`absolute top-[2px] left-[2px] bg-white border-gray-300 border rounded-full h-5 w-5 transition-transform duration-200 ${feeRangeVisible ? 'translate-x-5' : 'translate-x-0'}`}></div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* System Settings */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-4">System Settings</h3>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 text-blue-800">
                        <Settings className="h-5 w-5" />
                        <span className="font-medium">Categories and Speaking Topics</span>
                      </div>
                      <p className="text-sm text-blue-700 mt-2">
                        Manage available categories and organize speaking topics within categories. 
                        Changes will be reflected immediately in speaker profiles and search filters.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-6 w-6" />
                  Subscription Management
                </CardTitle>
                <CardDescription>
                  Manage subscription tier features and view speaker subscription status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="features" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="features" data-testid="subtab-features">
                      Tier Features
                    </TabsTrigger>
                    <TabsTrigger value="speakers" data-testid="subtab-speaker-subscriptions">
                      Speaker Subscriptions
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="features" className="mt-6">
                    <SubscriptionFeaturesManager />
                  </TabsContent>
                  <TabsContent value="speakers" className="mt-6">
                    <SpeakerSubscriptionsView />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Speaker Assignment Dialog */}
        {isAssignmentDialogOpen && speakerAssignmentCategory && (
          <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Manage Speakers - {speakerAssignmentCategory.name}</DialogTitle>
                <DialogDescription>
                  Add or remove speakers from the "{speakerAssignmentCategory.name}" category
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex flex-col space-y-4 h-full overflow-hidden">
                {/* Search */}
                <Input
                  placeholder="Search speakers by name..."
                  value={assignmentSearchQuery}
                  onChange={(e) => setAssignmentSearchQuery(e.target.value)}
                  className="w-full"
                />
                
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Currently Assigned Speakers */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-green-700 flex items-center">
                        <UserCheck className="h-4 w-4 mr-2" />
                        Assigned to {speakerAssignmentCategory.name}
                        <Badge variant="outline" className="ml-2">
                          {getSpeakersInCategory(speakerAssignmentCategory.name).length}
                        </Badge>
                      </h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {getSpeakersInCategory(speakerAssignmentCategory.name)
                          .filter((speaker: any) => 
                            assignmentSearchQuery === '' || 
                            speaker.name.toLowerCase().includes(assignmentSearchQuery.toLowerCase())
                          )
                          .map((speaker: any) => (
                            <div key={speaker.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <UserCheck className="h-4 w-4 text-green-600" />
                                <span className="font-medium">{speaker.name}</span>
                                {speaker.verified && <Badge variant="outline" className="text-xs">Verified</Badge>}
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  updateCategoryAssignmentMutation.mutate({
                                    speakerId: speaker.id,
                                    category: null
                                  });
                                }}
                                disabled={updateCategoryAssignmentMutation.isPending}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                Remove
                              </Button>
                            </div>
                          ))
                        }
                        {getSpeakersInCategory(speakerAssignmentCategory.name).length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No speakers assigned</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Available Speakers to Assign */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-blue-700 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Available Speakers
                        <Badge variant="outline" className="ml-2">
                          {speakersArray
                            .filter((speaker: any) => 
                              !(speaker.categories && Array.isArray(speaker.categories) && speaker.categories.includes(speakerAssignmentCategory.name))
                            ).length}
                        </Badge>
                      </h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {speakersArray
                          .filter((speaker: any) => 
                            !(speaker.categories && Array.isArray(speaker.categories) && speaker.categories.includes(speakerAssignmentCategory.name)) &&
                            (assignmentSearchQuery === '' || 
                             speaker.name.toLowerCase().includes(assignmentSearchQuery.toLowerCase()))
                          )
                          .map((speaker: any) => (
                            <div key={speaker.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Users className="h-4 w-4 text-blue-600" />
                                <div>
                                  <span className="font-medium">{speaker.name}</span>
                                  {speaker.categories && Array.isArray(speaker.categories) && speaker.categories.length > 0 && (
                                    <div className="text-xs text-gray-600">
                                      Currently in: {speaker.categories.join(', ')}
                                    </div>
                                  )}
                                </div>
                                {speaker.verified && <Badge variant="outline" className="text-xs">Verified</Badge>}
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  updateCategoryAssignmentMutation.mutate({
                                    speakerId: speaker.id,
                                    category: speakerAssignmentCategory.name
                                  });
                                }}
                                disabled={updateCategoryAssignmentMutation.isPending}
                                className="text-green-600 border-green-300 hover:bg-green-50"
                              >
                                Add
                              </Button>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </div>
                </div>
                
                <DialogClose asChild>
                  <Button variant="outline" className="w-full">
                    Done
                  </Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Application Details Dialog */}
        <Dialog open={!!selectedApplicationDetails} onOpenChange={(open) => {
          if (!open) {
            setSelectedApplicationDetails(null);
            setIsEditingApplication(false);
            setEditableApplicationData(null);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Application Details</span>
                <div className="flex items-center space-x-2">
                  {!isEditingApplication ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditingApplication(true);
                        setEditableApplicationData({...selectedApplicationDetails});
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (editableApplicationData) {
                            editApplicationMutation.mutate({
                              applicationId: editableApplicationData.id,
                              updates: editableApplicationData
                            });
                          }
                        }}
                        disabled={editApplicationMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditingApplication(false);
                          setEditableApplicationData(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </DialogTitle>
              <DialogDescription>
                {isEditingApplication 
                  ? "Edit the application details below and save your changes"
                  : "Review the full application details for this speaker"
                }
              </DialogDescription>
            </DialogHeader>
            {selectedApplicationDetails && (
              <div className="space-y-6">
                {/* Profile Claim Banner */}
                {selectedApplicationDetails.claimExistingProfile && (
                  <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-full">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-800">Existing Profile Claim</p>
                      <p className="text-sm text-amber-700">This applicant indicated they already have a profile on Speaker Sphere and would like to claim it. Please verify their identity matches an existing speaker profile before approving.</p>
                    </div>
                  </div>
                )}

                {/* Personal Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <div className="w-2 h-6 bg-blue-500 rounded-full mr-3"></div>
                    Personal Information
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {!isEditingApplication ? (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <p><strong>First Name:</strong> {selectedApplicationDetails.firstName}</p>
                          <p><strong>Last Name:</strong> {selectedApplicationDetails.lastName}</p>
                          <p><strong>Email:</strong> {selectedApplicationDetails.email}</p>
                        </div>
                        <div className="space-y-2">
                          <p><strong>Phone:</strong> {selectedApplicationDetails.phone}</p>
                          <p><strong>Website:</strong> {selectedApplicationDetails.website || 'Not provided'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">First Name</label>
                            <Input
                              value={editableApplicationData?.firstName || ''}
                              onChange={(e) => setEditableApplicationData({...editableApplicationData, firstName: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Last Name</label>
                            <Input
                              value={editableApplicationData?.lastName || ''}
                              onChange={(e) => setEditableApplicationData({...editableApplicationData, lastName: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Email</label>
                            <Input
                              type="email"
                              value={editableApplicationData?.email || ''}
                              onChange={(e) => setEditableApplicationData({...editableApplicationData, email: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Phone</label>
                            <Input
                              value={editableApplicationData?.phone || ''}
                              onChange={(e) => setEditableApplicationData({...editableApplicationData, phone: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Website</label>
                            <Input
                              value={editableApplicationData?.website || ''}
                              onChange={(e) => setEditableApplicationData({...editableApplicationData, website: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Social Media Links */}
                {(selectedApplicationDetails.instagramUrl || selectedApplicationDetails.twitterUrl || selectedApplicationDetails.facebookUrl || selectedApplicationDetails.linkedinUrl || isEditingApplication) && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <div className="w-2 h-6 bg-green-500 rounded-full mr-3"></div>
                      Social Media Links
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {!isEditingApplication ? (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            {selectedApplicationDetails.instagramUrl && (
                              <p><strong>Instagram:</strong> <a href={selectedApplicationDetails.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedApplicationDetails.instagramUrl}</a></p>
                            )}
                            {selectedApplicationDetails.twitterUrl && (
                              <p><strong>Twitter:</strong> <a href={selectedApplicationDetails.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedApplicationDetails.twitterUrl}</a></p>
                            )}
                          </div>
                          <div className="space-y-2">
                            {selectedApplicationDetails.facebookUrl && (
                              <p><strong>Facebook:</strong> <a href={selectedApplicationDetails.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedApplicationDetails.facebookUrl}</a></p>
                            )}
                            {selectedApplicationDetails.linkedinUrl && (
                              <p><strong>LinkedIn:</strong> <a href={selectedApplicationDetails.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedApplicationDetails.linkedinUrl}</a></p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium">Instagram URL</label>
                              <Input
                                value={editableApplicationData?.instagramUrl || ''}
                                onChange={(e) => setEditableApplicationData({...editableApplicationData, instagramUrl: e.target.value})}
                                placeholder="https://instagram.com/username"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Twitter URL</label>
                              <Input
                                value={editableApplicationData?.twitterUrl || ''}
                                onChange={(e) => setEditableApplicationData({...editableApplicationData, twitterUrl: e.target.value})}
                                placeholder="https://twitter.com/username"
                              />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium">Facebook URL</label>
                              <Input
                                value={editableApplicationData?.facebookUrl || ''}
                                onChange={(e) => setEditableApplicationData({...editableApplicationData, facebookUrl: e.target.value})}
                                placeholder="https://facebook.com/page"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">LinkedIn URL</label>
                              <Input
                                value={editableApplicationData?.linkedinUrl || ''}
                                onChange={(e) => setEditableApplicationData({...editableApplicationData, linkedinUrl: e.target.value})}
                                placeholder="https://linkedin.com/in/profile"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Professional Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <div className="w-2 h-6 bg-purple-500 rounded-full mr-3"></div>
                    Professional Information
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {!isEditingApplication ? (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <p><strong>Title:</strong> {selectedApplicationDetails.title}</p>
                          <p><strong>Specialty:</strong> {selectedApplicationDetails.specialty}</p>
                        </div>
                        <div className="space-y-2">
                          <p><strong>Years of Experience:</strong> {selectedApplicationDetails.yearsExperience}</p>
                          <p><strong>Credentials:</strong> {selectedApplicationDetails.credentials}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Title</label>
                            <Input
                              value={editableApplicationData?.title || ''}
                              onChange={(e) => setEditableApplicationData({...editableApplicationData, title: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Specialty</label>
                            <Input
                              value={editableApplicationData?.specialty || ''}
                              onChange={(e) => setEditableApplicationData({...editableApplicationData, specialty: e.target.value})}
                            />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Years of Experience</label>
                            <Input
                              value={editableApplicationData?.yearsExperience || ''}
                              onChange={(e) => setEditableApplicationData({...editableApplicationData, yearsExperience: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Credentials</label>
                            <Input
                              value={editableApplicationData?.credentials || ''}
                              onChange={(e) => setEditableApplicationData({...editableApplicationData, credentials: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Speaking Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <div className="w-2 h-6 bg-orange-500 rounded-full mr-3"></div>
                    Speaking Information
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    {!isEditingApplication ? (
                      <>
                        {/* Categories */}
                        {selectedApplicationDetails.selectedCategories && selectedApplicationDetails.selectedCategories.length > 0 && (
                          <div>
                            <p className="font-medium text-sm mb-2">Selected Categories:</p>
                            <div className="flex flex-wrap gap-1">
                              {selectedApplicationDetails.selectedCategories.map((category: string, index: number) => (
                                <Badge key={`${category}-${index}`} className="bg-purple-100 text-purple-800">
                                  {category}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Specific Topics */}
                        {selectedApplicationDetails.specificTopics && (
                          <div>
                            <p className="font-medium text-sm mb-2">Specific Topics of Expertise:</p>
                            <p className="text-sm text-gray-600 bg-white p-3 rounded border">{selectedApplicationDetails.specificTopics}</p>
                          </div>
                        )}

                        {/* Speaking Topics (backward compatibility) */}
                        {selectedApplicationDetails.speakingTopics && selectedApplicationDetails.speakingTopics !== selectedApplicationDetails.specificTopics && (
                          <div>
                            <p className="font-medium text-sm mb-2">Speaking Topics:</p>
                            <p className="text-sm text-gray-600 bg-white p-3 rounded border">{selectedApplicationDetails.speakingTopics}</p>
                          </div>
                        )}

                        {/* Previous Experience */}
                        {selectedApplicationDetails.previousExperience && (
                          <div>
                            <p className="font-medium text-sm mb-2">Previous Speaking Experience:</p>
                            <p className="text-sm text-gray-600 bg-white p-3 rounded border">{selectedApplicationDetails.previousExperience}</p>
                          </div>
                        )}

                        {/* Available Formats */}
                        {selectedApplicationDetails.availableFormats && selectedApplicationDetails.availableFormats.length > 0 && (
                          <div>
                            <p className="font-medium text-sm mb-2">Available Speaking Formats:</p>
                            <div className="flex flex-wrap gap-1">
                              {selectedApplicationDetails.availableFormats.map((format: string, index: number) => (
                                <Badge key={`${format}-${index}`} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {format}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Travel Willingness */}
                        <div>
                          <p className="font-medium text-sm mb-2">Travel Willingness:</p>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {selectedApplicationDetails.travelWillingness}
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Editable Categories */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">Selected Categories</label>
                          <div className="bg-white p-4 rounded border">
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                              {categoriesArray.map((category: any) => {
                                const isSelected = editableApplicationData?.selectedCategories?.includes(category.name) || false;
                                return (
                                  <div key={category.name} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`edit-category-${category.name}`}
                                      checked={isSelected}
                                      onCheckedChange={() => toggleApplicationCategory(category.name)}
                                    />
                                    <label 
                                      htmlFor={`edit-category-${category.name}`} 
                                      className="text-sm cursor-pointer flex-1 truncate"
                                      title={category.description || category.name}
                                    >
                                      {category.name}
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                            {editableApplicationData?.selectedCategories && editableApplicationData.selectedCategories.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs text-gray-600 mb-2">Currently selected ({editableApplicationData.selectedCategories.length}):</p>
                                <div className="flex flex-wrap gap-1">
                                  {editableApplicationData.selectedCategories.map((categoryName: string) => (
                                    <Badge 
                                      key={categoryName} 
                                      className="bg-purple-100 text-purple-800 cursor-pointer hover:bg-purple-200"
                                      onClick={() => toggleApplicationCategory(categoryName)}
                                    >
                                      {categoryName} ×
                                    </Badge>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Click on a category badge to remove it</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Editable Specific Topics */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">Specific Topics of Expertise</label>
                          <Textarea
                            value={editableApplicationData?.specificTopics || ''}
                            onChange={(e) => setEditableApplicationData({...editableApplicationData, specificTopics: e.target.value})}
                            rows={3}
                            placeholder="Enter specific areas of expertise and topics..."
                          />
                        </div>

                        {/* Editable Previous Experience */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">Previous Speaking Experience</label>
                          <Textarea
                            value={editableApplicationData?.previousExperience || ''}
                            onChange={(e) => setEditableApplicationData({...editableApplicationData, previousExperience: e.target.value})}
                            rows={3}
                            placeholder="Describe previous speaking experience..."
                          />
                        </div>

                        {/* Travel Willingness */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">Travel Willingness</label>
                          <Select 
                            value={editableApplicationData?.travelWillingness || ''}
                            onValueChange={(value) => setEditableApplicationData({...editableApplicationData, travelWillingness: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select travel preference" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Local Only">Local Only</SelectItem>
                              <SelectItem value="Regional">Regional</SelectItem>
                              <SelectItem value="National">National</SelectItem>
                              <SelectItem value="International">International</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Biography */}
                {(selectedApplicationDetails.biography || isEditingApplication) && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <div className="w-2 h-6 bg-teal-500 rounded-full mr-3"></div>
                      Biography
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {!isEditingApplication ? (
                        <p className="text-sm text-gray-600 leading-relaxed">{selectedApplicationDetails.biography}</p>
                      ) : (
                        <div>
                          <label className="text-sm font-medium mb-2 block">Biography</label>
                          <Textarea
                            value={editableApplicationData?.biography || ''}
                            onChange={(e) => setEditableApplicationData({...editableApplicationData, biography: e.target.value})}
                            rows={4}
                            className="w-full"
                            placeholder="Enter speaker biography..."
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Information */}
                {(selectedApplicationDetails.specialRequirements || selectedApplicationDetails.references || isEditingApplication) && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <div className="w-2 h-6 bg-pink-500 rounded-full mr-3"></div>
                      Additional Information
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      {!isEditingApplication ? (
                        <>
                          {selectedApplicationDetails.specialRequirements && (
                            <div>
                              <p className="font-medium text-sm mb-2">Special Requirements:</p>
                              <p className="text-sm text-gray-600 bg-white p-3 rounded border">{selectedApplicationDetails.specialRequirements}</p>
                            </div>
                          )}
                          
                          {selectedApplicationDetails.references && (
                            <div>
                              <p className="font-medium text-sm mb-2">References:</p>
                              <p className="text-sm text-gray-600 bg-white p-3 rounded border">{selectedApplicationDetails.references}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Special Requirements</label>
                            <Textarea
                              value={editableApplicationData?.specialRequirements || ''}
                              onChange={(e) => setEditableApplicationData({...editableApplicationData, specialRequirements: e.target.value})}
                              rows={3}
                              placeholder="Any special requirements or accommodations..."
                            />
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium mb-2 block">References</label>
                            <Textarea
                              value={editableApplicationData?.references || ''}
                              onChange={(e) => setEditableApplicationData({...editableApplicationData, references: e.target.value})}
                              rows={3}
                              placeholder="Professional references..."
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Application Status & Timeline */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <div className="w-2 h-6 bg-gray-500 rounded-full mr-3"></div>
                    Application Status
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Status:</span>
                        <Badge className={
                          selectedApplicationDetails.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                          selectedApplicationDetails.status === 'approved' ? 'bg-green-100 text-green-800' :
                          selectedApplicationDetails.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {selectedApplicationDetails.status?.charAt(0).toUpperCase() + selectedApplicationDetails.status?.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        Submitted: {new Date(selectedApplicationDetails.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {selectedApplicationDetails.reviewedBy && (
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Reviewed by:</strong> {selectedApplicationDetails.reviewedBy}</p>
                        {selectedApplicationDetails.reviewedAt && (
                          <p><strong>Reviewed on:</strong> {new Date(selectedApplicationDetails.reviewedAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    )}
                    
                    {selectedApplicationDetails.adminNotes && (
                      <div className="mt-3">
                        <p className="font-medium text-sm mb-2">Admin Notes:</p>
                        <p className="text-sm text-gray-600 bg-white p-3 rounded border">{selectedApplicationDetails.adminNotes}</p>
                      </div>
                    )}
                    
                    {selectedApplicationDetails.createdSpeakerId && (
                      <div className="mt-3">
                        <p className="text-sm text-green-600">
                          <strong>Speaker Profile Created:</strong> ID #{selectedApplicationDetails.createdSpeakerId}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setSelectedApplicationDetails(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Duplicate Check Dialog */}
        <Dialog open={duplicateCheckDialogOpen} onOpenChange={setDuplicateCheckDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Potential Duplicate Check</DialogTitle>
              <DialogDescription>
                {actionType === 'create_new' 
                  ? "Review potential duplicates before creating a new speaker profile"
                  : "Select an existing speaker to link this application to"
                }
              </DialogDescription>
            </DialogHeader>
            
            {currentApplication && (
              <div className="space-y-6">
                {/* Application Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Application Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Name:</strong> {currentApplication.firstName} {currentApplication.lastName}</p>
                      <p><strong>Email:</strong> {currentApplication.email}</p>
                    </div>
                    <div>
                      <p><strong>Specialty:</strong> {currentApplication.specialty}</p>
                      <p><strong>Location:</strong> {currentApplication.location}</p>
                    </div>
                  </div>
                </div>

                {/* Potential Matches */}
                {potentialDuplicates.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Potential Matches Found ({potentialDuplicates.length} matches)</h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {potentialDuplicates.map((match: any) => (
                        <div key={match.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={match.imageUrl || "/api/placeholder/40/40"} 
                              alt={match.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <p className="font-medium">{match.name}</p>
                              <p className="text-sm text-gray-600">{match.title}</p>
                              <p className="text-xs text-gray-500">{match.location}</p>
                            </div>
                          </div>
                          {actionType === 'add_to_existing' && (
                            <Button
                              size="sm"
                              variant={selectedExistingSpeaker === match.id ? "default" : "outline"}
                              onClick={() => setSelectedExistingSpeaker(match.id)}
                            >
                              {selectedExistingSpeaker === match.id ? "Selected" : "Select"}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {potentialDuplicates.length === 0 && actionType !== 'add_to_existing' && (
                  <div className="text-center py-6 text-gray-500">
                    <UserCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No potential duplicates found. Safe to proceed.</p>
                  </div>
                )}

                {actionType === 'add_to_existing' && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Search for Speaker to Link</h4>
                    <Input
                      type="text"
                      placeholder="Type a speaker name to search..."
                      onChange={(e) => {
                        const query = e.target.value.toLowerCase().trim();
                        if (query.length >= 2) {
                          const matches = speakersArray
                            .filter((s: any) => s.name.toLowerCase().includes(query))
                            .slice(0, 10)
                            .map((s: any) => ({ id: s.id, name: s.name, title: s.title, email: s.email, hidden: s.hideProfile }));
                          setPotentialDuplicates((prev: any[]) => {
                            const autoMatchIds = new Set(prev.filter((p: any) => p._autoMatch).map((p: any) => p.id));
                            const autoMatches = prev.filter((p: any) => p._autoMatch);
                            const searchResults = matches
                              .filter((m: any) => !autoMatchIds.has(m.id))
                              .map((m: any) => ({ ...m, _searchResult: true }));
                            return [...autoMatches, ...searchResults];
                          });
                        }
                      }}
                    />
                    {potentialDuplicates.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-2">Type at least 2 characters to search speakers</p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setDuplicateCheckDialogOpen(false);
                      setCurrentApplication(null);
                      setPotentialDuplicates([]);
                      setSelectedExistingSpeaker(null);
                      setActionType(null);
                    }}
                  >
                    Cancel
                  </Button>
                  
                  {actionType === 'create_new' && (
                    <div className="flex space-x-2">
                      {potentialDuplicates.length > 0 && (
                        <Button 
                          onClick={handleCreateNewWithOverride}
                          disabled={approveApplicationMutation.isPending}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          {approveApplicationMutation.isPending ? "Creating..." : "Create Anyway"}
                        </Button>
                      )}
                      <Button 
                        onClick={() => {
                          if (currentApplication) {
                            approveApplicationMutation.mutate({
                              applicationId: currentApplication.id,
                              reviewedBy: adminEmail || 'Admin User'
                            });
                            setDuplicateCheckDialogOpen(false);
                          }
                        }}
                        disabled={approveApplicationMutation.isPending || potentialDuplicates.length > 0}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {approveApplicationMutation.isPending ? "Creating..." : "Create New Profile"}
                      </Button>
                    </div>
                  )}
                  
                  {actionType === 'add_to_existing' && (
                    <Button 
                      onClick={handleLinkToExisting}
                      disabled={linkToExistingSpeakerMutation.isPending || !selectedExistingSpeaker}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {linkToExistingSpeakerMutation.isPending ? "Linking..." : "Link to Selected Speaker"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Override Confirmation Dialog */}
        <Dialog open={overrideConfirmDialogOpen} onOpenChange={setOverrideConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>⚠️ Confirm Override</DialogTitle>
              <DialogDescription>
                You are about to create a new speaker profile despite finding potential duplicates.
              </DialogDescription>
            </DialogHeader>
            
            {currentApplication && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <h4 className="font-medium text-amber-800">Similar Profiles Found</h4>
                  </div>
                  <p className="text-sm text-amber-700 mb-3">
                    We found {potentialDuplicates.length} existing speaker(s) with similar names:
                  </p>
                  <div className="space-y-1">
                    {potentialDuplicates.slice(0, 3).map((duplicate: any) => (
                      <p key={duplicate.id} className="text-sm text-amber-800 font-medium">
                        • {duplicate.name} - {duplicate.title || "No title"}
                      </p>
                    ))}
                    {potentialDuplicates.length > 3 && (
                      <p className="text-sm text-amber-700">...and {potentialDuplicates.length - 3} more</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">New Application Details</h4>
                  <div className="text-sm text-blue-700">
                    <p><strong>Name:</strong> {currentApplication.firstName} {currentApplication.lastName}</p>
                    <p><strong>Email:</strong> {currentApplication.email}</p>
                    <p><strong>Title:</strong> {currentApplication.title}</p>
                    <p><strong>Specialty:</strong> {currentApplication.specialty}</p>
                  </div>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">
                    <strong>Are you sure this is a different person?</strong> Creating duplicate profiles can confuse users and impact the platform's quality.
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setOverrideConfirmDialogOpen(false);
                  setDuplicateCheckDialogOpen(true);
                }}
              >
                Go Back
              </Button>
              <Button 
                onClick={handleOverrideConfirm}
                disabled={approveApplicationMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {approveApplicationMutation.isPending ? "Creating..." : "Yes, Create New Profile"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSpeaker?.isApplication ? "Delete Application" : "Delete Speaker Profile"}</DialogTitle>
              <DialogDescription>
                {editingSpeaker?.isApplication 
                  ? `Are you sure you want to delete ${editingSpeaker?.name}'s application? This will permanently remove the application record for organizational purposes. If this was an approved application, the speaker profile will remain intact.`
                  : `Choose how you want to delete ${editingSpeaker?.name || editingSpeaker?.email}'s profile.`
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {!editingSpeaker?.isApplication && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Deletion Options</Label>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        id="retention"
                        name="deletionType"
                        value="retention"
                        checked={deletionType === "retention"}
                        onChange={(e) => setDeletionType(e.target.value as "retention")}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor="retention" className="text-sm font-medium cursor-pointer">
                          14-Day Retention (Recommended)
                        </label>
                        <p className="text-xs text-gray-600 mt-1">
                          Hide profile immediately but keep data for 14 days in case you need to restore it. Profile will be permanently deleted after 14 days.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        id="immediate"
                        name="deletionType"
                        value="immediate"
                        checked={deletionType === "immediate"}
                        onChange={(e) => setDeletionType(e.target.value as "immediate")}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor="immediate" className="text-sm font-medium cursor-pointer text-red-600">
                          Immediate Delete
                        </label>
                        <p className="text-xs text-gray-600 mt-1">
                          Permanently delete the profile and all associated data immediately. This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="deletePassword">Admin Password</Label>
                <Input
                  id="deletePassword"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter admin password to confirm"
                />
              </div>
              {deleteError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{deleteError}</AlertDescription>
                </Alert>
              )}
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setDeletePassword("");
                  setDeleteError("");
                  setDeletionType("retention");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleteUserMutation.isPending || deleteSpeakerMutation.isPending || deleteApplicationMutation.isPending}
              >
                {(deleteUserMutation.isPending || deleteSpeakerMutation.isPending || deleteApplicationMutation.isPending)
                  ? "Deleting..." 
                  : (editingSpeaker?.isApplication 
                      ? "Delete Application" 
                      : (deletionType === "immediate" ? "Delete Immediately" : "Delete with 14-Day Retention")
                    )
                }
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Image Modal */}
        <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>Review Photo</DialogTitle>
            </DialogHeader>
            <div className="p-6 pt-0">
              {selectedImage && (
                <div className="flex justify-center">
                  <img 
                    src={selectedImage} 
                    alt="Review photo"
                    className="max-w-full max-h-[70vh] object-contain rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Topic Category Management Dialog */}
        <Dialog open={isTopicCategoryDialogOpen} onOpenChange={setIsTopicCategoryDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Manage Topics for Category: {selectedCategoryForTopics?.name}</DialogTitle>
              <DialogDescription>
                Assign or remove speaking topics from the "{selectedCategoryForTopics?.name}" category
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col space-y-4 h-full overflow-hidden">
              {/* Search and Filter */}
              <div className="flex gap-3">
                <Input
                  placeholder="Search topics..."
                  value={topicCategoryFilter}
                  onChange={(e) => setTopicCategoryFilter(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={() => {
                    if (selectedTopicsForCategory.size > 0) {
                      bulkUpdateTopicCategoriesMutation.mutate({
                        topicIds: Array.from(selectedTopicsForCategory),
                        category: selectedCategoryForTopics?.name || null
                      });
                    }
                  }}
                  disabled={selectedTopicsForCategory.size === 0 || bulkUpdateTopicCategoriesMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Assign Selected ({selectedTopicsForCategory.size})
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Topics in this category */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-green-700 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      In "{selectedCategoryForTopics?.name}" Category
                      <Badge variant="outline" className="ml-2">
                        {topics?.filter((t: any) => t.category === selectedCategoryForTopics?.name).length || 0}
                      </Badge>
                    </h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {topics?.filter((topic: any) => 
                        topic.category === selectedCategoryForTopics?.name &&
                        (topicCategoryFilter === '' || topic.name.toLowerCase().includes(topicCategoryFilter.toLowerCase()))
                      ).map((topic: any) => (
                        <div key={topic.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex-1">
                            <span className="font-medium">{topic.name}</span>
                            <div className="text-xs text-gray-500">{topic.speakerCount || 0} speakers</div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateTopicCategoryMutation.mutate({
                              topicId: topic.id,
                              category: null
                            })}
                            disabled={updateTopicCategoryMutation.isPending}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      {topics?.filter((t: any) => t.category === selectedCategoryForTopics?.name).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <XCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No topics assigned to this category</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Unassigned topics */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-blue-700 flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Unassigned Topics
                      <Badge variant="outline" className="ml-2">
                        {topics?.filter((t: any) => !t.category || t.category !== selectedCategoryForTopics?.name).length || 0}
                      </Badge>
                    </h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {topics?.filter((topic: any) => 
                        (!topic.category || topic.category !== selectedCategoryForTopics?.name) &&
                        (topicCategoryFilter === '' || topic.name.toLowerCase().includes(topicCategoryFilter.toLowerCase()))
                      ).map((topic: any) => (
                        <div key={topic.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-2 flex-1">
                            <Checkbox
                              checked={selectedTopicsForCategory.has(topic.id)}
                              onCheckedChange={(checked) => {
                                const newSelected = new Set(selectedTopicsForCategory);
                                if (checked) {
                                  newSelected.add(topic.id);
                                } else {
                                  newSelected.delete(topic.id);
                                }
                                setSelectedTopicsForCategory(newSelected);
                              }}
                            />
                            <div className="flex-1">
                              <span className="font-medium">{topic.name}</span>
                              <div className="text-xs text-gray-500">
                                {topic.speakerCount || 0} speakers
                                {topic.category && <span className="ml-2 text-orange-600">Currently in: {topic.category}</span>}
                              </div>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateTopicCategoryMutation.mutate({
                              topicId: topic.id,
                              category: selectedCategoryForTopics?.name || null
                            })}
                            disabled={updateTopicCategoryMutation.isPending}
                            className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          >
                            Assign
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsTopicCategoryDialogOpen(false);
                  setSelectedTopicsForCategory(new Set());
                  setTopicCategoryFilter('');
                }}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Speaker Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Speaker Profile</DialogTitle>
              <DialogDescription>
                Update speaker information and settings.
              </DialogDescription>
            </DialogHeader>
            {editingSpeaker && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="speakerName">Speaker Name</Label>
                    <Input
                      id="speakerName"
                      value={editingSpeaker.name || ""}
                      onChange={(e) => setEditingSpeaker((prev: any) => ({ ...prev, name: e.target.value }))}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="speakerTitle">Title</Label>
                    <Input
                      id="speakerTitle"
                      value={editingSpeaker.title || ""}
                      onChange={(e) => setEditingSpeaker((prev: any) => ({ ...prev, title: e.target.value }))}
                      placeholder="Professional title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="speakerEmail">Email</Label>
                    <Input
                      id="speakerEmail"
                      type="email"
                      value={editingSpeaker.email || ""}
                      onChange={(e) => setEditingSpeaker((prev: any) => ({ ...prev, email: e.target.value }))}
                      placeholder="Email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="speakerPhone">Phone</Label>
                    <Input
                      id="speakerPhone"
                      value={editingSpeaker.phone || ""}
                      onChange={(e) => setEditingSpeaker((prev: any) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="speakerWebsite">Website</Label>
                    <Input
                      id="speakerWebsite"
                      value={editingSpeaker.website || ""}
                      onChange={(e) => setEditingSpeaker((prev: any) => ({ ...prev, website: e.target.value }))}
                      placeholder="Website URL"
                    />
                  </div>
                  <div>
                    <Label htmlFor="speakerLocation">Location</Label>
                    <Input
                      id="speakerLocation"
                      value={editingSpeaker.location || ""}
                      onChange={(e) => setEditingSpeaker((prev: any) => ({ ...prev, location: e.target.value }))}
                      placeholder="City, State/Country"
                    />
                  </div>
                </div>

                {/* Headshot Upload Section */}
                <div className="space-y-4 border-t pt-6">
                  <Label className="text-base font-semibold">Profile Headshot</Label>
                  <div className="flex items-start space-x-6">
                    {/* Current Headshot Preview */}
                    <div className="flex flex-col space-y-2">
                      <Label className="text-sm text-gray-600">Current Photo</Label>
                      <div className="w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                        {editingSpeaker.imageUrl ? (
                          <img 
                            src={editingSpeaker.imageUrl} 
                            alt={editingSpeaker.name || "Speaker"} 
                            className="w-full h-full object-cover"
                            data-testid="current-speaker-headshot"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                            No photo
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Upload New Headshot */}
                    <div className="flex-1">
                      <Label className="text-sm text-gray-600">Upload New Photo</Label>
                      <div className="mt-2">
                        <ObjectUploader
                          imageType="profile"
                          entityId={editingSpeaker.id?.toString()}
                          ownerType="speaker"
                          maxFileSize={10485760} // 10MB
                          onComplete={(result) => {
                            if (result.successful && result.successful.length > 0) {
                              // Update the speaker's imageUrl with the new uploaded image
                              const uploadedFile = result.successful[0];
                              const newImageUrl = `/api/images/${uploadedFile.id}`;
                              setEditingSpeaker((prev: any) => ({ 
                                ...prev, 
                                imageUrl: newImageUrl 
                              }));
                            }
                          }}
                          buttonClassName="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload New Headshot
                        </ObjectUploader>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Recommended: Square image, at least 400x400px, under 10MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Professional Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="speakerSpecialty">Specialty</Label>
                    <Input
                      id="speakerSpecialty"
                      value={editingSpeaker.specialty || ""}
                      onChange={(e) => setEditingSpeaker((prev: any) => ({ ...prev, specialty: e.target.value }))}
                      placeholder="Medical specialty"
                    />
                  </div>
                  <div>
                    <Label htmlFor="speakerExperience">Years of Experience</Label>
                    <Input
                      id="speakerExperience"
                      type="number"
                      value={editingSpeaker.yearsExperience || ""}
                      onChange={(e) => setEditingSpeaker((prev: any) => ({ ...prev, yearsExperience: parseInt(e.target.value) || 0 }))}
                      placeholder="Years of experience"
                    />
                  </div>
                </div>

                {/* Biography */}
                <div>
                  <Label htmlFor="speakerBio">Biography</Label>
                  <textarea
                    id="speakerBio"
                    className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editingSpeaker.bio || ""}
                    onChange={(e) => setEditingSpeaker((prev: any) => ({ ...prev, bio: e.target.value }))}
                    placeholder="Professional biography"
                  />
                </div>

                {/* Social Media Links */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Social Media Links</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="speakerInstagram">Instagram</Label>
                      <Input
                        id="speakerInstagram"
                        value={editingSpeaker.instagramHandle || ""}
                        onChange={(e) => setEditingSpeaker((prev: any) => ({ ...prev, instagramHandle: e.target.value }))}
                        placeholder="Instagram URL"
                      />
                    </div>
                    <div>
                      <Label htmlFor="speakerTwitter">X (Twitter)</Label>
                      <Input
                        id="speakerTwitter"
                        value={editingSpeaker.xHandle || ""}
                        onChange={(e) => setEditingSpeaker((prev: any) => ({ ...prev, xHandle: e.target.value }))}
                        placeholder="X/Twitter URL"
                      />
                    </div>
                    <div>
                      <Label htmlFor="speakerLinkedIn">LinkedIn</Label>
                      <Input
                        id="speakerLinkedIn"
                        value={editingSpeaker.linkedinHandle || ""}
                        onChange={(e) => setEditingSpeaker((prev: any) => ({ ...prev, linkedinHandle: e.target.value }))}
                        placeholder="LinkedIn URL"
                      />
                    </div>
                    <div>
                      <Label htmlFor="speakerFacebook">Facebook</Label>
                      <Input
                        id="speakerFacebook"
                        value={editingSpeaker.facebookHandle || ""}
                        onChange={(e) => setEditingSpeaker((prev: any) => ({ ...prev, facebookHandle: e.target.value }))}
                        placeholder="Facebook URL"
                      />
                    </div>
                  </div>
                </div>

                {/* Speaking Information */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Speaking Information</Label>
                  <div>
                    <Label htmlFor="speakerSpeakingExperience">Previous Speaking Experience</Label>
                    <textarea
                      id="speakerSpeakingExperience"
                      className="w-full min-h-[80px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editingSpeaker.previousSpeakingExperience || ""}
                      onChange={(e) => setEditingSpeaker((prev: any) => ({ ...prev, previousSpeakingExperience: e.target.value }))}
                      placeholder="Describe previous speaking engagements"
                    />
                  </div>
                  <div>
                    <Label htmlFor="speakerTopics">Topics of Expertise</Label>
                    <textarea
                      id="speakerTopics"
                      className="w-full min-h-[80px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editingSpeaker.specificTopicsOfExpertise || ""}
                      onChange={(e) => setEditingSpeaker((prev: any) => ({ ...prev, specificTopicsOfExpertise: e.target.value }))}
                      placeholder="List specific topics you can speak about"
                    />
                  </div>
                </div>

                {/* Profile Status & Tier */}
                <div className="space-y-3 border-t pt-6">
                  <Label className="text-base font-semibold">Profile Status & Tier</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="subscriptionTier">Subscription Tier</Label>
                      <Select 
                        value={editingSpeaker.subscriptionTier || "basic"}
                        onValueChange={(value) => setEditingSpeaker((prev: any) => ({ ...prev, subscriptionTier: value }))}
                      >
                        <SelectTrigger id="subscriptionTier">
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic (Free)</SelectItem>
                          <SelectItem value="pro">Pro (Featured)</SelectItem>
                          <SelectItem value="premier">Premier (Top Placement)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Controls homepage placement and profile features
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified"
                        checked={!!editingSpeaker.verified}
                        onCheckedChange={(checked) => setEditingSpeaker((prev: any) => ({ ...prev, verified: checked }))}
                      />
                      <Label htmlFor="verified" className="text-sm">Verified Speaker</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="featured"
                        checked={!!editingSpeaker.featured}
                        onCheckedChange={(checked) => setEditingSpeaker((prev: any) => ({ ...prev, featured: checked }))}
                      />
                      <Label htmlFor="featured" className="text-sm">Featured Status</Label>
                    </div>
                  </div>
                </div>

                {/* Visibility Settings */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Visibility Settings</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hideProfile"
                        checked={!!editingSpeaker.hideProfile}
                        onCheckedChange={(checked) => setEditingSpeaker((prev: any) => ({ ...prev, hideProfile: checked }))}
                      />
                      <Label htmlFor="hideProfile" className="text-sm">Hide Profile</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hideRatings"
                        checked={!!editingSpeaker.hideRatings}
                        onCheckedChange={(checked) => setEditingSpeaker((prev: any) => ({ ...prev, hideRatings: checked }))}
                      />
                      <Label htmlFor="hideRatings" className="text-sm">Hide Ratings</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hideSocial"
                        checked={!!editingSpeaker.hideSocial}
                        onCheckedChange={(checked) => setEditingSpeaker((prev: any) => ({ ...prev, hideSocial: checked }))}
                      />
                      <Label htmlFor="hideSocial" className="text-sm">Hide Social Media</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hideContact"
                        checked={!!editingSpeaker.hideContact}
                        onCheckedChange={(checked) => setEditingSpeaker((prev: any) => ({ ...prev, hideContact: checked }))}
                      />
                      <Label htmlFor="hideContact" className="text-sm">Hide Contact Info</Label>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingSpeaker(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingSpeaker) {
                    updateSpeakerMutation.mutate(editingSpeaker);
                  }
                }}
                disabled={updateSpeakerMutation.isPending}
              >
                {updateSpeakerMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Category Deletion Confirmation Modal */}
        <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the category "{categoryToDelete?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete-category">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button 
                  variant="destructive" 
                  onClick={handleConfirmDelete}
                  disabled={deleteCategoryMutation.isPending}
                  data-testid="button-confirm-delete-category"
                >
                  {deleteCategoryMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
