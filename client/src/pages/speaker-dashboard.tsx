import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  ExternalLink
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({userReviews?.length || 0})</TabsTrigger>
            <TabsTrigger value="stats">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
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

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your profile visibility and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Profile Visibility</div>
                      <div className="text-sm text-gray-600">Control who can see your profile</div>
                    </div>
                    <Badge variant={speakerProfile.hideProfile ? "destructive" : "default"}>
                      {speakerProfile.hideProfile ? "Hidden" : "Visible"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Contact Information</div>
                      <div className="text-sm text-gray-600">Show contact details on profile</div>
                    </div>
                    <Badge variant={speakerProfile.hideContact ? "destructive" : "default"}>
                      {speakerProfile.hideContact ? "Hidden" : "Visible"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Ratings & Reviews</div>
                      <div className="text-sm text-gray-600">Display ratings and reviews</div>
                    </div>
                    <Badge variant={speakerProfile.hideRatings ? "destructive" : "default"}>
                      {speakerProfile.hideRatings ? "Hidden" : "Visible"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}