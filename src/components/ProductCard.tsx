"use client";

import Link from "next/link";
import Image from "next/image";
import { formatPriceArs } from "@/types";
import { useCartStore } from "@/store/cart";

/**
 * Tarjeta de producto para el catálogo.
 * Muestra imagen, nombre, precio en ARS y botón agregar al carrito.
 */
export default function ProductCard({ product }: { product: any }) {
  const addItem = useCartStore((s) => s.addItem);

  // Get primary image for display (new images array or fallback to single image_url)
  const primaryImage = (() => {
    // Supabase relational query returns data under the table name: product_images
    if (product.product_images?.length > 0) {
      return product.product_images.find((img: any) => img.is_primary)?.image_url || product.product_images[0]?.image_url;
    }
    return product.image_url;
  })();

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-brand-200 transition-all duration-300 flex flex-col">
      {/* Imagen del producto */}
      <Link href={`/product/${product.id}`} className="block aspect-square relative overflow-hidden bg-gray-100">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="text-6xl">🧊</span>
          </div>
        )}

        {/* Badge de categoría */}
        {product.category && (
          <span className="absolute top-3 left-3 bg-brand-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {categoryLabel(product.category)}
          </span>
        )}
      </Link>

      {/* Info del producto */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-brand-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Precio */}
        <div className="mt-auto pt-2 border-t border-gray-100">
          <p className="text-xl font-bold text-brand-700">{formatPriceArs(product.price_ars)}</p>
          {product.material && (
            <p className="text-xs text-gray-500 mt-1">Material: {product.material}</p>
          )}
        </div>

        {/* Botón agregar al carrito */}
        <button
          onClick={(e) => {
            e.preventDefault();
            addItem(product);
          }}
          className="mt-3 w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          Agregar al carrito
        </button>
      </div>
    </div>
  );
}

function categoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    decoracion: "Decoración",
    "juegos de mesa": "Juegos de Mesa",
    juguetes: "Juguetes",
    herramientas: "Herramientas",
  };
  return labels[cat] ?? cat;
}
