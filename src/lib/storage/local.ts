import { promises as fs } from "node:fs";
import path from "node:path";
import type { Storage } from "./types";

/**
 * Local-disk storage adapter for development.
 *
 * Writes under `public/uploads/<key>` so Next.js serves the files statically and
 * `next/image` can optimise them, mirroring how CloudFront will serve S3 objects
 * in production. Keys are sanitised to stay inside the upload root (no `..`
 * traversal) — defence in depth even though keys are server-generated.
 */
export class LocalStorage implements Storage {
  private readonly root: string;
  private readonly urlPrefix = "/uploads";

  constructor(root?: string) {
    this.root = root ?? path.join(process.cwd(), "public", "uploads");
  }

  private resolve(key: string): string {
    const safe = key.replace(/^[/\\]+/, "");
    const full = path.resolve(this.root, safe);
    const rootResolved = path.resolve(this.root);
    if (full !== rootResolved && !full.startsWith(rootResolved + path.sep)) {
      throw new Error(`Refusing to write outside upload root: ${key}`);
    }
    return full;
  }

  async put(key: string, body: Buffer, _contentType: string): Promise<string> {
    void _contentType; // content type is implied by extension when served locally
    const full = this.resolve(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, body);
    return key;
  }

  async delete(key: string): Promise<void> {
    const full = this.resolve(key);
    await fs.rm(full, { force: true });
  }

  publicUrl(key: string): string {
    const safe = key
      .replace(/^[/\\]+/, "")
      .split(path.sep)
      .join("/");
    return `${this.urlPrefix}/${safe}`;
  }
}
