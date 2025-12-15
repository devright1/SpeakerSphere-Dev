import { useState, useEffect } from "react";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, EyeOff, ArrowLeft, CheckCircle2, Loader2, Sparkles, User, UserCheck, Info, Mail, KeyRound } from "lucide-react";
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

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password confirmation is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("user-login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitStep, setSubmitStep] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  // Check for reset token in URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('resetToken');
    
    if (token) {
      setResetToken(token);
      setIsResetPassword(true);
      // Clear the token from URL for security
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

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

  const forgotPasswordForm = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetPasswordForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Update the token field when resetToken changes
  useEffect(() => {
    if (resetToken) {
      resetPasswordForm.setValue("token", resetToken);
    }
  }, [resetToken, resetPasswordForm]);

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
    onSuccess: () => {
      setSubmitStep("success");
      setIsSuccess(true);
      toast({
        title: "Account Created!",
        description: "You can now log in with your credentials.",
      });
      setTimeout(() => {
        setActiveTab("user-login");
        setSubmitStep("idle");
        setIsSuccess(false);
      }, 2000);
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

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordForm) => {
      return apiRequest('POST', '/api/auth/forgot-password', data);
    },
    onSuccess: () => {
      toast({
        title: "Reset Link Sent",
        description: "If an account with this email exists, you will receive a password reset link shortly.",
      });
      setIsForgotPasswordOpen(false);
      forgotPasswordForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Unable to process password reset request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordForm) => {
      return apiRequest('POST', '/api/auth/reset-password', data);
    },
    onSuccess: () => {
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset. You can now log in with your new password.",
      });
      setIsResetPassword(false);
      setResetToken(null);
      setActiveTab("user-login");
      resetPasswordForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Password Reset Failed",
        description: error.message || "Invalid or expired reset token. Please request a new password reset.",
        variant: "destructive",
      });
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

  const onForgotPasswordSubmit = (data: ForgotPasswordForm) => {
    forgotPasswordMutation.mutate(data);
  };

  const onResetPasswordSubmit = (data: ResetPasswordForm) => {
    resetPasswordMutation.mutate({
      ...data,
      token: resetToken || data.token,
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
            <CardTitle className="text-2xl text-center flex items-center justify-center">
              {isResetPassword ? (
                <>
                  <KeyRound className="h-6 w-6 mr-2" />
                  Reset Password
                </>
              ) : (
                "Get Started"
              )}
            </CardTitle>
            <CardDescription className="text-center">
              {isResetPassword 
                ? "Enter your new password below"
                : "Choose your account type and sign in or create a new account"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isResetPassword ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Please enter your new password. Make sure it's secure and at least 8 characters long.
                  </AlertDescription>
                </Alert>
                
                <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)} className="space-y-4">
                  {/* Hidden token field */}
                  <input type="hidden" {...resetPasswordForm.register("token")} value={resetToken || ""} />
                  
                  <div className="space-y-2">
                    <Label htmlFor="reset-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="reset-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your new password"
                        {...resetPasswordForm.register("password")}
                        className="pr-10"
                        data-testid="input-reset-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                        data-testid="button-toggle-password"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                    {resetPasswordForm.formState.errors.password && (
                      <p className="text-sm text-red-600">{resetPasswordForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reset-confirm-password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="reset-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your new password"
                        {...resetPasswordForm.register("confirmPassword")}
                        className="pr-10"
                        data-testid="input-reset-confirm-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        data-testid="button-toggle-confirm-password"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                    {resetPasswordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-600">{resetPasswordForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={resetPasswordMutation.isPending}
                    data-testid="button-reset-password"
                  >
                    {resetPasswordMutation.isPending ? (
                      <motion.div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Resetting Password...</span>
                      </motion.div>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                  
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsResetPassword(false);
                        setResetToken(null);
                      }}
                      data-testid="button-back-to-login"
                    >
                      Back to Sign In
                    </Button>
                  </div>
                </form>
              </motion.div>
            ) : (
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
                        data-testid="button-login"
                      >
                        {getButtonContent(true)}
                      </Button>
                      
                      <div className="text-center mt-4">
                        <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" data-testid="button-forgot-password">
                              Forgot Password?
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle className="flex items-center">
                                <Mail className="h-5 w-5 mr-2" />
                                Reset Your Password
                              </DialogTitle>
                              <DialogDescription>
                                Enter your email address and we'll send you a link to reset your password.
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="forgot-email">Email</Label>
                                <Input
                                  id="forgot-email"
                                  type="email"
                                  placeholder="your.email@example.com"
                                  {...forgotPasswordForm.register("email")}
                                  data-testid="input-forgot-email"
                                />
                                {forgotPasswordForm.formState.errors.email && (
                                  <p className="text-sm text-red-600">{forgotPasswordForm.formState.errors.email.message}</p>
                                )}
                              </div>
                              
                              <div className="flex gap-3">
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  className="flex-1"
                                  onClick={() => setIsForgotPasswordOpen(false)}
                                  data-testid="button-cancel-forgot-password"
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  type="submit" 
                                  className="flex-1"
                                  disabled={forgotPasswordMutation.isPending}
                                  data-testid="button-send-reset-link"
                                >
                                  {forgotPasswordMutation.isPending ? (
                                    <motion.div className="flex items-center space-x-2">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      <span>Sending...</span>
                                    </motion.div>
                                  ) : (
                                    "Send Reset Link"
                                  )}
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
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
                          Apply for a Speaker Sphere Profile
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">If you see yourself in our speaker directory, fill out the application to claim and manage your profile. </p>
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
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}