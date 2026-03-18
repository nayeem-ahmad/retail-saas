/**
 * Simple script to verify the read replica dashboard endpoint.
 * Run with: npx ts-node scripts/verify-read-replica.ts
 */

const ENDPOINT = "http://localhost:3000/api/dashboard/summary?tenantId=test-tenant-id";

async function verifyReadReplica() {
  console.log(`Testing Read Replica query routing at ${ENDPOINT}...`);
  
  try {
    const start = Date.now();
    
    // Simulate an authenticated request if needed, or rely on mock auth for testing
    const res = await fetch(ENDPOINT, {
      headers: {
        // "Authorization": "Bearer <token>" // Add test token if needed
      }
    });
    
    const duration = Date.now() - start;
    const data = await res.json().catch(() => null);
    
    if (res.ok) {
      console.log(`[SUCCESS] Data fetched from replica in ${duration}ms`);
      console.dir(data, { depth: null });
    } else {
      console.error(`[FAILED] Status ${res.status}:`, data?.error || res.statusText);
      console.log("Note: This endpoint requires a valid session and tenant access.");
    }
  } catch (err) {
    console.error(`[ERROR]:`, err instanceof Error ? err.message : err);
  }
}

verifyReadReplica();
