# 🧊 Impresiones 3D Argentina — Documento Técnico Completo

## 1. Diagrama Lógico del Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FLUJO DE DATOS - IMPRESIONES 3D              │
└─────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════
1. FLUJO: CATÁLOGO → DETALLE PRODUCTO
═══════════════════════════════════════════════════════════════════════

  [Supabase PostgreSQL]          [Next.js Server Component]     [Browser]
         │                               │                        │
         ▼                               ▼                        │
  ┌──────────────┐              ┌─────────────────┐             │
  │ products     │──(fetch)──►  │ catalog/page.tsx│             │
  │ (DB Table)   │              │ (Server Render) │             │
  └──────────────┘              └────────┬────────┘             │
                                         │                       │
                    ┌────────────────────┼─────────────────────┐ │
                    ▼                     ▼                     ▼ │
            ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
            │ProductCard   │    │ProductCard   │    │ProductCard   │
            │(Client Comp) │    │             │    │             │
            └──────┬───────┘    └──────┬───────┘    └────────────┘
                   │                    │                      │
                   ▼                    ▼                      │
          [Click en producto] → /product/[id]/page.tsx (Server)
                   │                    │
                   ▼                    ▼
            [Supabase Storage] ←─── fetch product image URL
                   │
                   ▼
            Product detail page rendered


═══════════════════════════════════════════════════════════════════════
2. FLUJO: CARRITO DE COMPRAS (Zustand + localStorage)
═══════════════════════════════════════════════════════════════════════

  [Browser Memory]              [localStorage]           [Cart Page]
         │                            │                       │
         ▼                            ▼                       │
  ┌──────────────┐    persist     ┌─────────────┐            │
  │ Zustand      │◄──────────────►│ localStorage│            │
  │ Cart Store   │                │ (browser)   │            │
  └──────┬───────┘                └─────────────┘            │
         │                                                     │
         ▼                                                     │
  addItem(product) → update state → re-render cart page       │


═══════════════════════════════════════════════════════════════════════
3. FLUJO: COTIZACIÓN (Drag & Drop → Supabase Storage + DB)
═══════════════════════════════════════════════════════════════════════

  [QuoteForm Component]    [Supabase Storage]     [Supabase PostgreSQL]
         │                        │                          │
         ▼                        ▼                          │
  ┌──────────────┐   uploadFile  ┌─────────────────┐        │
  │ File Input   │──────────────►│ quotations/     │        │
  │ (.stl/.3mf)  │               │ bucket          │        │
  └──────┬───────┘               └────────┬────────┘        │
         │                                │                  │
         ▼                                ▼                  │
  ┌──────────────┐   insertRow    ┌─────────────────┐       │
  │ Form Data    │───────────────►│ quotations      │       │
  │ (name,email, │                │ table           │       │
  │  notes)      │                │ (status=pendiente)│       │
  └──────────────┘                └─────────────────┘       │


═══════════════════════════════════════════════════════════════════════
4. FLUJO: CHECKOUT → ORDEN
═══════════════════════════════════════════════════════════════════════

  [Cart Page] ──(checkout)──► [Server Action/API Route]
                                      │
                                      ▼
                              ┌───────────────┐
                              │ orders table  │
                              │ (DB Insert)   │
                              └───────┬───────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │ order_items   │
                              │ (DB Inserts)  │
                              └───────────────┘


═══════════════════════════════════════════════════════════════════════
5. FLUJO: AUTENTICACIÓN + RLS (Supabase Auth)
═══════════════════════════════════════════════════════════════════════

  [User Login] ──► Supabase Auth ──► JWT Token
                                      │
                                      ▼
                              Row Level Security
                      ┌───────────┼───────────┐
                      ▼           ▼           ▼
              Products      Quotations    Orders
         (public read)   (admin read)  (user-specific)


═══════════════════════════════════════════════════════════════════════
6. FLUJO: ADMIN PANEL (futuro)
═══════════════════════════════════════════════════════════════════════

  [Admin Dashboard] ──► Supabase Edge Functions / API Routes
                                      │
          ┌─────────────┬─────────────┼─────────────┐
          ▼             ▼             ▼             ▼
   Manage Products  Manage Quotations  Manage Orders  Analytics
   (CRUD)           (update status)    (fulfillment)  (charts)


═══════════════════════════════════════════════════════════════════════
RESUMEN DE TECNOLOGÍAS POR CAPA
═══════════════════════════════════════════════════════════════════════

  FRONTEND:     Next.js App Router + React Server Components
                Zustand (client state) + localStorage persistence
                Tailwind CSS (mobile-first responsive)

  BACKEND:      Supabase PostgreSQL (database)
                Supabase Storage (file storage - STL, images)
                Supabase Auth (user authentication)

  DATA FLOW:    Server Components → fetch from Supabase DB
                Client Components → Zustand + localStorage
                File Uploads → Supabase Storage API


═══════════════════════════════════════════════════════════════════════
MONEDA Y LOCALIZACIÓN
═══════════════════════════════════════════════════════════════════════

  • Moneda: ARS (Peso Argentino)
  • Formato: Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })
  • Ejemplo: $4.500,00
  • Zona horaria: America/Argentina/Buenos_Aires
  • Idioma: es-AR (Spanish Argentina)

```

---

## 2. Guía de Configuración de Supabase (Paso a Paso)

### Paso 1: Crear el Proyecto en Supabase

1. Ir a https://app.supabase.com
2. Click en **"New Project"**
3. Seleccionar tu organización
4. Configurar:
   - **Project name**: `impresiones-3d-ar`
   - **Region**: Elegir la más cercana (ej: `South America (São Paulo)`)
   - **Database region**: Misma que el proyecto
   - **Master password**: Generar una contraseña segura

### Paso 2: Ejecutar el Schema SQL

1. En tu proyecto Supabase, ir a **"SQL Editor"** (panel izquierdo)
2. Click en **"New Query"** → **"New file"**
3. Subir o copiar el contenido de `supabase-schema.sql`
4. Click en **"Run"** (o Ctrl+Enter)

Esto creará:
- ✅ 5 tablas: `products`, `quotations`, `orders`, `order_items`
- ✅ Índices para rendimiento
- ✅ Políticas RLS (Row Level Security)
- ✅ Triggers para `updated_at` automático

### Paso 3: Configurar Storage Buckets

1. Ir a **"Storage"** en el panel izquierdo de Supabase
2. Click en **"New bucket"**
3. Crear dos buckets:

**Bucket 1 - Products:**
- Name: `products`
- Public: ✅ Sí (para que las imágenes sean accesibles públicamente)
- File size limit: 5MB
- Allowed MIME types: `image/*`

**Bucket 2 - Quotations:**
- Name: `quotations`
- Public: ❌ No (privado, solo admin puede leer)
- File size limit: 100MB
- Allowed MIME types: `application/octet-stream`, `model/stl`, `model/3mf`

### Paso 4: Configurar Variables de Entorno

Crear el archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

Para obtener estas credenciales:
1. Ir a **Project Settings** → **API** en Supabase
2. Copiar el valor de **"Project URL"** y **"anon public"** key

### Paso 5: Verificar la Configuración

Ejecutar `npm run dev` y verificar que:
- ✅ La app carga sin errores
- ✅ El catálogo muestra productos (o vacío si no hay datos)
- ✅ El formulario de cotización acepta archivos .stl/.3mf
- ✅ El carrito persiste al recargar la página

---

## 3. Guía de Datos Mock para Desarrollo

Para probar localmente, insertar estos datos de ejemplo en Supabase:

```sql
-- Insertar productos de prueba
INSERT INTO products (name, description, price_ars, category, material) VALUES
('Soporte Cable Management Pro', 'Organizador modular para escritorio.', 4500.00, 'hogar', 'PLA Premium'),
('Mini Figura Articulated Dragon', 'Dragón articulado de alta resolución.', 12800.00, 'gaming', 'Resina UV'),
('Prototipo Engranaje Helicoidal', 'Engranaje de precisión mecánico.', 8200.00, 'mecanica', 'PETG Industrial'),
('Maceta Geométrica Modular', 'Maceta apilable con diseño geométrico.', 6300.00, 'decoracion', 'PLA Reciclado'),
('Soporte Monitor Ergonómico', 'Elevar monitor para mejor postura.', 9700.00, 'hogar', 'PETG Industrial');
```

---

## 4. Arquitectura de Componentes

```
App Layout (layout.tsx)
├── Header (Header.tsx) [Client Component]
│   ├── Logo + Branding
│   ├── Nav Links (/catalog, /quote, /cart)
│   └── Cart Badge (Zustand state)
├── Main Content (page routes)
│   ├── Home (page.tsx) [Server Component]
│   ├── Catalog (catalog/page.tsx) [Server Component]
│   │   └── ProductCard × N [Client Components]
│   ├── Product Detail (product/[id]/page.tsx) [Server Component]
│   ├── Quote (quote/page.tsx) [Client Component]
│   │   └── QuoteForm [Client Component]
│   └── Cart (cart/page.tsx) [Client Component]
├── Footer (Footer.tsx) [Static]
└── CartProviderWrapper [Client Init]
    └── Zustand Store (cart.ts)
        └── localStorage persistence
```

---

## 5. Próximos Pasos Recomendados

1. **Instalar dependencias**: `npm install`
2. **Configurar Supabase** siguiendo la guía anterior
3. **Insertar datos mock** para desarrollo
4. **Ejecutar dev server**: `npm run dev`
5. **Agregar autenticación** con Supabase Auth (opcional)
6. **Integrar MercadoPago** como pasarela de pago
7. **Deploy a Vercel** o Netlify

---

*Documento generado para Impresiones 3D Argentina — Next.js + TypeScript + Supabase*
