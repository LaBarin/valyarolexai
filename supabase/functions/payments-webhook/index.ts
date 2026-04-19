import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyWebhook, EventName, type PaddleEnv } from '../_shared/paddle.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Maps credit pack price IDs to credit amounts (base + bonus)
const CREDIT_PACKS: Record<string, number> = {
  credits_starter_onetime: 100,
  credits_pro_onetime: 550,
  credits_power_onetime: 1750,
};

// Monthly credit grants per subscription tier (refreshed each billing cycle)
const MONTHLY_GRANTS: Record<string, number> = {
  pro_plan: 2000,
  business_plan: 6000,
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(req.url);
  const env = (url.searchParams.get('env') || 'sandbox') as PaddleEnv;

  try {
    const event = await verifyWebhook(req, env);
    console.log('Received event:', event.eventType, 'env:', env);

    switch (event.eventType) {
      case EventName.SubscriptionCreated:
        await handleSubscriptionCreated(event.data, env);
        break;
      case EventName.SubscriptionUpdated:
        await handleSubscriptionUpdated(event.data, env);
        break;
      case EventName.SubscriptionCanceled:
        await handleSubscriptionCanceled(event.data, env);
        break;
      case EventName.TransactionCompleted:
        await handleTransactionCompleted(event.data, env);
        break;
      case EventName.TransactionPaymentFailed:
        console.log('Payment failed:', event.data.id, 'env:', env);
        break;
      default:
        console.log('Unhandled event:', event.eventType);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Webhook error:', e);
    return new Response('Webhook error', { status: 400 });
  }
});

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;
  const userId = customData?.userId;
  if (!userId) {
    console.error('No userId in customData for subscription', id);
    return;
  }

  const item = items[0];
  const priceId = item.price.importMeta?.externalId || item.price.id;
  const productId = item.product?.importMeta?.externalId || item.product?.id || item.price.productId;

  await supabase.from('subscriptions').upsert({
    user_id: userId,
    paddle_subscription_id: id,
    paddle_customer_id: customerId,
    product_id: productId,
    price_id: priceId,
    status,
    current_period_start: currentBillingPeriod?.startsAt,
    current_period_end: currentBillingPeriod?.endsAt,
    cancel_at_period_end: false,
    environment: env,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,environment' });

  // Grant initial monthly credits for the new subscription
  const grant = MONTHLY_GRANTS[productId];
  if (grant) {
    await supabase.rpc('grant_credits', {
      p_user_id: userId,
      p_amount: grant,
      p_type: 'monthly_grant',
      p_description: `subscription:${productId}:initial`,
    });
  }

  console.log('Subscription created for user', userId);
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, currentBillingPeriod, scheduledChange, items } = data;
  const item = items?.[0];
  const priceId = item?.price.importMeta?.externalId || item?.price.id;
  const productId = item?.product?.importMeta?.externalId || item?.product?.id || item?.price.productId;

  const updates: Record<string, unknown> = {
    status,
    current_period_start: currentBillingPeriod?.startsAt,
    current_period_end: currentBillingPeriod?.endsAt,
    cancel_at_period_end: scheduledChange?.action === 'cancel',
    updated_at: new Date().toISOString(),
  };
  if (priceId) updates.price_id = priceId;
  if (productId) updates.product_id = productId;

  await supabase.from('subscriptions')
    .update(updates)
    .eq('paddle_subscription_id', id)
    .eq('environment', env);

  // If we just renewed (period advanced), grant monthly credits to subscriber
  if (productId && currentBillingPeriod?.startsAt) {
    const grant = MONTHLY_GRANTS[productId];
    if (grant) {
      // Use a per-period idempotency key in description so renewals only grant once
      const periodKey = `subscription:${productId}:${currentBillingPeriod.startsAt}`;
      const { data: existing } = await supabase
        .from('credit_transactions')
        .select('id')
        .eq('description', periodKey)
        .maybeSingle();
      if (!existing) {
        // Get user_id
        const { data: subRow } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('paddle_subscription_id', id)
          .eq('environment', env)
          .maybeSingle();
        if (subRow?.user_id) {
          await supabase.rpc('grant_credits', {
            p_user_id: subRow.user_id,
            p_amount: grant,
            p_type: 'monthly_grant',
            p_description: periodKey,
          });
        }
      }
    }
  }
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  await supabase.from('subscriptions')
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('paddle_subscription_id', data.id)
    .eq('environment', env);
}

async function handleTransactionCompleted(data: any, env: PaddleEnv) {
  const { id, customData, items } = data;
  const userId = customData?.userId;
  if (!userId) return;

  // Only handle one-time credit pack purchases here.
  // Subscriptions are handled by subscription.created/updated events.
  const item = items?.[0];
  const priceId = item?.price.importMeta?.externalId || item?.price.id;
  if (!priceId || !(priceId in CREDIT_PACKS)) {
    console.log('Transaction completed (non-credit-pack):', id, priceId);
    return;
  }

  const credits = CREDIT_PACKS[priceId];

  // Idempotency: skip if we've already logged this transaction
  const { data: existing } = await supabase
    .from('credit_transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('description', `paddle:${id}`)
    .maybeSingle();

  if (existing) {
    console.log('Transaction already processed:', id);
    return;
  }

  // Get current balance and add credits
  const { data: current } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();

  const newBalance = (current?.balance || 0) + credits;

  await supabase.from('user_credits').upsert(
    { user_id: userId, balance: newBalance },
    { onConflict: 'user_id' }
  );

  await supabase.from('credit_transactions').insert({
    user_id: userId,
    amount: credits,
    type: 'purchase',
    description: `paddle:${id}`,
  });

  console.log(`Granted ${credits} credits to user ${userId} (tx ${id})`);
}
