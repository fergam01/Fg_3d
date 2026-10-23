// ============================================================
// TYPES - Definiciones de tipos para la aplicación
// ============================================================

/** Categorías predefinidas del catálogo */
export const DEFAULT_CATEGORIES: ProductCategory[] = [
  "decoracion",
  "juegos_mesa",
  "juguetes",
  "herramientas",
];

/** Categoría de productos 3D */
export type ProductCategory =
  | "decoracion"
  | "juegos_mesa"
  | "juguetes"
  | "herramientas"
  | "personalizado";

/** Estado de stock de un producto */
export type StockStatus = "disponible" | "sin_stock";

/** Tipo de servicio de cotización (3 tipos soportados) */
export type QuotationServiceType =
  | "archivo"           // Usuario sube archivo STL/3MF/OBJ existente
  | "diseno"            // Diseño desde cero (sin impresión incluida)
  | "diseno_impresion"; // Diseño + impresión (modelo nuevo + fabricación)

/** Estado de una cotización */
export type QuotationStatus = "pendiente" | "cotizado" | "rechazado";

/** Estado de pago de un pedido */
export type PaymentStatus = "pendiente" | "pagado" | "cancelado" | "reembolsado";

/** Estado interno de un pedido (fulfillment) */
export type OrderFulfillmentStatus =
  | "recibido"
  | "en_impresion"
  | "finalizado"
  | "enviado"
  | "entregado";

// ──────────────────────────────────────────────
// PRODUCTOS E IMÁGENES
// ──────────────────────────────────────────────

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string;
  display_order: number;
  is_primary: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price_ars: number;
  image_url?: string; // fallback para compatibilidad
  images?: ProductImage[]; // array de imágenes (nuevo)
  category: ProductCategory;
  material?: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: "mm" | "cm";
  };
  weight_grams?: number;
  print_time_hours?: number;
  min_wall_thickness_mm?: number;
  rating?: number;
  stock?: number;
  created_at?: string;
}

// ──────────────────────────────────────────────
// COTIZACIONES (QUOTATIONS)
// ──────────────────────────────────────────────

export interface QuotationAttachment {
  url: string;
  name: string;
  type: "3d_model" | "reference_image";
  format?: string; // stl, obj, jpg, png, etc.
}

export interface Quotation {
  id: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
  service_type: "archivo" | "diseno" | "diseno_impresion";
  /** Descripción del proyecto/idea (requerido para diseno/diseno_impresion) */
  project_description?: string;
  /** ID de producto catálogo si aplica */
  catalog_product_id?: string;
  /** Archivos adjuntos (múltiples: modelos 3D + imágenes referencia) */
  attachments?: QuotationAttachment[];
  /** Legacy fields para compatibilidad con cotizaciones antiguas */
  file_url?: string;
  file_name?: string;
  file_size_bytes?: number;
  file_format?: "stl" | "3mf" | "obj" | "stl_ascii";
  notes?: string;
  estimated_price_ars?: number;
  status: QuotationStatus;
  created_at: string;
}

// ──────────────────────────────────────────────
// PEDIDOS (ORDERS)
// ──────────────────────────────────────────────

export interface OrderItem {
  product_id?: string;
  quotation_id?: string;
  description: string;
  quantity: number;
  unit_price_ars: number;
}

export interface Order {
  id: string;
  created_at: string;
  updated_at?: string;
  total_price_ars: number;
  payment_status: PaymentStatus;
  fulfillment_status: OrderFulfillmentStatus;
  items: OrderItem[];
  customer_name: string;
  customer_email: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_province?: string;
  shipping_postal_code?: string;
  payment_method?: "transferencia" | "tarjeta" | "efectivo" | "mercadopago";
  notes?: string;
}

// ──────────────────────────────────────────────
// CARRITO DE COMPRAS (Zustand State)
// ──────────────────────────────────────────────

export interface CartItem {
  product: Product;
  quantity: number;
}

/** Estado del carrito de compras */
export interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
    totalPriceArs: number;
}

// ──────────────────────────────────────────────
// UTILIDADES DE FORMATO
// ──────────────────────────────────────────────

/** Formatea número como moneda argentina (ARS) */
export function formatPriceArs(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Formatea número con separador de miles argentino */
export function formatNumberAr(value: number): string {
  return new Intl.NumberFormat("es-AR").format(value);
}
