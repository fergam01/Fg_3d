"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";
import type { Product, ProductImage } from "@/types";

interface MergedProduct extends Omit<Product, "images"> {
  product_images: ProductImage[];
}

/**
 * Client Component for catalog page.
 * Receives initial data from server component and handles client-side filtering/sorting.
 */
export default function CatalogPageClient({
  initialProducts = [],
}: {
  initialProducts?: MergedProduct[];
}) {
  const [products, setProducts] = useState<MergedProduct[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("price-desc");
  const [stockFilter, setStockFilter] = useState<"todos" | "disponible">("todos");

  useEffect(() => {
    if (initialProducts.length === 0) {
      loadProducts();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only run once on mount

  async function loadProducts() {
    setLoading(true);

    let productsQuery = supabase.from("products").select(`
      *,
      product_images (
        id, image_url, alt_text, display_order, is_primary
      )
    `).order("created_at", { ascending: false });

    if (categoryFilter) {
      productsQuery = productsQuery.eq("category", categoryFilter);
    }

    if (stockFilter === "disponible") {
      productsQuery = productsQuery.eq("stock_status", "disponible");
    }

    const { data: productsData, error: productsError } = await productsQuery;

    if (productsError) {
      console.error("Error cargando productos:", productsError);
      setLoading(false);
      return;
    }

    // Merge images into products and sort by display_order
    const mergedProducts = (productsData || []).map((product: any) => ({
      ...product,
      product_images: (product.product_images || [])
        .sort((a: ProductImage, b: ProductImage) => a.display_order - b.display_order),
    })) as MergedProduct[];

    // Apply client-side sorting
    let sortedProducts = [...mergedProducts];
    if (sortOrder === "price-desc") {
      sortedProducts.sort((a: any, b: any) => b.price_ars - a.price_ars);
    } else if (sortOrder === "price-asc") {
      sortedProducts.sort((a: any, b: any) => a.price_ars - b.price_ars);
    } else if (sortOrder === "name") {
      sortedProducts.sort((a: any, b: any) => a.name.localeCompare(b.name));
    }

    setProducts(sortedProducts);
    setLoading(false);
  }

  // Reload when filters change
  useEffect(() => {
    loadProducts();
  }, [categoryFilter, sortOrder, stockFilter]); // eslint-disable-line react-hooks/exhaustive-deps -- intentional reload on filter change

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Catálogo de Productos</h1>
        <p className="text-gray-600">Explorá nuestros modelos impresos en 3D. Todos los precios en ARS.</p>
      </div>

      {/* Filtros */}
      <div className="mb-8 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <form action="" method="GET" className="flex flex-wrap gap-3 items-center">
          <label htmlFor="category-filter" className="text-sm font-medium text-gray-700">
            Categoría:
          </label>
          <select
            id="category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm bg-white"
          >
            <option value="">Todas las categorías</option>
            <option value="decoracion">🎨 Decoración</option>
            <option value="juegos de mesa">🎲 Juegos de Mesa</option>
            <option value="juguetes">🧸 Juguetes</option>
            <option value="herramientas">🔧 Herramientas</option>
          </select>

          <label htmlFor="sort-filter" className="text-sm font-medium text-gray-700">
            Ordenar:
          </label>
          <select
            id="sort-filter"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm bg-white"
          >
            <option value="price-desc">Precio: Mayor a menor</option>
            <option value="price-asc">Precio: Menor a mayor</option>
            <option value="name">Nombre A-Z</option>
          </select>

          <Link
            href="/quote"
            className="ml-auto bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-5 rounded-lg transition-colors text-sm whitespace-nowrap"
          >
            📋 Cotizar pieza personalizada
          </Link>
        </form>
      </div>

      {/* Grid de productos */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-8 bg-gray-200 rounded w-1/3" />
                <div className="h-10 bg-gray-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl block mb-4">🔍</span>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No se encontraron productos</h3>
          <p className="text-gray-500">Probá ajustando los filtros o visitá la sección de cotización.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
