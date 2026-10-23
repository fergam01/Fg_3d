"use client";

import Link from "next/link";
import Image from "next/image";
import { formatPriceArs } from "@/types";
import { useCartStore } from "@/store/cart";

/**
 * CART PAGE — Visualización y gestión del carrito de compras.
 */
export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const totalItems = useCartStore((s) => s.totalItems);
  const totalPriceArs = useCartStore((s) => s.totalPriceArs);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  // ── Carrito vacío ──
  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <span className="text-6xl block mb-4">🛒</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Tu carrito está vacío</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Explorá nuestro catálogo y encontrá piezas increíbles impresas en 3D.
        </p>
        <Link href="/catalog" className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors">
          📦 Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tu carrito</h1>
        <button
          onClick={clearCart}
          className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
        >
          🗑️ Vaciar carrito
        </button>
      </div>

      {/* Lista de ítems */}
      <div className="space-y-4 mb-8">
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
            {/* Imagen */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {product.image_url ? (
                <Image src={product.image_url} alt={product.name} width={96} height={96} className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">🧊</div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <Link href={`/product/${product.id}`} className="font-semibold text-gray-900 hover:text-brand-600 transition-colors line-clamp-2">
                {product.name}
              </Link>
              <p className="text-sm text-gray-500 mt-1">{formatPriceArs(product.price_ars)} c/u</p>

              {/* Controles de cantidad */}
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => updateQuantity(product.id, Math.max(0, quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 text-lg font-bold"
                  aria-label="Reducir cantidad"
                >
                  −
                </button>
                <span className="text-sm font-medium w-6 text-center">{quantity}</span>
                <button
                  onClick={() => updateQuantity(product.id, quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 text-lg font-bold"
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>

                <button
                  onClick={() => removeItem(product.id)}
                  className="ml-auto text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>

            {/* Subtotal */}
            <div className="text-right hidden sm:block">
              <p className="font-bold text-lg text-brand-700">
                {formatPriceArs(product.price_ars * quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen del pedido */}
      <div className="bg-gray-50 rounded-xl p-6 space-y-4">
        <h3 className="font-bold text-lg text-gray-900">Resumen</h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Total de productos ({totalItems})</span>
            <span>{formatPriceArs(totalPriceArs)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Envío</span>
            <span className="text-green-600 font-medium">A calcular</span>
          </div>

          {/* Total */}
          <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
            <span className="font-bold text-lg text-gray-900">Total</span>
            <span className="font-extrabold text-xl text-brand-700">{formatPriceArs(totalPriceArs)}</span>
          </div>
        </div>

        {/* Botón checkout */}
        <button className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-brand-200 active:scale-[0.98]">
          Finalizar compra →
        </button>

        {/* Métodos de pago */}
        <div className="text-center text-xs text-gray-500 space-y-1 pt-2">
          <p>Aceptamos: Transferencia bancaria, MercadoPago, Tarjeta de crédito/débito</p>
          <p>Todos los precios en ARS • IVA incluido</p>
        </div>

        {/* Link para seguir comprando */}
        <Link href="/catalog" className="block text-center text-brand-600 hover:text-brand-700 font-medium text-sm mt-2">
          ← Seguir comprando
        </Link>
      </div>
    </div>
  );
}
