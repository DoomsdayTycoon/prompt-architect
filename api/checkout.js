const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  annual: process.env.STRIPE_PRICE_ANNUAL,
};

// Simple in-memory rate limiter (resets on cold start, good enough for serverless)
const rateLimit = new Map();
const RATE_WINDOW = 60 * 1000; // 1 minute
const RATE_MAX = 5; // max 5 checkout attempts per minute per IP

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW) {
    rateLimit.set(ip, { windowStart: now, count: 1 });
    return false;
  }
  entry.count++;
  if (entry.count > RATE_MAX) return true;
  return false;
}

// Validate UUID v4 format
function isValidUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// Validate email format
function isValidEmail(str) {
  return typeof str === 'string' && str.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting by IP
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
  }

  try {
    // Reject unexpected content types
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({ error: 'Content-Type must be application/json.' });
    }

    const { plan, email, userId, promoCode } = req.body || {};

    // Validate plan
    if (!plan || typeof plan !== 'string' || !PRICES[plan]) {
      return res.status(400).json({ error: 'Invalid plan. Use "monthly" or "annual".' });
    }

    // Validate email
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    // Validate userId as UUID
    if (!userId || typeof userId !== 'string' || !isValidUUID(userId)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    // Build checkout session config
    const sessionConfig = {
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      metadata: {
        supabase_user_id: userId,
      },
      line_items: [
        {
          price: PRICES[plan],
          quantity: 1,
        },
      ],
      success_url: `${process.env.SITE_URL || 'https://www.proarch.tech'}?payment=success`,
      cancel_url: `${process.env.SITE_URL || 'https://www.proarch.tech'}?payment=cancelled`,
      subscription_data: {
        metadata: {
          supabase_user_id: userId,
        },
      },
    };

    // Apply Stripe promotion code if provided
    if (promoCode && typeof promoCode === 'string' && promoCode.trim().length > 0) {
      try {
        const promotionCodes = await stripe.promotionCodes.list({
          code: promoCode.trim().toUpperCase(),
          active: true,
          limit: 1,
        });
        if (promotionCodes.data.length > 0) {
          sessionConfig.discounts = [{ promotion_code: promotionCodes.data[0].id }];
        }
      } catch (promoErr) {
        // Promo lookup failed — proceed without discount
        console.warn('Promo code lookup failed:', promoErr.message);
      }
    }

    // Allow user to enter promo on checkout page if none was pre-applied
    if (!sessionConfig.discounts) {
      sessionConfig.allow_promotion_codes = true;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    return res.status(500).json({ error: 'Failed to create checkout session.' });
  }
};
