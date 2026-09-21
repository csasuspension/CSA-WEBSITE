# CSA Website

Customer website and protected administration system for CSA Suspension.

## Production architecture

- Next.js-compatible application built with Vinext
- Cloudflare Workers hosting and CDN
- Cloudflare D1 for products, orders, warranty, and claim records
- Cloudflare R2 for uploaded evidence
- Cloudflare Access in front of `admin.csasuspension.com`
- GitHub repository as the source of truth

The application does not use ChatGPT Sites authentication or hosting. Customer and admin interfaces share one Worker, but the admin code requires the admin hostname, a successful Cloudflare Access assertion, and an email in `CSA_ADMIN_EMAILS`.

## Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm start
```

For Cloudflare release instructions, see [`CLOUDFLARE_DEPLOYMENT.md`](./CLOUDFLARE_DEPLOYMENT.md). For the editable project map, see [`PROJECT_GUIDE.md`](./PROJECT_GUIDE.md).
