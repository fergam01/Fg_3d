-- ============================================================
-- SUPABASE SCHEMA - Impresiones 3D Argentina
-- ============================================================
-- Ejecutar este SQL en el editor de Supabase (SQL Editor)
-- para crear todas las tablas, índices y políticas RLS.
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. PRODUCTS
-- ──────────────────────────────────────────────

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price_ars DECIMAL(12,2) NOT NULL CHECK (price_ars >= 0),
    image_url TEXT,
    category TEXT NOT NULL DEFAULT 'personalizado',
    material TEXT,
    dimensions_length_cm DECIMAL(8,2),
    dimensions_width_cm DECIMAL(8,2),
    dimensions_height_cm DECIMAL(8,2),
    weight_grams INTEGER,
    print_time_hours NUMERIC(5,1),
    min_wall_thickness_mm DECIMAL(4,1),
    rating DECIMAL(2,1) CHECK (rating BETWEEN 0 AND 5),
    stock INTEGER DEFAULT 0,
    -- Estado de visibilidad en catálogo: disponible | sin_stock
    stock_status TEXT NOT NULL DEFAULT 'disponible' CHECK (stock_status IN ('disponible', 'sin_stock')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsqueda rápida
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_price_ars ON products(price_ars);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- ──────────────────────────────────────────────
-- 2. QUOTATIONS (Cotizaciones)
-- ──────────────────────────────────────────────

-- ──────────────────────────────────────────────
-- 2. QUOTATIONS (Cotizaciones) — actualizado para soportar 3 tipos de servicio y múltiples archivos
-- ──────────────────────────────────────────────

CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_phone TEXT,
    -- Tipo de servicio: archivo existente, diseño desde cero, o diseño + impresión
    service_type TEXT NOT NULL DEFAULT 'archivo' CHECK (service_type IN ('archivo', 'diseno', 'diseno_impresion')),
    -- Descripción del proyecto/idea (requerido para diseno y diseno_impresion)
    project_description TEXT,
    -- ID de producto catálogo si aplica (para cotizaciones basadas en productos existentes)
    catalog_product_id UUID REFERENCES products(id),
    -- Archivos adjuntos como JSONB (soporta múltiples archivos: modelos 3D + imágenes referencia)
    attachments JSONB DEFAULT '[]'::jsonb,
    -- Campos legacy para compatibilidad con cotizaciones antiguas
    file_url TEXT,
    file_name TEXT,
    file_size_bytes BIGINT,
    file_format TEXT CHECK (file_format IN ('stl', '3mf', 'obj', 'stl_ascii')),
    notes TEXT,
    estimated_price_ars DECIMAL(12,2),
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'cotizado', 'rechazado')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_quotations_status ON quotations(status);
CREATE INDEX idx_quotations_created_at ON quotations(created_at DESC);
CREATE INDEX idx_quotations_service_type ON quotations(service_type);

-- ──────────────────────────────────────────────
-- 3. ORDERS (Pedidos)
-- ──────────────────────────────────────────────

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    total_price_ars DECIMAL(12,2) NOT NULL CHECK (total_price_ars >= 0),
    payment_status TEXT NOT NULL DEFAULT 'pendiente' CHECK (payment_status IN ('pendiente', 'pagado', 'cancelado', 'reembolsado')),
    fulfillment_status TEXT NOT NULL DEFAULT 'recibido' CHECK (fulfillment_status IN ('recibido', 'en_impresion', 'finalizado', 'enviado', 'entregado')),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    shipping_address TEXT,
    shipping_city TEXT,
    shipping_province TEXT,
    shipping_postal_code TEXT,
    payment_method TEXT CHECK (payment_method IN ('transferencia', 'tarjeta', 'efectivo', 'mercadopago')),
    notes TEXT
);

CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- ──────────────────────────────────────────────
-- 4. PRODUCT IMAGES (Múltiples imágenes por producto)
-- ──────────────────────────────────────────────

CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_display_order ON product_images(display_order);

-- ──────────────────────────────────────────────
-- 5. ORDER ITEMS (Detalle de cada pedido)
-- ──────────────────────────────────────────────

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quotation_id UUID REFERENCES quotations(id),
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_ars DECIMAL(12,2) NOT NULL CHECK (unit_price_ars >= 0)
);

-- ──────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY (RLS Policies)
-- ──────────────────────────────────────────────

-- Habilitar RLS en todas las tablas
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Función para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (auth.jwt()->>'email')::text = 'fernandogam@admin.com.ar';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Products: lectura pública, escritura solo admin
CREATE POLICY "Productos visibles públicamente" ON products
    FOR SELECT USING (true);

CREATE POLICY "Solo admin puede insertar productos" ON products
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Solo admin puede actualizar productos" ON products
    FOR UPDATE USING (is_admin());

CREATE POLICY "Solo admin puede eliminar productos" ON products
    FOR DELETE USING (is_admin());

-- Product Images: lectura pública, escritura solo admin
CREATE POLICY "Images visibles públicamente" ON product_images
    FOR SELECT USING (true);

CREATE POLICY "Admin inserta images" ON product_images
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admin actualiza images" ON product_images
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admin elimina images" ON product_images
    FOR DELETE USING (is_admin());

-- Quotations: cualquiera puede insertar, solo admin ve todas y actualiza
CREATE POLICY "Cualquiera puede crear cotización" ON quotations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin ve todas las cotizaciones" ON quotations
    FOR SELECT USING (is_admin());

CREATE POLICY "Admin puede actualizar cotizaciones" ON quotations
    FOR UPDATE USING (is_admin());

-- Orders: el cliente ve los suyos, admin ve todos
CREATE POLICY "Clientes ven sus pedidos" ON orders
    FOR SELECT USING (
        auth.jwt()->>'email' = customer_email OR is_admin()
    );

CREATE POLICY "Admin puede actualizar pedidos" ON orders
    FOR UPDATE USING (is_admin());

-- Order items: admin solo
CREATE POLICY "Admin ve order_items" ON order_items
    FOR ALL USING (is_admin());

-- ──────────────────────────────────────────────
-- 6. TRIGGERS (updated_at automático)
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_products
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_quotations
    BEFORE UPDATE ON quotations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_orders
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
