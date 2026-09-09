#!/usr/bin/env node
/*
 * Generates out/sw.js from scripts/sw-template.js after `next build`.
 *
 * Why build-time and not runtime: Next emits content-hashed chunk names that
 * change every build, and several of them are reachable only from a single
 * page or only from inside another chunk. Nothing in the browser can enumerate
 * them. Only the build output can.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPT_DIR, "..");
const OUT = join(ROOT, "out");
const TEMPLATE = join(SCRIPT_DIR, "sw-template.js");

function fail(msg) {
  console.error("generate-sw: " + msg);
  process.exit(1);
}

if (!existsSync(OUT)) fail("out/ does not exist. Run `next build` first.");
if (!existsSync(join(OUT, "index.html"))) fail("out/index.html missing - export looks incomplete.");
if (!existsSync(TEMPLATE)) fail("missing " + TEMPLATE);

/*
 * basePath. Read it from the manifest Next itself writes, so it can never drift
 * from next.config.ts. Present for output:"export" builds; "" today.
 */
let basePath = "";
const manifest = join(ROOT, ".next", "routes-manifest.json");
if (existsSync(manifest)) {
  basePath = JSON.parse(readFileSync(manifest, "utf8")).basePath || "";
} else {
  console.warn("generate-sw: .next/routes-manifest.json missing, assuming basePath \"\"");
}
if (basePath.endsWith("/")) basePath = basePath.slice(0, -1);

/*
 * Files that must NOT be precached:
 *  - sw.js / sw.js.map: precaching the worker would let the fetch handler serve
 *    a stale copy to the browser's own update check, permanently pinning the
 *    user to one build. This is the single most important exclusion.
 *  - *.map: source maps are never requested by an end user; they would roughly
 *    double the payload for nothing.
 *  - dotfiles (.nojekyll, .DS_Store): server-side markers and junk, no client
 *    value, and .nojekyll has no meaningful URL.
 * Everything else in out/ IS precached, deliberately - including chunks that no
 * HTML references, because those are lazy imports pulled in by other chunks.
 */
function excluded(rel) {
  const base = rel.slice(rel.lastIndexOf("/") + 1);
  if (base === "sw.js" || base === "sw.js.map") return true;
  if (base.startsWith(".")) return true;
  if (rel.endsWith(".map")) return true;
  // @fontsource's src: lists woff2 AND a legacy woff, so Next emits 8 dead .woff
  // files (~174 KB) that no service-worker-capable browser will ever request.
  // Note .endsWith(".woff") does not match ".woff2", so the live faces stay.
  if (rel.endsWith(".woff")) return true;
  return false;
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) walk(abs, acc);
    else if (entry.isFile()) acc.push(abs);
  }
  return acc;
}

/*
 * Path -> URL mapping. trailingSlash:true means the browser only ever requests
 * the directory form, so out/program/index.html must be precached as
 * "/program/" and NOT as "/program/index.html". Root index.html becomes "/".
 * Every other file keeps its literal path - crucially the RSC payloads, which
 * the client router requests verbatim as /program/index.txt (plus a ?_rsc=
 * query the worker strips with ignoreSearch).
 */
function toUrlPath(rel) {
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return "/" + rel.slice(0, -"index.html".length);
  return "/" + rel;
}

const files = walk(OUT)
  .map((abs) => relative(OUT, abs).split(sep).join("/"))
  .filter((rel) => !excluded(rel))
  .sort();

if (files.length === 0) fail("no files found under out/");

const entries = [];
for (const rel of files) {
  const bytes = readFileSync(join(OUT, rel));
  entries.push({
    url: basePath + toUrlPath(rel),
    digest: createHash("sha256").update(bytes).digest("hex"),
    size: bytes.length,
  });
}

const urls = [...new Set(entries.map((e) => e.url))].sort();

/*
 * The 404 page is the offline document fallback. Next emits it twice under
 * trailingSlash: out/404.html (what a static host serves for an unknown path)
 * and out/404/index.html (what a client-side link to /404/ would hit). Both are
 * precached; the worker uses /404.html.
 */
if (!urls.includes(basePath + "/404.html")) fail("out/404.html missing - offline fallback unavailable.");
if (!urls.includes(basePath + "/")) fail("root url missing from precache list.");

/*
 * Version = sha256 over every precached URL AND its content digest, plus the
 * basePath. It changes if any byte of any precached file changes, if a file is
 * added or removed, or if basePath changes - and is otherwise byte-stable, so
 * a rebuild with no source change produces an identical sw.js and the browser
 * does not churn a new install.
 */
const version = createHash("sha256")
  .update("basePath:" + basePath + "\n")
  .update(entries.map((e) => e.url + " " + e.digest).sort().join("\n"))
  .digest("hex")
  .slice(0, 16);

const totalBytes = entries.reduce((n, e) => n + e.size, 0);
if (totalBytes > 40 * 1024 * 1024) {
  console.warn(
    "generate-sw: precache is " + (totalBytes / 1048576).toFixed(1) + " MiB - large enough to risk eviction on mobile.",
  );
}

const source = readFileSync(TEMPLATE, "utf8")
  .replaceAll("__VERSION__", version)
  .replaceAll("__BASE__", basePath)
  .replaceAll("__PRECACHE__", JSON.stringify(urls, null, 2));

if (source.includes("__VERSION__") || source.includes("__PRECACHE__")) {
  fail("template placeholders were not all replaced.");
}

writeFileSync(join(OUT, "sw.js"), source);

console.log(
  "generate-sw: out/sw.js written - " +
    urls.length +
    " urls, " +
    (totalBytes / 1024).toFixed(0) +
    " KiB, version " +
    version +
    ", basePath " +
    JSON.stringify(basePath),
);
