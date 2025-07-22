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
import { Eye, EyeOff, ArrowLeft, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitStep, setSubmitStep] = useState<"idle" | "loading" | "success" | "error">("idle");
  const { toast } = useToast();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const formVariants = {
    enter: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    },
    exit: {
      x: activeTab === "login" ? -100 : 100,
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  };

  const successVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 25
      }
    }
  };

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
      const response = await apiRequest('POST', '/api/auth/login', data);
      return response.json();
    },
    onSuccess: (data) => {
      setSubmitStep("success");
      setIsSuccess(true);
      
      // Store session token
      localStorage.setItem('userToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      
      // Show success animation, then redirect
      setTimeout(() => {
        toast({
          title: "Welcome back!",
          description: "You've been successfully logged in.",
        });
        setLocation('/');
      }, 1500);
    },
    onError: (error: any) => {
      setSubmitStep("error");
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
      // Reset to idle after error animation
      setTimeout(() => setSubmitStep("idle"), 2000);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      setSubmitStep("loading");
      const { confirmPassword, ...userData } = data;
      const response = await apiRequest('POST', '/api/auth/register', userData);
      return response.json();
    },
    onSuccess: (data) => {
      setSubmitStep("success");
      setIsSuccess(true);
      
      // Store session token
      localStorage.setItem('userToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      
      // Show success animation, then redirect
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
      // Reset to idle after error animation
      setTimeout(() => setSubmitStep("idle"), 2000);
    },
  });

  const onLoginSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterForm) => {
    registerMutation.mutate(data);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Success overlay */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            className="absolute inset-0 bg-green-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="text-center"
              variants={successVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <CheckCircle2 className="h-10 w-10 text-white" />
              </motion.div>
              <motion.h2
                className="text-2xl font-bold text-green-700 mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Welcome!
              </motion.h2>
              <motion.p
                className="text-green-600"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                Redirecting you to the platform...
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="w-full max-w-md space-y-6 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="text-center" variants={itemVariants}>
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </motion.div>
          </Link>
          <motion.h1 
            className="text-3xl font-bold text-primary"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            The Speaker Sphere
          </motion.h1>
          <motion.div className="flex items-center justify-center mt-2 space-x-2">
            <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
            <p className="text-gray-600">Join our community of healthcare speakers</p>
            <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
          </motion.div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="shadow-xl backdrop-blur-sm bg-white/90 border-0">
            <CardHeader className="space-y-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <CardTitle className="text-2xl text-center">Get Started</CardTitle>
                <CardDescription className="text-center">
                  Sign in to your account or create a new one
                </CardDescription>
              </motion.div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Sign In</TabsTrigger>
                    <TabsTrigger value="register">Create Account</TabsTrigger>
                  </TabsList>
                </motion.div>

                {/* Login Tab */}
                <AnimatePresence mode="wait">
                  <TabsContent value="login" className="space-y-4">
                    <motion.form
                      key="login-form"
                      onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                      className="space-y-4"
                      variants={formVariants}
                      initial="exit"
                      animate="enter"
                      exit="exit"
                    >
                      <motion.div
                        className="space-y-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <Label htmlFor="login-email">Email</Label>
                        <motion.div
                          whileFocus={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="your.email@example.com"
                            {...loginForm.register("email")}
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                          />
                        </motion.div>
                        <AnimatePresence>
                          {loginForm.formState.errors.email && (
                            <motion.p
                              className="text-sm text-red-600"
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                            >
                              {loginForm.formState.errors.email.message}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      <motion.div
                        className="space-y-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Label htmlFor="login-password">Password</Label>
                        <motion.div
                          className="relative"
                          whileFocus={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            {...loginForm.register("password")}
                            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 pr-10"
                          />
                          <motion.button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            onClick={() => setShowPassword(!showPassword)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </motion.button>
                        </motion.div>
                        <AnimatePresence>
                          {loginForm.formState.errors.password && (
                            <motion.p
                              className="text-sm text-red-600"
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                            >
                              {loginForm.formState.errors.password.message}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button 
                            type="submit" 
                            className={`w-full transition-all duration-300 ${
                              submitStep === "success" ? "bg-green-500 hover:bg-green-600" :
                              submitStep === "error" ? "bg-red-500 hover:bg-red-600" :
                              "bg-primary hover:bg-blue-700"
                            }`}
                            disabled={loginMutation.isPending || submitStep === "loading"}
                          >
                            {getButtonContent(true)}
                          </Button>
                        </motion.div>
                      </motion.div>
                    </motion.form>
                  </TabsContent>
                </AnimatePresence>

                {/* Register Tab */}
                <TabsContent value="register" className="space-y-4">
                  <motion.form
                    key="register-form"
                    onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                    className="space-y-4"
                    variants={formVariants}
                    initial="exit"
                    animate="enter"
                    exit="exit"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <motion.div
                        className="space-y-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <Label htmlFor="register-firstName">First Name *</Label>
                        <Input
                          id="register-firstName"
                          placeholder="John"
                          {...registerForm.register("firstName")}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        />
                        <AnimatePresence>
                          {registerForm.formState.errors.firstName && (
                            <motion.p
                              className="text-sm text-red-600"
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                            >
                              {registerForm.formState.errors.firstName.message}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </motion.div>
                      
                      <motion.div
                        className="space-y-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <Label htmlFor="register-lastName">Last Name *</Label>
                        <Input
                          id="register-lastName"
                          placeholder="Doe"
                          {...registerForm.register("lastName")}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                        />
                        <AnimatePresence>
                          {registerForm.formState.errors.lastName && (
                            <motion.p
                              className="text-sm text-red-600"
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                            >
                              {registerForm.formState.errors.lastName.message}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>

                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Label htmlFor="register-email">Email *</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="your.email@example.com"
                        {...registerForm.register("email")}
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      />
                      <AnimatePresence>
                        {registerForm.formState.errors.email && (
                          <motion.p
                            className="text-sm text-red-600"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                          >
                            {registerForm.formState.errors.email.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Label htmlFor="register-password">Password *</Label>
                      <motion.div
                        className="relative"
                        whileFocus={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          {...registerForm.register("password")}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 pr-10"
                        />
                        <motion.button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </motion.button>
                      </motion.div>
                      <AnimatePresence>
                        {registerForm.formState.errors.password && (
                          <motion.p
                            className="text-sm text-red-600"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                          >
                            {registerForm.formState.errors.password.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Label htmlFor="register-confirmPassword">Confirm Password *</Label>
                      <motion.div
                        className="relative"
                        whileFocus={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Input
                          id="register-confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          {...registerForm.register("confirmPassword")}
                          className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 pr-10"
                        />
                        <motion.button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </motion.button>
                      </motion.div>
                      <AnimatePresence>
                        {registerForm.formState.errors.confirmPassword && (
                          <motion.p
                            className="text-sm text-red-600"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                          >
                            {registerForm.formState.errors.confirmPassword.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button 
                          type="submit" 
                          className={`w-full transition-all duration-300 ${
                            submitStep === "success" ? "bg-green-500 hover:bg-green-600" :
                            submitStep === "error" ? "bg-red-500 hover:bg-red-600" :
                            "bg-primary hover:bg-blue-700"
                          }`}
                          disabled={registerMutation.isPending || submitStep === "loading"}
                        >
                          {getButtonContent(false)}
                        </Button>
                      </motion.div>
                    </motion.div>
                  </motion.form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Benefits */}
        <motion.div 
          className="text-center space-y-4"
          variants={itemVariants}
        >
          <h3 className="text-lg font-semibold text-gray-900">Why create an account?</h3>
          <div className="grid gap-3 text-sm text-gray-600">
            <motion.div 
              className="flex items-center justify-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Save and organize your favorite speakers</span>
            </motion.div>
            <motion.div 
              className="flex items-center justify-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Leave reviews and track your event history</span>
            </motion.div>
            <motion.div 
              className="flex items-center justify-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Get personalized speaker recommendations</span>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}