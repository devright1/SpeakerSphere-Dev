import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MessageSquare, Star, TrendingUp, LogOut, Settings, BarChart3, FolderOpen, MousePointer, Eye, ExternalLink, Mail, Phone, Globe } from "lucide-react";
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
                  Monitor and moderate speaker reviews and ratings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Review management features coming soon</p>
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