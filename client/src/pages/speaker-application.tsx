import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, CheckCircle2, Loader2, Send, User, FileText, Briefcase, Globe } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

// Validation schema for speaker application
const speakerApplicationSchema = z.object({
  // Personal Information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(1, "Phone number is required"),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  
  // Social Media Links
  instagramUrl: z.string().url("Please enter a valid Instagram URL").optional().or(z.literal("")),
  twitterUrl: z.string().url("Please enter a valid X/Twitter URL").optional().or(z.literal("")),
  facebookUrl: z.string().url("Please enter a valid Facebook URL").optional().or(z.literal("")),
  linkedinUrl: z.string().url("Please enter a valid LinkedIn URL").optional().or(z.literal("")),
  
  // Professional Information
  title: z.string().min(1, "Professional title is required"),
  specialty: z.string().min(1, "Medical specialty is required"),
  yearsExperience: z.string().min(1, "Years of experience is required"),
  credentials: z.string().min(1, "Credentials and education are required"),
  
  // Speaking Information
  selectedCategories: z.array(z.string()).min(1, "Please select at least one category"),
  specificTopics: z.string().min(10, "Please provide specific topics (at least 10 characters)"),
  speakingTopics: z.string().min(1, "Speaking topics are required"),
  previousExperience: z.string().min(1, "Previous speaking experience is required"),
  availableFormats: z.array(z.string()).min(1, "Please select at least one format"),
  travelWillingness: z.string().min(1, "Please specify travel willingness"),
  
  // Additional Information
  biography: z.string().min(100, "Biography must be at least 100 characters"),
  specialRequirements: z.string().optional(),
  references: z.string().optional(),
});

type SpeakerApplicationForm = z.infer<typeof speakerApplicationSchema>;

const medicalSpecialties = [
  "Oral Surgery",
  "Prosthodontics", 
  "Orthodontics",
  "Periodontics",
  "Endodontics",
  "Pediatric Dentistry",
  "Oral Pathology",
  "Maxillofacial Surgery",
  "Digital Dentistry",
  "Esthetic Dentistry",
  "Implant Dentistry",
  "Practice Management",
  "Anesthesiology",
  "Sleep Medicine",
  "Other"
];

const speakingFormats = [
  "Keynote Presentation",
  "Clinical Lecture", 
  "Hands-on Workshop",
  "Panel Discussion",
  "Webinar",
  "Case Study Presentation"
];

const travelOptions = [
  "Local events only (within 50 miles)",
  "Regional events (within 500 miles)", 
  "National events (within country)",
  "International events"
];

export default function SpeakerApplicationPage() {
  const [submitStep, setSubmitStep] = useState<"idle" | "submitting" | "success">("idle");
  const { toast } = useToast();
  
  const form = useForm<SpeakerApplicationForm>({
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
      references: ""
    }
  });

  const applicationMutation = useMutation({
    mutationFn: async (data: SpeakerApplicationForm) => {
      console.log("Submitting speaker application:", data);
      const response = await apiRequest("POST", "/api/auth/speaker-application", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      setSubmitStep("success");
      toast({
        title: "Application Submitted!",
        description: data.message,
      });
      form.reset();
      setTimeout(() => setSubmitStep("idle"), 3000);
    },
    onError: (error: any) => {
      console.error("Speaker application submission error:", error);
      const errorMessage = error?.message || error?.toString() || "Application submission failed";
      toast({
        title: "Application Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setSubmitStep("idle");
    },
  });

  const onSubmit = (data: SpeakerApplicationForm) => {
    setSubmitStep("submitting");
    applicationMutation.mutate(data);
  };

  const handleFormatChange = (format: string, checked: boolean) => {
    const currentFormats = form.getValues("availableFormats");
    if (checked) {
      form.setValue("availableFormats", [...currentFormats, format]);
    } else {
      form.setValue("availableFormats", currentFormats.filter(f => f !== format));
    }
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const currentCategories = form.getValues("selectedCategories");
    if (checked) {
      form.setValue("selectedCategories", [...currentCategories, category]);
    } else {
      form.setValue("selectedCategories", currentCategories.filter(c => c !== category));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-xl border-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
            <CardHeader className="space-y-4 pb-8">
              <div className="flex items-center justify-between">
                <Link href="/auth">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
              </div>
              
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-4">
                  <User className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold">Speaker Application</CardTitle>
                <CardDescription className="text-lg">
                  Join SpeakerSphere's network of healthcare professionals
                </CardDescription>
              </div>

              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <strong>Application Process:</strong> Our team will review your application within 5-7 business days. 
                  You'll receive an email confirmation once approved with your login credentials.
                </AlertDescription>
              </Alert>
            </CardHeader>

            <CardContent className="space-y-8">
              <AnimatePresence mode="wait">
                {submitStep === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-center py-8 space-y-4"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                      <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-green-800 dark:text-green-200">
                      Application Submitted Successfully!
                    </h3>
                    <p className="text-green-600 dark:text-green-400">
                      We'll review your application and contact you within 5-7 business days.
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-8"
                  >
                    {/* Personal Information Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 pb-2 border-b">
                        <User className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold">Personal Information</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            {...form.register("firstName")}
                            placeholder="Enter your first name"
                          />
                          {form.formState.errors.firstName && (
                            <p className="text-sm text-red-600">{form.formState.errors.firstName.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            {...form.register("lastName")}
                            placeholder="Enter your last name"
                          />
                          {form.formState.errors.lastName && (
                            <p className="text-sm text-red-600">{form.formState.errors.lastName.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            {...form.register("email")}
                            placeholder="Enter your email address"
                          />
                          {form.formState.errors.email && (
                            <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            {...form.register("phone")}
                            placeholder="Enter your phone number"
                          />
                          {form.formState.errors.phone && (
                            <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website">Website (Optional)</Label>
                        <Input
                          id="website"
                          {...form.register("website")}
                          placeholder="https://yourwebsite.com"
                        />
                        {form.formState.errors.website && (
                          <p className="text-sm text-red-600">{form.formState.errors.website.message}</p>
                        )}
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Social Media Links (Optional)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="instagramUrl">Instagram</Label>
                            <Input
                              id="instagramUrl"
                              {...form.register("instagramUrl")}
                              placeholder="https://instagram.com/yourusername"
                            />
                            {form.formState.errors.instagramUrl && (
                              <p className="text-sm text-red-600">{form.formState.errors.instagramUrl.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="twitterUrl">X (Twitter)</Label>
                            <Input
                              id="twitterUrl"
                              {...form.register("twitterUrl")}
                              placeholder="https://x.com/yourusername"
                            />
                            {form.formState.errors.twitterUrl && (
                              <p className="text-sm text-red-600">{form.formState.errors.twitterUrl.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="facebookUrl">Facebook</Label>
                            <Input
                              id="facebookUrl"
                              {...form.register("facebookUrl")}
                              placeholder="https://facebook.com/yourusername"
                            />
                            {form.formState.errors.facebookUrl && (
                              <p className="text-sm text-red-600">{form.formState.errors.facebookUrl.message}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="linkedinUrl">LinkedIn</Label>
                            <Input
                              id="linkedinUrl"
                              {...form.register("linkedinUrl")}
                              placeholder="https://linkedin.com/in/yourusername"
                            />
                            {form.formState.errors.linkedinUrl && (
                              <p className="text-sm text-red-600">{form.formState.errors.linkedinUrl.message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Professional Information Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 pb-2 border-b">
                        <Briefcase className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold">Professional Information</h3>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="title">Professional Title *</Label>
                        <Input
                          id="title"
                          {...form.register("title")}
                          placeholder="e.g., DDS, DMD, Oral Surgeon"
                        />
                        {form.formState.errors.title && (
                          <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="specialty">Medical Specialty *</Label>
                          <Select onValueChange={(value) => form.setValue("specialty", value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your specialty" />
                            </SelectTrigger>
                            <SelectContent>
                              {medicalSpecialties.map((specialty) => (
                                <SelectItem key={specialty} value={specialty}>
                                  {specialty}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.specialty && (
                            <p className="text-sm text-red-600">{form.formState.errors.specialty.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="yearsExperience">Years of Experience *</Label>
                          <Select onValueChange={(value) => form.setValue("yearsExperience", value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select experience" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1-5">1-5 years</SelectItem>
                              <SelectItem value="6-10">6-10 years</SelectItem>
                              <SelectItem value="11-15">11-15 years</SelectItem>
                              <SelectItem value="16-20">16-20 years</SelectItem>
                              <SelectItem value="20+">20+ years</SelectItem>
                            </SelectContent>
                          </Select>
                          {form.formState.errors.yearsExperience && (
                            <p className="text-sm text-red-600">{form.formState.errors.yearsExperience.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="credentials">Education & Credentials *</Label>
                        <Textarea
                          id="credentials"
                          {...form.register("credentials")}
                          placeholder="List your education, degrees, certifications, and professional credentials"
                          className="min-h-[100px]"
                        />
                        {form.formState.errors.credentials && (
                          <p className="text-sm text-red-600">{form.formState.errors.credentials.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Speaking Information Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 pb-2 border-b">
                        <Globe className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold">Speaking Information</h3>
                      </div>

                      {/* Category Selection */}
                      <div className="space-y-3">
                        <Label>Speaking Categories * (Select all that apply)</Label>
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
                        {form.formState.errors.selectedCategories && (
                          <p className="text-sm text-red-600">{form.formState.errors.selectedCategories.message}</p>
                        )}
                      </div>

                      {/* Specific Topics */}
                      <div className="space-y-2">
                        <Label htmlFor="specificTopics">Specific Topics of Expertise *</Label>
                        <Textarea
                          id="specificTopics"
                          {...form.register("specificTopics")}
                          placeholder="List your specific areas of expertise and topics you can speak about in detail (e.g., 'All-on-4 implants, Digital workflow integration, Guided surgery protocols')"
                          className="min-h-[100px]"
                        />
                        {form.formState.errors.specificTopics && (
                          <p className="text-sm text-red-600">{form.formState.errors.specificTopics.message}</p>
                        )}
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Please be specific about your expertise areas. This helps us match you with relevant speaking opportunities.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="speakingTopics">General Speaking Topics *</Label>
                        <Textarea
                          id="speakingTopics"
                          {...form.register("speakingTopics")}
                          placeholder="List the topics you can speak about (separated by commas)"
                          className="min-h-[80px]"
                        />
                        {form.formState.errors.speakingTopics && (
                          <p className="text-sm text-red-600">{form.formState.errors.speakingTopics.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="previousExperience">Previous Speaking Experience *</Label>
                        <Textarea
                          id="previousExperience"
                          {...form.register("previousExperience")}
                          placeholder="Describe your previous speaking engagements, conferences, or presentations"
                          className="min-h-[100px]"
                        />
                        {form.formState.errors.previousExperience && (
                          <p className="text-sm text-red-600">{form.formState.errors.previousExperience.message}</p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Label>Available Speaking Formats *</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 border rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
                          {speakingFormats.map((format) => (
                            <div key={format} className="flex items-center space-x-2">
                              <Checkbox
                                id={format}
                                onCheckedChange={(checked) => handleFormatChange(format, checked as boolean)}
                              />
                              <Label htmlFor={format} className="text-sm cursor-pointer">
                                {format}
                              </Label>
                            </div>
                          ))}
                        </div>
                        {form.formState.errors.availableFormats && (
                          <p className="text-sm text-red-600">{form.formState.errors.availableFormats.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="travelWillingness">Travel Willingness *</Label>
                        <Select onValueChange={(value) => form.setValue("travelWillingness", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select travel preference" />
                          </SelectTrigger>
                          <SelectContent>
                            {travelOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.travelWillingness && (
                          <p className="text-sm text-red-600">{form.formState.errors.travelWillingness.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Additional Information Section */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 pb-2 border-b">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold">Additional Information</h3>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="biography">Professional Biography *</Label>
                        <Textarea
                          id="biography"
                          {...form.register("biography")}
                          placeholder="Write a comprehensive professional biography (minimum 100 characters)"
                          className="min-h-[120px]"
                        />
                        <p className="text-xs text-muted-foreground">
                          This will be used for your speaker profile. Include your background, achievements, and areas of expertise.
                        </p>
                        {form.formState.errors.biography && (
                          <p className="text-sm text-red-600">{form.formState.errors.biography.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="specialRequirements">Special Requirements (Optional)</Label>
                        <Textarea
                          id="specialRequirements"
                          {...form.register("specialRequirements")}
                          placeholder="Any special requirements for speaking engagements (e.g., equipment, setup, accessibility needs)"
                          className="min-h-[80px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="references">Professional References (Optional)</Label>
                        <Textarea
                          id="references"
                          {...form.register("references")}
                          placeholder="Names and contact information of professional references"
                          className="min-h-[80px]"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button
                        type="submit"
                        disabled={submitStep === "submitting"}
                        className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        {submitStep === "submitting" ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting Application...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Submit Application
                          </>
                        )}
                      </Button>
                      
                      <Link href="/auth">
                        <Button variant="outline" className="h-12 px-6">
                          Cancel
                        </Button>
                      </Link>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}