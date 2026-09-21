# CSA native Cloudflare deployment

The production target is a Cloudflare Worker named `csa-production` with:

- `DB` → D1 database `csa-production`
- `BUCKET` → R2 bucket `csa-media`
- `admin.csasuspension.com` protected by Cloudflare Access
- `www.csasuspension.com` and `csasuspension.com` public

## Required Cloudflare variables

Set these in the Cloudflare build environment (do not commit their real values):

```text
D1_DATABASE_ID=<the D1 database UUID>
D1_DATABASE_NAME=csa-production
R2_BUCKET_NAME=csa-media
CLOUDFLARE_WORKER_NAME=csa-production
```

Set the Worker runtime variable `CSA_ADMIN_EMAILS` to a comma-separated admin allowlist.

## Safe release order

1. Create the D1 database and R2 bucket in the CSA Cloudflare account.
2. Build with `pnpm run build:cloudflare`.
3. Apply D1 migrations with `pnpm run migrate:cloudflare`.
4. Deploy to the temporary `workers.dev` URL with `pnpm run deploy:cloudflare`.
5. Verify the customer UI and APIs on the temporary URL.
6. Create a Cloudflare Access self-hosted application for `admin.csasuspension.com` and restrict it to the CSA admin email.
7. Remove the three domains from the previous host only after step 5 succeeds.
8. Redeploy once with `CLOUDFLARE_CUSTOM_DOMAINS=1` to attach the apex, `www`, and `admin` domains.

Do not point the production domains at the new Worker before the temporary URL passes testing.
