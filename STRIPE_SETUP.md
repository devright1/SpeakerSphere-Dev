# Stripe Subscription Setup Guide

## Overview
Your SpeakerSphere platform is now configured with Stripe subscriptions! This guide will help you complete the final step: setting up webhooks.

## Current Status ✓

### Already Configured:
- ✅ **STRIPE_SECRET_KEY** - Secret API key (configured in Replit Secrets)
- ✅ **VITE_STRIPE_PUBLIC_KEY** - Public key for frontend (configured in Replit Secrets)
- ✅ **Price IDs** - All four subscription prices configured in the code:
  - Pro Monthly: `price_1SQWeD2KfWIY1BOyGKNeaLLF`
  - Pro Yearly: `price_1SRwRA2KfWIY1BOyCgczlidp`
  - Premier Monthly: `price_1SRwQh2KfWIY1BOydMaxI2Tm`
  - Premier Yearly: `price_1SRwRe2KfWIY1BOySdq1lQON`

### Remaining Step:
- ⚠️ **STRIPE_WEBHOOK_SECRET** - Needed to verify webhook events from Stripe

---

## How to Set Up Webhooks

Webhooks allow Stripe to automatically notify your app when subscription events occur (payment succeeded, subscription canceled, etc.).

### Step 1: Get Your Replit App URL
Your webhook endpoint will be:
```
https://[your-replit-app-name].replit.app/api/webhooks/stripe
```

Replace `[your-replit-app-name]` with your actual Replit app domain.

### Step 2: Create Webhook in Stripe Dashboard

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"+ Add endpoint"**
3. Enter your webhook URL:
   ```
   https://[your-replit-app-name].replit.app/api/webhooks/stripe
   ```
4. Under **"Events to send"**, select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **"Add endpoint"**

### Step 3: Get the Webhook Signing Secret

1. After creating the endpoint, you'll see it in your webhooks list
2. Click on the newly created endpoint
3. In the **"Signing secret"** section, click **"Reveal"**
4. Copy the secret (it starts with `whsec_...`)

### Step 4: Add Secret to Replit

1. In your Replit workspace, go to **Tools → Secrets**
2. Click **"+ New Secret"**
3. Set:
   - **Key**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: Paste the webhook signing secret (starts with `whsec_...`)
4. Click **"Add Secret"**

### Step 5: Restart Your Application

After adding the secret, restart your Replit app for the changes to take effect.

---

## Testing the Integration

### Test Mode (Recommended First)
1. Use Stripe's test mode to verify everything works
2. Use test card: `4242 4242 4242 4242`
3. Any future expiry date and any 3-digit CVC

### Test the Flow:
1. Visit `/subscription/upgrade` on your app
2. Click "Upgrade to Pro" or "Upgrade to Premier"
3. Complete the Stripe checkout with a test card
4. Verify:
   - You're redirected back to your app
   - The speaker's tier is updated in the database
   - Webhook events appear in Stripe Dashboard → Developers → Events

### Switch to Live Mode
Once everything works in test mode:
1. Get your **live** API keys from Stripe (Live mode toggle in Stripe Dashboard)
2. Create a new webhook endpoint for live mode
3. Update your Replit secrets with live keys:
   - `STRIPE_SECRET_KEY` (live secret key)
   - `VITE_STRIPE_PUBLIC_KEY` (live publishable key)
   - `STRIPE_WEBHOOK_SECRET` (live webhook secret)

---

## Subscription Tiers

Your platform has three tiers:

| Tier | Monthly | Annual | Benefits |
|------|---------|--------|----------|
| **Basic** | Free | Free | Standard speaker profile |
| **Pro** | $29/mo | $290/yr | Enhanced visibility, homepage rotation |
| **Premier** | $99/mo | $990/yr | Top placement, exclusive features |

Annual plans save ~16% compared to monthly billing.

---

## Webhook Events Explained

Here's what happens with each event:

### `customer.subscription.created` / `customer.subscription.updated`
- Triggered when a subscription is created or updated
- Updates speaker's tier, subscription status, and billing period end date

### `customer.subscription.deleted`
- Triggered when a subscription is canceled
- Downgrades speaker to Basic tier

### `invoice.payment_succeeded`
- Triggered when a payment succeeds
- Confirms subscription is active and updates billing period

### `invoice.payment_failed`
- Triggered when a payment fails
- Marks subscription as "past_due" for follow-up

---

## Troubleshooting

### Webhooks Not Working?
1. Check webhook endpoint is accessible (visit the URL in browser - you should see "No signature" error, which is normal)
2. Verify `STRIPE_WEBHOOK_SECRET` is set correctly in Replit Secrets
3. Check Stripe Dashboard → Developers → Events for webhook delivery status
4. Look for errors in your Replit logs

### Subscription Not Updating?
1. Verify webhook secret is configured
2. Check Stripe Dashboard → Developers → Webhooks for failed deliveries
3. Review server logs for webhook processing errors

### Test Mode vs Live Mode
- Test mode uses `sk_test_...` and `pk_test_...` keys
- Live mode uses `sk_live_...` and `pk_live_...` keys
- **Never mix test and live keys!**

---

## Support

For Stripe-specific questions:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com/)

For platform-specific questions:
- Check server logs in Replit
- Review webhook events in Stripe Dashboard
