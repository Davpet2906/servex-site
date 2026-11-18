# Servex Group website

A static site with no build step and no dependencies. It runs on the Cloudflare Pages free plan.

## Files
- `index.html`: main website
- `brand.html`: brand guide (logo, colors, type, voice)
- `styles.css`: all styles (with automatic light and dark mode)
- `logo.svg` / `logo-white.svg`: full logo for light / dark backgrounds
- `logo-mark.svg`: the X symbol on its own
- `favicon.svg`, `logo-512.png`: app icon
- `404.html`: not-found page
- `_headers`: Cloudflare security and cache headers
- `sitemap.xml`: list of pages for Google (submitted in Search Console)
- `robots.txt`: lets search engines crawl the site and points them to the sitemap

## Deploy to Cloudflare Pages (free)
**Connected to GitHub (updates automatically):**
1. Log in to dash.cloudflare.com and open **Workers & Pages → Create → Pages → Connect to Git**.
2. Choose the `servex-site` repository.
3. Set Framework preset to **None**, leave Build command empty, and set Build output directory to `/`.
4. Click **Save and Deploy**. The site goes live at `servex-site.pages.dev`, and every push to `main` redeploys it.

**Without GitHub:** choose **Upload assets** instead and drag in this folder.

**Custom domain:** in the project, open **Custom domains** and add `servexgroup.com`.

## Before launch
- Review the service bullet points so they match what each company actually offers.

## Analytics and SEO
- Google Analytics 4: Measurement ID `G-1CSWVTF1F6`. The tag sits right after `<meta charset>` on every page.
- Google Search Console: `servexgroup.com`, with `sitemap.xml` submitted.
- Cloudflare serves clean URLs: `brand.html` is live at `/brand`. Link to and list pages by their clean URL.

## Adding a page or blog post
1. Copy the `<head>` of an existing page, including the Google Analytics snippet.
2. Give it a unique `<title>`, `<meta name="description">` and `<link rel="canonical" href="https://servexgroup.com/...">`.
3. Add its clean URL to `sitemap.xml` with today's date in `<lastmod>`, and update `<lastmod>` on any page you change.
4. After it goes live, use URL Inspection → Request indexing in Search Console to get it crawled sooner.
