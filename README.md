# 🧊 FG_3D Argentina

Plataforma de e-commerce para venta de piezas impresas en 3D, enfocada en el mercado argentino.

## Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Next.js | 14+ (App Router) | Framework principal |
| TypeScript | 5.x | Tipado estático |
| Tailwind CSS | 3.x | Estilos utility-first |
| Supabase | Latest | PostgreSQL + Storage + Auth |
| Zustand | 4.x | Gestión de estado del carrito |

## 🚀 Instalación Rápida

```bash
# 1. Clonar el repositorio (cuando esté listo)
git clone <repo-url> && cd 3d-store

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.local.example .env.local
# Editar con tus credenciales de Supabase

# 4. Ejecutar en desarrollo
npm run dev
```

## 📁 Estructura del Proyecto

```
3d-store/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Layout raíz (Header + Footer)
│   │   ├── page.tsx            # Home / Landing
│   │   ├── catalog/page.tsx    # Catálogo de productos
│   │   ├── product/[id]/page.tsx  # Detalle producto
│   │   ├── quote/page.tsx      # Cotización personalizada
│   │   ├── cart/page.tsx       # Carrito de compras
│   │   └── globals.css         # Estilos globales
│   ├── components/             # Componentes reutilizables
│   │   ├── Header.tsx          # Navegación principal
│   │   ├── Footer.tsx          # Pie de página
│   │   ├── ProductCard.tsx     # Tarjeta de producto
│   │   └── QuoteForm.tsx       # Formulario cotización
│   ├── lib/
│   │   └── supabase.ts         # Cliente Supabase + Storage
│   ├── store/
│   │   └── cart.ts             # Zustand (carrito)
│   └── types/
│       └── index.ts            # Tipos TypeScript
├── supabase-schema.sql         # Esquema de base de datos
├── .env.local                  # Variables de entorno
└── package.json
```

## 🗄️ Configuración de Supabase

### Paso 1: Crear las tablas

1. Ir a https://app.supabase.com → tu proyecto
2. ir al **SQL Editor**
3. Pegar el contenido de `supabase-schema.sql`
4. Ejecutar

### Paso 2: Configurar Storage Buckets

Crear dos buckets públicos en Supabase Storage:

| Bucket | Uso | Acceso |
|--------|-----|--------|
| `products` | Imágenes de productos | Público (lectura) |
| `quotations` | Archivos STL/3MF subidos | Privado (admin lectura) |

### Paso 3: Políticas RLS

El archivo SQL ya incluye políticas RLS básicas. Ajustar según necesidad.

## 📦 Funcionalidades Principales

- ✅ Catálogo de productos con precios en ARS
- ✅ Detalle de producto con especificaciones técnicas
- ✅ Cotización personalizada (drag & drop .STL/.3MF)
- ✅ Carrito de compras persistente (localStorage + Zustand)
- ✅ Formateo de moneda argentina (ARS)
- ✅ Mobile-first responsive design
- ✅ Server Components para rendimiento SEO

## 🌐 Rutas de la Aplicación

| Ruta | Descripción |
|------|-------------|
| `/` | Home / Landing page |
| `/catalog` | Listado completo de productos |
| `/product/[id]` | Detalle individual del producto |
| `/quote` | Formulario de cotización personalizada |
| `/cart` | Carrito de compras |

## 📝 Tipos de Datos

### Product
- `name`, `description`, `price_ars`, `image_url`, `category`
- `material`, `dimensions`, `weight_grams`, `print_time_hours`

### Quotation  
- `user_name`, `user_email`, `file_url`, `file_format`
- `status`: pendiente | cotizado | rechazado

### Order
- `total_price_ars`, `payment_status`, `fulfillment_status`
- `items[]`, `customer_*`, `shipping_*`

## 🏗️ Arquitectura de Datos

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  PRODUCTS    │     │ QUOTATIONS   │     │   ORDERS    │
│─────────────│     │──────────────│     │─────────────│
│ id (PK)     │◄────│ product_id(FK)│     │ id (PK)     │
│ name        │     │ user_name     │     │ total_ars   │
│ price_ars   │     │ file_url      │     │ payment_st  │
│ image_url   │     │ status        │     └─────────────┘
│ category    │     └──────────────┘           ▲
└─────────────┘                               │
                                               │ (1:N)
                                        ┌──────────────┐
                                        │ ORDER ITEMS  │
                                        ├──────────────┤
                                        │ id (PK)      │
                                        │ order_id(FK) │
                                        │ description  │
                                        │ quantity     │
                                        │ unit_price   │
                                        └──────────────┘
```

## 📄 Licencia

MIT © Impresiones 3D Argentina
