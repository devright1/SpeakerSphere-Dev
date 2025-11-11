import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function checkCustomer() {
  try {
    const customerId = 'cus_TOmwhIBAPUWGBI';
    
    console.log('Fetching customer details...');
    const customer = await stripe.customers.retrieve(customerId);
    console.log('\n=== CUSTOMER INFO ===');
    console.log('Customer ID:', customer.id);
    console.log('Email:', customer.email);
    console.log('Name:', customer.name);
    
    console.log('\n=== SUBSCRIPTIONS ===');
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10
    });
    
    if (subscriptions.data.length === 0) {
      console.log('❌ NO SUBSCRIPTIONS FOUND for this customer');
    } else {
      subscriptions.data.forEach((sub, index) => {
        console.log(`\n--- Subscription ${index + 1} ---`);
        console.log('Subscription ID:', sub.id);
        console.log('Status:', sub.status);
        console.log('Cancel at period end:', sub.cancel_at_period_end);
        console.log('Current period end:', new Date(sub.current_period_end * 1000).toISOString());
        console.log('Price: $' + (sub.items.data[0]?.price.unit_amount / 100), sub.items.data[0]?.price.currency.toUpperCase());
        console.log('Interval:', sub.items.data[0]?.price.recurring?.interval);
      });
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

checkCustomer();
