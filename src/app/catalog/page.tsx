import { Metadata } from "next";
import CatalogPageClient from "./page-client";
import type { Product, ProductImage } from "@/types";

interface MergedProduct extends Omit<Product, "images"> {
  product_images: ProductImage[];
}

export const metadata: Metadata = {
  title: "Catálogo de Productos | Impresiones 3D Argentina",
  description:
    "Explorá nuestro catálogo completo de productos impresos en 3D. Precios en ARS, múltiples categorías.",
};

/**
 * Server Component wrapper that fetches products and passes them to the client component.
 * Uses a single Supabase relational query to avoid N+1 database calls.
 */
export default async function CatalogPage() {
  // Fetch initial data on server (SSR) for faster first paint
  const initialProducts: MergedProduct[] = [];

  return <CatalogPageClient initialProducts={initialProducts} />;
}
