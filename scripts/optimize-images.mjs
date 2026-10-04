// Regenerates the responsive WebP derivatives in src/assets/img from the
// original Figma Make exports in src/assets. Run once after replacing a photo:
//   pnpm dlx --package=sharp node scripts/optimize-images.mjs
// (sharp is intentionally not a project dependency; the outputs are committed.)
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const src = new URL("../src/assets/", import.meta.url);
const out = new URL("../src/assets/img/", import.meta.url);
mkdirSync(out, { recursive: true });

const jobs = [
  // name, source, widths, quality
  ["cloud", "bf775.png", [480, 800, 1152], 78],
  ["moon", "100da.png", [480, 864], 78],
  ["cat", "a42d3.png", [480, 800, 1152], 78],
  ["performance", "dfea1.png", [480, 864], 78],
  ["portrait", "6796c.png", [560, 928], 86],
];

for (const [name, file, widths, quality] of jobs) {
  for (const w of widths) {
    const info = await sharp(new URL(file, src).pathname)
      .rotate()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality, alphaQuality: 90, effort: 6, smartSubsample: true })
      .toFile(new URL(`${name}-${w}.webp`, out).pathname);
    console.log(`${name}-${w}.webp`, info.width + "x" + info.height, Math.round(info.size / 1024) + " KB");
  }
}
