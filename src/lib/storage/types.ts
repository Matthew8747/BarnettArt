/**
 * Storage abstraction for artwork media.
 *
 * Call sites depend only on this interface, never on a concrete backend, so the
 * local-disk dev adapter can be swapped for S3 + CloudFront (Phase 1/4, blocked
 * on AWS — see docs/EXTERNAL-SETUP.md) with zero changes elsewhere.
 *
 * A `key` is a backend-agnostic path, e.g. `products/<id>/<filename>`. It is the
 * stable identifier we persist in `images.s3_key`; `publicUrl(key)` turns it
 * into something a browser can fetch.
 */
export interface Storage {
  /** Store bytes under `key`, returning the same key for convenience. */
  put(key: string, body: Buffer, contentType: string): Promise<string>;
  /** Remove the object at `key`. No-op if it does not exist. */
  delete(key: string): Promise<void>;
  /** Public, browser-fetchable URL for `key`. */
  publicUrl(key: string): string;
}
