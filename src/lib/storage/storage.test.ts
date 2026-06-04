import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { LocalStorage } from "./local";
import { productImageKey } from "./index";

describe("LocalStorage", () => {
  let root: string;
  let storage: LocalStorage;

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "barnett-storage-"));
    storage = new LocalStorage(root);
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it("writes bytes under the key and reads them back", async () => {
    const body = Buffer.from("hello-art");
    await storage.put("products/abc/hero.jpg", body, "image/jpeg");
    const onDisk = await fs.readFile(path.join(root, "products/abc/hero.jpg"));
    expect(onDisk.equals(body)).toBe(true);
  });

  it("creates nested directories as needed", async () => {
    await storage.put("products/x/y/z.png", Buffer.from("x"), "image/png");
    const stat = await fs.stat(path.join(root, "products/x/y/z.png"));
    expect(stat.isFile()).toBe(true);
  });

  it("deletes an object and is a no-op when missing", async () => {
    await storage.put("a/b.jpg", Buffer.from("x"), "image/jpeg");
    await storage.delete("a/b.jpg");
    await expect(fs.stat(path.join(root, "a/b.jpg"))).rejects.toThrow();
    // second delete must not throw
    await expect(storage.delete("a/b.jpg")).resolves.toBeUndefined();
  });

  it("returns a web URL under /uploads", () => {
    expect(storage.publicUrl("products/abc/hero.jpg")).toBe(
      "/uploads/products/abc/hero.jpg",
    );
  });

  it("passes through already-absolute keys (demo catalog / CDN URLs)", () => {
    expect(storage.publicUrl("/sample-art/lily-pond.jpg")).toBe(
      "/sample-art/lily-pond.jpg",
    );
    expect(storage.publicUrl("https://cdn.example.com/x.jpg")).toBe(
      "https://cdn.example.com/x.jpg",
    );
  });

  it("refuses path traversal outside the upload root", async () => {
    await expect(
      storage.put("../escape.txt", Buffer.from("x"), "text/plain"),
    ).rejects.toThrow(/outside upload root/);
  });
});

describe("productImageKey", () => {
  it("namespaces by product id and slugifies the filename", () => {
    expect(productImageKey("prod-1", "My Painting!.JPG")).toBe(
      "products/prod-1/my-painting-.jpg",
    );
  });
});
