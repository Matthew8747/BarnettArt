import "server-only";
import type { Storage } from "./types";
import { LocalStorage } from "./local";

export type { Storage } from "./types";

/**
 * Resolve the active storage backend.
 *
 * Today this is always the local-disk adapter. When the S3 + CloudFront pipeline
 * lands (blocked on AWS — see docs/EXTERNAL-SETUP.md), add an `S3Storage`
 * implementing the same `Storage` interface and select it here when
 * `S3_BUCKET_NAME`/`CLOUDFRONT_URL` are configured. Nothing else needs to change.
 */
let instance: Storage | null = null;

export function getStorage(): Storage {
  if (!instance) {
    instance = new LocalStorage();
  }
  return instance;
}

/** Build a stable storage key for a product image. */
export function productImageKey(productId: string, filename: string): string {
  const safeName = filename
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `products/${productId}/${safeName}`;
}
