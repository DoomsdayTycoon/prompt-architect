const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

function isValidUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Please wait a minute.' });
  }

  try {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({ error: 'Content-Type must be application/json.' });
    }

    const { code, userId } = req.body || {};

    // Validate code format: PA-XXXXX-XXXXX
    if (!code || typeof code !== 'string' || !/^PA-[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(code.trim().toUpperCase())) {
      return res.status(400).json({ error: 'Invalid promo code format.' });
    }

    if (!userId || !isValidUUID(userId)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    // Hash the code to compare against stored hashes (codes are never stored in plain text)
    const codeHash = crypto.createHash('sha256').update(code.trim().toUpperCase()).digest('hex');

    // Call the database function to atomically validate and redeem
    const { data, error } = await supabase.rpc('redeem_promo_code', {
      p_code_hash: codeHash,
      p_user_id: userId,
    });

    if (error) {
      console.error('Promo redeem RPC error:', error.message);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }

    if (data?.error) {
      return res.status(400).json({ error: data.error });
    }

    return res.status(200).json({ success: true, plan: data.plan, days: data.days });
  } catch (err) {
    console.error('Promo redeem error:', err.message);
    return res.status(500).json({ error: 'Failed to redeem code.' });
  }
};
