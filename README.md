# Northern Freight Unlimited Site and Calculator

This repo contains the source code for <https://northernfreightunlimited.com>.

## Common Commands

```bash
# Install dependencies
npm install

# Run dev server using vite
npm run dev # or
npx vite

# Run "prod-like" environment
npm run preview

# Build
npm run build

# Deploy to CloudFlare
npm run deploy
```

## Architecture

The app is designed to run on [CloudFlare
Pages](https://developers.cloudflare.com/pages/), using simple [Function
routing](https://developers.cloudflare.com/pages/functions/routing/).
There are two pages, `index.html` and `404.html`. The index page contains a
single interactive element, the calculator.

The calc relies on two routes defined in the functions to operate: `/routes` and
`/calc`. The former returns all the available routes between two star systems, and
latter calculates the fee for a route given the collateral and volume parameters.
[HTMX](https://htmx.org/) is used for client-side scripting.

The `[[routes]].ts` file captures all Pages Function calls (defined in
`_routes.json`).  However, all the requests are then routed through the
[Hono app](https://hono.dev/docs/) in `src/index.ts`.

## How To

### Update routes

Make changes to `src/eve/routes.ts`.

### Add a new Function route

Update the Hono app configuration and then make sure to update `_routes.json`.

### Assets in public are 404'ing

You may need to update the exclusion list for the vite dev server plugin.

## Potential ToDos

1. Use SSR to generate the list of routes for the drop down at build time instead
of requiring a browser request to fetch it.
1. Migrate HTML responses to their own template files instead of inlining.
