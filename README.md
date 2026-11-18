# Servex Group website

A static site with no build step and no dependencies, hosted free on Cloudflare (Workers static assets).

## Files
- `index.html`: main website
- `brand.html`: brand guide (logo, colors, type, voice)
- `styles.css`: all styles (with automatic light and dark mode). Browsers cache it for a day, so after changing it, bump the `?v=` number in the pages' stylesheet link.
- `logo.svg` / `logo-white.svg`: full logo for light / dark backgrounds
- `logo-mark.svg`: the X symbol on its own
- `favicon.svg`, `logo-512.png`: app icon
- `404.html`: not-found page
- `_headers`: Cloudflare security and cache headers
- `sitemap.xml`: list of pages for Google (submitted in Search Console)
- `robots.txt`: lets search engines crawl the site and points them to the sitemap
- `blog/index.html`: the blog page (servexgroup.com/blog/)
- `templates/blog-post.html`: starting point for new blog posts (not published)
- `wrangler.jsonc`: Cloudflare settings (serves `404.html` for missing pages)
- `.assetsignore`: repo files that are not published on the website
- `pricing/index.html`, `cart.js`, `catalog.json`: pricing page and cart (prices live in `catalog.json`)
- `src/worker.js`: the checkout function (`POST /api/checkout`, creates a Stripe Checkout session)
- `checkout/success.html`: thank-you page after payment
- `terms.html`, `privacy.html`: Terms of Service and Privacy Policy
- `consent.js`: cookie banner (Google Consent Mode); loaded on every page before Google Analytics

## Deploy
The Cloudflare Worker `servex-site` is connected to this GitHub repo. Every commit to `main` redeploys the site automatically (deploy command `npx wrangler deploy`, settings in `wrangler.jsonc`). Builds and logs are under Cloudflare → Workers & Pages → servex-site → Deployments.

## Before launch
- Review the service bullet points so they match what each company actually offers.

## Pricing and payments
- Change a price or package: edit `catalog.json`. The pricing page and checkout both read it, so they always match.
- Payments go through Stripe. The secret key is a Cloudflare secret named `STRIPE_SECRET_KEY` (never put it in this repo). Without it, checkout politely asks customers to email instead.
- Stripe Tax: set `STRIPE_AUTOMATIC_TAX` to `"on"` in `wrangler.jsonc` once Stripe Tax is set up in the Stripe dashboard.
- Checkout requires customers to accept the Terms of Service; the acceptance time is saved on the Stripe payment.

## Analytics and SEO
- Google Analytics 4: Measurement ID `G-1CSWVTF1F6`. The tag sits right after `<meta charset>` on every page.
- Google Search Console: `servexgroup.com`, with `sitemap.xml` submitted.
- Cloudflare serves clean URLs: `brand.html` is live at `/brand`. Link to and list pages by their clean URL.

## Writing a blog post
1. Copy `templates/blog-post.html` to `blog/your-post-slug.html` (lowercase words joined by hyphens). It goes live at `https://servexgroup.com/blog/your-post-slug`.
2. Replace everything in `[BRACKETS]`: title (under 60 characters), description (120 to 155 characters), slug, dates, category and body text.
3. In `blog/index.html`, add a card for the post at the top of the list (copy the commented example) and delete the "First articles are on the way" box once the first post is up.
4. Add the post to `sitemap.xml` with today's date in `<lastmod>`, and update the `/blog/` date too.
5. Commit to `main`. Cloudflare publishes it in about a minute. Then use Search Console → URL Inspection → Request indexing.

## Adding any other page
Copy the `<head>` of an existing page (including the Google Analytics snippet), give it a unique `<title>`, `<meta name="description">` and `<link rel="canonical">`, and add it to `sitemap.xml`.

## Domain
- `servexgroup.com` is the main address. `www.servexgroup.com` redirects to it (Cloudflare redirect rule, path and query kept).
