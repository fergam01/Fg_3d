import { Metadata } from "next";
import ProductDetailClient from "./page-client";

/**
 * Server Component wrapper that fetches product data for SEO and passes to client component.
 */
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { supabase } = await import("@/lib/supabase");

  // Fetch product data for metadata
  const { data, error } = await supabase
    .from("products")
    .select(`name, description, category, price_ars`)
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return {
      title: "Producto no encontrado | Impresiones 3D Argentina",
      description: "El producto que buscás ya no está disponible.",
    };
  }

  const productName = data.name;
  const productDescription = data.description?.slice(0, 160) || `Ver ${productName} en nuestro catálogo de impresiones 3D.`;

  return {
    title: `${productName} | Impresiones 3D Argentina`,
    description: productDescription,
    keywords: [
      "impresión 3D",
      productName.toLowerCase(),
      data.category?.toLowerCase() || "",
      "Argentina",
      "ARS",
      "STL",
      "3MF",
    ].filter(Boolean),
    openGraph: {
      title: `${productName} | Impresiones 3D Argentina`,
      description: productDescription,
      type: "website",
      locale: "es_AR",
      siteName: "Impresiones 3D Argentina",
    },
    twitter: {
      card: "summary_large_image",
      title: `${productName} | Impresiones 3D Argentina`,
      description: productDescription,
    },
  };
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  // Fetch initial data on server (SSR) for faster first paint
  const { supabase } = await import("@/lib/supabase");
  
  let productData = null;
  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        product_images (
          id, image_url, alt_text, display_order, is_primary
        )
      `)
      .eq("id", params.id)
      .single();

    if (!error && data) {
      productData = data;
    }
  } catch (err) {
    console.error("Error fetching product:", err);
  }

  return <ProductDetailClient initialProduct={productData} />;
}
