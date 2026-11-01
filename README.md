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
