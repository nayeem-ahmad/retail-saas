"use server";

import { createClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { ProductSchema } from "@retail-saas/shared-types";
import { formatError } from "@/lib/api-utils";

export async function createProduct(formData: FormData) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    const rawData = {
      name: formData.get("name"),
      sku: formData.get("sku"),
      price: formData.get("price"),
      initialStock: formData.get("initialStock"),
    };

    // 1. Validate Input
    const parsedData = ProductSchema.parse(rawData);

    const supabase = await createClient();

    // 2. Get current user's tenant context
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: tenantUser, error: tenantUserError } = await supabase
      .from("tenant_users")
      .select("tenant_id")
      .eq("user_id", user.id)
      .single();

    if (tenantUserError || !tenantUser) {
      throw new Error("Could not determine tenant context");
    }

    const tenantId = tenantUser.tenant_id;

    // 3. Insert Product
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert([{
        tenant_id: tenantId,
        name: parsedData.name,
        sku: parsedData.sku,
        price: parsedData.price,
        reorder_level: 10, // Default for now
      }])
      .select()
      .single();

    if (productError || !product) {
      throw productError || new Error("Failed to create product");
    }

    // 4. Handle Initial Stock (if applicable)
    // Note: We need a default warehouse for the tenant. For MVP, we might just look up the first warehouse
    // or skip if we don't have warehouses set up yet. Let's assume a default warehouse exists or create a basic stock entry.
    const { data: warehouse } = await supabase
      .from("warehouses")
      .select("id")
      .eq("tenant_id", tenantId)
      .limit(1)
      .single();

    if (warehouse && parsedData.initialStock > 0) {
      const { error: stockError } = await supabase
        .from("product_stocks")
        .insert([{
          tenant_id: tenantId,
          product_id: product.id,
          warehouse_id: warehouse.id,
          quantity: parsedData.initialStock,
        }]);

      if (stockError) {
        // Log error but don't fail the whole product creation
        console.error("Failed to set initial stock", stockError);
      }
    }

    revalidatePath("/dashboard/products");
    return { success: true };
  } catch (error) {
    console.error(`[Create Product Error] Request ID: ${requestId}`, error);
    const apiError = formatError(error, requestId);
    return { error: apiError.error.message, details: apiError.error.details };
  }
}
