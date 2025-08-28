import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { 
  Users, 
  Star, 
  Award, 
  TrendingUp, 
  CheckCircle, 
  LogIn, 
  UserPlus,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  MessageCircle
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Official categories from your CSV mapping
const officialCategories = [
  "AI & Innovation",
  "Anesthesia & Sedation", 
  "Bone Grafting & Regeneration",
  "Digital Dentistry",
  "Education & Training",
  "Endodontics",
  "Esthetic Dentistry",
  "Full Arch Rehabilitation",
  "Implant Dentistry",
  "Leadership",
  "Oral Surgery",
  "Orthodontics",
  "Periodontics",
  "Practice Management",
  "Prosthodontics",
  "Research",
  "Sleep Medicine",
  "Technology & Innovation"
];

// Sign In Form Schema
const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Speaker Application Form Schema
const speakerApplicationSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  
  // Social Media Links
  instagramUrl: z.string().url("Please enter a valid Instagram URL").optional().or(z.literal("")),
  twitterUrl: z.string().url("Please enter a valid X/Twitter URL").optional().or(z.literal("")),
  facebookUrl: z.string().url("Please enter a valid Facebook URL").optional().or(z.literal("")),
  linkedinUrl: z.string().url("Please enter a valid LinkedIn URL").optional().or(z.literal("")),
  
  // Professional Information
  title: z.string().min(2, "Professional title is required"),
  specialty: z.string().min(2, "Specialty is required"),
  yearsExperience: z.string().min(1, "Years of experience is required"),
  credentials: z.string().min(10, "Please provide your credentials and qualifications"),
  
  // Speaking Information
  selectedCategories: z.array(z.string()).min(1, "Please select at least one category"),
  specificTopics: z.string().min(10, "Please provide specific topics (at least 10 characters)"),
  speakingTopics: z.string().min(20, "Please describe your speaking topics (minimum 20 characters)"),
  previousExperience: z.string().min(20, "Please describe your previous speaking experience"),
  availableFormats: z.array(z.string()).min(1, "Please select at least one speaking format"),
  travelWillingness: z.string().min(1, "Please specify your travel preferences"),
  
  // Additional Information
  biography: z.string().min(50, "Biography must be at least 50 characters"),
  specialRequirements: z.string().optional(),
  references: z.string().optional(),
});

type SignInForm = z.infer<typeof signInSchema>;
type SpeakerApplicationForm = z.infer<typeof speakerApplicationSchema>;

export default function ForSpeakers() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("signin");

  // Sign In Form
  const signInForm = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Speaker Application Form
  const applicationForm = useForm<SpeakerApplicationForm>({
    resolver: zodResolver(speakerApplicationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      website: "",
      instagramUrl: "",
      twitterUrl: "",
      facebookUrl: "",
      linkedinUrl: "",
      title: "",
      specialty: "",
      yearsExperience: "",
      credentials: "",
      selectedCategories: [],
      specificTopics: "",
      speakingTopics: "",
      previousExperience: "",
      availableFormats: [],
      travelWillingness: "",
      biography: "",
      specialRequirements: "",
      references: "",
    },
  });

  // Sign In Mutation
  const signInMutation = useMutation({
    mutationFn: async (data: SignInForm) => {
      return apiRequest("POST", "/api/auth/signin", data);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "You have been signed in successfully.",
      });
      // Redirect to speaker dashboard or profile
      window.location.href = "/profile";
    },
    onError: (error: any) => {
      toast({
        title: "Sign In Failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });

  // Application Submission Mutation
  const applicationMutation = useMutation({
    mutationFn: async (data: SpeakerApplicationForm) => {
      return apiRequest("POST", "/api/speakers/apply", data);
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted!",
        description: "Thank you for your application. We'll review it and get back to you within 5 business days.",
      });
      applicationForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  const onSignInSubmit = (data: SignInForm) => {
    signInMutation.mutate(data);
  };

  const onApplicationSubmit = (data: SpeakerApplicationForm) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", applicationForm.formState.errors);
    applicationMutation.mutate(data);
  };

  const speakingFormats = [
    "Keynote Presentations",
    "Workshop Sessions", 
    "Panel Discussions",
    "Webinars",
    "Training Sessions",
    "Conference Presentations",
    "Breakout Sessions"
  ];

  const handleFormatChange = (format: string, checked: boolean) => {
    const currentFormats = applicationForm.getValues("availableFormats");
    if (checked) {
      applicationForm.setValue("availableFormats", [...currentFormats, format]);
    } else {
      applicationForm.setValue("availableFormats", currentFormats.filter(f => f !== format));
    }
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const currentCategories = applicationForm.getValues("selectedCategories");
    if (checked) {
      applicationForm.setValue("selectedCategories", [...currentCategories, category]);
    } else {
      applicationForm.setValue("selectedCategories", currentCategories.filter(c => c !== category));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Join The Speaker Sphere
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect with healthcare professionals seeking expertise. Share your knowledge and grow your speaking career.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Reach More Audiences</h3>
              <p className="text-sm text-gray-600">Connect with healthcare organizations worldwide</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Star className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Build Your Reputation</h3>
              <p className="text-sm text-gray-600">Collect reviews and showcase your expertise</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Award className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Professional Recognition</h3>
              <p className="text-sm text-gray-600">Get verified and stand out as a trusted expert</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Grow Your Career</h3>
              <p className="text-sm text-gray-600">Expand your speaking opportunities and income</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin" className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Existing Speakers Sign In
                </TabsTrigger>
                <TabsTrigger value="apply" className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Apply to Become a Speaker
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="mt-6">
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
                    <p className="text-gray-600">Sign in to manage your speaker profile and opportunities</p>
                  </div>
                  
                  <Form {...signInForm}>
                    <form onSubmit={signInForm.handleSubmit(onSignInSubmit)} className="space-y-4 max-w-md mx-auto">
                      <FormField
                        control={signInForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="your.email@example.com" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={signInForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Enter your password" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={signInMutation.isPending}
                      >
                        {signInMutation.isPending ? "Signing In..." : "Sign In"}
                      </Button>
                      
                      <div className="text-center">
                        <p className="text-sm text-gray-600">
                          Don't have an account? 
                          <Button 
                            variant="link" 
                            className="p-0 ml-1 h-auto"
                            onClick={() => setActiveTab("apply")}
                          >
                            Apply to become a speaker
                          </Button>
                        </p>
                      </div>
                    </form>
                  </Form>
                </div>
              </TabsContent>
              
              <TabsContent value="apply" className="mt-6">
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Speaker Application</h2>
                    <p className="text-gray-600">Join our network of healthcare speaking professionals</p>
                  </div>
                  
                  <Form {...applicationForm}>
                    <form onSubmit={applicationForm.handleSubmit(onApplicationSubmit)} className="space-y-6">
                      {/* Personal Information Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <UserPlus className="w-5 h-5" />
                          Personal Information
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={applicationForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="John" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={applicationForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Smith" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={applicationForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address *</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="john.smith@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={applicationForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number *</FormLabel>
                                <FormControl>
                                  <Input placeholder="+1 (555) 123-4567" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={applicationForm.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Professional Website</FormLabel>
                              <FormControl>
                                <Input placeholder="https://www.yourwebsite.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Social Media Links Section */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Social Media Links (Optional)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={applicationForm.control}
                              name="instagramUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Instagram</FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://instagram.com/yourusername" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={applicationForm.control}
                              name="twitterUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>X (Twitter)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://x.com/yourusername" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={applicationForm.control}
                              name="facebookUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Facebook</FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://facebook.com/yourusername" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={applicationForm.control}
                              name="linkedinUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>LinkedIn</FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://linkedin.com/in/yourusername" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Professional Information Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Award className="w-5 h-5" />
                          Professional Information
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={applicationForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Professional Title *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., DDS, MD, Chief of Surgery" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={applicationForm.control}
                            name="specialty"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Specialty/Field *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Oral Surgery, Cardiology" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={applicationForm.control}
                          name="yearsExperience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Years of Professional Experience *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select years of experience" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1-3">1-3 years</SelectItem>
                                  <SelectItem value="4-7">4-7 years</SelectItem>
                                  <SelectItem value="8-15">8-15 years</SelectItem>
                                  <SelectItem value="16-25">16-25 years</SelectItem>
                                  <SelectItem value="25+">25+ years</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={applicationForm.control}
                          name="credentials"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Credentials & Qualifications *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="List your degrees, certifications, board certifications, and professional memberships..."
                                  rows={3}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Speaking Information Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <MessageCircle className="w-5 h-5" />
                          Speaking Information
                        </h3>

                        {/* Category Selection */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Speaking Categories * (Select all that apply)</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 border rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
                            {officialCategories.map((category) => (
                              <div key={category} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`category-${category}`}
                                  onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
                                />
                                <Label 
                                  htmlFor={`category-${category}`} 
                                  className="text-sm cursor-pointer"
                                >
                                  {category}
                                </Label>
                              </div>
                            ))}
                          </div>
                          {applicationForm.formState.errors.selectedCategories && (
                            <p className="text-sm text-red-600">{applicationForm.formState.errors.selectedCategories.message}</p>
                          )}
                        </div>

                        {/* Specific Topics */}
                        <FormField
                          control={applicationForm.control}
                          name="specificTopics"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Specific Topics of Expertise *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="List your specific areas of expertise and topics you can speak about in detail (e.g., 'All-on-4 implants, Digital workflow integration, Guided surgery protocols')"
                                  rows={3}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Please be specific about your expertise areas. This helps us match you with relevant speaking opportunities.
                              </p>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={applicationForm.control}
                          name="speakingTopics"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Speaking Topics & Areas of Expertise *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe the topics you can speak about, your areas of expertise, and what audiences would benefit from your presentations..."
                                  rows={4}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={applicationForm.control}
                          name="previousExperience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Previous Speaking Experience *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe your previous speaking engagements, conferences you've presented at, and any notable presentations..."
                                  rows={4}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={applicationForm.control}
                          name="availableFormats"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Available Speaking Formats * (Select all that apply)</FormLabel>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 border rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
                                {speakingFormats.map((format) => (
                                  <div key={format} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={format}
                                      checked={field.value?.includes(format) || false}
                                      onCheckedChange={(checked) => {
                                        const currentFormats = field.value || [];
                                        if (checked) {
                                          field.onChange([...currentFormats, format]);
                                        } else {
                                          field.onChange(currentFormats.filter((f: string) => f !== format));
                                        }
                                      }}
                                    />
                                    <Label htmlFor={format} className="text-sm cursor-pointer">
                                      {format}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={applicationForm.control}
                          name="travelWillingness"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Travel Preferences *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select your travel preferences" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="local">Local/Regional only (within 100 miles)</SelectItem>
                                  <SelectItem value="national">National (willing to travel domestically)</SelectItem>
                                  <SelectItem value="international">International (willing to travel globally)</SelectItem>
                                  <SelectItem value="virtual">Virtual presentations only</SelectItem>
                                  <SelectItem value="hybrid">Mix of in-person and virtual</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Additional Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Additional Information</h3>
                        
                        <FormField
                          control={applicationForm.control}
                          name="biography"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Professional Biography *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Write a professional biography that highlights your background, achievements, and what makes you an exceptional speaker..."
                                  rows={5}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={applicationForm.control}
                          name="specialRequirements"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Special Requirements or Equipment Needs</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Any special audio/visual equipment, accessibility needs, or other requirements..."
                                  rows={2}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={applicationForm.control}
                          name="references"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Professional References</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Provide 2-3 professional references who can speak to your expertise and speaking abilities..."
                                  rows={3}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-center">
                        <Button 
                          type="submit" 
                          size="lg"
                          className="px-8"
                          disabled={applicationMutation.isPending}
                        >
                          {applicationMutation.isPending ? "Submitting Application..." : "Submit Application"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        {/* Process Information */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-6">Application Process</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Submit Application</h3>
              <p className="text-sm text-gray-600">Complete the comprehensive speaker application form</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Review Process</h3>
              <p className="text-sm text-gray-600">Our team reviews your application and credentials (5 business days)</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Get Listed</h3>
              <p className="text-sm text-gray-600">Upon approval, your profile goes live and opportunities begin</p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}