import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, MessageSquare, Star, TrendingUp, LogOut, Settings, BarChart3, FolderOpen, MousePointer, Eye, EyeOff, ExternalLink, Mail, Phone, Globe, Share2, Edit, Trash2, AlertTriangle, Home, Download, Plus, UserCheck, Upload, UserPlus, Link as LinkIcon, FileText } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AnalyticsDashboard from "@/components/analytics-dashboard";
import { SpeakerInteractionAnalytics } from "@/components/speaker-interaction-analytics";
import { DetailedSpeakerAnalytics } from "@/components/detailed-speaker-analytics";
import type { User, Speaker, Category, Inquiry } from "@shared/schema";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [adminEmail, setAdminEmail] = useState("");
  const [editingSpeaker, setEditingSpeaker] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [newSpeakerType, setNewSpeakerType] = useState("");
  const [speakerTypes, setSpeakerTypes] = useState(['Keynote', 'Clinical', 'Research', 'Educational', 'Workshop Leader', 'Panel Moderator']);
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
  
  // Admin speakers filter states
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
  
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
  
  const { toast } = useToast();

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
      const response = await fetch(`/api/speakers/${updatedSpeaker.id}`, {
        method: 'PATCH',
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
    mutationFn: async ({ speakerId, password }: { speakerId: number; password: string }) => {
      const response = await fetch(`/api/admin/speakers/${speakerId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminPassword: password }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete speaker');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Speaker Deleted", 
        description: "Speaker has been moved to recently deleted (14 days retention)" 
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

  const handleDeleteConfirm = () => {
    if (!deletePassword.trim()) {
      setDeleteError("Password is required");
      return;
    }
    
    // Check if we're deleting a user (users have email property, speakers have title/name)
    if (editingSpeaker.email && typeof editingSpeaker.id === 'string') {
      deleteUserMutation.mutate({ 
        userId: editingSpeaker.id, 
        adminPassword: deletePassword 
      });
    } else {
      deleteSpeakerMutation.mutate({ 
        speakerId: editingSpeaker.id, 
        password: deletePassword 
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

  // Add speaker type
  const handleAddSpeakerType = () => {
    if (newSpeakerType.trim() && !speakerTypes.includes(newSpeakerType.trim())) {
      setSpeakerTypes([...speakerTypes, newSpeakerType.trim()]);
      setNewSpeakerType("");
      toast({ title: "Success", description: "Speaker type added successfully" });
    }
  };

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

  // Check for duplicate speakers mutation
  const checkDuplicatesMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const response = await fetch(`/api/admin/speaker-applications/${applicationId}/check-duplicates`);
      if (!response.ok) throw new Error('Failed to check for duplicates');
      return response.json();
    },
    onSuccess: (data) => {
      setPotentialDuplicates(data.potentialMatches || []);
      setDuplicateCheckDialogOpen(true);
      setIsCheckingDuplicates(false);
    },
    onError: () => {
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
      setDuplicateCheckDialogOpen(false);
      setCurrentApplication(null);
      setPotentialDuplicates([]);
      setActionType(null);
      
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

  const getSpeakersInCategory = (categoryName: string) => {
    return speakersArray.filter((speaker: any) => 
      speaker.categories && Array.isArray(speaker.categories) && speaker.categories.includes(categoryName)
    );
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
      queryClient.invalidateQueries({ queryKey: ["/api/speakers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/speakers/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/speakers"] });
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
      approveApplicationMutation.mutate({
        applicationId: currentApplication.id,
        reviewedBy: adminEmail || 'Admin User'
      });
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
  
  // Filter speakers based on search query, categories, and statuses
  const filteredSpeakers = speakersArray.filter((speaker: any) => {
    // Search query filter
    const matchesSearch = searchQuery === "" || 
      speaker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      speaker.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      speaker.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter
    const matchesCategory = selectedCategories.size === 0 || 
      selectedCategories.has(speaker.category || '');
    
    // Status filter (verified/featured)
    const matchesStatus = selectedStatuses.size === 0 || 
      (selectedStatuses.has('verified') && speaker.verified) ||
      (selectedStatuses.has('featured') && speaker.featured);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Filter speakers for category assignment dialog
  const filteredCategorySpeakers = speakersArray.filter((speaker: any) => 
    speaker.name.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
    speaker.title?.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );
  
  const totalSpeakers = speakersArray.length;
  const verifiedSpeakers = speakersArray.filter((s: any) => s.verified).length;
  const featuredSpeakers = speakersArray.filter((s: any) => s.featured).length;
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
          <TabsList className="grid w-full grid-cols-6 bg-gray-100 p-1 rounded-lg">
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
              value="users"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white bg-white hover:bg-gray-50 transition-colors"
            >
              Users
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
                    {speakersArray.length || 0}
                  </div>
                  <div className="text-sm font-medium text-purple-800">Total Speakers</div>
                  <div className="text-xs text-purple-600 mt-1">All speaker accounts</div>
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
                            
                            {application.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setCurrentApplication(application);
                                    setActionType('create_new');
                                    setDuplicateCheckDialogOpen(true);
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
                                    setDuplicateCheckDialogOpen(true);
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
                  Manage speaker profiles, verification status, and featured listings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Recent Speakers</h3>
                    <Button onClick={() => setIsManualAddDialogOpen(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add New Speaker
                    </Button>
                  </div>
                  
                  <div className="grid gap-4">
                    {speakersArray.slice(0, 5).map((speaker: any) => (
                      <div key={speaker.slug} className="flex items-center justify-between p-4 border rounded-lg">
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
                          
                          {/* Featured Badge - Always Visible and Clickable */}
                          <button
                            onClick={() => updateSpeakerMutation.mutate({
                              ...speaker,
                              featured: !speaker.featured
                            })}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                              speaker.featured 
                                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                            title={speaker.featured ? "Click to unfeature" : "Click to feature"}
                          >
                            Featured
                          </button>
                          
                          <Button variant="outline" size="sm">Edit</Button>
                        </div>
                      </div>
                    ))}
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
                          const allSpeakerIds = filteredSpeakers.map((s: any) => s.id);
                          bulkToggleContactMutation.mutate({ speakerIds: allSpeakerIds, hideContact: true });
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
                          const allSpeakerIds = filteredSpeakers.map((s: any) => s.id);
                          bulkToggleContactMutation.mutate({ speakerIds: allSpeakerIds, hideContact: false });
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
                          const allSpeakerIds = filteredSpeakers.map((s: any) => s.id);
                          bulkToggleRatingsMutation.mutate({ speakerIds: allSpeakerIds, hideRatings: true });
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
                          const allSpeakerIds = filteredSpeakers.map((s: any) => s.id);
                          bulkToggleRatingsMutation.mutate({ speakerIds: allSpeakerIds, hideRatings: false });
                        }}
                        disabled={bulkToggleRatingsMutation.isPending}
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Show All Ratings
                      </Button>
                    </div>
                    
                    <div className="grid gap-4">
                      {filteredSpeakers.length > 0 ? (
                        filteredSpeakers.map((speaker: any) => (
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
                                
                                {/* Featured Badge - Always Visible and Clickable */}
                                <button
                                  onClick={() => updateSpeakerMutation.mutate({
                                    ...speaker,
                                    featured: !speaker.featured
                                  })}
                                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                                    speaker.featured 
                                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                  }`}
                                  title={speaker.featured ? "Click to unfeature" : "Click to feature"}
                                >
                                  Featured
                                </button>
                                
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditSpeaker(speaker)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
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
                      {speakersArray.length || 0}
                    </div>
                    <div className="text-sm font-medium text-purple-800">Total Speaker Accounts</div>
                    <div className="text-xs text-purple-600 mt-1">All speakers combined</div>
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
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Current Categories</h3>
                    <Button>Add New Category</Button>
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
                              <Button variant="outline" size="sm">Delete</Button>
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
                          
                          {inquiry.adminNotes && (
                            <div className="text-sm bg-gray-50 p-2 rounded">
                              <strong>Admin Notes:</strong> {inquiry.adminNotes}
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

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Speaker Analytics</CardTitle>
                <CardDescription>
                  Comprehensive performance metrics, demand forecasting, and engagement analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsDashboard />
              </CardContent>
            </Card>
            
            {/* Detailed Speaker Interaction Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Speaker Interaction Analytics</CardTitle>
                <CardDescription>
                  Click-by-click tracking for individual speakers. Search and filter all speakers to view their detailed interaction metrics, engagement patterns, and user behavior data.
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
                    
                    {/* Add New Category */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
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

                    {/* Existing Categories */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Existing Categories</h4>
                      <div className="grid gap-3">
                        {categoriesArray.map((category: any) => (
                          <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{category.name}</div>
                              <div className="text-sm text-gray-600">{category.description}</div>
                              <div className="text-xs text-gray-500">{category.speakerCount || 0} speakers</div>
                            </div>
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
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Speaker Type Management */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-4">Speaker Type Management</h3>
                    
                    {/* Add New Speaker Type */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="font-medium mb-3">Add New Speaker Type</h4>
                      <div className="flex gap-3">
                        <Input
                          placeholder="Speaker Type (e.g., Workshop Leader)"
                          value={newSpeakerType}
                          onChange={(e) => setNewSpeakerType(e.target.value)}
                        />
                        <Button 
                          onClick={handleAddSpeakerType}
                          disabled={!newSpeakerType.trim()}
                        >
                          Add Type
                        </Button>
                      </div>
                    </div>

                    {/* Existing Speaker Types */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Available Speaker Types</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {speakerTypes.map((type) => (
                          <div key={type} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{type}</span>
                            <button
                              onClick={() => {
                                setSpeakerTypes(speakerTypes.filter(t => t !== type));
                                toast({ title: "Success", description: "Speaker type removed" });
                              }}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
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
                        <span className="font-medium">Categories and Speaker Types</span>
                      </div>
                      <p className="text-sm text-blue-700 mt-2">
                        Manage available categories and speaker types used throughout the platform. 
                        Changes will be reflected immediately in speaker profiles and search filters.
                      </p>
                    </div>
                  </div>
                </div>
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
      </div>
    </div>
  );
}
