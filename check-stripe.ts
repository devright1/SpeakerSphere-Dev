import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function checkCustomer() {
  try {
    const customerId = 'cus_TOmwhIBAPUWGBI';
    
    console.log('🔍 Fetching customer details from Stripe...\n');
    const customer = await stripe.customers.retrieve(customerId);
    console.log('=== CUSTOMER INFO ===');
    console.log('Customer ID:', customer.id);
    console.log('Email:', customer.email);
    console.log('Name:', customer.name);
    
    console.log('\n=== SUBSCRIPTIONS ===');
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
      expand: ['data.default_payment_method']
    });
    
    if (subscriptions.data.length === 0) {
      console.log('❌ NO SUBSCRIPTIONS FOUND for this customer in Stripe');
      console.log('\n💡 This means Rafael was manually upgraded to Pro tier without going through Stripe.');
    } else {
      subscriptions.data.forEach((sub, index) => {
        console.log(`\n--- Subscription ${index + 1} ---`);
        console.log('Subscription ID:', sub.id);
        console.log('Status:', sub.status);
        console.log('Cancel at period end:', sub.cancel_at_period_end ? '✅ YES' : '❌ NO');
        if (sub.cancel_at_period_end && sub.cancel_at) {
          console.log('Will cancel on:', new Date(sub.cancel_at * 1000).toLocaleString());
        }
        console.log('Current period end:', new Date(sub.current_period_end * 1000).toLocaleString());
        console.log('Price: $' + (sub.items.data[0]?.price.unit_amount! / 100));
        console.log('Interval:', sub.items.data[0]?.price.recurring?.interval);
        console.log('Created:', new Date(sub.created * 1000).toLocaleString());
      });
    }
    
  } catch (error: any) {
    console.error('❌ ERROR:', error.message);
  }
}

checkCustomer();
