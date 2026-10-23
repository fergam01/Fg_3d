import { supabase } from "@/lib/supabase";
import type { Product, ProductImage } from "@/types";

/**
 * Server Component: Fetches products and images with a single relational query.
 * Returns merged product data ready for client-side filtering/sorting.
 */
export async function fetchProducts({
  category,
  stockFilter,
}: {
  category?: string;
  stockFilter?: "todos" | "disponible";
} = {}): Promise<{ products: (Product & { product_images: ProductImage[] })[]; error: Error | null }> {
  // Build query with relational images in a single Supabase call
  let query = supabase
    .from("products")
    .select(`
      *,
      product_images (
        id, image_url, alt_text, display_order, is_primary
      )
    `, { count: "exact" })
    .order("created_at", { ascending: false });

  // Apply category filter
  if (category) {
    query = query.eq("category", category);
  }

  // Apply stock filter
  if (stockFilter === "disponible") {
    query = query.eq("stock_status", "disponible");
  }

  const { data: productsData, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return { products: [], error };
  }

  // Merge images into products and sort by display_order
  const mergedProducts = (productsData || []).map((product: any) => ({
    ...product,
    product_images: (product.product_images || [])
      .sort((a: ProductImage, b: ProductImage) => a.display_order - b.display_order),
  }));

  return { products: mergedProducts as (Product & { product_images: ProductImage[] })[], error: null };
}
