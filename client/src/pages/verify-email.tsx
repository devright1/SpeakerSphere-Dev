import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function VerifyEmail() {
  const [location, setLocation] = useLocation();
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  // Extract token from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  const verifyEmailMutation = useMutation({
    mutationFn: async (token: string) => {
      return apiRequest("GET", `/api/auth/verify-email/${token}`);
    },
    onSuccess: () => {
      setVerificationStatus("success");
      // Redirect to login after 3 seconds
      setTimeout(() => {
        setLocation("/login");
      }, 3000);
    },
    onError: (error: any) => {
      setVerificationStatus("error");
      setErrorMessage(error.message || "Verification failed. Please try again.");
    },
  });

  useEffect(() => {
    if (!token) {
      setVerificationStatus("error");
      setErrorMessage("No verification token provided");
      return;
    }

    // Verify email with token
    verifyEmailMutation.mutate(token);
  }, [token]);

  const handleReturnToLogin = () => {
    setLocation("/login");
  };

  const handleReturnToHome = () => {
    setLocation("/");
  };

  if (verificationStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Verifying Your Email
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">
              Please wait while we verify your email address...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Email Verified Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-gray-600">
              Welcome to SpeakerSphere! Your account has been verified and is now active.
            </p>
            
            <div className="bg-green-50 p-4 rounded-lg text-sm text-green-800">
              <p className="font-medium mb-2">You can now:</p>
              <ul className="space-y-1 text-left">
                <li>• Browse our speaker database</li>
                <li>• Read detailed speaker profiles</li>
                <li>• Submit inquiries to speakers</li>
                <li>• Leave reviews and feedback</li>
                <li>• Bookmark your favorite speakers</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleReturnToLogin}
                className="w-full"
              >
                Sign In to Your Account
              </Button>
              
              <Button
                onClick={handleReturnToHome}
                variant="outline"
                className="w-full"
              >
                Explore Speakers
              </Button>
            </div>

            <p className="text-sm text-gray-500">
              Redirecting to login in 3 seconds...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Verification Failed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-600">
            {errorMessage}
          </p>
          
          <div className="bg-red-50 p-4 rounded-lg text-sm text-red-800">
            <p className="font-medium mb-2">Possible reasons:</p>
            <ul className="space-y-1 text-left">
              <li>• The verification link has expired (24 hours)</li>
              <li>• The link has already been used</li>
              <li>• Invalid or corrupted verification token</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleReturnToLogin}
              className="w-full"
            >
              Back to Login
            </Button>
            
            <Button
              onClick={handleReturnToHome}
              variant="outline"
              className="w-full"
            >
              Go to Homepage
            </Button>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-2">
              Need help? Try:
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => setLocation("/register")}
                variant="ghost"
                size="sm"
                className="text-blue-600"
              >
                <Mail className="w-4 h-4 mr-2" />
                Resend Verification Email
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}