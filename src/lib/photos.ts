import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { photoStorage } from "./storage";

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export class PhotoError extends Error {}

/**
 * Re-encodes an uploaded image to WebP (max 1600 px). Re-encoding drops all
 * metadata, including the GPS position and camera details in EXIF, and
 * rejects anything that isn't really an image. Returns the storage key.
 */
export async function savePhoto(file: File): Promise<string> {
  if (file.size === 0) throw new PhotoError("The photo is empty.");
  if (file.size > MAX_PHOTO_BYTES) throw new PhotoError("The photo is larger than 10 MB.");
  if (!file.type.startsWith("image/")) throw new PhotoError("Only image files can be uploaded.");

  let out: Buffer;
  try {
    out = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 60_000_000 })
      .rotate() // apply EXIF orientation before metadata is dropped
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw new PhotoError("That file couldn't be read as an image.");
  }

  const key = `${randomUUID()}.webp`;
  await photoStorage().put(key, out);
  return key;
}
