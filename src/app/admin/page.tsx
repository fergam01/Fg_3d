"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatPriceArs } from "@/types";

/** Dashboard principal del admin */
export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, quotations: 0, orders: 0, pendingQuotations: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [{ count: productCount }, { count: quoteCount }, { count: orderCount }] = await Promise.all([
          supabase.from("products").select("*", { count: "exact", head: true }),
          supabase.from("quotations").select("*", { count: "exact", head: true }),
          supabase.from("orders").select("*", { count: "exact", head: true }),
        ]);

        const { count: pendingCount } = await supabase
          .from("quotations")
          .select("id", { count: "exact", head: true })
          .eq("status", "pendiente");

        setStats({
          products: productCount ?? 0,
          quotations: quoteCount ?? 0,
          orders: orderCount ?? 0,
          pendingQuotations: pendingCount ?? 0,
        });
      } catch (err) {
        console.error("Error cargando stats:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) return <div className="p-8 text-center">Cargando dashboard...</div>;

  return (
    <div className="p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Resumen general de la tienda</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Productos", value: stats.products, icon: "📦", color: "bg-blue-50 border-blue-200" },
          { label: "Cotizaciones pendientes", value: stats.pendingQuotations, icon: "⏳", color: "bg-yellow-50 border-yellow-200" },
          { label: "Total cotizaciones", value: stats.quotations, icon: "📋", color: "bg-purple-50 border-purple-200" },
          { label: "Pedidos", value: stats.orders, icon: "🛒", color: "bg-green-50 border-green-200" },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} border rounded-xl p-6`}>
            <span className="text-3xl block mb-2">{stat.icon}</span>
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {loading ? "..." : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-bold text-lg mb-4">Acciones rápidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickAction href="/admin/products" label="Gestionar productos" desc="Agregar, editar o eliminar" />
          <QuickAction href="/admin/quotations" label="Ver cotizaciones pendientes" desc={`${stats.pendingQuotations} por responder`} />
          <QuickAction href="/catalog" label="Ir a la tienda" desc="Ver cómo lo ven los clientes" />
        </div>
      </div>

      {/* Recent quotations */}
      <RecentQuotations />
    </div>
  );
}

function QuickAction({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link href={href} className="block p-4 bg-gray-50 hover:bg-brand-50 border border-gray-200 hover:border-brand-300 rounded-xl transition-colors">
      <p className="font-medium text-gray-900">{label}</p>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
    </Link>
  );
}

function RecentQuotations() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("quotations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setQuotations(data ?? []);
        setLoading(false);
      });
  }, []);

  if (loading || quotations.length === 0) return null;

  return (
    <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-bold text-lg mb-4">Cotizaciones recientes</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 font-medium text-gray-600">Email</th>
              <th className="text-left py-2 font-medium text-gray-600">Archivo</th>
              <th className="text-left py-2 font-medium text-gray-600">Estado</th>
              <th className="text-left py-2 font-medium text-gray-600">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {quotations.map((q) => (
              <tr key={q.id} className="border-b border-gray-100">
                <td className="py-2">{q.user_email}</td>
                <td className="py-2 font-mono text-xs">{q.file_name}</td>
                <td className="py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    q.status === "pendiente" ? "bg-yellow-100 text-yellow-800" :
                    q.status === "cotizado" ? "bg-green-100 text-green-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {q.status}
                  </span>
                </td>
                <td className="py-2 text-gray-500">
                  {new Date(q.created_at).toLocaleDateString("es-AR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
