import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import SpeakerVideoPortfolio from "@/components/speaker-video-portfolio";
import { apiRequest } from "@/lib/queryClient";
import { 
  Star, 
  MapPin, 
  Globe, 
  Phone, 
  Mail, 
  Calendar, 
  CheckCircle, 
  Award,
  User,
  Building,
  MessageSquare,
  Heart,
  Share2,
  AlertCircle
} from "lucide-react";
import { FaInstagram, FaFacebook, FaLinkedin } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import type { Speaker, Review } from "@shared/schema";

const inquirySchema = z.object({
  clientName: z.string().min(1, "Name is required"),
  clientEmail: z.string().email("Valid email is required"),
  clientCompany: z.string().min(1, "Company is required"),
  eventType: z.string().min(1, "Event type is required"),
  eventDate: z.string().min(1, "Event date is required"),
  eventLocation: z.string().min(1, "Event location is required"),
  budget: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

const reviewSchema = z.object({
  reviewerName: z.string().min(1, "Name is required"),
  reviewerTitle: z.string().min(1, "Title is required"),
  reviewerCompany: z.string().min(1, "Company is required"),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, "Comment must be at least 10 characters"),
  eventType: z.string().min(1, "Event type is required"),
  eventDate: z.string().min(1, "Event date is required"),
});

export default function SpeakerProfile() {
  const { name } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const { data: speaker, isLoading: speakerLoading, error: speakerError } = useQuery<Speaker>({
    queryKey: ["/api/speakers", name],
    queryFn: async () => {
      const response = await fetch(`/api/speakers/${name}`);
      if (!response.ok) throw new Error("Failed to fetch speaker");
      return response.json();
    },
    enabled: !!name,
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: ["/api/speakers", name, "reviews"],
    queryFn: async () => {
      const response = await fetch(`/api/speakers/${name}/reviews`);
      if (!response.ok) throw new Error("Failed to fetch reviews");
      return response.json();
    },
    enabled: !!name,
  });

  const inquiryForm = useForm<z.infer<typeof inquirySchema>>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      clientCompany: "",
      eventType: "",
      eventDate: "",
      eventLocation: "",
      budget: "",
      message: "",
    },
  });

  const reviewForm = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      reviewerName: "",
      reviewerTitle: "",
      reviewerCompany: "",
      rating: 5,
      comment: "",
      eventType: "",
      eventDate: "",
    },
  });

  const inquiryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof inquirySchema>) => {
      if (!speaker) throw new Error("Speaker not found");
      const response = await apiRequest("POST", `/api/speakers/${speaker.id}/inquiries`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Inquiry Sent",
        description: "Your inquiry has been sent to the speaker. They will respond within 24 hours.",
      });
      setIsInquiryOpen(false);
      inquiryForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send inquiry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: z.infer<typeof reviewSchema>) => {
      if (!speaker) throw new Error("Speaker not found");
      const response = await apiRequest("POST", `/api/speakers/${speaker.id}/reviews`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review Submitted",
        description: "Your review has been submitted successfully.",
      });
      setIsReviewOpen(false);
      reviewForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/speakers", name, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/speakers", name] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (speakerLoading) {
    return (
      <div className="min-h-screen bg-neutral">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (speakerError || !speaker) {
    return (
      <div className="min-h-screen bg-neutral">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Speaker not found or failed to load. Please try again.
            </AlertDescription>
          </Alert>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Speaker Header */}
            <Card className="mb-8">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-6">
                  <img 
                    src={speaker.imageUrl} 
                    alt={speaker.name}
                    className={`w-32 h-48 rounded-2xl mx-auto md:mx-0 ${
                      speaker.name === "Dr. Will Martin" 
                        ? "object-cover object-[center_17%]" 
                        : "object-contain"
                    }`}
                  />
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                      <h1 className="text-3xl font-bold text-gray-900">{speaker.name}</h1>
                      <div className="flex items-center gap-2">
                        {speaker.verified && (
                          <Badge variant="default" className="bg-success text-white">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        {speaker.featured && (
                          <Badge variant="default" className="bg-accent text-white">
                            Featured
                          </Badge>
                        )}
                        <Badge variant="outline">{speaker.speakerType}</Badge>
                      </div>
                    </div>
                    
                    <p className="text-xl text-primary font-semibold mb-3">{speaker.title}</p>
                    
                    <div className="flex items-center justify-center md:justify-start gap-6 mb-4">
                      <div className="flex items-center">
                        <div className="flex text-yellow-400 mr-2">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-5 h-5 ${i < Math.floor(parseFloat(speaker.overallRating || "0")) ? "fill-current" : ""}`} 
                            />
                          ))}
                        </div>
                        <span className="font-semibold">{speaker.overallRating}</span>
                        <span className="text-gray-600 ml-1">({speaker.reviewCount} reviews)</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-1" />
                        {speaker.location}
                      </div>
                    </div>

                    <div className="flex items-center justify-center md:justify-start gap-4">
                      <Button size="sm" variant="outline">
                        <Heart className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                      
                      {/* Social Media Icons */}
                      <div className="flex items-center gap-3 ml-4">
                        <a 
                          href={`https://instagram.com/${(speaker as any).instagramHandle || 'devrightspeakers'}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-pink-600 transition-colors"
                        >
                          <FaInstagram className="w-5 h-5" />
                        </a>
                        <a 
                          href="https://facebook.com/devrightspeakers" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <FaFacebook className="w-5 h-5" />
                        </a>
                        <a 
                          href="https://x.com/devrightspeakers" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-black transition-colors"
                        >
                          <FaXTwitter className="w-5 h-5" />
                        </a>
                        <a 
                          href="https://linkedin.com/company/devrightspeakers" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-blue-700 transition-colors"
                        >
                          <FaLinkedin className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="topics">Topics</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>About {speaker.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-gray-700 leading-relaxed">{speaker.bio}</p>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Key Achievements</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {speaker.achievements?.map((achievement, index) => (
                          <div key={index} className="flex items-center">
                            <Award className="w-5 h-5 text-accent mr-2" />
                            <span>{achievement}</span>
                          </div>
                        )) || []}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Areas of Expertise</h3>
                      <div className="flex flex-wrap gap-2">
                        {speaker.expertise?.map((skill, index) => (
                          <Badge key={index} variant="secondary">{skill}</Badge>
                        )) || []}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Languages</h3>
                      <div className="flex flex-wrap gap-2">
                        {speaker.languages?.map((language, index) => (
                          <Badge key={index} variant="outline">{language}</Badge>
                        )) || []}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="topics">
                <Card>
                  <CardHeader>
                    <CardTitle>Speaking Topics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {speaker.expertise?.map((topic: string, index: number) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-2">{topic}</h4>
                          <p className="text-gray-600 text-sm">Expert-level presentation on {topic.toLowerCase()}</p>
                        </div>
                      )) || []}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Reviews</h2>
                    <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                      <DialogTrigger asChild>
                        <Button>Leave a Review</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Leave a Review for {speaker.name}</DialogTitle>
                        </DialogHeader>
                        <Form {...reviewForm}>
                          <form onSubmit={reviewForm.handleSubmit((data) => reviewMutation.mutate(data))} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={reviewForm.control}
                                name="reviewerName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Your Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={reviewForm.control}
                                name="reviewerTitle"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Your Title</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={reviewForm.control}
                                name="reviewerCompany"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Company</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={reviewForm.control}
                                name="rating"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Rating</FormLabel>
                                    <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select rating" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="5">5 Stars - Excellent</SelectItem>
                                        <SelectItem value="4">4 Stars - Very Good</SelectItem>
                                        <SelectItem value="3">3 Stars - Good</SelectItem>
                                        <SelectItem value="2">2 Stars - Fair</SelectItem>
                                        <SelectItem value="1">1 Star - Poor</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={reviewForm.control}
                                name="eventType"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Event Type</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="e.g., Corporate Conference" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={reviewForm.control}
                                name="eventDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Event Date</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="date" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={reviewForm.control}
                              name="comment"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Review</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} rows={4} placeholder="Share your experience..." />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex justify-end space-x-2">
                              <Button type="button" variant="outline" onClick={() => setIsReviewOpen(false)}>
                                Cancel
                              </Button>
                              <Button type="submit" disabled={reviewMutation.isPending}>
                                {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {reviewsLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {reviews?.map((review) => (
                        <Card key={review.id}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="w-6 h-6 text-gray-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold">{review.reviewerName}</h4>
                                  <p className="text-gray-600 text-sm">{review.reviewerTitle}, {review.reviewerCompany}</p>
                                  <p className="text-gray-500 text-xs">{review.eventType} • {review.eventDate}</p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <div className="flex text-yellow-400 mr-2">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < review.overallRating ? "fill-current" : ""}`} />
                                  ))}
                                </div>
                                {review.verified && (
                                  <Badge variant="default" className="bg-success text-white text-xs">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-gray-700">{review.comment}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="media">
                <Card>
                  <CardHeader>
                    <CardTitle>Video Portfolio & Speaker Demos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SpeakerVideoPortfolio speakerId={speaker.id} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Book This Speaker</span>
                  <span className="text-2xl font-bold text-primary">
                    {(speaker as any).fee ? `$${parseFloat((speaker as any).fee).toLocaleString()}+` : "Contact for pricing"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Availability:</span>
                  <Badge variant={speaker.availability === "available" ? "default" : "secondary"}>
                    {speaker.availability}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Travel:</span>
                  <span className="capitalize">{speaker.travelWillingness}</span>
                </div>

                <Dialog open={isInquiryOpen} onOpenChange={setIsInquiryOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-accent hover:bg-orange-600">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send Inquiry
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Send Inquiry to {speaker.name}</DialogTitle>
                    </DialogHeader>
                    <Form {...inquiryForm}>
                      <form onSubmit={inquiryForm.handleSubmit((data) => inquiryMutation.mutate(data))} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={inquiryForm.control}
                            name="clientName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Your Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={inquiryForm.control}
                            name="clientEmail"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input {...field} type="email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={inquiryForm.control}
                          name="clientCompany"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={inquiryForm.control}
                            name="eventType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Event Type</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., Corporate Conference" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={inquiryForm.control}
                            name="eventDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Event Date</FormLabel>
                                <FormControl>
                                  <Input {...field} type="date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={inquiryForm.control}
                            name="eventLocation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Event Location</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="City, State" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={inquiryForm.control}
                            name="budget"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Budget (Optional)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="$10,000" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={inquiryForm.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Message</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={4} placeholder="Tell us about your event..." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsInquiryOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={inquiryMutation.isPending}>
                            {inquiryMutation.isPending ? "Sending..." : "Send Inquiry"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-3 text-gray-500" />
                  <span className="text-sm">{speaker.email}</span>
                </div>
                {speaker.phone && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-3 text-gray-500" />
                    <span className="text-sm">{speaker.phone}</span>
                  </div>
                )}
                {speaker.website && (
                  <div className="flex items-center">
                    <Globe className="w-4 h-4 mr-3 text-gray-500" />
                    <a href={speaker.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      Website
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Speaker Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Reviews:</span>
                  <span className="font-semibold">{speaker.reviewCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Rating:</span>
                  <span className="font-semibold">{speaker.overallRating}/5.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Response Time:</span>
                  <span className="font-semibold">Within 24 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-semibold">{speaker.category}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
