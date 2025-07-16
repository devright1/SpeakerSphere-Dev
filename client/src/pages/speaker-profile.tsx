import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Users, 
  Award, 
  TrendingUp, 
  Heart, 
  Share2, 
  MessageCircle,
  AlertCircle,
  Instagram,
  Linkedin,
  Facebook
} from "lucide-react";
import type { Speaker, Review } from "@shared/schema";

const inquirySchema = z.object({
  clientName: z.string().min(1, "Name is required"),
  clientEmail: z.string().email("Valid email is required"),
  clientCompany: z.string().min(1, "Company is required"),
  eventType: z.string().min(1, "Event type is required"),
  eventDate: z.string().min(1, "Event date is required"),
  eventLocation: z.string().min(1, "Event location is required"),
  expectedAttendees: z.string().min(1, "Expected attendees is required"),
  budget: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

const reviewSchema = z.object({
  reviewerName: z.string().min(1, "Name is required"),
  reviewerTitle: z.string().min(1, "Title is required"),
  reviewerCompany: z.string().min(1, "Company is required"),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, "Written review is required (minimum 10 characters)"),
  eventType: z.string().min(1, "Event type is required"),
  eventDate: z.string().min(1, "Event date is required"),
  photo: z.any().refine((file) => file instanceof File, { message: "Photo from audience is required" }),
});

export default function SpeakerProfile() {
  const { name } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: speaker, isLoading: speakerLoading, error: speakerError } = useQuery<Speaker>({
    queryKey: ["/api/speakers", name],
    queryFn: async () => {
      const response = await fetch(`/api/speakers/${name}`);
      if (!response.ok) {
        throw new Error("Speaker not found");
      }
      return response.json();
    },
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: ["/api/speakers", name, "reviews"],
    queryFn: async () => {
      if (!speaker) return [];
      const response = await fetch(`/api/speakers/${speaker.id}/reviews`);
      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }
      return response.json();
    },
    enabled: !!speaker,
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
      expectedAttendees: "",
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
      photo: undefined,
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
      
      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append('reviewerName', data.reviewerName);
      formData.append('reviewerTitle', data.reviewerTitle);
      formData.append('reviewerCompany', data.reviewerCompany);
      formData.append('rating', data.rating.toString());
      formData.append('comment', data.comment);
      formData.append('eventType', data.eventType);
      formData.append('eventDate', data.eventDate);
      formData.append('photo', data.photo);
      
      const response = await fetch(`/api/speakers/${speaker.id}/reviews`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit review');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review Submitted",
        description: "Your review has been submitted successfully.",
      });
      setIsReviewOpen(false);
      setSelectedFile(null);
      setHoveredRating(0);
      reviewForm.reset({
        reviewerName: "",
        reviewerTitle: "",
        reviewerCompany: "",
        rating: 5,
        comment: "",
        eventType: "",
        eventDate: "",
        photo: undefined,
      });
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
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (speakerError || !speaker) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Speaker not found. Please check the URL and try again.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Speaker Header */}
            <Card className="mb-8">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <div className="flex-shrink-0">
                    <img
                      src={speaker.imageUrl}
                      alt={speaker.name}
                      className={`w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover ${
                        // All speakers use original scaling (100% - no scaling) except special cases
                        speaker.name === "Dr. Larry Brecht" 
                          ? "speaker-image-position-center speaker-image-scale-md bg-white" 
                          : speaker.name === "Marisa Notturno"
                          ? "object-[center_7%] speaker-image-scale-md"
                          : speaker.name === "Dr. Sascha Jovanovic"
                          ? "object-contain bg-gray-100"
                          : "speaker-image-position-center speaker-image-scale-md"
                      }`}
                    />
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
                      <h1 className="text-3xl font-bold text-gray-900">{speaker.name}</h1>
                      <div className="flex flex-wrap justify-center md:justify-start gap-2">
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

                    <div className="mb-4">
                      <Button 
                        onClick={() => setIsReviewOpen(true)}
                        className="bg-primary hover:bg-blue-700 text-white"
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Leave a Review
                      </Button>
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
                        {speaker.instagramHandle && (
                          <a 
                            href={`https://instagram.com/${speaker.instagramHandle}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-pink-600 transition-colors"
                          >
                            <Instagram className="w-5 h-5" />
                          </a>
                        )}
                        {speaker.socialMedia && speaker.socialMedia.find(link => link.includes('linkedin')) && (
                          <a 
                            href={speaker.socialMedia.find(link => link.includes('linkedin'))} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-blue-600 transition-colors"
                          >
                            <Linkedin className="w-5 h-5" />
                          </a>
                        )}
                        {speaker.socialMedia && speaker.socialMedia.find(link => link.includes('facebook')) && (
                          <a 
                            href={speaker.socialMedia.find(link => link.includes('facebook'))} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-blue-700 transition-colors"
                          >
                            <Facebook className="w-5 h-5" />
                          </a>
                        )}
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
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="topics">Topics</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed mb-6">{speaker.bio}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Expertise</h3>
                        <div className="flex flex-wrap gap-2">
                          {speaker.expertise?.map((skill, index) => (
                            <Badge key={index} variant="secondary">{skill}</Badge>
                          )) || []}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Speaking Fee</h3>
                        <p className="text-2xl font-bold text-primary">{speaker.fee || "Contact for pricing"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Video Portfolio */}
                <SpeakerVideoPortfolio speakerId={speaker.id} />
              </TabsContent>

              <TabsContent value="experience">
                <Card>
                  <CardHeader>
                    <CardTitle>Professional Experience</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Achievements</h3>
                      <ul className="space-y-2">
                        {speaker.achievements?.map((achievement, index) => (
                          <li key={index} className="flex items-start">
                            <Award className="w-4 h-4 text-accent mt-1 mr-2 flex-shrink-0" />
                            <span className="text-gray-700">{achievement}</span>
                          </li>
                        )) || []}
                      </ul>
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
                    <Button onClick={() => setIsReviewOpen(true)}>Leave a Review</Button>
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
                              <div>
                                <h4 className="font-semibold">{review.reviewerName}</h4>
                                <p className="text-sm text-gray-600">{review.reviewerTitle} at {review.reviewerCompany}</p>
                              </div>
                              <div className="flex items-center">
                                <div className="flex text-yellow-400 mr-2">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < review.overallRating ? "fill-current" : ""}`} />
                                  ))}
                                </div>
                                <span className="text-sm font-medium">{review.overallRating}/5</span>
                              </div>
                            </div>
                            <p className="text-gray-700 mb-3">{review.comment}</p>
                            <div className="text-xs text-gray-500">
                              {review.eventType} • {review.eventDate}
                              {review.verified && (
                                <span className="ml-2 inline-flex items-center">
                                  <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                                  Verified
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )) || []}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">


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

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Leave a Review for {speaker?.name}</DialogTitle>
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
                      <FormLabel>Rating *</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              className="focus:outline-none"
                              onMouseEnter={() => setHoveredRating(star)}
                              onMouseLeave={() => setHoveredRating(0)}
                              onClick={() => field.onChange(star)}
                            >
                              <Star
                                className={`w-8 h-8 transition-colors ${
                                  star <= (hoveredRating || field.value)
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            </button>
                          ))}
                          <span className="ml-2 text-sm text-gray-600">
                            {field.value ? `${field.value}/5` : "Click to rate"}
                          </span>
                        </div>
                      </FormControl>
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
                    <FormLabel>Written Review *</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} placeholder="Share your experience with this speaker..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={reviewForm.control}
                name="photo"
                render={({ field: { onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Photo from Audience *</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSelectedFile(file);
                              onChange(file);
                            }
                          }}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {selectedFile && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <span>✓ {selectedFile.name}</span>
                          </div>
                        )}
                        <p className="text-xs text-gray-500">
                          Upload a photo of the speaker presenting to your audience
                        </p>
                      </div>
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
  );
}