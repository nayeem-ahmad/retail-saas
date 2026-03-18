"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "../actions";

export default function NewProductPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);

    try {
      const result = await createProduct(formData);
      
      if (result.error) {
        setError(result.error);
        if (result.details) {
          console.error(result.details);
        }
      } else {
        router.push("/dashboard/products");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Product</h1>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded mb-6 border border-red-200 text-sm">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-4 bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
          <input 
            type="text" 
            name="name" 
            id="name" 
            required
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
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-black focus:border-black"
          />
        </div>

        <div>
           <label htmlFor="initialStock" className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
           <input 
            type="number" 
            name="initialStock" 
            id="initialStock"
            defaultValue={0}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-black focus:border-black"
          />
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition disabled:bg-gray-400"
          >
            {loading ? "Creating..." : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
