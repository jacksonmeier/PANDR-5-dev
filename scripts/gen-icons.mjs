// Regenerates every PWA raster from assets/icon/*.svg into public/.
// Run: npm run icons
//
// Uses `sharp`, which is present because next declares it in
// optionalDependencies. If it is ever missing: npm i -D sharp
import { mkdirSync, writeFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = (n) => resolve(ROOT, "assets/icon", n);
const OUT = (n) => resolve(ROOT, "public", n);

let sharp;
try {
  ({ default: sharp } = await import("sharp"));
} catch {
  console.error(
    "sharp is not installed. It normally arrives as an optional dependency of\n" +
      "next. Install it explicitly with:  npm i -D sharp"
  );
  process.exit(1);
}

// Rasterize at 512 density regardless of target size, then downscale.
// Downscaling from a full-res raster keeps the hazard stripes clean.
const DENSITY = 512;

async function png(src, size, out, { opaque = false } = {}) {
  let p = sharp(SRC(src), { density: DENSITY }).resize(size, size, {
    fit: "cover",
    kernel: "lanczos3",
  });
  // iOS composites transparent apple-touch-icon pixels onto black. Our art is
  // already opaque, but stripping alpha makes that guarantee explicit and the
  // file smaller.
  if (opaque) p = p.flatten({ background: "#0e0d0b" });
  const buf = await p.png({ compressionLevel: 9, palette: false }).toBuffer();
  mkdirSync(dirname(OUT(out)), { recursive: true });
  writeFileSync(OUT(out), buf);
  return buf;
}

// sharp cannot write .ico. Build a Vista-style PNG-in-ICO by hand:
// 6-byte ICONDIR + one 16-byte ICONDIRENTRY per image + the PNG payloads.
function encodeIco(images) {
  const n = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(n, 4); // image count

  const dir = Buffer.alloc(16 * n);
  let offset = 6 + 16 * n;
  images.forEach(({ size, data }, i) => {
    const e = dir.subarray(i * 16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // width  (0 means 256)
    e.writeUInt8(size >= 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2); // palette colours
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
  });

  return Buffer.concat([header, dir, ...images.map((i) => i.data)]);
}

const kib = (p) => (statSync(OUT(p)).size / 1024).toFixed(1) + " KiB";

// --- any: unmasked launcher / desktop install / splash -----------------
await png("icon-any.svg", 192, "icons/icon-192.png");
await png("icon-any.svg", 512, "icons/icon-512.png");

// --- maskable: Android adaptive launcher ------------------------------
await png("icon-maskable.svg", 192, "icons/icon-maskable-192.png");
await png("icon-maskable.svg", 512, "icons/icon-maskable-512.png");

// --- iOS home screen (@3x iPhone; iOS downscales for every other slot) -
await png("icon-any.svg", 180, "apple-touch-icon.png", { opaque: true });

// --- favicon: optically simplified 3-chip mark -------------------------
const icoSizes = [16, 32, 48];
const icoImages = [];
for (const size of icoSizes) {
  const data = await sharp(SRC("icon-mark.svg"), { density: DENSITY })
    .resize(size, size, { kernel: "lanczos3" })
    .png({ compressionLevel: 9 })
    .toBuffer();
  icoImages.push({ size, data });
}
mkdirSync(dirname(OUT("favicon.ico")), { recursive: true });
writeFileSync(OUT("favicon.ico"), encodeIco(icoImages));

for (const f of [
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-192.png",
  "icons/icon-maskable-512.png",
  "apple-touch-icon.png",
  "favicon.ico",
]) {
  console.log("  public/" + f.padEnd(30) + kib(f));
}
console.log("icons written");
