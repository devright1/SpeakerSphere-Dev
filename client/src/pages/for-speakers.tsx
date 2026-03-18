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
  MessageCircle,
  Crown,
  Check,
  X,
  Info,
  User
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SEOHead } from "@/components/seo-head";
import { GA_EVENTS } from "@/lib/analytics";

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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

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
      return apiRequest("POST", "/api/auth/login", data);
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

  // Forgot Password Mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest("POST", "/api/auth/forgot-password", { email });
    },
    onSuccess: () => {
      toast({
        title: "Check Your Email",
        description: "If an account exists with that email, a new temporary password has been sent.",
      });
      setShowForgotPassword(false);
      setForgotEmail("");
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Application Submission Mutation
  const applicationMutation = useMutation({
    mutationFn: async (data: SpeakerApplicationForm) => {
      return apiRequest("POST", "/api/auth/speaker-application", data);
    },
    onSuccess: () => {
      // Track successful application submission with Google Analytics
      GA_EVENTS.submitApplication(true);
      
      toast({
        title: "Application Submitted!",
        description: "Thank you for your application. We'll review it and get back to you within 5 business days.",
      });
      applicationForm.reset();
    },
    onError: (error: any) => {
      console.error("Speaker application submission error:", error);
      
      // Track failed application submission with Google Analytics
      GA_EVENTS.submitApplication(false);
      
      // The server error message comes through in error.message
      const errorMessage = error?.message || "Please check your information and try again.";
      toast({
        title: "Submission Failed", 
        description: errorMessage,
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
      <SEOHead
        title="Join Our Healthcare Speaker Network | Grow Your Speaking Career"
        description="Become a featured healthcare speaker. Connect with medical events and conferences seeking expert speakers. Showcase your expertise, manage bookings, and expand your reach in the healthcare industry."
        keywords="become a healthcare speaker, medical speaker opportunities, healthcare conference speakers, speaker registration, join speaker network, speaking opportunities"
        ogType="website"
      />
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

        {/* Tier Comparison Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Choose Your Speaker Tier</h2>
            <p className="text-lg text-gray-600">Select the level that fits your goals and get the visibility you deserve</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Basic Tier */}
            <Card className="relative">
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3">
                  <Users className="w-6 h-6 text-gray-600" />
                </div>
                <h3 className="text-2xl font-bold">Speaker</h3>
                <p className="text-sm text-gray-600 mt-1">Get Listed</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold">Free</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Basic profile listing</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Name, headshot & specialty</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Up to 3 speaking topics</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">1 video or file upload</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Receive inquiries</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Directory listing</span>
                </div>
              </CardContent>
            </Card>

            {/* Pro Tier */}
            <Card className="relative border-2 border-primary shadow-xl">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-primary text-white px-4 py-1">Popular</Badge>
              </div>
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
                  <Star className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold">Pro Speaker</h3>
                <p className="text-sm text-gray-600 mt-1">Enhanced Visibility</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold">Contact Us</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium">Everything in Basic, plus:</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Homepage rotation (bottom 12 spots)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Expanded bio & custom sections</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Up to 5 speaking topics</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">5 videos/lectures/research files</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Social media links & website</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Pro speaker badge</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Analytics dashboard</span>
                </div>
              </CardContent>
            </Card>

            {/* Premier Tier */}
            <Card className="relative border-2 border-amber-400">
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-full mx-auto mb-3">
                  <Crown className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold">Premier Speaker</h3>
                <p className="text-sm text-gray-600 mt-1">Maximum Exposure</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold">Contact Us</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium">Everything in Pro, plus:</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Top homepage placement (top 12 spots)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Directory top rotation</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">10 video uploads</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Unlimited notes & publications</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Exclusive "Speaker Vault"</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Password-protected content</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Direct messaging</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Advanced analytics</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Full profile customization</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Premier badge</span>
                </div>
              </CardContent>
            </Card>
          </div>
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
                  Apply for a Speaker Sphere Profile
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
                        <Button
                          type="button"
                          variant="link"
                          className="p-0 h-auto text-sm text-gray-500"
                          onClick={() => setShowForgotPassword(true)}
                        >
                          Forgot your password?
                        </Button>
                      </div>
                      
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

                  {showForgotPassword && (
                    <div className="mt-6 max-w-md mx-auto p-6 bg-gray-50 rounded-lg border">
                      <h3 className="text-lg font-semibold mb-2">Reset Your Password</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Enter your email address and we'll send you a new temporary password.
                      </p>
                      <div className="space-y-3">
                        <Input
                          type="email"
                          placeholder="your.email@example.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                        />
                        <div className="flex gap-3">
                          <Button
                            className="flex-1"
                            onClick={() => forgotPasswordMutation.mutate(forgotEmail)}
                            disabled={!forgotEmail || forgotPasswordMutation.isPending}
                          >
                            {forgotPasswordMutation.isPending ? "Sending..." : "Send New Password"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => { setShowForgotPassword(false); setForgotEmail(""); }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="apply" className="mt-6">
                <div className="text-center space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Apply for a Speaker Sphere Profile
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      If you see yourself in our speaker directory, fill out the application to claim and manage your profile. New speakers can also apply to join our network.
                    </p>
                  </div>
                  
                  <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Application Process:</strong> Submit your professional information and credentials. 
                      Our team reviews applications within 5-7 business days.
                    </AlertDescription>
                  </Alert>
                  
                  <Link href="/speaker-application">
                    <Button className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg">
                      <User className="mr-2 h-5 w-5" />
                      Submit Speaker Application
                    </Button>
                  </Link>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Already approved? Use the "Existing Speakers Sign In" tab above to access your account.
                  </p>
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