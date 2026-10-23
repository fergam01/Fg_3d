"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";

/**
 * HOME PAGE — Landing principal con hero + productos destacados.
 * Client Component para cargar imágenes dinámicamente.
 */

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  async function loadFeaturedProducts() {
    setLoading(true);
    
    // Load featured products with their images (limit to 3)
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        product_images (
          id, image_url, alt_text, display_order, is_primary
        )
      `)
      .order("created_at", { ascending: false })
      .limit(3);

    if (!error && data) {
      setFeaturedProducts(data);
    }
    
    setLoading(false);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* ── Hero Section ── */}
      <section className="text-center mb-16 animate-fade-in-up">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-4">
          Piezas impresas en{" "}
          <span className="bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent">
            3D
          </span>
          <br />
          de alta calidad
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Catálogo con precios en pesos argentinos + cotización personalizada.
          Subí tu archivo STL o 3MF y te respondemos en menos de 24hs.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/catalog"
            className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg shadow-brand-200 active:scale-[0.98]"
          >
            Ver catálogo completo →
          </Link>
          <Link
            href="/quote"
            className="bg-white hover:bg-gray-50 text-brand-700 font-semibold py-3 px-8 rounded-xl border-2 border-brand-600 transition-all duration-200 active:scale-[0.98]"
          >
            Solicitar cotización 📋
          </Link>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
        {[
          { icon: "🇦🇷", title: "Precios en ARS", desc: "Todo en pesos argentinos, sin sorpresas." },
          { icon: "⚡", title: "Entrega rápida", desc: "Respuesta en menos de 24hs hábiles." },
          { icon: "🧊", title: "Alta calidad", desc: "Materiales premium PLA, PETG y resina UV." },
        ].map((f) => (
          <div key={f.title} className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
            <span className="text-3xl block mb-3">{f.icon}</span>
            <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
            <p className="text-sm text-gray-500">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* ── Productos destacados ── */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Productos destacados</h2>
          <Link href="/catalog" className="text-brand-600 hover:text-brand-700 font-medium text-sm">
            Ver todo →
          </Link>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Cargando productos...</p>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <span className="text-4xl block mb-3">📦</span>
            <p className="text-gray-600">No hay productos destacados aún.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
