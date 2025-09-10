import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, ArrowLeft, CheckCircle2, Loader2, Sparkles, User, UserCheck, Info } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  title: z.string().optional(),
  company: z.string().optional(),
  accountType: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("user-login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitStep, setSubmitStep] = useState<"idle" | "loading" | "success" | "error">("idle");
  const { toast } = useToast();
  const { login } = useAuth();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      title: "",
      company: "",
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      setSubmitStep("loading");
      return apiRequest('POST', '/api/auth/login', data);
    },
    onSuccess: (data) => {
      setSubmitStep("success");
      setIsSuccess(true);
      
      // Use the auth context login method to properly update state  
      login(data.user.id, data.user);
      
      setTimeout(() => {
        toast({
          title: "Welcome back!",
          description: "You've been successfully logged in.",
        });
        // Check if user has a speaker profile to redirect to speaker dashboard
        if (data.user.speakerId) {
          setLocation('/speaker-dashboard');
        } else {
          setLocation('/');
        }
      }, 1500);
    },
    onError: (error: any) => {
      setSubmitStep("error");
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
      setTimeout(() => setSubmitStep("idle"), 2000);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      setSubmitStep("loading");
      const { confirmPassword, ...userData } = data;
      return apiRequest('POST', '/api/auth/register', userData);
    },
    onSuccess: (data) => {
      setSubmitStep("success");
      setIsSuccess(true);
      
      // Use the auth context login method to properly update state  
      login(data.user.id, data.user);
      
      setTimeout(() => {
        toast({
          title: "Account Created!",
          description: "Welcome to The Speaker Sphere. You're now logged in.",
        });
        setLocation('/');
      }, 1500);
    },
    onError: (error: any) => {
      setSubmitStep("error");
      toast({
        title: "Registration Failed",
        description: error.message || "Unable to create account. Please try again.",
        variant: "destructive",
      });
      setTimeout(() => setSubmitStep("idle"), 2000);
    },
  });

  const onLoginSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterForm) => {
    const accountType = activeTab === "user-login" ? "user" : "speaker";
    
    // If speaker registration, redirect to application process
    if (accountType === "speaker") {
      window.location.href = "/speaker-application";
      return;
    }
    
    registerMutation.mutate({
      ...data,
      accountType
    });
  };

  // Animated button content based on state
  const getButtonContent = (isLogin: boolean) => {
    if (submitStep === "loading") {
      return (
        <motion.div 
          className="flex items-center space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{isLogin ? "Signing in..." : "Creating account..."}</span>
        </motion.div>
      );
    }
    
    if (submitStep === "success") {
      return (
        <motion.div 
          className="flex items-center space-x-2"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Success!</span>
        </motion.div>
      );
    }

    return isLogin ? "Sign In" : "Create Account";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      {/* Success overlay */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            className="absolute inset-0 bg-green-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <motion.div
                className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <CheckCircle2 className="h-10 w-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-green-700 mb-2">Welcome!</h2>
              <p className="text-green-600">Redirecting you to the platform...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="w-full max-w-lg space-y-6"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="text-center">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-primary">The Speaker Sphere</h1>
          <div className="flex items-center justify-center mt-2 space-x-2">
            <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
            <p className="text-gray-600">Join our community of healthcare speakers</p>
            <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
          </div>
        </div>

        <Card className="shadow-xl bg-white border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Get Started</CardTitle>
            <CardDescription className="text-center">
              Choose your account type and sign in or create a new account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="user-login" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Users</span>
                </TabsTrigger>
                <TabsTrigger value="speaker-login" className="flex items-center space-x-2">
                  <UserCheck className="h-4 w-4" />
                  <span>Speakers</span>
                </TabsTrigger>
              </TabsList>

              {/* User Login Tab */}
              <TabsContent value="user-login" className="space-y-4">
                <div className="text-center mb-4 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800">User Account</h3>
                  <p className="text-sm text-blue-600">Sign in or create an account to browse and connect with speakers</p>
                </div>
                
                <Tabs defaultValue="user-signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="user-signin">Sign In</TabsTrigger>
                    <TabsTrigger value="user-register">Register</TabsTrigger>
                  </TabsList>
                  
                  {/* User Sign In */}
                  <TabsContent value="user-signin" className="space-y-4">
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="user-login-email">Email</Label>
                        <Input
                          id="user-login-email"
                          type="email"
                          placeholder="your.email@example.com"
                          {...loginForm.register("email")}
                        />
                        {loginForm.formState.errors.email && (
                          <p className="text-sm text-red-600">{loginForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="user-login-password">Password</Label>
                        <div className="relative">
                          <Input
                            id="user-login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            {...loginForm.register("password")}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                        {loginForm.formState.errors.password && (
                          <p className="text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
                        )}
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        {getButtonContent(true)}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* User Register */}
                  <TabsContent value="user-register" className="space-y-4">
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="user-register-firstName">First Name *</Label>
                          <Input
                            id="user-register-firstName"
                            placeholder="John"
                            {...registerForm.register("firstName")}
                          />
                          {registerForm.formState.errors.firstName && (
                            <p className="text-sm text-red-600">{registerForm.formState.errors.firstName.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="user-register-lastName">Last Name *</Label>
                          <Input
                            id="user-register-lastName"
                            placeholder="Doe"
                            {...registerForm.register("lastName")}
                          />
                          {registerForm.formState.errors.lastName && (
                            <p className="text-sm text-red-600">{registerForm.formState.errors.lastName.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="user-register-email">Email *</Label>
                        <Input
                          id="user-register-email"
                          type="email"
                          placeholder="your.email@example.com"
                          {...registerForm.register("email")}
                        />
                        {registerForm.formState.errors.email && (
                          <p className="text-sm text-red-600">{registerForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="user-register-password">Password *</Label>
                          <div className="relative">
                            <Input
                              id="user-register-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Create password"
                              {...registerForm.register("password")}
                              className="pr-10"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-500" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-500" />
                              )}
                            </button>
                          </div>
                          {registerForm.formState.errors.password && (
                            <p className="text-sm text-red-600">{registerForm.formState.errors.password.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="user-register-confirmPassword">Confirm Password *</Label>
                          <div className="relative">
                            <Input
                              id="user-register-confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm password"
                              {...registerForm.register("confirmPassword")}
                              className="pr-10"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-500" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-500" />
                              )}
                            </button>
                          </div>
                          {registerForm.formState.errors.confirmPassword && (
                            <p className="text-sm text-red-600">{registerForm.formState.errors.confirmPassword.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="user-register-title">Title (Optional)</Label>
                          <Input
                            id="user-register-title"
                            placeholder="Event Coordinator"
                            {...registerForm.register("title")}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="user-register-company">Company (Optional)</Label>
                          <Input
                            id="user-register-company"
                            placeholder="Healthcare Inc."
                            {...registerForm.register("company")}
                          />
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={registerMutation.isPending}
                      >
                        {getButtonContent(false)}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* Speaker Login Tab */}
              <TabsContent value="speaker-login" className="space-y-4">
                <div className="text-center mb-4 p-4 bg-green-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800">Speaker Account</h3>
                  <p className="text-sm text-green-600">Join our platform as a healthcare speaker to showcase your expertise</p>
                </div>
                
                <Tabs defaultValue="speaker-signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="speaker-signin">Sign In</TabsTrigger>
                    <TabsTrigger value="speaker-register">Register</TabsTrigger>
                  </TabsList>
                  
                  {/* Speaker Sign In */}
                  <TabsContent value="speaker-signin" className="space-y-4">
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="speaker-login-email">Email</Label>
                        <Input
                          id="speaker-login-email"
                          type="email"
                          placeholder="speaker.email@example.com"
                          {...loginForm.register("email")}
                        />
                        {loginForm.formState.errors.email && (
                          <p className="text-sm text-red-600">{loginForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="speaker-login-password">Password</Label>
                        <div className="relative">
                          <Input
                            id="speaker-login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            {...loginForm.register("password")}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                        {loginForm.formState.errors.password && (
                          <p className="text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
                        )}
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={loginMutation.isPending}
                      >
                        {getButtonContent(true)}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* Speaker Application */}
                  <TabsContent value="speaker-register" className="space-y-4">
                    <div className="text-center space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                          Apply to Join SpeakerSphere
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Healthcare professionals must apply for approval to ensure quality speakers for our network.
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
                        Already approved? Use the "Sign In" tab above to access your account.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}