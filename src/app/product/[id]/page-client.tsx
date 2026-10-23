"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { formatPriceArs } from "@/types";
import { useCartStore } from "@/store/cart";
import { supabase } from "@/lib/supabase";

interface ProductImage {
  id: string;
  image_url: string;
  alt_text?: string;
  display_order: number;
  is_primary: boolean;
}

/**
 * Client Component for product detail page.
 * Receives initial data from server component and handles client-side interactions.
 */
export default function ProductDetailClient({
  initialProduct = null,
}: {
  initialProduct?: any | null;
}) {
  const [product, setProduct] = useState<any>(initialProduct);
  const [loading, setLoading] = useState(initialProduct === null);
  const [selectedImage, setSelectedImage] = useState(0);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (initialProduct === null && !product) {
      loadProduct();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only run once on mount

  async function loadProduct() {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        product_images (
          id, image_url, alt_text, display_order, is_primary
        )
      `)
      .eq("id", initialProduct?.id || "")
      .single();

    if (!error && data) {
      setProduct(data);
    }
    
    setLoading(false);
  }

  // Get all images for gallery (new images array or fallback to single image_url)
  const images = (() => {
    if (product?.product_images?.length > 0) {
      return product.product_images.sort((a: any, b: any) => a.display_order - b.display_order);
    }
    // Fallback for backward compatibility
    return product?.image_url ? [{ image_url: product.image_url }] : [];
  })();

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Cargando producto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <span className="text-5xl block mb-4">🔍</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Producto no encontrado</h2>
        <p className="text-gray-600 mb-6">El producto que buscás ya no está disponible.</p>
        <Link href="/catalog" className="text-brand-600 hover:text-brand-700 font-medium">
          ← Volver al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-brand-600 transition-colors">Inicio</Link>
        <span>/</span>
        <Link href="/catalog" className="hover:text-brand-600 transition-colors">Catálogo</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Galería de imágenes del producto ── */}
        {images.length > 0 ? (
          <>
            {/* Main image display */}
            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative">
              <Image 
                src={images[selectedImage]?.image_url || ""} 
                alt={product.name} 
                fill 
                className="object-cover" 
              />
            </div>

            {/* Thumbnail gallery */}
            {images.length > 1 && (
              <div className="lg:hidden">
                <p className="text-sm font-medium text-gray-700 mb-2">Vista previa:</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === idx ? "border-brand-500" : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <Image src={img.image_url} alt="" width={64} height={64} className="object-cover w-full h-full" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Desktop image list */}
            {images.length > 1 && (
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-gray-700 mb-2">Galería ({images.length} imágenes):</p>
                <div className="grid grid-cols-4 gap-2">
                  {images.map((img: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === idx ? "border-brand-500" : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <Image src={img.image_url} alt="" width={128} height={128} className="object-cover w-full h-full" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative">
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-8xl">🧊</span>
            </div>
          </div>
        )}

        {/* ── Info del producto ── */}
        <div className="space-y-6">
          {/* Categoría badge */}
          <span className="inline-block bg-brand-100 text-brand-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {product.category}
          </span>

          {/* Título y precio */}
          <h1 className="text-3xl font-extrabold text-gray-900">{product.name}</h1>
          <p className="text-2xl font-bold text-brand-700">{formatPriceArs(product.price_ars)}</p>

          {/* Rating y stock */}
          {product.rating && (
            <div className="flex items-center gap-2">
              <span className="text-yellow-500">{'★'.repeat(Math.round(product.rating))}</span>
              <span className="text-sm text-gray-500">{product.rating}/5</span>
            </div>
          )}

          {product.stock !== undefined && (
            <p className={`text-sm font-medium ${product.stock > 0 ? "text-green-600" : "text-red-600"}`}>
              {product.stock > 0 ? `✅ En stock (${product.stock} unidades)` : "❌ Sin stock"}
            </p>
          )}

          {/* Descripción */}
          <div className="prose prose-sm text-gray-700">
            <p>{product.description}</p>
          </div>

          {/* Especificaciones técnicas */}
          {(product.dimensions || product.material || product.weight_grams) && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <h3 className="font-semibold text-sm text-gray-900 mb-3">Especificaciones técnicas</h3>
              {product.dimensions && (
                <p className="text-sm text-gray-600">
                  📐 Dimensiones: {product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height}{" "}
                  {product.dimensions.unit}
                </p>
              )}
              {product.material && (
                <p className="text-sm text-gray-600">🧱 Material: {product.material}</p>
              )}
              {product.weight_grams && (
                <p className="text-sm text-gray-600">⚖️ Peso estimado: {product.weight_grams}g</p>
              )}
              {product.print_time_hours && (
                <p className="text-sm text-gray-600">🕐 Tiempo de impresión: ~{product.print_time_hours}hs</p>
              )}
            </div>
          )}

          {/* Botón agregar al carrito */}
          <button
            onClick={() => addItem(product)}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-brand-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            Agregar al carrito — {formatPriceArs(product.price_ars)}
          </button>

          {/* Links alternativos */}
          <div className="flex gap-3 pt-2">
            <Link
              href="/quote"
              className="flex-1 text-center bg-white border-2 border-brand-600 text-brand-700 font-medium py-2.5 px-4 rounded-xl hover:bg-brand-50 transition-colors text-sm"
            >
              📋 Cotizar personalizado
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
