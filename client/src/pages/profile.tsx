import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Home
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [isEditingProfile, setIsEditingProfile] = useState(false);

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

  // Fetch user favorites
  const { data: favorites, isLoading: favoritesLoading } = useQuery<any[]>({
    queryKey: ['/api/users/favorites', user?.id],
    queryFn: async () => {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`/api/users/favorites/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch favorites');
      return response.json();
    },
    enabled: !!user?.id,
  });

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
                    ) : favorites && favorites.length > 0 ? (
                      <div className="space-y-4">
                        {/* Favorites list will be implemented here */}
                        <p className="text-gray-600">Your favorite speakers will appear here.</p>
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
                    <div className="space-y-4">
                      <p className="text-gray-600">Account settings and preferences will be available here.</p>
                      <div className="pt-4 border-t">
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