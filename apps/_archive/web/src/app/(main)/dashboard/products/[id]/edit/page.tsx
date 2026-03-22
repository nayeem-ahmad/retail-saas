import { createClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { updateProduct } from "../../actions";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: tenantUser } = await supabase
    .from("tenant_users")
    .select("tenant_id")
    .eq("user_id", user.id)
    .single();

  if (!tenantUser) {
    return <div className="p-8">No tenant linked</div>;
  }

  const { data: product, error } = await supabase
    .from("products")
    .select("id, name, sku, price, warranty_enabled, warranty_duration_days")
    .eq("tenant_id", tenantUser.tenant_id)
    .eq("id", id)
    .single();

  if (error || !product) {
    return <div className="p-8">Product not found.</div>;
  }

  async function handleSubmit(formData: FormData) {
    "use server";
    const result = await updateProduct(id, formData);
    if (result.error) {
      throw new Error(result.error);
    }
    redirect("/dashboard/products");
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
      <form action={handleSubmit} className="space-y-4 bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
          <input
            type="text"
            name="name"
            id="name"
            required
            defaultValue={product.name}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-black focus:border-black"
          />
        </div>

        <div>
          <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
          <input
            type="text"
            name="sku"
            id="sku"
            required
            defaultValue={product.sku ?? ""}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-black focus:border-black"
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price</label>
          <input
            type="number"
            name="price"
            id="price"
            step="0.01"
            min="0"
            required
            defaultValue={Number(product.price)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-black focus:border-black"
          />
        </div>

        <div className="rounded-md border border-gray-200 p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              name="warrantyEnabled"
              defaultChecked={Boolean(product.warranty_enabled)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Warranty Enabled
          </label>

          <div className="mt-3">
            <label htmlFor="warrantyDurationDays" className="block text-sm font-medium text-gray-700 mb-1">
              Warranty Duration (Days)
            </label>
            <input
              type="number"
              name="warrantyDurationDays"
              id="warrantyDurationDays"
              min={0}
              defaultValue={product.warranty_duration_days ?? undefined}
              placeholder="e.g. 365"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-black focus:border-black"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <a href="/dashboard/products" className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50">Cancel</a>
          <button type="submit" className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition">Save Changes</button>
        </div>
      </form>
    </div>
  );
}
