// Verifies the generated PWA assets. No network, no browser, no deps.
// Run: npm run verify:pwa
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const P = (n) => resolve(ROOT, "public", n);

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const COLOUR_TYPE = { 0: "gray", 2: "rgb", 3: "palette", 4: "gray+a", 6: "rgba" };

let failures = 0;
const ok = (m) => console.log("  PASS  " + m);
const bad = (m) => {
  console.log("  FAIL  " + m);
  failures++;
};

/** Parse a PNG IHDR straight out of the bytes. */
function readPng(file) {
  const b = readFileSync(file);
  if (!b.subarray(0, 8).equals(PNG_SIG)) return null;
  return {
    bytes: b,
    width: b.readUInt32BE(16),
    height: b.readUInt32BE(20),
    bitDepth: b.readUInt8(24),
    colourType: b.readUInt8(25),
  };
}

function checkPng(rel, size, { expectAlpha }) {
  const file = P(rel);
  if (!existsSync(file)) return bad(`${rel} is missing`);
  const png = readPng(file);
  if (!png) return bad(`${rel} is not a PNG (bad magic bytes)`);
  if (png.width !== size || png.height !== size)
    return bad(`${rel} is ${png.width}x${png.height}, expected ${size}x${size}`);
  const hasAlpha = png.colourType === 6 || png.colourType === 4;
  if (hasAlpha !== expectAlpha)
    return bad(
      `${rel} colour type ${png.colourType} (${COLOUR_TYPE[png.colourType]}); ` +
        `expected alpha=${expectAlpha}`
    );
  ok(`${rel} ${size}x${size} ${COLOUR_TYPE[png.colourType]}`);
}

console.log("\nPNG signature / dimensions / alpha");
checkPng("icons/icon-192.png", 192, { expectAlpha: true });
checkPng("icons/icon-512.png", 512, { expectAlpha: true });
checkPng("icons/icon-maskable-192.png", 192, { expectAlpha: true });
checkPng("icons/icon-maskable-512.png", 512, { expectAlpha: true });
// iOS composites transparency onto black, so this one must carry no alpha.
checkPng("apple-touch-icon.png", 180, { expectAlpha: false });

console.log("\nICO container");
{
  const f = P("favicon.ico");
  if (!existsSync(f)) bad("favicon.ico is missing");
  else {
    const b = readFileSync(f);
    const type = b.readUInt16LE(2);
    const count = b.readUInt16LE(4);
    if (b.readUInt16LE(0) !== 0 || type !== 1) bad("favicon.ico header is not an icon");
    else {
      const sizes = [];
      let badPayload = false;
      for (let i = 0; i < count; i++) {
        const e = 6 + 16 * i;
        sizes.push(b.readUInt8(e) || 256);
        const off = b.readUInt32LE(e + 12);
        if (!b.subarray(off, off + 8).equals(PNG_SIG)) badPayload = true;
      }
      if (badPayload) bad("favicon.ico has a non-PNG payload");
      else ok(`favicon.ico: ${count} images [${sizes.join(", ")}]`);
    }
  }
}

console.log("\nManifest");
{
  const f = P("manifest.webmanifest");
  if (!existsSync(f)) bad("manifest.webmanifest is missing");
  else {
    const m = JSON.parse(readFileSync(f, "utf8"));
    // Relative URLs resolve against the manifest, which is what makes the
    // whole thing basePath-agnostic. Absolute paths would silently break.
    for (const [k, v] of [
      ["start_url", m.start_url],
      ["scope", m.scope],
    ]) {
      if (typeof v === "string" && v.startsWith("./")) ok(`${k} is relative ("${v}")`);
      else bad(`${k} is "${v}"; must be relative ("./") to survive a basePath`);
    }
    if ("id" in m)
      bad('"id" is set; omit it so the browser derives it from start_url');
    else ok('"id" omitted (browser derives it from start_url)');

    for (const icon of m.icons) {
      if (!icon.src.startsWith("./")) {
        bad(`icon src "${icon.src}" is not relative`);
        continue;
      }
      const file = P(icon.src.slice(2));
      if (!existsSync(file)) {
        bad(`icon src "${icon.src}" does not exist on disk`);
        continue;
      }
      const png = readPng(file);
      const actual = `${png.width}x${png.height}`;
      if (actual !== icon.sizes)
        bad(`${icon.src} declares ${icon.sizes} but is ${actual}`);
      else ok(`${icon.src} ${actual} purpose=${icon.purpose}`);
    }
    if (!m.icons.some((i) => i.purpose === "maskable"))
      bad("no maskable icon; Android will plate the icon on white");
    if (m.theme_color !== "#0e0d0b")
      bad("theme_color must match viewport.themeColor in src/app/layout.tsx");
    else ok("theme_color matches layout.tsx viewport.themeColor");
  }
}

console.log("\nMaskable safe zone (art must sit inside the centred 80% circle)");
{
  // Needs raw pixels, so this section is skipped if sharp is unavailable.
  let sharp = null;
  try {
    ({ default: sharp } = await import("sharp"));
  } catch {
    console.log("  SKIP  sharp unavailable");
  }
  if (sharp) {
    for (const rel of ["icons/icon-maskable-192.png", "icons/icon-maskable-512.png"]) {
      const { data, info } = await sharp(P(rel))
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const S = info.width;
      const limit = 0.4 * S;
      const c = S / 2;
      let outside = 0;
      let maxR = 0;
      for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < S; x++) {
          const i = (y * S + x) * info.channels;
          // Background is the dark ink ramp; anything brighter is artwork.
          if (data[i] <= 90 && data[i + 1] <= 90 && data[i + 2] <= 90) continue;
          const d = Math.hypot(x + 0.5 - c, y + 0.5 - c);
          if (d > maxR) maxR = d;
          if (d > limit) outside++;
        }
      }
      const msg = `${rel} max art radius ${maxR.toFixed(1)} of ${limit.toFixed(1)}`;
      if (outside === 0) ok(msg);
      else bad(`${msg} — ${outside} px outside the safe zone`);
    }
  }
}

console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
