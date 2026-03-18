import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-utils";

/**
 * Basic health check to verify database connectivity.
 */
async function handler() {
  const supabase = await createClient();
  
  // Simple query to verify connection
  const { error } = await supabase.from("tenants").select("count").limit(1);

  if (error) {
    throw error;
  }

  return NextResponse.json({
    status: "ok",
    database: "connected",
    timestamp: new Date().toISOString(),
  });
}

export const GET = withErrorHandler(handler);
