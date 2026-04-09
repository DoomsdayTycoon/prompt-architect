const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Rate limit: 5 attempts per minute per IP
const rateLimit = new Map();
const RATE_WINDOW = 60 * 1000;
const RATE_MAX = 5;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW) {
    rateLimit.set(ip, { windowStart: now, count: 1 });
    return false;
  }
  entry.count++;
  return entry.count > RATE_MAX;
}

function isValidEmail(str) {
  return typeof str === 'string' && str.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
  }

  try {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({ error: 'Content-Type must be application/json.' });
    }

    const { email } = req.body || {};

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    // Find Stripe customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) {
      return res.status(404).json({ error: 'No subscription found for this account.' });
    }

    // Create a billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: process.env.SITE_URL || 'https://www.proarch.tech',
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Portal session error:', err.message);
    return res.status(500).json({ error: 'Failed to open account portal.' });
  }
};
