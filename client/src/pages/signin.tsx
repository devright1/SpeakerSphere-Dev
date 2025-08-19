import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useLogin, useAuth } from "@/hooks/useAuth";
import { User, Stethoscope, Eye, EyeOff } from "lucide-react";
import { useEffect } from "react";

export default function SignIn() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const loginMutation = useLogin();

  const [reviewerData, setReviewerData] = useState({
    email: "",
    password: "",
  });

  const [speakerData, setSpeakerData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState({
    reviewer: false,
    speaker: false,
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const handleLogin = async (userType: 'reviewer' | 'speaker') => {
    const data = userType === 'reviewer' ? reviewerData : speakerData;
    
    if (!data.email || !data.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await loginMutation.mutateAsync(data);
      toast({
        title: "Success",
        description: "Signed in successfully!",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to SpeakerSphere
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Sign in to your account
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Choose your account type to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="reviewer" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="reviewer" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Reviewer
                </TabsTrigger>
                <TabsTrigger value="speaker" className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Speaker
                </TabsTrigger>
              </TabsList>

              <TabsContent value="reviewer" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Alert>
                    <User className="h-4 w-4" />
                    <AlertDescription>
                      For healthcare professionals who want to review and rate speakers
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reviewer-email">Email</Label>
                    <Input
                      id="reviewer-email"
                      type="email"
                      placeholder="Enter your email"
                      value={reviewerData.email}
                      onChange={(e) => setReviewerData({ ...reviewerData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reviewer-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="reviewer-password"
                        type={showPassword.reviewer ? "text" : "password"}
                        placeholder="Enter your password"
                        value={reviewerData.password}
                        onChange={(e) => setReviewerData({ ...reviewerData, password: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword({ ...showPassword, reviewer: !showPassword.reviewer })}
                      >
                        {showPassword.reviewer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleLogin('reviewer')}
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Signing In..." : "Sign In as Reviewer"}
                  </Button>

                  <div className="text-center">
                    <Link href="/signup" className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                      Don't have an account? Sign up
                    </Link>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="speaker" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Alert>
                    <Stethoscope className="h-4 w-4" />
                    <AlertDescription>
                      For speakers who want to manage their profile and view analytics
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="speaker-email">Email</Label>
                    <Input
                      id="speaker-email"
                      type="email"
                      placeholder="Enter your email"
                      value={speakerData.email}
                      onChange={(e) => setSpeakerData({ ...speakerData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="speaker-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="speaker-password"
                        type={showPassword.speaker ? "text" : "password"}
                        placeholder="Enter your password"
                        value={speakerData.password}
                        onChange={(e) => setSpeakerData({ ...speakerData, password: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword({ ...showPassword, speaker: !showPassword.speaker })}
                      >
                        {showPassword.speaker ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleLogin('speaker')}
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Signing In..." : "Sign In as Speaker"}
                  </Button>

                  <div className="text-center">
                    <Link href="/signup" className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                      Don't have an account? Sign up
                    </Link>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
            ← Back to SpeakerSphere
          </Link>
        </div>
      </div>
    </div>
  );
}