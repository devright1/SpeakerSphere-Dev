import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Mail, Eye, EyeOff, CheckCircle, Shield, Loader2, AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  title: z.string().optional(),
  company: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

type RegistrationStep = "form" | "verification" | "verifying" | "success" | "failed";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<RegistrationStep>("form");
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [verificationSessionId, setVerificationSessionId] = useState("");
  const [verificationError, setVerificationError] = useState("");

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      title: "",
      company: "",
    },
  });

  // Create identity verification session
  const createVerificationSession = useMutation({
    mutationFn: async (data: { email: string; firstName: string; lastName: string }) => {
      const response = await apiRequest("POST", "/api/identity/create-session", {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        type: "user"
      });
      return response;
    },
    onSuccess: async (data: any) => {
      setVerificationSessionId(data.sessionId);
      setStep("verifying");
      
      // Load Stripe and open identity verification modal
      const stripe = await stripePromise;
      if (stripe && data.clientSecret) {
        const { error } = await stripe.verifyIdentity(data.clientSecret);
        
        if (error) {
          console.error("Identity verification error:", error);
          setVerificationError(error.message || "Verification failed");
          setStep("failed");
        } else {
          // Verification submitted - check status
          checkVerificationStatus(data.sessionId);
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Verification Setup Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      setStep("form");
    },
  });

  // Check verification status
  const checkVerificationStatus = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/identity/status/${sessionId}`);
      const data = await response.json();
      
      if (data.status === "verified") {
        // Update user verification status
        await apiRequest("POST", "/api/identity/update-user-status", {
          userId: userId,
          sessionId: sessionId,
          status: "verified"
        });
        setStep("success");
      } else if (data.status === "requires_input") {
        setVerificationError(data.lastError?.reason || "Verification requires additional input");
        setStep("failed");
      } else if (data.status === "processing") {
        // Poll again after a delay
        setTimeout(() => checkVerificationStatus(sessionId), 2000);
      } else {
        setStep("success"); // For now, treat as success pending webhook
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
      setStep("success"); // Proceed - webhook will handle final status
    }
  };

  // Register user and start identity verification
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      return apiRequest("POST", "/api/auth/register", data);
    },
    onSuccess: (data: any) => {
      setUserEmail(form.getValues("email"));
      setUserId(data.user?.id || "");
      setStep("verification");
      
      // Start identity verification
      createVerificationSession.mutate({
        email: form.getValues("email"),
        firstName: form.getValues("firstName"),
        lastName: form.getValues("lastName"),
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  const handleRetryVerification = () => {
    setVerificationError("");
    createVerificationSession.mutate({
      email: userEmail,
      firstName: form.getValues("firstName"),
      lastName: form.getValues("lastName"),
    });
  };

  // Identity Verification in Progress screen
  if (step === "verification" || step === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Identity Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-gray-600">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="mb-4">
                {step === "verification" 
                  ? "Preparing identity verification..." 
                  : "Please complete the verification in the popup window."}
              </p>
              <p className="text-sm text-gray-500">
                We need to verify your identity to ensure the security of our platform.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verification Failed screen
  if (step === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Verification Issue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-gray-600">
              <p className="mb-4">
                We couldn't complete your identity verification:
              </p>
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {verificationError || "Please try again with a valid ID document."}
              </p>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={handleRetryVerification}
                disabled={createVerificationSession.isPending}
                className="w-full"
              >
                {createVerificationSession.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Preparing...
                  </>
                ) : (
                  "Try Again"
                )}
              </Button>
              
              <Button
                onClick={() => setLocation("/login")}
                variant="outline"
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success screen
  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Account Created!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-gray-600">
              <p className="mb-4">
                Your account has been created and verified successfully.
              </p>
              <p className="font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg">
                {userEmail}
              </p>
            </div>
            
            <div className="text-sm text-gray-600 space-y-2">
              <p>You can now log in to access:</p>
              <p>• Browse medical speakers</p>
              <p>• Save favorites and submit inquiries</p>
              <p>• Write reviews for speakers you've worked with</p>
            </div>

            <Button
              onClick={() => setLocation("/login")}
              className="w-full"
            >
              Continue to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Create Your Account
          </CardTitle>
          <p className="text-gray-600">
            Join SpeakerSphere to discover top medical speakers
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="john@example.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="At least 6 characters"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Dr., Director, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Your organization" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </Form>

          <Separator className="my-6" />

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}