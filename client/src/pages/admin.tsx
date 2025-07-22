import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MessageSquare, Star, TrendingUp, LogOut, Settings, BarChart3, FolderOpen, MousePointer, Eye, EyeOff, ExternalLink, Mail, Phone, Globe, Share2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [adminEmail, setAdminEmail] = useState("");

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
    setLocation("/");
  };

  const speakersArray = Array.isArray(speakers) ? speakers : [];
  const categoriesArray = Array.isArray(categories) ? categories : [];
  
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
        <Tabs defaultValue="speakers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="speakers">Speakers</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
                      <div className="text-sm text-gray-600">
                        Manage visibility settings for each speaker
                      </div>
                    </div>
                    
                    <div className="grid gap-4">
                      {speakersArray.map((speaker: any) => (
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
                                  className="p-2 rounded-lg border hover:bg-red-50 hover:border-red-200 transition-colors"
                                  title="Hide entire speaker listing"
                                >
                                  <EyeOff className="h-4 w-4 text-red-600" />
                                </button>
                                <span className="text-xs text-gray-500 mt-1">Hide Profile</span>
                              </div>

                              {/* Hide Ratings */}
                              <div className="flex flex-col items-center group">
                                <button 
                                  className="p-2 rounded-lg border hover:bg-yellow-50 hover:border-yellow-200 transition-colors"
                                  title="Hide ratings and reviews"
                                >
                                  <Star className="h-4 w-4 text-yellow-600" />
                                </button>
                                <span className="text-xs text-gray-500 mt-1">Hide Ratings</span>
                              </div>

                              {/* Hide Social Icons */}
                              <div className="flex flex-col items-center group">
                                <button 
                                  className="p-2 rounded-lg border hover:bg-blue-50 hover:border-blue-200 transition-colors"
                                  title="Hide social media icons"
                                >
                                  <Share2 className="h-4 w-4 text-blue-600" />
                                </button>
                                <span className="text-xs text-gray-500 mt-1">Hide Social</span>
                              </div>

                              {/* Hide Contact Details */}
                              <div className="flex flex-col items-center group">
                                <button 
                                  className="p-2 rounded-lg border hover:bg-purple-50 hover:border-purple-200 transition-colors"
                                  title="Hide contact information"
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
                                <Button variant="outline" size="sm">Edit</Button>
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
                      ))}
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
                          <Button variant="outline" size="sm">Edit</Button>
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
            <div className="grid gap-6">
              {/* Overall Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle>Click Analytics Overview</CardTitle>
                  <CardDescription>
                    Track all clickable interactions across The Speaker Sphere
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Eye className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">Profile Views</span>
                      </div>
                      <div className="text-2xl font-bold">0</div>
                      <div className="text-sm text-gray-500">Total speaker profile views (since today)</div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <MousePointer className="h-5 w-5 text-green-500" />
                        <span className="font-medium">Contact Clicks</span>
                      </div>
                      <div className="text-2xl font-bold">0</div>
                      <div className="text-sm text-gray-500">Email, phone, website clicks (since today)</div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <ExternalLink className="h-5 w-5 text-purple-500" />
                        <span className="font-medium">External Links</span>
                      </div>
                      <div className="text-2xl font-bold">0</div>
                      <div className="text-sm text-gray-500">Social media, website visits (since today)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Speaker-Specific Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle>Speaker Performance Analytics</CardTitle>
                  <CardDescription>
                    Detailed click tracking for each speaker's profile interactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-gray-700 mb-4">Speaker Analytics (tracking starts today - {new Date().toLocaleDateString()})</div>
                    
                    {speakersArray.slice(0, 8).map((speaker: any, index: number) => {
                      // Analytics data reset to 0 for today's base point
                      const analytics = {
                        profileViews: 0,
                        emailClicks: 0,
                        phoneClicks: 0,
                        websiteClicks: 0,
                        socialClicks: 0,
                        inquiryClicks: 0
                      };
                      
                      const totalClicks = analytics.emailClicks + analytics.phoneClicks + 
                                        analytics.websiteClicks + analytics.socialClicks + 
                                        analytics.inquiryClicks;
                      
                      return (
                        <div key={speaker.slug} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <img 
                                src={speaker.imageUrl} 
                                alt={speaker.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <div>
                                <h4 className="font-medium">{speaker.name}</h4>
                                <p className="text-sm text-gray-600">{speaker.category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">{totalClicks}</div>
                              <div className="text-sm text-gray-500">total clicks</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
                            <div className="flex items-center space-x-1">
                              <Eye className="h-4 w-4 text-blue-500" />
                              <span>{analytics.profileViews} views</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Mail className="h-4 w-4 text-green-500" />
                              <span>{analytics.emailClicks} emails</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Phone className="h-4 w-4 text-orange-500" />
                              <span>{analytics.phoneClicks} calls</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Globe className="h-4 w-4 text-purple-500" />
                              <span>{analytics.websiteClicks} website</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <ExternalLink className="h-4 w-4 text-pink-500" />
                              <span>{analytics.socialClicks} social</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageSquare className="h-4 w-4 text-teal-500" />
                              <span>{analytics.inquiryClicks} inquiries</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Link Performance Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Link Type Performance</CardTitle>
                  <CardDescription>
                    Breakdown of click performance by link type across all speakers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { icon: Mail, label: "Email Links", clicks: 0, color: "text-green-500" },
                      { icon: Phone, label: "Phone Links", clicks: 0, color: "text-orange-500" },
                      { icon: Globe, label: "Website Links", clicks: 0, color: "text-purple-500" },
                      { icon: ExternalLink, label: "Social Media", clicks: 0, color: "text-pink-500" },
                      { icon: MessageSquare, label: "Inquiry Forms", clicks: 0, color: "text-teal-500" },
                      { icon: Eye, label: "Video Views", clicks: 0, color: "text-blue-500" }
                    ].map((item, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <item.icon className={`h-5 w-5 ${item.color}`} />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <div className="text-2xl font-bold">{item.clicks.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">Total clicks (since today)</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
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
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Settings panel coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}