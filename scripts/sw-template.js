/* eslint-disable */
/*
 * PANDR-5 offline service worker TEMPLATE.
 * scripts/generate-sw.mjs fills the VERSION, BASE and PRECACHE constants below and
 * writes out/sw.js. Do not put those placeholder tokens in comments: the generator
 * substitutes the first occurrence and would fill the comment instead of the code.
 * Never edit out/sw.js by hand - it is regenerated on every build.
 */

const VERSION = "__VERSION__";      // sha256 over every precached byte, 16 hex chars
const BASE = "__BASE__";            // next.config basePath, "" today
const PRECACHE = __PRECACHE__;      // full URL list, inlined at build time

const PREFIX = "pandr5-precache-";
const CACHE = PREFIX + VERSION;
const KEEP_GENERATIONS = 2;         // current build + previous build
const OFFLINE_DOC = BASE + "/404.html";

/* ---------------------------------------------------------------- install
 * Precache the entire export. cache:"reload" bypasses the HTTP cache so a
 * build can never be assembled from a stale CDN copy. Promise.all means the
 * install is atomic: if ANY url 404s (partial deploy) the whole install
 * rejects, this worker never activates, and the previously installed build
 * keeps serving. That is the correct failure mode for a gym app.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all(
        PRECACHE.map(async (url) => {
          const res = await fetch(new Request(url, { cache: "reload", redirect: "follow" }));
          if (!res.ok) throw new Error("precache failed: " + url + " -> " + res.status);
          // cache.put() rejects on a redirected response; rebuild it if the host redirected us.
          await cache.put(
            url,
            res.redirected
              ? new Response(res.clone().body, { status: 200, statusText: "OK", headers: res.headers })
              : res,
          );
        }),
      );
      // NO skipWaiting() here - see the update-safety note in the spec. A new
      // build parks in `waiting` so it can never swap assets under a page that
      // is mid-workout. It takes over on the next cold launch.
    })(),
  );
});

/* Explicit, user-initiated takeover only. */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

/* --------------------------------------------------------------- activate
 * caches.keys() is specified to return names in CREATION order, so the N most
 * recently created caches are simply the last N. No bookkeeping record, no
 * read-modify-write race. Keeping the previous generation means a page that is
 * still running the old build can always resolve its own hashed chunks, even
 * though the server no longer has them.
 *
 * clients.claim() matters on the FIRST install: there is no active worker to
 * wait behind, so activate runs immediately and claim() puts the very first
 * page load under control. That is what makes one online visit sufficient.
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = (await caches.keys()).filter((n) => n.startsWith(PREFIX));
      const keep = new Set([CACHE, ...names.slice(-KEEP_GENERATIONS)]);
      await Promise.all(names.filter((n) => !keep.has(n)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

/*
 * Look up a path. Our OWN generation first, so a page is always served a
 * self-consistent build; other retained generations are a last resort before
 * the network. ignoreSearch:true is required: Next appends ?_rsc=<hash> to RSC
 * prefetches and ?favicon.<hash>.ico to the favicon.
 */
async function fromCaches(path) {
  const names = (await caches.keys()).filter((n) => n.startsWith(PREFIX));
  for (const name of [CACHE, ...names.reverse()]) {
    const cache = await caches.open(name);
    const hit = await cache.match(path, { ignoreSearch: true });
    if (hit) return hit;
  }
  return undefined;
}

/* ------------------------------------------------------------------ fetch
 * Strategy per class:
 *
 * non-GET        -> not handled. Nothing in this app POSTs, and a SW must
 *                   never buffer a non-idempotent request.
 * cross-origin   -> not handled. respondWith is never called, so the request
 *                   goes straight to the network and NOTHING cross-origin can
 *                   ever enter a cache. Covers the Google Fonts stylesheet.
 * hashed asset   -> cache-first, never revalidated. The filename IS a content
 *                   hash, so a hit is correct by construction; revalidating
 *                   would only burn a network round trip in a basement.
 * navigation     -> cache-first against the precached HTML. Network-first with
 *                   a cache fallback would stall every launch on a TCP timeout
 *                   before falling back, which is exactly the gym case. The
 *                   precache is a full, atomically installed snapshot, so
 *                   cache-first cannot serve a torn build.
 * miss           -> network, then (documents only) the cached 404 page.
 */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // cross-origin: untouched, never cached

  const isDoc = req.mode === "navigate" || req.destination === "document";

  event.respondWith(
    (async () => {
      let hit = await fromCaches(url.pathname);

      // trailingSlash:true means only /program/ is precached. A hard navigation
      // to /program (typed, bookmarked, or an old link) must still resolve.
      if (!hit && isDoc && !url.pathname.endsWith("/") && !/\.[a-z0-9]+$/i.test(url.pathname)) {
        hit = await fromCaches(url.pathname + "/");
      }
      if (hit) return hit;

      try {
        return await fetch(req);
      } catch (err) {
        if (!isDoc) throw err;
        const fallback = await fromCaches(OFFLINE_DOC);
        if (fallback) {
          return new Response(fallback.body, {
            status: 404,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        }
        throw err;
      }
    })(),
  );
});
