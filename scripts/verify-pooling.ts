/**
 * Simple script to verify API and DB connectivity under concurrent load.
 * Run with: npx ts-node scripts/verify-pooling.ts
 */

const ENDPOINT = "http://localhost:3000/api/health";
const CONCURRENCY = 20;

async function checkHealth(id: number) {
  try {
    const start = Date.now();
    const res = await fetch(ENDPOINT);
    const duration = Date.now() - start;
    
    if (res.ok) {
      console.log(`[Request ${id}] SUCCESS (${duration}ms)`);
    } else {
      console.error(`[Request ${id}] FAILED with status ${res.status}`);
    }
  } catch (err) {
    console.error(`[Request ${id}] ERROR:`, err instanceof Error ? err.message : err);
  }
}

async function runTest() {
  console.log(`Starting load test with ${CONCURRENCY} concurrent requests to ${ENDPOINT}...`);
  
  const requests = Array.from({ length: CONCURRENCY }, (_, i) => checkHealth(i + 1));
  await Promise.all(requests);
  
  console.log("Load test complete.");
}

runTest();
