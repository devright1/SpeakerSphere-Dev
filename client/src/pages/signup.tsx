import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useRegisterReviewer, useRegisterSpeaker, useVerifySpeaker, useAuth } from "@/hooks/useAuth";
import { User, Stethoscope, Eye, EyeOff, Search, CheckCircle, XCircle } from "lucide-react";
import { useEffect } from "react";

export default function SignUp() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const registerReviewerMutation = useRegisterReviewer();
  const registerSpeakerMutation = useRegisterSpeaker();
  const verifySpeakerMutation = useVerifySpeaker();

  const [reviewerData, setReviewerData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    title: "",
    company: "",
  });

  const [speakerData, setSpeakerData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    title: "",
    company: "",
    speakerId: "",
  });

  const [speakerVerification, setSpeakerVerification] = useState<{
    verified: boolean;
    speaker?: any;
    message?: string;
  } | null>(null);

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

  const handleVerifySpeaker = async () => {
    if (!speakerData.speakerId || !speakerData.email) {
      toast({
        title: "Error",
        description: "Please enter both Speaker ID and email",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await verifySpeakerMutation.mutateAsync({
        speakerId: parseInt(speakerData.speakerId),
        email: speakerData.email,
      });
      setSpeakerVerification(result);
      
      if (result.verified) {
        toast({
          title: "Verification Successful",
          description: "Your speaker profile has been verified!",
        });
      } else {
        toast({
          title: "Verification Failed", 
          description: result.message || "Unable to verify speaker profile",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification Error",
        description: error.message || "Failed to verify speaker profile",
        variant: "destructive",
      });
    }
  };

  const handleRegisterReviewer = async () => {
    if (!reviewerData.email || !reviewerData.password || !reviewerData.firstName || !reviewerData.lastName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await registerReviewerMutation.mutateAsync(reviewerData);
      toast({
        title: "Success",
        description: "Reviewer account created successfully!",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    }
  };

  const handleRegisterSpeaker = async () => {
    if (!speakerData.email || !speakerData.password || !speakerData.firstName || !speakerData.lastName || !speakerData.speakerId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!speakerVerification?.verified) {
      toast({
        title: "Error",
        description: "Please verify your speaker profile first",
        variant: "destructive",
      });
      return;
    }

    try {
      await registerSpeakerMutation.mutateAsync({
        ...speakerData,
        speakerId: parseInt(speakerData.speakerId),
      });
      toast({
        title: "Success",
        description: "Speaker account created successfully!",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Join SpeakerSphere
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Create your account to get started
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Sign Up</CardTitle>
            <CardDescription className="text-center">
              Choose your account type to begin
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
                      Create an account to review speakers, save favorites, and track your reviews
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reviewer-first-name">First Name *</Label>
                    <Input
                      id="reviewer-first-name"
                      placeholder="First name"
                      value={reviewerData.firstName}
                      onChange={(e) => setReviewerData({ ...reviewerData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reviewer-last-name">Last Name *</Label>
                    <Input
                      id="reviewer-last-name"
                      placeholder="Last name"
                      value={reviewerData.lastName}
                      onChange={(e) => setReviewerData({ ...reviewerData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reviewer-email">Email *</Label>
                  <Input
                    id="reviewer-email"
                    type="email"
                    placeholder="Enter your email"
                    value={reviewerData.email}
                    onChange={(e) => setReviewerData({ ...reviewerData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reviewer-title">Title</Label>
                  <Input
                    id="reviewer-title"
                    placeholder="e.g., Dentist, Oral Surgeon"
                    value={reviewerData.title}
                    onChange={(e) => setReviewerData({ ...reviewerData, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reviewer-company">Practice/Company</Label>
                  <Input
                    id="reviewer-company"
                    placeholder="Practice or company name"
                    value={reviewerData.company}
                    onChange={(e) => setReviewerData({ ...reviewerData, company: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reviewer-password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="reviewer-password"
                      type={showPassword.reviewer ? "text" : "password"}
                      placeholder="Create a password (min 6 characters)"
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
                  onClick={handleRegisterReviewer}
                  className="w-full"
                  disabled={registerReviewerMutation.isPending}
                >
                  {registerReviewerMutation.isPending ? "Creating Account..." : "Create Reviewer Account"}
                </Button>

                <div className="text-center">
                  <Link href="/signin" className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    Already have an account? Sign in
                  </Link>
                </div>
              </TabsContent>

              <TabsContent value="speaker" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Alert>
                    <Stethoscope className="h-4 w-4" />
                    <AlertDescription>
                      Link your existing speaker profile to manage your information and view analytics
                    </AlertDescription>
                  </Alert>
                  
                  <Alert className="border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20">
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      <strong>Need your Speaker ID?</strong>{" "}
                      <Link href="/speaker-lookup" className="underline hover:no-underline">
                        Search for your profile here
                      </Link>{" "}
                      to find your ID and verify your information.
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="speaker-id">Speaker ID *</Label>
                      <Input
                        id="speaker-id"
                        placeholder="Your speaker ID"
                        value={speakerData.speakerId}
                        onChange={(e) => setSpeakerData({ ...speakerData, speakerId: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="verify-email">Email *</Label>
                      <Input
                        id="verify-email"
                        type="email"
                        placeholder="Profile email"
                        value={speakerData.email}
                        onChange={(e) => setSpeakerData({ ...speakerData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleVerifySpeaker}
                    variant="outline"
                    className="w-full"
                    disabled={verifySpeakerMutation.isPending}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {verifySpeakerMutation.isPending ? "Verifying..." : "Verify Speaker Profile"}
                  </Button>

                  {speakerVerification && (
                    <Alert className={speakerVerification.verified ? "border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20" : "border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20"}>
                      {speakerVerification.verified ? (
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                      <AlertDescription className={speakerVerification.verified ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}>
                        {speakerVerification.message}
                        {speakerVerification.speaker && (
                          <div className="mt-2 flex items-center gap-2">
                            <img
                              src={speakerVerification.speaker.imageUrl}
                              alt={speakerVerification.speaker.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-medium">{speakerVerification.speaker.name}</div>
                              <div className="text-sm opacity-75">{speakerVerification.speaker.title}</div>
                            </div>
                            {speakerVerification.speaker.verified && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Verified
                              </Badge>
                            )}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {speakerVerification?.verified && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="speaker-first-name">First Name *</Label>
                          <Input
                            id="speaker-first-name"
                            placeholder="First name"
                            value={speakerData.firstName}
                            onChange={(e) => setSpeakerData({ ...speakerData, firstName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="speaker-last-name">Last Name *</Label>
                          <Input
                            id="speaker-last-name"
                            placeholder="Last name"
                            value={speakerData.lastName}
                            onChange={(e) => setSpeakerData({ ...speakerData, lastName: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="speaker-title">Title</Label>
                        <Input
                          id="speaker-title"
                          placeholder="Professional title"
                          value={speakerData.title}
                          onChange={(e) => setSpeakerData({ ...speakerData, title: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="speaker-company">Practice/Company</Label>
                        <Input
                          id="speaker-company"
                          placeholder="Practice or company name"
                          value={speakerData.company}
                          onChange={(e) => setSpeakerData({ ...speakerData, company: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="speaker-password">Password *</Label>
                        <div className="relative">
                          <Input
                            id="speaker-password"
                            type={showPassword.speaker ? "text" : "password"}
                            placeholder="Create a password (min 6 characters)"
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
                        onClick={handleRegisterSpeaker}
                        className="w-full"
                        disabled={registerSpeakerMutation.isPending}
                      >
                        {registerSpeakerMutation.isPending ? "Creating Account..." : "Create Speaker Account"}
                      </Button>
                    </>
                  )}

                  <div className="text-center">
                    <Link href="/signin" className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                      Already have an account? Sign in
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