import Link from "next/link";

/** Footer con información de contacto y links */
export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Columna 1: Info */}
          <div>
            <h3 className="text-white font-bold text-lg mb-3">🧊 Impresiones 3D Argentina</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Piezas impresas en 3D de alta calidad. Diseños personalizados, prototipos y modelos listos para enviar.
            </p>
          </div>

          {/* Columna 2: Links */}
          <div>
            <h4 className="text-white font-semibold mb-3">Navegación</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/catalog" className="hover:text-brand-400 transition-colors">Catálogo</Link></li>
              <li><Link href="/quote" className="hover:text-brand-400 transition-colors">Cotizar pieza</Link></li>
              <li><Link href="/cart" className="hover:text-brand-400 transition-colors">Carrito</Link></li>
            </ul>
          </div>

          {/* Columna 3: Contacto */}
          <div>
            <h4 className="text-white font-semibold mb-3">Contacto</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>📧 info@impresiones3d.ar</li>
              <li>📱 WhatsApp: +54 11 XXXX-XXXX</li>
              <li>📍 Buenos Aires, Argentina</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-gray-700 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Impresiones 3D Argentina. Todos los precios en ARS.
        </div>
      </div>
    </footer>
  );
}
