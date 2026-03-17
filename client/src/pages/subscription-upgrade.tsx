import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTierLimits, formatTierLimit } from "@/hooks/useTierLimits";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Check, Crown, Star, Users, Loader2, ChevronRight } from "lucide-react";
import { GA_EVENTS } from "@/lib/analytics";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function SubscriptionUpgrade() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isAnnual, setIsAnnual] = useState(false);
  const [processingTier, setProcessingTier] = useState<string | null>(null);

  // Get current subscription status
  const { data: subscriptionStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery<{
    tier: string;
    status: string;
    periodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    cancelledAt?: Date | null;
    amount?: number;
    interval?: string;
  }>({
    queryKey: ["/api/subscriptions/status", user?.speakerId],
    enabled: isAuthenticated && !!user?.speakerId,
  });

  // Get subscription features
  const { data: subscriptionFeatures, isLoading: featuresLoading } = useQuery<{
    basic: Array<{ id: number; name: string; description: string | null; sortOrder: number; isHighlighted: boolean }>;
    pro: Array<{ id: number; name: string; description: string | null; sortOrder: number; isHighlighted: boolean }>;
    premier: Array<{ id: number; name: string; description: string | null; sortOrder: number; isHighlighted: boolean }>;
  }>({
    queryKey: ["/api/subscriptions/features"],
  });

  // Get tier limits for display
  const { data: tierLimits, isLoading: tierLimitsLoading } = useTierLimits();
  
  // Helper to get limit value for a specific tier and limit type (delegates to shared formatter)
  const getLimit = (tier: string, limitType: 'bioWordLimit' | 'topicLimit' | 'uploadLimit' | 'storageLimitMb' | 'maxFileSizeMb'): string => {
    return formatTierLimit(tierLimits, tier, limitType);
  };

  // Track successful purchase when returning from Stripe
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    // If we have a session_id, the user just completed a Stripe checkout
    if (sessionId) {
      // Prevent duplicate tracking by checking if we've already tracked this session
      const trackedSessions = sessionStorage.getItem('tracked_sessions');
      const tracked = trackedSessions ? JSON.parse(trackedSessions) : [];
      
      if (!tracked.includes(sessionId)) {
        // Fetch session metadata from backend to get accurate tier, interval, and price
        fetch(`/api/subscriptions/session/${sessionId}`)
          .then(res => res.json())
          .then(data => {
            if (data.tier && data.interval && data.price) {
              // Track purchase completion with Google Analytics using authoritative data
              GA_EVENTS.completePurchase(data.tier, data.interval, data.price);
              
              toast({
                title: "Subscription Activated!",
                description: `Your ${data.tier} subscription is now active. Welcome!`,
              });
              
              // Mark this session as tracked
              tracked.push(sessionId);
              sessionStorage.setItem('tracked_sessions', JSON.stringify(tracked));
              
              // Clean up URL
              window.history.replaceState({}, '', location);
            }
          })
          .catch(error => {
            console.error('Failed to retrieve session metadata:', error);
          });
      }
    }
  }, [location, toast]);

  // Subscription checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: async ({ tier, interval }: { tier: string; interval: string }) => {
      const response = await apiRequest("POST", "/api/subscriptions/create-checkout", { tier, interval });
      return response;
    },
    onSuccess: async (data) => {
      console.log('Checkout response:', data);
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe failed to load");
      }
      
      // Open Stripe Checkout in a new tab (avoids cross-origin issues in Replit iframe)
      if (data.url) {
        console.log('Opening Stripe URL:', data.url);
        window.open(data.url, '_blank');
      } else {
        console.error('No URL in response:', data);
        toast({
          title: "Error",
          description: "Failed to get checkout URL from server",
          variant: "destructive",
        });
        setProcessingTier(null);
      }
    },
    onError: (error: any) => {
      setProcessingTier(null);
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout process",
        variant: "destructive",
      });
    },
  });

  // Resume subscription mutation
  const resumeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/subscriptions/reactivate", {});
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Subscription Resumed",
        description: "Your subscription has been reactivated. You'll be charged on your next renewal date.",
      });
      refetchStatus();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resume subscription",
        variant: "destructive",
      });
    },
  });

  const handleUpgrade = (tier: "pro" | "premier") => {
    if (!isAuthenticated) {
      setLocation("/for-speakers");
      return;
    }

    const interval = isAnnual ? "annual" : "monthly";
    const price = isAnnual ? pricing[tier].annual : pricing[tier].monthly;
    
    // Track checkout initiation with Google Analytics
    GA_EVENTS.initiateCheckout(tier, interval, price);

    setProcessingTier(tier);
    checkoutMutation.mutate({
      tier,
      interval,
    });
  };

  const handleResumeSubscription = () => {
    resumeMutation.mutate();
  };

  const currentTier = subscriptionStatus?.tier || "basic";
  
  // Check if subscription is canceled but still active
  const isCanceledButActive = !!(
    subscriptionStatus?.cancelledAt && 
    subscriptionStatus?.periodEnd && 
    new Date(subscriptionStatus.periodEnd) > new Date()
  );
  const isBasic = currentTier === "basic";
  const isPro = currentTier === "pro";
  const isPremier = currentTier === "premier";

  const pricing = {
    pro: {
      monthly: 29,
      annual: 290,
    },
    premier: {
      monthly: 99,
      annual: 990,
    },
  };

  const annualSavings = {
    pro: (pricing.pro.monthly * 12) - pricing.pro.annual,
    premier: (pricing.premier.monthly * 12) - pricing.premier.annual,
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Speaker Login Required</CardTitle>
              <CardDescription>
                Please sign in to your speaker account to upgrade your subscription tier.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation("/for-speakers")}>
                Sign In
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Upgrade Your Speaker Profile
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Increase your visibility and reach more healthcare professionals with our premium tiers
          </p>
          
          {/* Current Tier Badge */}
          {!statusLoading && (
            <div className="inline-flex flex-col items-center gap-2">
              <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-sm">
                <span className="text-sm text-gray-600">Current tier:</span>
                <Badge className={
                  currentTier === "premier" 
                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white"
                    : currentTier === "pro"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-600 text-white"
                }>
                  {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
                </Badge>
              </div>
              
              {/* Show expiration notice and Resume button if canceled but still active */}
              {isCanceledButActive && subscriptionStatus?.periodEnd && (
                <div className="flex flex-col items-center gap-3 mt-2">
                  <p className="text-sm text-orange-600 font-medium">
                    Active until {new Date(subscriptionStatus.periodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <Button 
                    onClick={handleResumeSubscription}
                    disabled={resumeMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="button-resume-subscription"
                  >
                    {resumeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Resuming...
                      </>
                    ) : (
                      'Resume Subscription'
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 max-w-md text-center">
                    Your next charge will be on {new Date(subscriptionStatus.periodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Label htmlFor="billing-toggle" className={!isAnnual ? "font-semibold" : ""}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <Label htmlFor="billing-toggle" className={isAnnual ? "font-semibold" : ""}>
              Annual
              <Badge className="ml-2 bg-green-600 text-white">
                Save {isAnnual ? "17%" : "up to 17%"}
              </Badge>
            </Label>
          </div>
        </div>

        {/* Pricing Cards - Always show all three tiers for comparison */}
        <div className="grid gap-8 mb-12 md:grid-cols-3">
          {/* Basic Tier */}
          {(
            <Card className={`relative ${isBasic ? "border-2 border-primary" : ""}`}>
            {isBasic && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-primary text-white">Current Plan</Badge>
              </div>
            )}
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3">
                <Users className="w-6 h-6 text-gray-600" />
              </div>
              <CardTitle>Speaker</CardTitle>
              <div className="mt-4">
                <span className="text-3xl font-bold">Free</span>
              </div>
              <CardDescription>Get Listed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {featuresLoading || tierLimitsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <>
                  {/* Profile Limits */}
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-semibold">{getLimit('basic', 'bioWordLimit')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-semibold">{getLimit('basic', 'topicLimit')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-semibold">{getLimit('basic', 'uploadLimit')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-semibold">{getLimit('basic', 'storageLimitMb')}</span>
                  </div>
                  {subscriptionFeatures?.basic?.map((feature) => (
                    <div key={feature.id} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature.name}</span>
                    </div>
                  ))}
                </>
              )}
              <Button className="w-full mt-6" variant="outline" disabled>
                Current Plan
              </Button>
            </CardContent>
          </Card>
          )}

          {/* Pro Tier */}
          {(
            <Card className={`relative ${isPro ? "border-2 border-primary" : "border-2 border-blue-600 shadow-xl"}`}>
              {isPro ? (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Badge className="bg-primary text-white">Current Plan</Badge>
                </div>
              ) : (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Badge className="bg-blue-600 text-white">Popular</Badge>
                </div>
              )}
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
                <Star className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Featured Speaker</CardTitle>
              <div className="mt-4">
                <span className="text-3xl font-bold">
                  ${isAnnual ? pricing.pro.annual : pricing.pro.monthly}
                </span>
                <span className="text-gray-600">/{isAnnual ? "year" : "month"}</span>
              </div>
              {isAnnual && (
                <div className="text-sm text-green-600 font-medium">
                  Save ${annualSavings.pro}/year
                </div>
              )}
              <CardDescription>Enhanced Visibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {featuresLoading || tierLimitsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <>
                  {/* Profile Limits */}
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-semibold">{getLimit('pro', 'bioWordLimit')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-semibold">{getLimit('pro', 'topicLimit')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-semibold">{getLimit('pro', 'uploadLimit')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-semibold">{getLimit('pro', 'storageLimitMb')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">Everything in Basic, plus:</span>
                  </div>
                  {subscriptionFeatures?.pro?.map((feature) => (
                    <div key={feature.id} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature.name}</span>
                    </div>
                  ))}
                </>
              )}
              {isPro ? (
                <Button className="w-full mt-6" variant="outline" disabled>
                  Current Plan
                </Button>
              ) : isPremier ? (
                <Button className="w-full mt-6" variant="outline" disabled>
                  Included in Premier
                </Button>
              ) : (
                <Button 
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => handleUpgrade("pro")}
                  disabled={processingTier !== null}
                >
                  {processingTier === "pro" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Upgrade to Pro`
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
          )}

          {/* Premier Tier */}
          {(
            <Card className={`relative ${isPremier ? "border-2 border-primary" : "border-2 border-amber-400"}`}>
            {isPremier && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-primary text-white">Current Plan</Badge>
              </div>
            )}
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-full mx-auto mb-3">
                <Crown className="w-6 h-6 text-amber-600" />
              </div>
              <CardTitle>Premier Speaker</CardTitle>
              <div className="mt-4">
                <span className="text-3xl font-bold">
                  ${isAnnual ? pricing.premier.annual : pricing.premier.monthly}
                </span>
                <span className="text-gray-600">/{isAnnual ? "year" : "month"}</span>
              </div>
              {isAnnual && (
                <div className="text-sm text-green-600 font-medium">
                  Save ${annualSavings.premier}/year
                </div>
              )}
              <CardDescription>Maximum Exposure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {featuresLoading || tierLimitsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <>
                  {/* Profile Limits */}
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-semibold">{getLimit('premier', 'bioWordLimit')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-semibold">{getLimit('premier', 'topicLimit')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-semibold">{getLimit('premier', 'uploadLimit')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-semibold">{getLimit('premier', 'storageLimitMb')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">Everything in Pro, plus:</span>
                  </div>
                  {subscriptionFeatures?.premier?.map((feature) => (
                    <div key={feature.id} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature.name}</span>
                    </div>
                  ))}
                </>
              )}
              {isPremier ? (
                <Button className="w-full mt-6" variant="outline" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button 
                  className="w-full mt-6 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
                  onClick={() => handleUpgrade("premier")}
                  disabled={processingTier !== null}
                >
                  {processingTier === "premier" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Upgrade to Premier`
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
          )}
        </div>

        {/* FAQ or additional information */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">How does billing work?</h4>
              <p>You'll be charged immediately upon upgrading. Annual subscriptions provide significant savings and are billed once per year.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Can I cancel anytime?</h4>
              <p>Yes! You can cancel your subscription at any time. Your benefits will continue until the end of your current billing period.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Can I upgrade from Pro to Premier?</h4>
              <p>Yes! You can upgrade at any time. The price difference will be prorated for your current billing period.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">What payment methods do you accept?</h4>
              <p>We accept all major credit cards through our secure payment processor, Stripe.</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}
