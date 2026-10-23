// ============================================================
// CART STORE - Estado del carrito con Zustand
// ============================================================

import { create } from "zustand";
import type { CartItem, Product, CartState as CartStateType } from "@/types";

const CART_STORAGE_KEY = "3d-store-cart";

/** Carga el carrito desde localStorage */
function loadCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/** Guarda el carrito en localStorage */
function saveCartToStorage(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Silenciar errores de storage
  }
}

/** Crea el store inicial con Zustand */
function createCartStore(initialItems: CartItem[]) {
  return create<CartStateType>((set, get) => ({
    items: initialItems,

    addItem: (product: Product, quantity = 1) => {
      const existing = get().items.find((i) => i.product.id === product.id);
      if (existing) {
        set({
          items: get()
            .items.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
        });
      } else {
        set({ items: [...get().items, { product, quantity }] });
      }
    },

    removeItem: (productId: string) => {
      set({ items: get().items.filter((i) => i.product.id !== productId) });
    },

    updateQuantity: (productId: string, quantity: number) => {
      if (quantity <= 0) {
        set({ items: get().items.filter((i) => i.product.id !== productId) });
      } else {
        set({
          items: get()
            .items.map((item) =>
              item.product.id === productId ? { ...item, quantity } : item
            ),
        });
      }
    },

    clearCart: () => {
      set({ items: [] });
    },

    get totalItems() {
      return get().items.reduce((sum, i) => sum + i.quantity, 0);
    },

    get totalPriceArs() {
      return get().items.reduce(
        (sum, item) => sum + item.product.price_ars * item.quantity,
        0
      );
    },
  }));
}

// Inicializa el store con datos de localStorage
const initialItems = loadCartFromStorage();
export const useCartStore = createCartStore(initialItems);

// Sincronizar cambios a localStorage en cada actualización
useCartStore.subscribe((state) => {
  saveCartToStorage(state.items);
});
