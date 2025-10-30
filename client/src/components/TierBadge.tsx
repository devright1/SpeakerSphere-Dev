import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Crown, Star, User } from "lucide-react";

type SubscriptionTier = "basic" | "pro" | "premier";

interface TierBadgeProps {
  tier: SubscriptionTier;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

const tierConfig = {
  basic: {
    label: "Speaker",
    color: "bg-gray-100 text-gray-700 border-gray-300",
    icon: User,
    tooltip: "Basic profile with essential features for getting listed on the platform",
  },
  pro: {
    label: "Featured Speaker",
    color: "bg-blue-50 text-blue-700 border-blue-300",
    icon: Star,
    tooltip: "Enhanced visibility with homepage rotation, expanded profile, and analytics",
  },
  premier: {
    label: "Premier Speaker",
    color: "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-400",
    icon: Crown,
    tooltip: "Maximum exposure with top placement, unlimited content, and the exclusive Speaker Vault",
  },
};

export default function TierBadge({ tier, showIcon = true, size = "md" }: TierBadgeProps) {
  const config = tierConfig[tier];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={`${config.color} ${sizeClasses[size]} font-semibold border inline-flex items-center gap-1.5`}
            data-testid={`badge-tier-${tier}`}
          >
            {showIcon && <Icon className={iconSizes[size]} />}
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
