"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatPriceArs } from "@/types";

/** Admin page para gestionar pedidos */
export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders(data ?? []);
    setLoading(false);
  }

  async function updateOrderStatus(id: string, field: string, value: string) {
    const { error } = await supabase.from("orders").update({ [field]: value }).eq("id", id);
    if (error) alert(`Error: ${error.message}`);
    else loadOrders();
  }

  return (
    <div className="p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-gray-500 mt-1">{orders.length} pedidos registrados</p>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-8">Cargando pedidos...</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <span className="text-4xl block mb-3">🛒</span>
          <p className="text-gray-600">No hay pedidos aún.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-brand-300 transition-colors">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  {/* Customer info */}
                  <p className="font-semibold text-gray-900">{order.customer_name}</p>
                  <p className="text-sm text-gray-500">{order.customer_email}</p>

                  {order.shipping_address && (
                    <p className="text-sm text-gray-500 mt-1">📍 {order.shipping_address}, {order.shipping_city} ({order.shipping_province})</p>
                  )}

                  {/* Order details */}
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Total:</span>{" "}
                      <span className="font-bold text-brand-700">{formatPriceArs(order.total_price_ars)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Método de pago:</span>{" "}
                      <span className="capitalize">{order.payment_method || "No especificado"}</span>
                    </div>
                  </div>

                  {order.notes && (
                    <p className="mt-3 text-sm text-gray-600 italic">"{order.notes}"</p>
                  )}

                  {/* Date */}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(order.created_at).toLocaleString("es-AR")}
                  </p>
                </div>

                {/* Status controls */}
                <div className="flex flex-col gap-3 min-w-[160px]">
                  <select
                    value={order.payment_status}
                    onChange={(e) => updateOrderStatus(order.id, "payment_status", e.target.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border ${
                      order.payment_status === "pagado" ? "bg-green-50 border-green-300 text-green-700" :
                      order.payment_status === "cancelado" ? "bg-red-50 border-red-300 text-red-700" :
                      "bg-yellow-50 border-yellow-300 text-yellow-700"
                    }`}
                  >
                    <option value="pendiente">⏳ Pendiente</option>
                    <option value="pagado">✅ Pagado</option>
                    <option value="cancelado">❌ Cancelado</option>
                    <option value="reembolsado">↩️ Reembolsado</option>
                  </select>

                  <select
                    value={order.fulfillment_status}
                    onChange={(e) => updateOrderStatus(order.id, "fulfillment_status", e.target.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border ${
                      order.fulfillment_status === "entregado" ? "bg-green-50 border-green-300 text-green-700" :
                      order.fulfillment_status === "en_impresion" ? "bg-blue-50 border-blue-300 text-blue-700" :
                      "bg-gray-50 border-gray-300 text-gray-700"
                    }`}
                  >
                    <option value="recibido">📥 Recibido</option>
                    <option value="en_impresion">🖨️ En impresión</option>
                    <option value="finalizado">✅ Finalizado</option>
                    <option value="enviado">📦 Enviado</option>
                    <option value="entregado">🎉 Entregado</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
