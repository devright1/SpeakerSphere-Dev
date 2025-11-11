import Stripe from 'stripe';
import { db } from './server/db';
import { speakers } from './shared/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function fixRafaelSubscription() {
  const subscriptionId = 'sub_1SS0gd2KfWIY1BOyxFFg5F9H';
  const speakerId = 1792;
  
  try {
    console.log('Step 1: Updating database with Stripe subscription ID...');
    await db.update(speakers)
      .set({ 
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: 'active' // Change back to active since Stripe will handle the cancellation
      })
      .where(eq(speakers.id, speakerId));
    console.log('✅ Database updated successfully');
    
    console.log('\nStep 2: Canceling subscription in Stripe (cancel at period end)...');
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
    
    console.log('✅ Stripe subscription updated successfully');
    console.log('\n=== RESULT ===');
    console.log('Subscription ID:', subscription.id);
    console.log('Status:', subscription.status);
    console.log('Cancel at period end:', subscription.cancel_at_period_end ? '✅ YES' : '❌ NO');
    console.log('Current period ends:', new Date(subscription.current_period_end * 1000).toLocaleString());
    console.log('\n💡 Rafael will keep Pro access until:', new Date(subscription.current_period_end * 1000).toLocaleDateString());
    
    console.log('\nStep 3: Updating database with period end date...');
    await db.update(speakers)
      .set({ 
        subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000)
      })
      .where(eq(speakers.id, speakerId));
    console.log('✅ Period end date saved to database');
    
    console.log('\n🎉 All done! Rafael\'s subscription is now properly canceled in Stripe.');
    
  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

fixRafaelSubscription();
