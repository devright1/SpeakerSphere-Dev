import Stripe from "stripe";
import { storage } from "./storage";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover" as any,
});

export async function validateStripeSubscriptions() {
  try {
    const speakers = await storage.getSpeakers();
    const subscribedSpeakers = speakers.filter(s => s.stripeSubscriptionId);

    if (subscribedSpeakers.length === 0) {
      console.log("✅ No speakers with Stripe subscriptions to validate");
      return;
    }

    console.log(`🔍 Validating ${subscribedSpeakers.length} Stripe subscription(s)...`);

    let valid = 0;
    let downgraded = 0;

    for (const speaker of subscribedSpeakers) {
      try {
        const subscription = await stripe.subscriptions.retrieve(speaker.stripeSubscriptionId!);

        if (subscription.status === 'active' || subscription.status === 'trialing') {
          valid++;
        } else if (subscription.status === 'canceled' || subscription.status === 'unpaid' || subscription.status === 'incomplete_expired') {
          console.warn(`⚠️ Speaker ${speaker.id} (${speaker.name}) has ${subscription.status} subscription - downgrading to basic`);
          await storage.updateSpeaker(speaker.id, {
            subscriptionTier: 'basic',
            subscriptionStatus: 'canceled',
            stripeSubscriptionId: null,
            subscriptionPeriodEnd: null,
          });
          downgraded++;
        } else {
          valid++;
        }
      } catch (err: any) {
        if (err?.code === 'resource_missing') {
          console.warn(`⚠️ Speaker ${speaker.id} (${speaker.name}) has stale subscription ${speaker.stripeSubscriptionId} - not found in Stripe, downgrading to basic`);
          await storage.updateSpeaker(speaker.id, {
            subscriptionTier: 'basic',
            subscriptionStatus: 'canceled',
            stripeSubscriptionId: null,
            subscriptionPeriodEnd: null,
          });
          downgraded++;
        } else {
          console.error(`Error validating subscription for speaker ${speaker.id}:`, err.message);
        }
      }
    }

    console.log(`✅ Subscription validation complete: ${valid} valid, ${downgraded} downgraded`);
  } catch (error) {
    console.error("Failed to validate Stripe subscriptions:", error);
  }
}
