// Servex Group site worker.
// Serves the static site (env.ASSETS) and one API route:
//   POST /api/checkout  { items: [{ id, qty }] }  ->  { url }  (Stripe Checkout)
// Prices always come from catalog.json on the server, never from the browser.
// Required secret (Cloudflare > Workers > servex-site > Settings > Variables and secrets):
//   STRIPE_SECRET_KEY   restricted key, test mode first, then live
// Optional variable (wrangler.jsonc "vars"):
//   STRIPE_AUTOMATIC_TAX "on" once Stripe Tax is set up in the Stripe dashboard

import catalog from '../catalog.json';

const ITEMS = new Map();
for (const group of catalog.groups) {
  for (const item of group.items) ITEMS.set(item.id, { ...item, company: group.company });
}

const MAX_LINES = 20; // Stripe allows up to 20 one-time items in a subscription checkout

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/checkout') {
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, { Allow: 'POST' });
      return checkout(request, env, url);
    }
    if (url.pathname.startsWith('/api/')) return json({ error: 'Not found' }, 404);
    return env.ASSETS.fetch(request);
  },
};

async function checkout(request, env, url) {
  // Only accept requests from our own pages.
  const origin = request.headers.get('Origin');
  if (origin && origin !== url.origin) return json({ error: 'Forbidden' }, 403);

  if (!env.STRIPE_SECRET_KEY) {
    return json({ error: 'Online checkout is not set up yet. Please email info@servexgroup.com.' }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }

  if (!body || body.agreed !== true) return json({ error: 'Please accept the Terms of Service to continue.' }, 400);

  const lines = validate(body && body.items);
  if (typeof lines === 'string') return json({ error: lines }, 400);

  const recurring = lines.some((l) => l.item.interval);
  const params = new URLSearchParams();
  params.set('mode', recurring ? 'subscription' : 'payment');
  params.set('success_url', `${url.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${url.origin}/pricing/?checkout=canceled`);
  params.set('billing_address_collection', 'required');
  params.set('allow_promotion_codes', 'true');
  params.set('phone_number_collection[enabled]', 'true');
  if (!recurring) {
    params.set('customer_creation', 'always');
    params.set('invoice_creation[enabled]', 'true');
  }

  lines.forEach(({ item, qty }, i) => {
    const p = `line_items[${i}]`;
    params.set(`${p}[quantity]`, String(qty));
    params.set(`${p}[price_data][currency]`, catalog.currency);
    params.set(`${p}[price_data][unit_amount]`, String(Math.round(item.price * 100)));
    params.set(`${p}[price_data][product_data][name]`, `${item.name} (${item.company})`);
    params.set(`${p}[price_data][product_data][description]`, item.summary);
    params.set(`${p}[price_data][product_data][metadata][catalog_id]`, item.id);
    if (item.interval) params.set(`${p}[price_data][recurring][interval]`, item.interval);
  });
  params.set('custom_text[submit][message]', `By paying you agree to the Servex Group Terms of Service (${url.origin}/terms) and Privacy Policy (${url.origin}/privacy).`);
  if (env.STRIPE_AUTOMATIC_TAX === 'on') params.set('automatic_tax[enabled]', 'true');
  params.set('metadata[terms_accepted]', new Date().toISOString());
  params.set('metadata[source]', 'servexgroup.com/pricing');
  params.set('metadata[items]', lines.map((l) => `${l.item.id}x${l.qty}`).join(',').slice(0, 500));

  const api = env.STRIPE_API_BASE || 'https://api.stripe.com';
  let res;
  try {
    res = await fetch(`${api}/v1/checkout/sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
  } catch (e) {
    console.error('Stripe request failed', e);
    return json({ error: 'Payment service is unavailable. Please try again.' }, 502);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) {
    console.error('Stripe error', res.status, data && data.error && data.error.message);
    return json({ error: 'Could not start checkout. Please try again or email info@servexgroup.com.' }, 502);
  }
  return json({ url: data.url });
}

// Returns [{item, qty}] or an error message string.
export function validate(items) {
  if (!Array.isArray(items) || items.length === 0) return 'Your cart is empty.';
  if (items.length > MAX_LINES) return 'Too many items in the cart.';
  const seen = new Set();
  const lines = [];
  for (const entry of items) {
    const item = entry && ITEMS.get(entry.id);
    if (!item) return 'One of the items is no longer available. Please refresh the page.';
    if (seen.has(item.id)) return 'Duplicate item in cart.';
    seen.add(item.id);
    const qty = Number(entry.qty);
    const max = item.interval ? 1 : item.maxQty || 1;
    if (!Number.isInteger(qty) || qty < 1 || qty > max) return `Invalid quantity for ${item.name}.`;
    lines.push({ item, qty });
  }
  return lines;
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}
