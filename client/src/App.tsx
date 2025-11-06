import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/providers/AuthProvider";
import { trackPageView } from "@/lib/analytics";
import Home from "@/pages/home";
import Speakers from "@/pages/speakers";
import SpeakerProfile from "@/pages/speaker-profile";
import Categories from "@/pages/categories";
import Auth from "@/pages/auth";
import Profile from "@/pages/profile";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin";
import ForSpeakers from "@/pages/for-speakers";
import SpeakerApplication from "@/pages/speaker-application";
import SpeakerDashboard from "@/pages/speaker-dashboard";
import Register from "@/pages/register";
import VerifyEmail from "@/pages/verify-email";
import HowItWorks from "@/pages/how-it-works";
import SubscriptionUpgrade from "@/pages/subscription-upgrade";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();

  // Track page views with Google Analytics on route change
  useEffect(() => {
    trackPageView(location);
  }, [location]);

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/speakers" component={Speakers} />
      <Route path="/speakers/:name" component={SpeakerProfile} />
      <Route path="/categories" component={Categories} />
      <Route path="/auth" component={Auth} />
      <Route path="/login" component={Auth} />
      <Route path="/register" component={Register} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/profile" component={Profile} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/for-speakers" component={ForSpeakers} />
      <Route path="/speaker-application" component={SpeakerApplication} />
      <Route path="/speaker-dashboard" component={SpeakerDashboard} />
      <Route path="/subscription/upgrade" component={SubscriptionUpgrade} />
      <Route path="/subscription/success" component={SubscriptionUpgrade} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
