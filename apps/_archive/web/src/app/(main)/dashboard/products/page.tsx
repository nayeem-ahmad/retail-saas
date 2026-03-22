import { createClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProductsPage() {
  const supabase = await createClient();

  // Get user
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
    return <div>No tenant linked</div>;
  }

  const tenantId = tenantUser.tenant_id;

  // Fetch products
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("tenant_id", tenantId);

  if (error) {
    return <div>Error loading products: {error.message}</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link 
          href="/dashboard/products/new" 
          className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition relative"
        >
          Add Product
        </Link>
      </div>

      <div className="border rounded-lg overflow-hidden border-gray-200">
        <table className="w-full text-left bg-white">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-sm font-medium text-gray-500 uppercase">Product Name</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500 uppercase">Warranty</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products && products.length > 0 ? (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{product.sku}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">${Number(product.price).toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {product.warranty_enabled
                      ? `${product.warranty_duration_days ?? 0} days`
                      : "Disabled"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <Link href={`/dashboard/products/${product.id}/edit`} className="text-black underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
