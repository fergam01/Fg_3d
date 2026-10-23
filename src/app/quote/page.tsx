import Link from "next/link";
import QuoteForm from "@/components/QuoteForm";

/**
 * QUOTE PAGE — Página para solicitar cotización personalizada.
 * Soporta: archivo existente, diseño desde cero, y diseño + impresión.
 */
export default function QuotePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Solicitar Cotización</h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          Subí tu archivo 3D o contanos tu idea. Te devolvemos una cotización personalizada en menos de 24hs hábiles.
        </p>
      </div>

      {/* Info box */}
      <div className="mb-8 p-5 bg-blue-50 border border-blue-200 rounded-xl">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <span>💡</span> ¿Cómo funciona?
        </h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Elegí el tipo de servicio: archivo existente, diseño desde cero o diseño + impresión</li>
          <li>Subí tu modelo 3D (.STL/.3MF/.OBJ) y/o describí tu idea</li>
          <li>Nuestro equipo analiza todo y te envía una cotización detallada con precio en ARS</li>
        </ol>
      </div>

      {/* Formulario */}
    <QuoteForm />

      {/* FAQ rápida */}
      <section className="mt-12 pt-8 border-t border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Preguntas frecuentes</h3>
        <div className="space-y-4">
          {[
            { q: "¿Qué formatos aceptan?", a: ".STL, .3MF y .OBJ para modelos 3D. JPG, PNG o WebP para imágenes de referencia." },
            { q: "¿Cuál es el tamaño máximo de archivo?", a: "100 MB para modelos 3D, 5 MB para imágenes de referencia." },
            { q: "¿Qué es 'diseño desde cero'?", a: "Describí tu idea y nuestro diseñador crea el modelo 3D por vos. Ideal si no tenés archivo técnico." },
            { q: "¿En qué moneda cotizan?", a: "Todos los precios son en ARS (pesos argentinos). Aceptamos transferencia bancaria y MercadoPago." },
          ].map((faq) => (
            <details key={faq.q} className="group bg-white rounded-xl border border-gray-200 overflow-hidden">
              <summary className="cursor-pointer px-5 py-3 font-medium text-sm text-gray-800 hover:text-brand-600 transition-colors flex items-center gap-2">
                <span className="text-brand-500">+</span> {faq.q}
              </summary>
              <div className="px-5 pb-3 text-sm text-gray-600">{faq.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="mt-10 text-center">
        <p className="text-gray-500 mb-3">¿Ya tenés un producto del catálogo?</p>
        <Link href="/catalog" className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 px-6 rounded-xl transition-colors">
          📦 Ir al catálogo
        </Link>
      </div>
    </div>
  );
}
