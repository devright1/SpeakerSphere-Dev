import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Heart, 
  MessageSquare, 
  Mail, 
  Calendar,
  TrendingUp,
  Settings,
  Camera,
  Edit3,
  ArrowLeft,
  Home,
  UserPlus,
  Lock,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  title?: string;
  company?: string;
  profileImageUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface UserStats {
  favoritesCount: number;
  reviewsCount: number;
  inquiriesCount: number;
  totalProfileViews: number;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Get user data from localStorage (this would typically come from a global auth context)
  const getUserData = (): UserProfile | null => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  };

  const user = getUserData();

  // Fetch user activity stats
  const { data: userStats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ['/api/users/stats', user?.id],
    queryFn: async () => {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`/api/users/stats/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch user bookmarks (favorite speaker IDs)
  const { data: favoriteIds = [], isLoading: favoritesLoading } = useQuery<number[]>({
    queryKey: [`/api/users/${user?.id}/bookmarks`],
    queryFn: async () => {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`/api/users/${user?.id}/bookmarks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch favorites');
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch all speakers and filter favorites
  const { data: allSpeakers = [] } = useQuery<any[]>({
    queryKey: ['/api/speakers'],
  });

  // Filter favorite speakers
  const favoriteSpeakers = allSpeakers.filter((speaker: any) => 
    favoriteIds.includes(speaker.id)
  );

  // Fetch user reviews
  const { data: userReviews, isLoading: reviewsLoading } = useQuery<any[]>({
    queryKey: ['/api/users/reviews', user?.id],
    queryFn: async () => {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`/api/users/reviews/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error("New passwords don't match");
      }
      
      if (passwordData.newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }
      
      const token = localStorage.getItem('userToken');
      const user = getUserData(); // Get user data to send user ID
      console.log("Current user data:", user);
      console.log("Token:", token);
      
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
          userId: user?.id // Include user ID for direct lookup
        }),
        credentials: "include" // Important for session cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to change password");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated.",
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Please Sign In</h2>
            <p className="text-gray-600 mb-4">You need to be logged in to view your profile.</p>
            <Button onClick={() => window.location.href = '/auth'}>
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Back to Home Button */}
          <motion.div variants={itemVariants}>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="mb-4 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </motion.div>
          {/* Welcome Section */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-32"></div>
              <CardContent className="relative px-6 pb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16">
                  {/* Profile Picture */}
                  <div className="relative">
                    <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                      <AvatarImage src={user.profileImageUrl} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback className="text-xl font-semibold bg-blue-500 text-white">
                        {getInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-white shadow-sm"
                      onClick={() => toast({ title: "Photo upload coming soon!" })}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                          {user.firstName} {user.lastName}
                        </h1>
                        {user.title && (
                          <p className="text-lg text-gray-600">{user.title}</p>
                        )}
                        {user.company && (
                          <p className="text-sm text-gray-500">{user.company}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        className="self-start sm:self-auto"
                        onClick={() => setIsEditingProfile(true)}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <User className="h-3 w-3 mr-1" />
                        Member since {formatDate(user.createdAt)}
                      </Badge>
                      {user.lastLoginAt && (
                        <Badge variant="outline" className="text-xs">
                          Last active {formatDate(user.lastLoginAt)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Stats */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="transition-all duration-200 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Heart className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {statsLoading ? "..." : userStats?.favoritesCount || 0}
                      </p>
                      <p className="text-sm text-gray-600">Favorites</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="transition-all duration-200 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {statsLoading ? "..." : userStats?.reviewsCount || 0}
                      </p>
                      <p className="text-sm text-gray-600">Reviews</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="transition-all duration-200 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Mail className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {statsLoading ? "..." : userStats?.inquiriesCount || 0}
                      </p>
                      <p className="text-sm text-gray-600">Inquiries</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="transition-all duration-200 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {statsLoading ? "..." : userStats?.totalProfileViews || 0}
                      </p>
                      <p className="text-sm text-gray-600">Profile Views</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* Profile Tabs */}
          <motion.div variants={itemVariants}>
            <Tabs defaultValue="favorites" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="favorites">My Favorites</TabsTrigger>
                <TabsTrigger value="reviews">My Reviews</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="favorites">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      Favorite Speakers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {favoritesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : favoriteSpeakers && favoriteSpeakers.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {favoriteSpeakers.map((speaker: any) => (
                          <div key={speaker.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3">
                              {speaker.imageUrl ? (
                                <img 
                                  src={speaker.imageUrl} 
                                  alt={speaker.name}
                                  className="w-16 h-16 rounded-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const fallback = target.nextSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center" style={{display: speaker.imageUrl ? 'none' : 'flex'}}>
                                <UserPlus className="w-8 h-8 text-gray-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 truncate">{speaker.name}</h4>
                                <p className="text-sm text-blue-600 truncate">{speaker.title}</p>
                                <p className="text-xs text-gray-500 mt-1">{speaker.location}</p>
                                <div className="flex items-center mt-2 gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => window.location.href = `/speakers/${speaker.slug}`}
                                  >
                                    View Profile
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
                        <p className="text-gray-600 mb-4">
                          Start exploring speakers and save your favorites to see them here.
                        </p>
                        <Button onClick={() => window.location.href = '/speakers'}>
                          Browse Speakers
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-blue-500" />
                      My Reviews
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reviewsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : userReviews && userReviews.length > 0 ? (
                      <div className="space-y-4">
                        {/* Reviews list will be implemented here */}
                        <p className="text-gray-600">Your reviews will appear here.</p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
                        <p className="text-gray-600 mb-4">
                          Share your experience with speakers you've worked with.
                        </p>
                        <Button onClick={() => window.location.href = '/speakers'}>
                          Find Speakers to Review
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-gray-500" />
                      Account Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Password Change Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Lock className="h-4 w-4 text-gray-500" />
                          <h3 className="font-medium text-gray-900">Change Password</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4 max-w-md">
                          <div>
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                              id="currentPassword"
                              type="password"
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({
                                ...passwordData,
                                currentPassword: e.target.value
                              })}
                              placeholder="Enter your current password"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({
                                ...passwordData,
                                newPassword: e.target.value
                              })}
                              placeholder="Enter your new password"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              Password must be at least 6 characters long
                            </p>
                          </div>
                          
                          <div>
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({
                                ...passwordData,
                                confirmPassword: e.target.value
                              })}
                              placeholder="Confirm your new password"
                            />
                          </div>
                          
                          <Button
                            onClick={() => changePasswordMutation.mutate()}
                            disabled={
                              !passwordData.currentPassword || 
                              !passwordData.newPassword || 
                              !passwordData.confirmPassword ||
                              changePasswordMutation.isPending
                            }
                            className="w-full mt-2"
                          >
                            {changePasswordMutation.isPending ? "Changing Password..." : "Change Password"}
                          </Button>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Account Deletion Section */}
                      <div className="pt-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Shield className="h-4 w-4 text-red-500" />
                          <h3 className="font-medium text-red-900">Danger Zone</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}