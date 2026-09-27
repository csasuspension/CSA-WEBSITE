import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourcePath = resolve(root, "dist/server/wrangler.json");
const outputPath = resolve(root, "dist/server/wrangler.deploy.json");

const databaseId = process.env.D1_DATABASE_ID?.trim() || "b809ef2b-20c7-4d8e-ae29-c703bf1ed77d";

const source = JSON.parse(await readFile(sourcePath, "utf8"));
const useCustomDomains = process.env.CLOUDFLARE_CUSTOM_DOMAINS === "1";

const config = {
  ...source,
  name: process.env.CLOUDFLARE_WORKER_NAME?.trim() || "csa-website",
  workers_dev: true,
  preview_urls: true,
  vars: {
    ...(source.vars ?? {}),
    ENVIRONMENT: "production",
    CSA_ADMIN_HOST: "www.csasuspension.com",
  },
  d1_databases: [{
    binding: "DB",
    database_name: process.env.D1_DATABASE_NAME?.trim() || "site-creator-d1",
    database_id: databaseId,
    migrations_dir: "../../drizzle",
  }],
  r2_buckets: [{
    binding: "BUCKET",
    bucket_name: process.env.R2_BUCKET_NAME?.trim() || "csa-website-media",
  }],
  ...(useCustomDomains ? {
    routes: [
      { pattern: "csasuspension.com", custom_domain: true },
      { pattern: "www.csasuspension.com", custom_domain: true },
    ],
  } : {}),
};

await writeFile(outputPath, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Prepared ${outputPath}`);
