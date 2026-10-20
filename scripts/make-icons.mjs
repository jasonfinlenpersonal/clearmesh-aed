// Renders the PNG app icons from public/icons/icon.svg. Run after changing
// the SVG: npm run icons
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const dir = new URL("../public/icons/", import.meta.url);
const svg = await readFile(new URL("icon.svg", dir));

for (const [name, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
]) {
  await sharp(svg).resize(size, size).png().toFile(fileURLToPath(new URL(name, dir)));
}

// Maskable: full-bleed background with the artwork in the central safe zone.
const inner = await sharp(svg).resize(400, 400).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: "#15803d" } })
  .composite([{ input: inner, gravity: "center" }])
  .png()
  .toFile(fileURLToPath(new URL("icon-maskable-512.png", dir)));

console.log("icons written");
