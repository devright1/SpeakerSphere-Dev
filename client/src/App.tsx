import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Speakers from "@/pages/speakers";
import SpeakerProfile from "@/pages/speaker-profile";
import Categories from "@/pages/categories";
import Auth from "@/pages/auth";
import SignIn from "@/pages/signin";
import SignUp from "@/pages/signup";
import Profile from "@/pages/profile";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin";
import ForSpeakers from "@/pages/for-speakers";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/speakers" component={Speakers} />
      <Route path="/speakers/:name" component={SpeakerProfile} />
      <Route path="/categories" component={Categories} />
      <Route path="/auth" component={Auth} />
      <Route path="/signin" component={SignIn} />
      <Route path="/signup" component={SignUp} />
      <Route path="/profile" component={Profile} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/for-speakers" component={ForSpeakers} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
