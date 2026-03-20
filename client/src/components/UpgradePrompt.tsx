import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, TrendingUp, BarChart3, LineChart, PieChart } from "lucide-react";

interface UpgradePromptProps {
  feature: "analytics" | "storage" | "social";
  currentTier: "basic" | "pro" | "premier";
  onUpgradeClick?: () => void;
}

export function UpgradePrompt({ feature, currentTier, onUpgradeClick }: UpgradePromptProps) {
  const featureContent = {
    analytics: {
      title: "Advanced Analytics",
      description: "Unlock detailed insights about your profile performance",
      benefits: [
        "Track profile views and engagement",
        "Monitor click-through rates",
        "View detailed visitor analytics",
        "Download analytics reports",
        "Analyze trends over time"
      ],
      icon: BarChart3
    },
    storage: {
      title: "Increased Storage",
      description: "Get more space for your content",
      benefits: [
        "Upload more resources",
        "Share larger files",
        "Build a comprehensive portfolio",
        "Never run out of space"
      ],
      icon: TrendingUp
    },
    social: {
      title: "Social Media Integration",
      description: "Connect with your audience across platforms",
      benefits: [
        "Display social media links",
        "Build your professional network",
        "Increase your reach",
        "Connect with potential clients"
      ],
      icon: LineChart
    }
  };

  const content = featureContent[feature];
  const Icon = content.icon;

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="max-w-2xl w-full border-2 border-gray-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {content.title}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {content.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Benefits List */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Icon className="w-5 h-5 mr-2 text-blue-600" />
              What you'll get with Premier:
            </h3>
            <ul className="space-y-3">
              {content.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Current Tier Message */}
          <div className="text-center text-sm text-gray-600">
            You're currently on the <span className="font-semibold capitalize">{currentTier}</span> tier
          </div>

          {/* CTA Button */}
          <Button 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-lg font-semibold shadow-lg"
            data-testid="button-upgrade-to-premier"
            onClick={onUpgradeClick}
          >
            Upgrade to Premier - $99/month
          </Button>

          {/* Additional Info */}
          <p className="text-center text-sm text-gray-500">
            Unlock all features and maximize your visibility
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
