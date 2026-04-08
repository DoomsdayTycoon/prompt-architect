const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Vercel needs raw body for Stripe signature verification
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    // Vercel provides raw body as buffer
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

        if (userId) {
          await supabase
            .from('profiles')
            .update({
              is_paid: true,
              stripe_customer_id: customerId,
              subscription_status: 'active',
            })
            .eq('id', userId);
          console.log(`User ${userId} upgraded to paid.`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.supabase_user_id;
        const status = subscription.status;

        if (userId) {
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
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.supabase_user_id;

        if (userId) {
          await supabase
            .from('profiles')
            .update({
              is_paid: false,
              subscription_status: 'cancelled',
              subscription_end: new Date().toISOString(),
            })
            .eq('id', userId);
          console.log(`User ${userId} subscription cancelled.`);
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

// Helper: read raw body from Vercel request
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body !== 'string' && !Buffer.isBuffer(req.body)) {
      // Body already parsed as object — need raw for signature verification
      // Vercel may have already parsed it, so we reconstruct
      resolve(Buffer.from(JSON.stringify(req.body)));
    } else if (Buffer.isBuffer(req.body)) {
      resolve(req.body);
    } else {
      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    }
  });
}

// Vercel config: disable body parsing so we get raw body for Stripe
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
