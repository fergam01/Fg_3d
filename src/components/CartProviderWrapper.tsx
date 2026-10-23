"use client";

import { useCartStore } from "@/store/cart";

/**
 * Wrapper que inicializa el carrito en el cliente.
 * El store se carga desde localStorage al instanciarse.
 */
export default function CartProviderWrapper({ children }: { children: React.ReactNode }) {
  // Forzar la lectura del estado de Zustand (se sincroniza con localStorage)
  useCartStore();

  return <>{children}</>;
}
