const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Validate UUID v4 format
function isValidUUID(str) {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig) {
    return res.status(400).json({ error: 'Missing Stripe signature.' });
  }

  let event;
  try {
    // When bodyParser is disabled, Vercel streams the raw body.
    // Read it from the stream to guarantee byte-perfect signature verification.
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed.' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.supabase_user_id;
        const customerId = session.customer;

        if (userId && isValidUUID(userId)) {
          await supabase
            .from('profiles')
            .update({
              is_paid: true,
              stripe_customer_id: customerId,
              subscription_status: 'active',
            })
            .eq('id', userId);
          console.log(`User ${userId} upgraded to paid.`);
        } else {
          console.warn('checkout.session.completed: missing or invalid userId in metadata');
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.supabase_user_id;
        const status = subscription.status;

        if (userId && isValidUUID(userId)) {
          const isPaid = status === 'active' || status === 'trialing';
          await supabase
            .from('profiles')
            .update({
              is_paid: isPaid,
              subscription_status: status,
              subscription_end: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
            })
            .eq('id', userId);
          console.log(`User ${userId} subscription status: ${status}`);
        } else {
          console.warn('subscription.updated: missing or invalid userId in metadata');
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.supabase_user_id;

        if (userId && isValidUUID(userId)) {
          await supabase
            .from('profiles')
            .update({
              is_paid: false,
              subscription_status: 'cancelled',
              subscription_end: new Date().toISOString(),
            })
            .eq('id', userId);
          console.log(`User ${userId} subscription cancelled.`);
        } else {
          console.warn('subscription.deleted: missing or invalid userId in metadata');
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error('Webhook handler error:', err.message);
    return res.status(500).json({ error: 'Webhook handler failed.' });
  }

  return res.status(200).json({ received: true });
};

// Read raw body from the request stream (byte-perfect for Stripe signature verification).
// With bodyParser disabled, Vercel does NOT pre-parse the body, so we always read from the stream.
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Vercel config: disable body parsing so we get raw body for Stripe signature verification
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
