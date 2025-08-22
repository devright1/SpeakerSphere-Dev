import { db } from "./db";
import { subscriptionPlans } from "../shared/schema";

export async function seedSubscriptionPlans() {
  try {
    // Check if plans already exist
    const existingPlans = await db.select().from(subscriptionPlans);
    if (existingPlans.length > 0) {
      console.log("Subscription plans already exist");
      return;
    }

    // Create default subscription plans
    const plans = [
      {
        name: "Free",
        slug: "free",
        description: "Basic access to speaker discovery and reviews",
        price: "0.00",
        yearlyPrice: "0.00",
        features: [
          "Browse speaker profiles",
          "Read reviews and ratings",
          "Basic search functionality",
          "Save up to 5 bookmarks",
          "Submit up to 2 inquiries per month"
        ],
        maxBookmarks: 5,
        maxInquiries: 2,
        maxReviews: 1,
        advancedFilters: false,
        prioritySupport: false,
        customReports: false,
        isActive: true
      },
      {
        name: "Premium",
        slug: "premium",
        description: "Enhanced features for active healthcare professionals",
        price: "19.99",
        yearlyPrice: "199.99",
        features: [
          "Everything in Free",
          "Advanced search filters",
          "Unlimited bookmarks",
          "Unlimited inquiries",
          "Priority customer support",
          "Speaker comparison tools",
          "Email notifications",
          "Export speaker lists"
        ],
        maxBookmarks: -1,
        maxInquiries: -1,
        maxReviews: 5,
        advancedFilters: true,
        prioritySupport: true,
        customReports: false,
        isActive: true
      },
      {
        name: "Pro",
        slug: "pro",
        description: "Complete solution for organizations and event planners",
        price: "49.99",
        yearlyPrice: "499.99",
        features: [
          "Everything in Premium",
          "Custom analytics reports",
          "Team collaboration tools",
          "API access",
          "Dedicated account manager",
          "Custom speaker matching",
          "Bulk inquiry management",
          "White-label options"
        ],
        maxBookmarks: -1,
        maxInquiries: -1,
        maxReviews: -1,
        advancedFilters: true,
        prioritySupport: true,
        customReports: true,
        isActive: true
      }
    ];

    await db.insert(subscriptionPlans).values(plans);
    console.log("✅ Subscription plans seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding subscription plans:", error);
    throw error;
  }
}