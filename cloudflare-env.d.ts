declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    CSA_ADMIN_EMAILS?: string;
    CSA_ADMIN_HOST?: string;
    ENVIRONMENT?: string;
  }
}
