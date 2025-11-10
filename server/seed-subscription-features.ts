import { db } from "./db";
import { subscriptionFeatures, subscriptionTierFeatures } from "@shared/schema";

// Default features based on current tier benefits
const defaultFeatures = [
  // Basic tier features
  { slug: "profile-listing", name: "Profile listing", description: "Your speaker profile visible to potential clients", tier: "basic", sortOrder: 1, isHighlighted: false },
  { slug: "basic-analytics", name: "Basic analytics", description: "Track profile views and engagement", tier: "basic", sortOrder: 2, isHighlighted: false },
  { slug: "email-support", name: "Email support", description: "Standard email support", tier: "basic", sortOrder: 3, isHighlighted: false },
  
  // Pro tier features
  { slug: "featured-search", name: "Featured in search", description: "Enhanced visibility in search results", tier: "pro", sortOrder: 1, isHighlighted: true },
  { slug: "priority-placement", name: "Priority placement", description: "Higher ranking in category listings", tier: "pro", sortOrder: 2, isHighlighted: true },
  { slug: "advanced-analytics", name: "Advanced analytics", description: "Detailed insights on profile performance", tier: "pro", sortOrder: 3, isHighlighted: false },
  { slug: "video-portfolio", name: "Video portfolio", description: "Showcase your speaking videos", tier: "pro", sortOrder: 4, isHighlighted: false },
  { slug: "priority-support", name: "Priority support", description: "Faster response times for support requests", tier: "pro", sortOrder: 5, isHighlighted: false },
  { slug: "custom-branding", name: "Custom branding", description: "Personalize your speaker profile", tier: "pro", sortOrder: 6, isHighlighted: false },
  
  // Premier tier features
  { slug: "top-placement", name: "Top search placement", description: "Guaranteed top positions in search and category pages", tier: "premier", sortOrder: 1, isHighlighted: true },
  { slug: "homepage-feature", name: "Homepage feature", description: "Regular featuring on the homepage", tier: "premier", sortOrder: 2, isHighlighted: true },
  { slug: "premium-badge", name: "Premium badge", description: "Distinguished Premier tier badge on your profile", tier: "premier", sortOrder: 3, isHighlighted: true },
  { slug: "unlimited-videos", name: "Unlimited videos", description: "Upload unlimited speaking videos", tier: "premier", sortOrder: 4, isHighlighted: false },
  { slug: "24-7-support", name: "24/7 priority support", description: "Round-the-clock priority assistance", tier: "premier", sortOrder: 5, isHighlighted: false },
  { slug: "newsletter-feature", name: "Featured in newsletters", description: "Regular inclusion in platform newsletters", tier: "premier", sortOrder: 6, isHighlighted: false },
  { slug: "account-manager", name: "Dedicated account manager", description: "Personal support specialist for your success", tier: "premier", sortOrder: 7, isHighlighted: false },
];

async function seedSubscriptionFeatures() {
  console.log("Seeding subscription features...");
  
  try {
    // Check if features already exist
    const existingFeatures = await db.select().from(subscriptionFeatures).limit(1);
    
    if (existingFeatures.length > 0) {
      console.log("Subscription features already seeded. Skipping.");
      return;
    }
    
    // Create unique features (slug-based deduplication)
    const uniqueFeatures = Array.from(
      new Map(defaultFeatures.map(f => [f.slug, { slug: f.slug, name: f.name, description: f.description }])).values()
    );
    
    // Insert features
    const insertedFeatures = await db.insert(subscriptionFeatures)
      .values(uniqueFeatures)
      .returning();
    
    console.log(`Inserted ${insertedFeatures.length} subscription features`);
    
    // Map slug to feature ID
    const featureMap = new Map(insertedFeatures.map(f => [f.slug, f.id]));
    
    // Insert tier-feature mappings
    const tierFeatureMappings = defaultFeatures.map(f => ({
      tier: f.tier,
      featureId: featureMap.get(f.slug)!,
      sortOrder: f.sortOrder,
      isHighlighted: f.isHighlighted,
    }));
    
    await db.insert(subscriptionTierFeatures).values(tierFeatureMappings);
    
    console.log(`Inserted ${tierFeatureMappings.length} tier-feature mappings`);
    console.log("Subscription features seeded successfully!");
  } catch (error) {
    console.error("Error seeding subscription features:", error);
    throw error;
  }
}

export { seedSubscriptionFeatures };

// Auto-run when executed directly
seedSubscriptionFeatures()
  .then(() => {
    console.log("Seed completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
