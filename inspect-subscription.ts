import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function inspectSubscription() {
  try {
    const subscription = await stripe.subscriptions.retrieve('sub_1SS0gd2KfWIY1BOyxFFg5F9H');
    
    console.log('Full subscription object:');
    console.log(JSON.stringify(subscription, null, 2));
    
  } catch (error: any) {
    console.error('ERROR:', error.message);
  }
}

inspectSubscription();
