/**
 * Script to verify Edge caching and CDN performance.
 * Run with: npx ts-node scripts/verify-caching.ts <url>
 */

const targetUrl = process.argv[2] || "http://localhost:3000";

async function verifyCaching(url: string) {
  console.log(`Auditing caching headers for: ${url}
`);

  try {
    // 1. Initial request (may be a MISS)
    const start1 = Date.now();
    const res1 = await fetch(url);
    const duration1 = Date.now() - start1;

    console.log(`[Request 1] ${duration1}ms`);
    console.log(`Cache-Control: ${res1.headers.get("cache-control") || "None"}`);
    console.log(`X-Vercel-Cache: ${res1.headers.get("x-vercel-cache") || "None (Local Environment)"}`);
    console.log(`X-Vercel-Id: ${res1.headers.get("x-vercel-id") || "None"}
`);

    // 2. Second request (should be a HIT if CDN is active)
    const start2 = Date.now();
    const res2 = await fetch(url);
    const duration2 = Date.now() - start2;

    console.log(`[Request 2] ${duration2}ms`);
    console.log(`X-Vercel-Cache: ${res2.headers.get("x-vercel-cache") || "None (Local Environment)"}`);

    if (res2.headers.get("x-vercel-cache") === "HIT") {
      console.log("
✅ SUCCESS: Asset is being served from the Edge CDN cache!");
    } else if (url.includes("localhost")) {
      console.log("
ℹ️ INFO: Testing locally. Deploy to Vercel to see actual CDN HIT/MISS headers.");
    } else {
      console.warn("
⚠️ WARNING: Asset is NOT being served from the cache (MISS). Check your Cache-Control headers.");
    }
  } catch (err) {
    console.error("Error during audit:", err instanceof Error ? err.message : err);
  }
}

verifyCaching(targetUrl);
