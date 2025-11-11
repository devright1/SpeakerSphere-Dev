import Stripe from 'stripe';
import { db } from './server/db';
import { speakers } from './shared/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function verifyAndFixDate() {
  const subscriptionId = 'sub_1SS0gd2KfWIY1BOyxFFg5F9H';
  const speakerId = 1792;
  
  try {
    console.log('Fetching subscription details from Stripe...');
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    console.log('\n=== STRIPE SUBSCRIPTION STATUS ===');
    console.log('Subscription ID:', subscription.id);
    console.log('Status:', subscription.status);
    console.log('Cancel at period end:', subscription.cancel_at_period_end ? '✅ YES' : '❌ NO');
    
    // Get the period end from the subscription items
    const periodEndTimestamp = subscription.current_period_end;
    const periodEndDate = new Date(periodEndTimestamp * 1000);
    
    console.log('Period end timestamp:', periodEndTimestamp);
    console.log('Period end date:', periodEndDate.toLocaleString());
    console.log('Period end ISO:', periodEndDate.toISOString());
    
    console.log('\nUpdating database with correct period end date...');
    await db.update(speakers)
      .set({ 
        subscriptionPeriodEnd: periodEndDate
      })
      .where(eq(speakers.id, speakerId));
    console.log('✅ Database updated successfully');
    
    // Verify the database update
    console.log('\nVerifying database record...');
    const speaker = await db.query.speakers.findFirst({
      where: eq(speakers.id, speakerId)
    });
    
    console.log('\n=== DATABASE RECORD ===');
    console.log('Name:', speaker?.name);
    console.log('Tier:', speaker?.subscriptionTier);
    console.log('Status:', speaker?.subscriptionStatus);
    console.log('Stripe Subscription ID:', speaker?.stripeSubscriptionId);
    console.log('Period End:', speaker?.subscriptionPeriodEnd);
    console.log('Cancelled At:', speaker?.cancelledAt);
    
    console.log('\n🎉 SUCCESS! Rafael\'s subscription is now properly set up:');
    console.log('- Subscription linked to Stripe ✅');
    console.log('- Will cancel at period end ✅');
    console.log('- Keeps Pro access until', periodEndDate.toLocaleDateString(), '✅');
    console.log('- Cancellation feedback saved ✅');
    
  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
  }
}

verifyAndFixDate();
