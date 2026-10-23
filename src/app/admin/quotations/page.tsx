"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatPriceArs } from "@/types";

/** Admin page para gestionar cotizaciones */
export default function AdminQuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pendiente" | "cotizado" | "rechazado">("all");

  useEffect(() => {
    loadQuotations();
  }, []);

  async function loadQuotations() {
    setLoading(true);
    let query = supabase.from("quotations").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    setQuotations(data ?? []);
    setLoading(false);
  }

  async function updateStatus(id: string, newStatus: "cotizado" | "rechazado") {
    const { error } = await supabase.from("quotations").update({ status: newStatus }).eq("id", id);
    if (error) alert(`Error: ${error.message}`);
    else loadQuotations();
  }

  function serviceTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      archivo: "📁 Archivo",
      diseno: "✏️ Diseño",
      diseno_impresion: "🎨 Diseño + Impresión",
    };
    return labels[type] ?? type;
  }

  function serviceTypeColor(type: string): string {
    const colors: Record<string, string> = {
      archivo: "bg-blue-100 text-blue-800",
      diseno: "bg-purple-100 text-purple-800",
      diseno_impresion: "bg-pink-100 text-pink-800",
    };
    return colors[type] ?? "bg-gray-100 text-gray-800";
  }

  function serviceTypeBadge(type: string): { bg: string; label: string } {
    const badges: Record<string, { bg: string; label: string }> = {
      archivo: { bg: "bg-blue-100", label: "📁 Archivo" },
      diseno: { bg: "bg-purple-100", label: "✏️ Diseño" },
      diseno_impresion: { bg: "bg-pink-100", label: "🎨 Diseño + Impresión" },
    };
    return badges[type] ?? { bg: "bg-gray-100", label: type };
  }

  function renderAttachments(attachments: any[]) {
    if (!attachments || attachments.length === 0) return null;
    return (
      <div className="mt-3 space-y-2">
        <p className="text-xs font-semibold text-gray-600">Archivos adjuntos ({attachments.length}):</p>
        {attachments.map((att: any, idx: number) => (
          <a
            key={idx}
            href={att.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 text-sm hover:bg-gray-100 transition-colors"
          >
            <span>{att.type === "3d_model" ? "🧊" : "📷"}</span>
            <span className="font-mono text-xs text-brand-600">{att.name}</span>
            {att.format && <span className="text-gray-400 text-xs">({att.format.toUpperCase()})</span>}
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
        <p className="text-gray-500 mt-1">Gestionar cotizaciones de archivos, diseño e impresión</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: "all", label: "Todas" },
          { key: "pendiente", label: "⏳ Pendientes" },
          { key: "cotizado", label: "✅ Cotizadas" },
          { key: "rechazado", label: "❌ Rechazadas" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key ? "bg-brand-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Quotations list */}
      {loading ? (
        <p className="text-center text-gray-500 py-8">Cargando cotizaciones...</p>
      ) : quotations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <span className="text-4xl block mb-3">📋</span>
          <p className="text-gray-600">No hay cotizaciones {filter !== "all" ? `con filtro "${filter}"` : ""}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotations.map((q) => (
            <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-brand-300 transition-colors">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  {/* User info */}
                  <p className="font-semibold text-gray-900">{q.user_name}</p>
                  <p className="text-sm text-gray-500">{q.user_email}</p>
                  {q.user_phone && <p className="text-sm text-gray-500">📱 {q.user_phone}</p>}

                  {/* Service type badge */}
                  <div className="mt-2 flex gap-2 items-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${serviceTypeColor(q.service_type)}`}>
                      {serviceTypeLabel(q.service_type)}
                    </span>
                  </div>

                  {/* Project description (for design services) */}
                  {(q.service_type === "diseno" || q.service_type === "diseno_impresion") && q.project_description && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Descripción del proyecto:</p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{q.project_description}</p>
                    </div>
                  )}

                  {/* Attachments (new format) or legacy file info */}
                  {q.attachments && q.attachments.length > 0 ? (
                    renderAttachments(q.attachments)
                  ) : q.file_name ? (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="font-mono text-xs text-brand-600">{q.file_name}</p>
                      {q.file_format && q.file_size_bytes && (
                        <p className="text-xs text-gray-500 mt-1">
                          {q.file_format.toUpperCase()} · {(q.file_size_bytes / 1024).toFixed(1)} KB
                        </p>
                      )}
                    </div>
                  ) : null}

                  {/* Notes */}
                  {q.notes && (
                    <p className="mt-3 text-sm text-gray-600 italic">"{q.notes}"</p>
                  )}

                  {/* Date */}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(q.created_at).toLocaleString("es-AR")}
                  </p>
                </div>

                {/* Status + Actions */}
                <div className="flex flex-col items-end gap-2 min-w-[120px]">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    q.status === "pendiente" ? "bg-yellow-100 text-yellow-800" :
                    q.status === "cotizado" ? "bg-green-100 text-green-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {q.status}
                  </span>

                  {q.status === "pendiente" && (
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(q.id, "cotizado")} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors">
                        ✅ Cotizar
                      </button>
                      <button onClick={() => updateStatus(q.id, "rechazado")} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors">
                        ❌ Rechazar
                      </button>
                    </div>
                  )}

                  {/* Download link */}
                  {q.file_url && (
                    <a href={q.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline">
                      📎 Ver archivo
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
