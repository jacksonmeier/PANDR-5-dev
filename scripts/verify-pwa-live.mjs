// Browser-truth verification against a served build.
//
//   npx --yes http-server out -p 8080 -s &
//   node scripts/verify-pwa-live.mjs http://127.0.0.1:8080/
//
// Playwright is not an npm dependency of this project; it is installed
// globally, so it is imported by absolute path.
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";

const base = process.argv[2] ?? "http://127.0.0.1:8080/";
let failures = 0;
const ok = (m) => console.log("  PASS  " + m);
const bad = (m) => {
  console.log("  FAIL  " + m);
  failures++;
};

const browser = await chromium.launch();
const page = await browser.newPage();

// Load a DEEP route, not the root: this is what proves the manifest's
// relative URLs resolve against the manifest rather than the document.
const deep = new URL("workout/push/", base).href;
await page.goto(deep, { waitUntil: "load" });
ok(`loaded deep route ${deep}`);

const cdp = await page.context().newCDPSession(page);
await cdp.send("Page.enable");
const res = await cdp.send("Page.getAppManifest");

if (!res.url) bad("no <link rel=\"manifest\"> found");
else ok(`manifest url ${res.url}`);

// Chromium's own parser. Empty means it accepted everything.
if (res.errors.length === 0) ok("Chromium reported no manifest errors");
else for (const e of res.errors) bad(`manifest: ${e.message}`);

// NOTE: read `manifest`, not `parsed` — `parsed` is sparse.
const m = res.manifest ?? {};
const expectedScope = new URL(".", res.url).href;
if (m.scope === expectedScope) ok(`scope resolved to ${m.scope}`);
else bad(`scope is ${m.scope}, expected ${expectedScope}`);
if (m.startUrl === expectedScope) ok(`start_url resolved to ${m.startUrl}`);
else bad(`start_url is ${m.startUrl}, expected ${expectedScope}`);
// With "id" omitted the browser derives it from start_url.
if (m.id === expectedScope) ok(`id derived as ${m.id}`);
else bad(`id is ${m.id}, expected ${expectedScope}`);
if (m.display === "kStandalone") ok("display is standalone");
else bad(`display is ${m.display}`);

// getAppManifest does NOT verify icons exist. Fetch every one.
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
let any192 = false;
let any512 = false;
for (const icon of m.icons ?? []) {
  const r = await page.request.get(icon.url);
  if (!r.ok()) {
    bad(`icon ${icon.url} -> HTTP ${r.status()}`);
    continue;
  }
  const b = await r.body();
  if (!b.subarray(0, 8).equals(PNG_SIG)) {
    bad(`icon ${icon.url} is not a PNG`);
    continue;
  }
  const actual = `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`;
  if (actual !== icon.sizes) bad(`${icon.url} declares ${icon.sizes} but is ${actual}`);
  else ok(`icon ${icon.url} ${actual}`);
  if (actual === "192x192") any192 = true;
  if (actual === "512x512") any512 = true;
}
if (any192 && any512) ok("192 and 512 icons both present and fetchable");
else bad("missing a fetchable 192 or 512 icon (Chrome install criteria)");

// apple-touch-icon is an iOS <link>, invisible to the manifest.
const appleHref = await page.getAttribute('link[rel="apple-touch-icon"]', "href");
if (!appleHref) bad("no <link rel=\"apple-touch-icon\">");
else {
  const abs = new URL(appleHref, page.url()).href;
  const r = await page.request.get(abs);
  if (!r.ok()) bad(`apple-touch-icon ${abs} -> HTTP ${r.status()}`);
  else {
    const b = await r.body();
    const colourType = b.readUInt8(25);
    const dims = `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`;
    if (dims !== "180x180") bad(`apple-touch-icon is ${dims}, expected 180x180`);
    else if (colourType === 6 || colourType === 4)
      bad("apple-touch-icon has an alpha channel; iOS will composite it on black");
    else ok(`apple-touch-icon ${abs} ${dims} opaque`);
  }
}

await browser.close();
console.log(failures === 0 ? "\nAll live checks passed.\n" : `\n${failures} failed.\n`);
process.exit(failures === 0 ? 0 : 1);
