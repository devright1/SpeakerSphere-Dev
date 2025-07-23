import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, MessageSquare, Star, TrendingUp, LogOut, Settings, BarChart3, FolderOpen, MousePointer, Eye, EyeOff, ExternalLink, Mail, Phone, Globe, Share2, Edit, Trash2, AlertTriangle, Home } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AnalyticsDashboard from "@/components/analytics-dashboard";
import SpeakerPerformanceAnalytics from "@/components/speaker-performance-analytics";

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
  const [feeRangeVisible, setFeeRangeVisible] = useState(false);
  const { toast } = useToast();

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

  const { data: speakers } = useQuery({
    queryKey: ["/api/speakers"],
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

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
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update speaker", variant: "destructive" });
    },
  });

  // Delete speaker mutation
  const deleteSpeakerMutation = useMutation({
    mutationFn: async ({ speakerId, password }: { speakerId: number; password: string }) => {
      const response = await fetch(`/api/speakers/${speakerId}`, {
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
    deleteSpeakerMutation.mutate({ 
      speakerId: editingSpeaker.id, 
      password: deletePassword 
    });
  };

  const handleSaveSpeaker = () => {
    updateSpeakerMutation.mutate(editingSpeaker);
  };

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

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    
    // Initialize checkbox states for all speakers
    const currentSpeakers = Array.isArray(speakers) ? speakers : [];
    const assignments: {[key: string]: boolean} = {};
    currentSpeakers.forEach((speaker: any) => {
      assignments[speaker.id] = speaker.category === category.name;
    });
    setCategoryAssignments(assignments);
    setCategorySearchQuery(""); // Reset search when opening dialog
    setIsCategoryEditDialogOpen(true);
  };

  const handleSaveCategoryAssignments = async () => {
    const updatePromises: Promise<any>[] = [];
    
    // Process each speaker assignment change
    Object.entries(categoryAssignments).forEach(([speakerId, isAssigned]) => {
      const speaker = speakersArray.find((s: any) => s.id === parseInt(speakerId));
      if (speaker) {
        const currentlyAssigned = speaker.category === editingCategory.name;
        
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

  const speakersArray = Array.isArray(speakers) ? speakers : [];
  const categoriesArray = Array.isArray(categories) ? categories : [];
  
  // Filter speakers based on search query
  const filteredSpeakers = speakersArray.filter((speaker: any) => 
    speaker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    speaker.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    speaker.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="speakers">Speakers</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="speakers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Speaker Management</CardTitle>
                <CardDescription>
                  Manage speaker profiles, verification status, and featured listings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Recent Speakers</h3>
                    <Button>Add New Speaker</Button>
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
                          {speaker.verified && <Badge variant="secondary">Verified</Badge>}
                          {speaker.featured && <Badge>Featured</Badge>}
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
                                  onClick={() => updateSpeakerMutation.mutate({
                                    ...speaker,
                                    hideRatings: !speaker.hideRatings
                                  })}
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
                                  onClick={() => updateSpeakerMutation.mutate({
                                    ...speaker,
                                    hideContact: !speaker.hideContact
                                  })}
                                >
                                  <Phone className="h-4 w-4 text-purple-600" />
                                </button>
                                <span className="text-xs text-gray-500 mt-1">Hide Contact</span>
                              </div>

                              {/* Separator */}
                              <div className="h-8 w-px bg-gray-300 mx-2"></div>

                              {/* Status Badges and Edit */}
                              <div className="flex items-center space-x-2">
                                {speaker.verified && <Badge variant="secondary">Verified</Badge>}
                                {speaker.featured && <Badge>Featured</Badge>}
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

                          {/* Status Indicators Row */}
                          <div className="mt-3 pt-3 border-t flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-gray-600">Profile Visible</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-gray-600">Ratings Visible</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-gray-600">Social Visible</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-gray-600">Contact Visible</span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              Last updated: Today
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
                    {categoriesArray.map((category: any) => (
                      <div key={category.name} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <FolderOpen className="h-8 w-8 text-primary" />
                          <div>
                            <h4 className="font-medium">{category.name}</h4>
                            <p className="text-sm text-gray-600">{category.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {speakersArray.filter((s: any) => s.category === category.name).length} speakers
                          </Badge>
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
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
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
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Speaker Performance Analytics</CardTitle>
                <CardDescription>
                  Detailed view and engagement tracking for each speaker, sorted by total views
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SpeakerPerformanceAnalytics />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Management</CardTitle>
                <CardDescription>
                  Approve, reject, or flag reviews for further consideration. Only approved reviews affect rankings and appear on speaker profiles.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Review Status Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <MessageSquare className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">Pending Reviews</span>
                      </div>
                      <div className="text-2xl font-bold">8</div>
                      <div className="text-sm text-gray-500">Awaiting approval</div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Star className="h-5 w-5 text-green-500" />
                        <span className="font-medium">Approved</span>
                      </div>
                      <div className="text-2xl font-bold">0</div>
                      <div className="text-sm text-gray-500">Live on profiles</div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-yellow-500" />
                        <span className="font-medium">Tentative</span>
                      </div>
                      <div className="text-2xl font-bold">0</div>
                      <div className="text-sm text-gray-500">Need review</div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Settings className="h-5 w-5 text-red-500" />
                        <span className="font-medium">Rejected</span>
                      </div>
                      <div className="text-2xl font-bold">0</div>
                      <div className="text-sm text-gray-500">Not published</div>
                    </div>
                  </div>

                  {/* Pending Reviews */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Pending Reviews for Approval</h3>
                    
                    {/* Sample pending reviews */}
                    {[
                      {
                        id: 1,
                        speaker: "Dr. Sascha Jovanovic",
                        reviewer: "Dr. Michael Thompson",
                        date: "2025-01-22",
                        rating: 4.8,
                        content: "Exceptional speaker with incredible knowledge of digital workflows. His presentation on guided surgery was both informative and practical. Highly recommend for any dental conference.",
                        categories: {
                          expertise: 5,
                          delivery: 5,
                          engagement: 4,
                          practical: 5
                        }
                      },
                      {
                        id: 2,
                        speaker: "Dr. Robert Levine",
                        reviewer: "Dr. Sarah Chen",
                        date: "2025-01-22",
                        rating: 4.9,
                        content: "Dr. Levine's expertise in periodontics is unmatched. His SameDay Smile protocols have revolutionized our practice. Clear, concise, and actionable content.",
                        categories: {
                          expertise: 5,
                          delivery: 5,
                          engagement: 5,
                          practical: 4
                        }
                      },
                      {
                        id: 3,
                        speaker: "Dr. Will Martin",
                        reviewer: "Dr. Jennifer Adams",
                        date: "2025-01-22",
                        rating: 4.6,
                        content: "Great insights into team-based workflows. The collaborative approach he teaches has improved our case outcomes significantly.",
                        categories: {
                          expertise: 5,
                          delivery: 4,
                          engagement: 4,
                          practical: 5
                        }
                      }
                    ].map((review) => (
                      <div key={review.id} className="p-6 border rounded-lg bg-yellow-50 border-yellow-200">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-semibold text-lg">{review.speaker}</h4>
                            <p className="text-sm text-gray-600">Reviewed by: {review.reviewer}</p>
                            <p className="text-sm text-gray-500">{review.date}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="font-bold">{review.rating}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-gray-700 italic">"{review.content}"</p>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                          <div>
                            <span className="font-medium">Expertise:</span> {review.categories.expertise}/5
                          </div>
                          <div>
                            <span className="font-medium">Delivery:</span> {review.categories.delivery}/5
                          </div>
                          <div>
                            <span className="font-medium">Engagement:</span> {review.categories.engagement}/5
                          </div>
                          <div>
                            <span className="font-medium">Practical Value:</span> {review.categories.practical}/5
                          </div>
                        </div>
                        
                        <div className="flex space-x-3 pt-4 border-t">
                          <Button 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => {/* Handle approve */}}
                          >
                            ✓ Approve
                          </Button>
                          <Button 
                            variant="outline" 
                            className="border-yellow-600 text-yellow-700 hover:bg-yellow-50"
                            onClick={() => {/* Handle tentative */}}
                          >
                            ⚠ Tentative
                          </Button>
                          <Button 
                            variant="outline" 
                            className="border-red-600 text-red-700 hover:bg-red-50"
                            onClick={() => {/* Handle reject */}}
                          >
                            ✗ Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Recently Processed Reviews */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Recently Processed Reviews</h3>
                    <div className="text-sm text-gray-500">
                      No reviews have been processed yet. Approved reviews will appear on speaker profiles and affect rankings.
                    </div>
                  </div>
                </div>
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
      </div>

      {/* Edit Speaker Dialog */}
      {editingSpeaker && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Speaker Profile</DialogTitle>
              <DialogDescription>
                Update speaker information and profile details
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input 
                    id="name"
                    value={editingSpeaker.name || ''} 
                    onChange={(e) => setEditingSpeaker({...editingSpeaker, name: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input 
                    id="title"
                    value={editingSpeaker.title || ''} 
                    onChange={(e) => setEditingSpeaker({...editingSpeaker, title: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Biography</Label>
                  <Textarea 
                    id="bio"
                    rows={4}
                    value={editingSpeaker.bio || ''} 
                    onChange={(e) => setEditingSpeaker({...editingSpeaker, bio: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input 
                    id="location"
                    value={editingSpeaker.location || ''} 
                    onChange={(e) => setEditingSpeaker({...editingSpeaker, location: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Categories (select multiple)</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-3 border rounded-md">
                    {categoriesArray.map((category: any) => (
                      <div key={category.name} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`category-${category.name}`}
                          checked={editingSpeaker.category?.includes(category.name) || false}
                          onChange={(e) => {
                            const currentCategories = editingSpeaker.category ? editingSpeaker.category.split(', ') : [];
                            let newCategories;
                            if (e.target.checked) {
                              newCategories = [...currentCategories, category.name];
                            } else {
                              newCategories = currentCategories.filter(cat => cat !== category.name);
                            }
                            setEditingSpeaker({
                              ...editingSpeaker,
                              category: newCategories.join(', ')
                            });
                          }}
                          className="rounded"
                        />
                        <label htmlFor={`category-${category.name}`} className="text-sm cursor-pointer">
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Speaker Types (select multiple)</Label>
                  <div className="grid grid-cols-2 gap-2 p-3 border rounded-md">
                    {speakerTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`type-${type}`}
                          checked={editingSpeaker.speakerType?.includes(type) || false}
                          onChange={(e) => {
                            const currentTypes = editingSpeaker.speakerType ? editingSpeaker.speakerType.split(', ') : [];
                            let newTypes;
                            if (e.target.checked) {
                              newTypes = [...currentTypes, type];
                            } else {
                              newTypes = currentTypes.filter(t => t !== type);
                            }
                            setEditingSpeaker({
                              ...editingSpeaker,
                              speakerType: newTypes.join(', ')
                            });
                          }}
                          className="rounded"
                        />
                        <label htmlFor={`type-${type}`} className="text-sm cursor-pointer">
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="fee">Speaking Fee</Label>
                  <Input 
                    id="fee"
                    placeholder="e.g., $5,000 - $10,000"
                    value={editingSpeaker.fee || ''} 
                    onChange={(e) => setEditingSpeaker({...editingSpeaker, fee: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="experience">Experience (Years)</Label>
                  <Input 
                    id="experience"
                    type="number"
                    placeholder="e.g., 15"
                    value={editingSpeaker.experience || ''} 
                    onChange={(e) => setEditingSpeaker({...editingSpeaker, experience: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div>
                  <Label htmlFor="topics">Speaking Topics (comma-separated)</Label>
                  <Textarea 
                    id="topics"
                    rows={3}
                    placeholder="Full Arch Rehabilitation, Digital Workflows, Team Management"
                    value={editingSpeaker.lectures ? editingSpeaker.lectures.join(', ') : ''} 
                    onChange={(e) => setEditingSpeaker({
                      ...editingSpeaker, 
                      lectures: e.target.value.split(',').map(item => item.trim()).filter(item => item)
                    })}
                  />
                </div>
              </div>

              {/* Contact & Media */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact & Media</h3>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={editingSpeaker.email || ''} 
                    onChange={(e) => setEditingSpeaker({...editingSpeaker, email: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone"
                    value={editingSpeaker.phone || ''} 
                    onChange={(e) => setEditingSpeaker({...editingSpeaker, phone: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input 
                    id="website"
                    placeholder="https://"
                    value={editingSpeaker.website || ''} 
                    onChange={(e) => setEditingSpeaker({...editingSpeaker, website: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="imageUrl">Profile Image URL</Label>
                  <Input 
                    id="imageUrl"
                    placeholder="https://"
                    value={editingSpeaker.imageUrl || ''} 
                    onChange={(e) => setEditingSpeaker({...editingSpeaker, imageUrl: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="instagramHandle">Instagram Handle</Label>
                  <Input 
                    id="instagramHandle"
                    placeholder="@username"
                    value={editingSpeaker.instagramHandle || ''} 
                    onChange={(e) => setEditingSpeaker({...editingSpeaker, instagramHandle: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="facebookHandle">Facebook Handle</Label>
                  <Input 
                    id="facebookHandle"
                    placeholder="@username or profile URL"
                    value={editingSpeaker.facebookHandle || ''} 
                    onChange={(e) => setEditingSpeaker({...editingSpeaker, facebookHandle: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="xHandle">X (Twitter) Handle</Label>
                  <Input 
                    id="xHandle"
                    placeholder="@username"
                    value={editingSpeaker.xHandle || ''} 
                    onChange={(e) => setEditingSpeaker({...editingSpeaker, xHandle: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="linkedinHandle">LinkedIn Profile</Label>
                  <Input 
                    id="linkedinHandle"
                    placeholder="linkedin.com/in/username or full URL"
                    value={editingSpeaker.linkedinHandle || ''} 
                    onChange={(e) => setEditingSpeaker({...editingSpeaker, linkedinHandle: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="expertise">Expertise (comma-separated)</Label>
                  <Textarea 
                    id="expertise"
                    rows={3}
                    placeholder="Digital Workflows, Guided Surgery, CAD/CAM"
                    value={editingSpeaker.expertise ? editingSpeaker.expertise.join(', ') : ''} 
                    onChange={(e) => setEditingSpeaker({
                      ...editingSpeaker, 
                      expertise: e.target.value.split(',').map(item => item.trim())
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="languages">Languages (comma-separated)</Label>
                  <Input 
                    id="languages"
                    placeholder="English, Spanish, German"
                    value={editingSpeaker.languages ? editingSpeaker.languages.join(', ') : ''} 
                    onChange={(e) => setEditingSpeaker({
                      ...editingSpeaker, 
                      languages: e.target.value.split(',').map(item => item.trim()).filter(item => item)
                    })}
                  />
                </div>

                {/* Experience Section */}
                <div className="pt-4 border-t">
                  <h4 className="text-md font-semibold mb-3">Professional Experience</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="education">Education & Credentials</Label>
                      <Textarea 
                        id="education"
                        rows={2}
                        placeholder="DDS, University of California San Francisco; Prosthodontic Residency, UCLA"
                        value={editingSpeaker.education || ''} 
                        onChange={(e) => setEditingSpeaker({...editingSpeaker, education: e.target.value})}
                      />
                    </div>

                    <div>
                      <Label htmlFor="certifications">Certifications & Awards</Label>
                      <Textarea 
                        id="certifications"
                        rows={2}
                        placeholder="Board Certified Prosthodontist; Fellow, American College of Prosthodontists"
                        value={editingSpeaker.certifications || ''} 
                        onChange={(e) => setEditingSpeaker({...editingSpeaker, certifications: e.target.value})}
                      />
                    </div>

                    <div>
                      <Label htmlFor="affiliations">Professional Affiliations</Label>
                      <Textarea 
                        id="affiliations"
                        rows={2}
                        placeholder="American Dental Association; International Congress of Oral Implantologists"
                        value={editingSpeaker.affiliations || ''} 
                        onChange={(e) => setEditingSpeaker({...editingSpeaker, affiliations: e.target.value})}
                      />
                    </div>

                    <div>
                      <Label htmlFor="publications">Publications & Research</Label>
                      <Textarea 
                        id="publications"
                        rows={2}
                        placeholder="Author of 50+ peer-reviewed articles; Contributing editor, Journal of Prosthodontics"
                        value={editingSpeaker.publications || ''} 
                        onChange={(e) => setEditingSpeaker({...editingSpeaker, publications: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Visibility Controls Section */}
                <div className="pt-4 border-t">
                  <h4 className="text-md font-semibold mb-3">Visibility Settings</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="hideProfile"
                        checked={editingSpeaker.hideProfile || false}
                        onChange={(e) => setEditingSpeaker({...editingSpeaker, hideProfile: e.target.checked})}
                        className="rounded"
                      />
                      <label htmlFor="hideProfile" className="text-sm">Hide entire profile from public view</label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="hideRatings"
                        checked={editingSpeaker.hideRatings || false}
                        onChange={(e) => setEditingSpeaker({...editingSpeaker, hideRatings: e.target.checked})}
                        className="rounded"
                      />
                      <label htmlFor="hideRatings" className="text-sm">Hide ratings and reviews</label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="hideSocial"
                        checked={editingSpeaker.hideSocial || false}
                        onChange={(e) => setEditingSpeaker({...editingSpeaker, hideSocial: e.target.checked})}
                        className="rounded"
                      />
                      <label htmlFor="hideSocial" className="text-sm">Hide social media links</label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="hideContact"
                        checked={editingSpeaker.hideContact || false}
                        onChange={(e) => setEditingSpeaker({...editingSpeaker, hideContact: e.target.checked})}
                        className="rounded"
                      />
                      <label htmlFor="hideContact" className="text-sm">Hide contact information</label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={editingSpeaker.verified || false}
                        onCheckedChange={(checked) => setEditingSpeaker({...editingSpeaker, verified: checked})}
                      />
                      <Label>Verified</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={editingSpeaker.featured || false}
                        onCheckedChange={(checked) => setEditingSpeaker({...editingSpeaker, featured: checked})}
                      />
                      <Label>Featured</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t mt-6">
              <Button 
                variant="destructive" 
                onClick={handleDeleteClick}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Profile
              </Button>
              
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveSpeaker}
                  disabled={updateSpeakerMutation.isPending}
                >
                  {updateSpeakerMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Confirm Delete
            </DialogTitle>
            <DialogDescription>
              This will permanently delete {editingSpeaker?.name}'s profile. The profile will be moved to recently deleted for 14 days before permanent removal.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> This action cannot be undone. Please enter your admin password to confirm.
              </AlertDescription>
            </Alert>
            
            <div>
              <Label htmlFor="deletePassword">Admin Password *</Label>
              <Input 
                id="deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleDeleteConfirm()}
              />
              {deleteError && (
                <p className="text-sm text-red-600 mt-1">{deleteError}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deleteSpeakerMutation.isPending}
            >
              {deleteSpeakerMutation.isPending ? "Deleting..." : "Delete Profile"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Edit Dialog */}
      <Dialog open={isCategoryEditDialogOpen} onOpenChange={setIsCategoryEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Category: {editingCategory?.name}</DialogTitle>
            <DialogDescription>
              Select which speakers should be assigned to the "{editingCategory?.name}" category
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-1">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">{editingCategory?.name}</h4>
                  <p className="text-sm text-gray-600">{editingCategory?.description}</p>
                </div>
                <Badge variant="outline">
                  {Object.values(categoryAssignments).filter(Boolean).length} speakers assigned
                </Badge>
              </div>
              
              {/* Search Box */}
              <div className="border-b pb-4">
                <Label className="text-sm font-medium">Search Speakers</Label>
                <Input
                  type="text"
                  placeholder="Type speaker name to search..."
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-gray-700">
                    {categorySearchQuery ? `Search Results (${filteredCategorySpeakers.length})` : `All Speakers (${speakersArray.length})`}:
                  </h4>
                  {categorySearchQuery && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setCategorySearchQuery("")}
                      className="text-xs"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
                
                {filteredCategorySpeakers.length > 0 ? (
                  filteredCategorySpeakers.map((speaker: any) => (
                  <div key={speaker.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={speaker.imageUrl} 
                        alt={speaker.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium">{speaker.name}</p>
                        <p className="text-sm text-gray-600">{speaker.title}</p>
                        {speaker.category && speaker.category !== editingCategory?.name && (
                          <p className="text-xs text-gray-500">Currently in: {speaker.category}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`speaker-${speaker.id}`}
                        checked={categoryAssignments[speaker.id] || false}
                        onChange={(e) => {
                          setCategoryAssignments({
                            ...categoryAssignments,
                            [speaker.id]: e.target.checked
                          });
                        }}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor={`speaker-${speaker.id}`} className="text-sm cursor-pointer">
                        Assign to {editingCategory?.name}
                      </Label>
                    </div>
                  </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No speakers found matching "{categorySearchQuery}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setIsCategoryEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCategoryAssignments}
              disabled={updateCategoryAssignmentMutation.isPending}
            >
              {updateCategoryAssignmentMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}