import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
// import { useAuth } from "@/providers/AuthProvider";
import { 
  User, 
  Edit3, 
  Save, 
  Eye, 
  Star, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
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
  EyeOff
} from "lucide-react";

export default function SpeakerDashboard() {
  // const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

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

  // Fetch user stats and reviews
  const { data: userStats } = useQuery({
    queryKey: ['/api/users/stats', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/users/stats/${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch user stats');
      return response.json();
    },
    enabled: !!user?.id,
  });

  const { data: userReviews } = useQuery({
    queryKey: ['/api/users/reviews', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/users/reviews/${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch user reviews');
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch speaker content
  const { data: speakerContent, refetch: refetchContent } = useQuery({
    queryKey: ['/api/speakers/content', speakerProfile?.id],
    queryFn: async () => {
      const response = await fetch(`/api/speakers/${speakerProfile?.id}/content`);
      if (!response.ok) throw new Error('Failed to fetch speaker content');
      return response.json();
    },
    enabled: !!speakerProfile?.id,
  });

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
      const response = await fetch(`/api/speakers/${speakerProfile?.id}/content`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload content');
      return response.json();
    },
    onSuccess: () => {
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

  // Toggle content visibility
  const toggleContentVisibility = (contentId: number, isPublic: boolean) => {
    updateContentMutation.mutate({ contentId, isPublic });
  };

  useEffect(() => {
    if (speakerProfile && !editForm.name) {
      setEditForm(speakerProfile);
    }
  }, [speakerProfile]);

  const handleSave = () => {
    updateProfileMutation.mutate(editForm);
  };

  const handleCancel = () => {
    setEditForm(speakerProfile);
    setIsEditing(false);
  };

  // File upload handling
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', `${file.name}`);
    formData.append('category', getFileCategory(file.type));
    formData.append('isPublic', 'false');

    uploadContentMutation.mutate(formData);
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
              <Button
                onClick={() => setIsEditing(!isEditing)}
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({userReviews?.length || 0})</TabsTrigger>
            <TabsTrigger value="stats">Analytics</TabsTrigger>
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
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Speaker Profile
                    </CardTitle>
                    <CardDescription>
                      {isEditing ? "Edit your speaker information" : "Your public speaker profile information"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
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
                      <Label htmlFor="bio">Biography</Label>
                      {isEditing ? (
                        <Textarea
                          id="bio"
                          rows={4}
                          value={editForm.bio || ''}
                          onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                          placeholder="Tell people about your experience and expertise..."
                        />
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

                {/* Expertise */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="h-5 w-5 mr-2" />
                      Expertise
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {speakerProfile.expertise?.map((skill: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

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
              </div>
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Reviews</CardTitle>
                <CardDescription>See what people are saying about your speaking</CardDescription>
              </CardHeader>
              <CardContent>
                {userReviews && userReviews.length > 0 ? (
                  <div className="space-y-4">
                    {userReviews.map((review: any) => (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="font-medium">{review.rating}/5</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No reviews yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Eye className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold">{userStats?.profileViews || 0}</div>
                  <div className="text-sm text-gray-600">Profile Views</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Mail className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold">{userStats?.emailClicks || 0}</div>
                  <div className="text-sm text-gray-600">Email Clicks</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Phone className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold">{userStats?.phoneClicks || 0}</div>
                  <div className="text-sm text-gray-600">Phone Clicks</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Globe className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold">{userStats?.websiteClicks || 0}</div>
                  <div className="text-sm text-gray-600">Website Clicks</div>
                </CardContent>
              </Card>
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
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.mov,.mp3,.wav"
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => document.getElementById('pdfUpload')?.click()}>
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

                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => document.getElementById('imageUpload')?.click()}>
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

                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => document.getElementById('videoUpload')?.click()}>
                  <CardContent className="p-6 text-center">
                    <Video className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Videos</h3>
                    <p className="text-sm text-gray-600">Presentations, demos, tutorials</p>
                    <input
                      type="file"
                      id="videoUpload"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".mp4,.mov,.avi"
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => document.getElementById('documentUpload')?.click()}>
                  <CardContent className="p-6 text-center">
                    <FileText className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Documents</h3>
                    <p className="text-sm text-gray-600">Word docs, PowerPoint presentations</p>
                    <input
                      type="file"
                      id="documentUpload"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".doc,.docx,.ppt,.pptx"
                    />
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => document.getElementById('audioUpload')?.click()}>
                  <CardContent className="p-6 text-center">
                    <Music className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Audio</h3>
                    <p className="text-sm text-gray-600">Recordings, podcasts, lectures</p>
                    <input
                      type="file"
                      id="audioUpload"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".mp3,.wav,.m4a"
                    />
                  </CardContent>
                </Card>
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
                  <div className="grid gap-4">
                    {speakerContent.map((content: any) => (
                      <Card key={content.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="p-2 bg-gray-100 rounded-lg">
                                {getFileIcon(content.category)}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{content.originalName}</h4>
                                <p className="text-sm text-gray-600">{content.description}</p>
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                  <span>{formatFileSize(content.fileSize)}</span>
                                  <span>{content.category}</span>
                                  <span>{content.downloadCount} downloads</span>
                                  <span>
                                    {content.isPublic ? (
                                      <Badge variant="outline" className="text-green-600 border-green-600">
                                        Public
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-gray-600 border-gray-600">
                                        Private
                                      </Badge>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleContentVisibility(content.id, !content.isPublic)}
                                disabled={updateContentMutation.isPending}
                                className={content.isPublic ? 
                                  "text-orange-600 border-orange-600 hover:bg-orange-50" : 
                                  "text-green-600 border-green-600 hover:bg-green-50"
                                }
                                title={content.isPublic ? "Make Private" : "Make Public"}
                              >
                                {content.isPublic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/api/content/${content.id}/download`, '_blank')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteContentMutation.mutate(content.id)}
                                disabled={deleteContentMutation.isPending}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
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
            </div>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription">
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Speaker Plan</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Unlock premium features and boost your visibility with our professional speaker subscription plans
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Silver Plan */}
                <Card className="border-gray-200 hover:border-gray-300 transition-colors">
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-gray-100 rounded-full">
                        <Award className="h-8 w-8 text-gray-600" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Silver</CardTitle>
                    <CardDescription className="text-lg">Essential speaker features</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-gray-900">$29</span>
                      <span className="text-gray-600">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Enhanced profile visibility</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Basic analytics dashboard</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Email support</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Professional badge on profile</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Up to 5 videos in portfolio</span>
                      </div>
                    </div>
                    <Button className="w-full bg-gray-600 hover:bg-gray-700">
                      Get Started
                    </Button>
                  </CardContent>
                </Card>

                {/* Gold Plan - Most Popular */}
                <Card className="border-yellow-300 border-2 relative hover:border-yellow-400 transition-colors">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-yellow-500 text-white px-4 py-1 text-sm font-medium">
                      Most Popular
                    </Badge>
                  </div>
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-yellow-100 rounded-full">
                        <Star className="h-8 w-8 text-yellow-600" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Gold</CardTitle>
                    <CardDescription className="text-lg">Professional speaker toolkit</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-gray-900">$59</span>
                      <span className="text-gray-600">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="text-sm font-medium text-yellow-700 mb-2">Everything in Silver, plus:</div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Priority placement in search results</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Advanced analytics & insights</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Direct inquiry management</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Featured speaker badge</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Up to 15 videos in portfolio</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Priority phone & email support</span>
                      </div>
                    </div>
                    <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                      Upgrade to Gold
                    </Button>
                  </CardContent>
                </Card>

                {/* Premium Plan */}
                <Card className="border-purple-300 hover:border-purple-400 transition-colors">
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-purple-100 rounded-full">
                        <Crown className="h-8 w-8 text-purple-600" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Premium</CardTitle>
                    <CardDescription className="text-lg">Elite speaker experience</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-gray-900">$99</span>
                      <span className="text-gray-600">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="text-sm font-medium text-purple-700 mb-2">Everything in Gold, plus:</div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Top-tier placement & homepage featuring</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Comprehensive analytics suite</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Personal account manager</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Premium speaker badge</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">Unlimited videos in portfolio</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">White-glove onboarding</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">24/7 priority support</span>
                      </div>
                    </div>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      Go Premium
                    </Button>
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
    </div>
  );
}