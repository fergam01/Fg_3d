"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { formatPriceArs } from "@/types";
import type { ProductImage } from "@/types";

/** Extensiones válidas para imágenes */
const VALID_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const MAX_IMAGE_SIZE_MB = 5; // 5 MB máximo por imagen

/** Categorías predefinidas + lista dinámica */
const DEFAULT_CATEGORIES = ["decoracion", "juegos de mesa", "juguetes", "herramientas"];

/** Admin page para gestionar productos (CRUD) con sistema de subida mejorado */
export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceArs, setPriceArs] = useState("");
  const [category, setCategory] = useState("personalizado");
  const [material, setMaterial] = useState("");
  const [stockStatus, setStockStatus] = useState<"disponible" | "sin_stock">("disponible");

  // Dynamic categories (custom ones added by admin)
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Image management state
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);

  // Pending uploads: files queued while product doesn't exist yet (new product flow)
  const pendingUploadsRef = useRef<Array<{ file: File; previewUrl: string }>>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts(data ?? []);
    setLoading(false);
  }

  // ── Image upload functions ──

  /**
   * Sube una imagen a Supabase Storage.
   * Si el producto ya existe (editingId), usa la ruta products/[id]/[filename].
   * Si es nuevo, guarda en pendingUploadsRef para subir después del create.
   */
  async function handleImageUpload(file: File) {
    // Validar extensión
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!VALID_IMAGE_EXTENSIONS.includes(ext)) {
      alert(`Formato "${ext}" no válido. Solo aceptamos ${VALID_IMAGE_EXTENSIONS.join(", ")}.`);
      return;
    }

    // Validar tamaño
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      alert(`"${file.name}" excede el límite de ${MAX_IMAGE_SIZE_MB} MB.`);
      return;
    }

    // Crear preview URL para mostrar en la UI inmediatamente
    const previewUrl = URL.createObjectURL(file);

    if (editingId) {
      // ── CASO: Producto existente → subir directamente con product_id real ──
      await uploadImageToProduct(editingId, file, previewUrl);
    } else {
      // ── CASO: Nuevo producto → colar en pendingUploads para subir después ──
      const pendingEntry = { file, previewUrl };
      pendingUploadsRef.current.push(pendingEntry);

      // Crear registro temporal de imagen con UUID válido (se actualizará tras el create)
      const tempImage: ProductImage = {
        id: crypto.randomUUID(),
        product_id: "", // se llenará tras crear producto
        image_url: previewUrl,
        alt_text: file.name.replace(/\.[^.]+$/, ""),
        display_order: pendingUploadsRef.current.length - 1,
        is_primary: pendingUploadsRef.current.length === 1,
      };

      setProductImages((prev) => [...prev, tempImage]);
    }
  }

  /** Sube una imagen al bucket products/[productId]/[filename] */
  async function uploadImageToProduct(productId: string, file: File, previewUrl?: string) {
    // Generar nombre único para evitar colisiones
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${file.name}`;
    const filePath = `products/${productId}/${uniqueName}`;

    setUploadingFiles((prev) => [...prev, file.name]);

    try {
      // Subir a Supabase Storage en products/[productId]/
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from("products")
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) throw new Error("No se pudo obtener la URL pública");

      // Actualizar imagen en el estado local o crear nueva
      setProductImages((prev) => {
        const existingIdx = prev.findIndex(
          (img) => img.image_url === previewUrl || img.id.startsWith("temp-")
        );

        if (existingIdx >= 0) {
          // Actualizar imagen temporal con URL real
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            id: crypto.randomUUID(),
            product_id: productId,
            image_url: urlData.publicUrl,
            alt_text: file.name.replace(/\.[^.]+$/, ""),
          };
          return updated;
        }

        // Crear nueva imagen
        const newImage: ProductImage = {
          id: crypto.randomUUID(),
          product_id: productId,
          image_url: urlData.publicUrl,
          alt_text: file.name.replace(/\.[^.]+$/, ""),
          display_order: prev.length,
          is_primary: prev.length === 0,
        };

        return [...prev, newImage];
      });
    } catch (err) {
      alert(`Error subiendo imagen "${file.name}": ${err}`);
    } finally {
      setUploadingFiles((prev) => prev.filter((f) => f !== file.name));
    }
  }

  /** Procesa los uploads pendientes después de crear el producto */
  async function processPendingUploads(productId: string) {
    const pending = [...pendingUploadsRef.current];
    if (pending.length === 0) return;

    // Limpiar previews del DOM
    for (const entry of pending) {
      URL.revokeObjectURL(entry.previewUrl);
    }

    // Subir cada archivo pendiente con el product_id real y previewUrl para vincular con el registro temporal
    const uploadPromises = pending.map(async ({ file, previewUrl }) => {
      await uploadImageToProduct(productId, file, previewUrl);
    });

    await Promise.all(uploadPromises);
    pendingUploadsRef.current = [];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingId) {
      // ── ACTUALIZAR producto existente ──
      const { error } = await supabase
        .from("products")
        .update({ name, description, price_ars: parseFloat(priceArs), category, material, stock_status: stockStatus })
        .eq("id", editingId);

      if (error) { alert(`Error actualizando producto: ${error.message}`); return; }

      // Actualizar imágenes en DB (upsert — permite reutilizar IDs existentes)
      for (const img of productImages) {
        const { error: imgError } = await supabase.from("product_images").upsert({
          id: img.id,
          product_id: editingId,
          image_url: img.image_url,
          alt_text: img.alt_text,
          display_order: img.display_order,
          is_primary: img.is_primary,
        }, { onConflict: "id" }); // PostgreSQL upsert by PK
        if (imgError) alert(`Error guardando imagen: ${imgError.message}`);
      }

    } else {
      // ── CREAR nuevo producto ──
      const { data: newProduct, error } = await supabase
        .from("products")
        .insert({ name, description, price_ars: parseFloat(priceArs), category, material, stock_status: stockStatus })
        .select()
        .single();

      if (error) { alert(`Error creando producto: ${error.message}`); return; }

      // Procesar imágenes pendientes con el product_id real
      if (newProduct && pendingUploadsRef.current.length > 0) {
        await processPendingUploads(newProduct.id);
      }

      // Persistir TODAS las imágenes en la DB:
      // - Las que ya fueron subidas a storage tienen product_id !== "" y image_url real
      // - Las que no se subieron (si alguna falló) siguen con product_id === "" y son previews blob:
      const allImagesToPersist = productImages.filter((img) => img.image_url && !img.image_url.startsWith("blob:"));

      for (const img of allImagesToPersist) {
        // Si la imagen ya fue actualizada por uploadImageToProduct, tiene un UUID válido
        // Si aún no se subió (caso raro), generar nuevo UUID
        const dbId = img.id && !img.id.startsWith("temp-") ? img.id : crypto.randomUUID();
        const { error: imgError } = await supabase.from("product_images").upsert({
          id: dbId,
          product_id: newProduct.id,
          image_url: img.image_url,
          alt_text: img.alt_text || "",
          display_order: img.display_order ?? 0,
          is_primary: img.is_primary ?? false,
        });
        if (imgError) console.error("Error guardando imagen en DB:", imgError);
      }

      // Limpiar imágenes temporales que no se persistieron en DB
      setProductImages((prev) => prev.filter((img) => img.product_id !== ""));
    }

    resetForm();
    loadProducts();
  }

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setName(""); setDescription(""); setPriceArs(""); setCategory("decoracion"); setMaterial("");
    setStockStatus("disponible");
    setProductImages([]); setUploadingFiles([]);
    pendingUploadsRef.current = [];
  }

  // ── Category management ──
  function addCustomCategory() {
    const name = newCategoryName.trim().toLowerCase();
    if (!name) return;
    if (DEFAULT_CATEGORIES.includes(name)) {
      alert("Esa categoría ya existe por defecto.");
      setNewCategoryName("");
      return;
    }
    if (customCategories.includes(name)) {
      alert("Esa categoría ya fue agregada.");
      setNewCategoryName("");
      return;
    }
    setCustomCategories((prev) => [...prev, name]);
    setCategory(name); // Select the new category
    setNewCategoryName("");
  }

  function removeCustomCategory(name: string) {
    setCustomCategories((prev) => prev.filter((c) => c !== name));
    if (category === name) setCategory("decoracion");
  }

  /** Todas las categorías disponibles (default + custom) */
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  async function startEdit(product: any) {
    setEditingId(product.id);
    setName(product.name);
    setDescription(product.description);
    setPriceArs(String(product.price_ars));
    setCategory(product.category);
    setMaterial(product.material ?? "");
    setStockStatus(product.stock_status ?? "disponible");

    // Load existing images for this product
    const { data: images } = await supabase
      .from("product_images")
      .select("*")
      .eq("product_id", product.id)
      .order("display_order");

    if (images && images.length > 0) {
      setProductImages(images);
    } else {
      setProductImages([]);
    }

    setShowForm(true);
  }

  async function deleteProduct(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;

    // 1. Eliminar TODOS los archivos del storage bajo products/{id}/
    // Usamos list() para obtener todos los objetos y luego los eliminamos en lote.
    // Esto es más robusto que parsear URLs, ya que captura también imágenes huérfanas.
    const { data: storedFiles } = await supabase.storage
      .from("products")
      .list("", { limit: 1000, offset: 0 });

    if (storedFiles && storedFiles.length > 0) {
      // Filtrar archivos que pertenezcan a este producto por prefijo "products/{id}/"
      const filesToDelete = storedFiles
        .filter((f: any) => f.name.startsWith(`products/${id}/`))
        .map((f: any) => f.name);

      if (filesToDelete.length > 0) {
        await supabase.storage.from("products").remove(filesToDelete);
      }
    }

    // 2. Eliminar registros de product_images de la DB
    const { error: imgDeleteError } = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", id);

    if (imgDeleteError) {
      alert(`Error eliminando imágenes asociadas: ${imgDeleteError.message}`);
      return;
    }

    // 3. Eliminar el producto de la DB
    const { error: productDeleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (productDeleteError) {
      alert(`Error eliminando producto: ${productDeleteError.message}`);
    } else {
      loadProducts();
    }
  }

  function cancelEdit() {
    resetForm();
  }

  async function removeImage(imageId: string) {
    const image = productImages.find((img) => img.id === imageId);
    if (!image) return;

    // Delete from storage (solo si es una imagen real, no temporal con preview URL)
    if (!image.image_url.startsWith("blob:")) {
      try {
        const filePath = image.image_url.split("/products/")[1];
        if (filePath) {
          await supabase.storage.from("products").remove([filePath]);
        }
      } catch (err) {
        console.error("Error deleting image:", err);
      }
    }

    // Delete from DB (solo si ya fue persistida en la base)
    if (!imageId.startsWith("temp-") && image.product_id !== "") {
      const { error: dbError } = await supabase
        .from("product_images")
        .delete()
        .eq("id", imageId);

      if (dbError) alert(`Error eliminando imagen: ${dbError.message}`);
    }

    setProductImages((prev) => prev.filter((img) => img.id !== imageId));
  }

  async function setPrimaryImage(imageId: string) {
    const target = productImages.find((img) => img.id === imageId);
    if (!target || !target.product_id) return;

    // Update all images to not primary, then set this one as primary
    const { error } = await supabase
      .from("product_images")
      .update({ is_primary: false })
      .eq("product_id", target.product_id);

    if (error) {
      alert(`Error estableciendo imagen principal: ${error.message}`);
      return;
    }

    const { error: updateError } = await supabase
      .from("product_images")
      .update({ is_primary: true })
      .eq("id", imageId);

    if (updateError) alert(`Error estableciendo imagen principal: ${updateError.message}`);
  }

  return (
    <div className="p-6 lg:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-500 mt-1">{products.length} productos en el catálogo</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); if (!showForm) setEditingId(null); }} className="bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-4 rounded-xl transition-colors">
          {showForm ? "Cancelar" : "+ Nuevo producto"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 mb-8 space-y-4">
          <h3 className="font-bold text-lg">{editingId ? "Editar producto" : "Nuevo producto"}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del producto *" className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-xl bg-white">
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>{categoryLabel(cat)}</option>
              ))}
            </select>
          </div>

          <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción *" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" rows={3} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="number" required min="1000" step="any" value={priceArs} onChange={(e) => setPriceArs(e.target.value)} placeholder="Precio ARS *" className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" />
            <input type="text" value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Material (ej: PLA Premium)" className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" />
          </div>

          {/* Stock status toggle */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Estado de stock:</span>
            <button
              type="button"
              onClick={() => setStockStatus(stockStatus === "disponible" ? "sin_stock" : "disponible")}
              className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
                stockStatus === "disponible" ? "bg-green-500" : "bg-gray-400"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                  stockStatus === "disponible" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm font-semibold ${stockStatus === "disponible" ? "text-green-600" : "text-red-500"}`}>
              {stockStatus === "disponible" ? "✅ Disponible" : "❌ Sin stock"}
            </span>
          </div>

          {/* Category management */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">📂 Gestión de categorías</h4>
            <p className="text-xs text-gray-500 mb-3">Crea categorías personalizadas para organizar tus productos.</p>

            {/* Add new category */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nueva categoría..."
                onKeyDown={(e) => { if (e.key === "Enter") addCustomCategory(); }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
              <button type="button" onClick={addCustomCategory} className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">
                + Agregar
              </button>
            </div>

            {/* Existing custom categories */}
            {customCategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {customCategories.map((cat) => (
                  <span key={cat} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium">
                    {categoryLabel(cat)}
                    <button type="button" onClick={() => removeCustomCategory(cat)} className="text-red-500 hover:text-red-700 ml-1">×</button>
                  </span>
                ))}
              </div>
            )}

            {/* Default categories info */}
            <p className="text-xs text-gray-400 mt-2">Las categorías por defecto (decoración, juegos de mesa...) siempre están disponibles.</p>
          </div>

          {/* Image upload section */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm text-gray-700 mb-3">📸 Imágenes del producto</h4>

            {productImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                {productImages.map((img) => (
                  <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-gray-200 hover:border-brand-500 transition-colors">
                    {/* Usar img src para previews blob: y next/image para URLs reales */}
                    {img.image_url.startsWith("blob:") ? (
                      <img src={img.image_url} alt={img.alt_text || "Preview"} className="w-full h-full object-cover" />
                    ) : (
                      <Image src={img.image_url} alt={img.alt_text || "Imagen del producto"} fill className="object-cover" />
                    )}

                    {/* Primary badge */}
                    {img.is_primary && (
                      <span className="absolute top-2 left-2 bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        PRINCIPAL
                      </span>
                    )}

                    {/* Actions overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!img.is_primary && (
                        <button type="button" onClick={() => setPrimaryImage(img.id)} className="bg-white text-brand-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-gray-100" title="Establecer como principal">
                          ⭐ Principal
                        </button>
                      )}
                      <button type="button" onClick={() => removeImage(img.id)} className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-600" title="Eliminar imagen">
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-colors">
              <div className="text-center">
                <span className="text-2xl block mb-1">📤</span>
                <p className="text-sm text-gray-600 font-medium">Click para subir imágenes</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG o WebP (máx. 5MB)</p>
              </div>
              <input type="file" accept="image/*" multiple onChange={(e) => {
                const files = Array.from(e.target.files || []);
                files.forEach(handleImageUpload);
                e.target.value = ""; // Reset for re-upload
              }} className="hidden" />
            </label>

            {/* Uploading indicators */}
            {uploadingFiles.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-700 font-medium">⏳ Subiendo archivos...</p>
                {uploadingFiles.map((file) => (
                  <p key={file} className="text-xs text-blue-600 mt-1 ml-4">• {file}</p>
                ))}
              </div>
            )}

            {/* Info about storage structure */}
            <p className="text-xs text-gray-500 mt-2">
              💡 Las imágenes se almacenan en Supabase Storage bajo la ruta <code className="bg-gray-100 px-1 rounded">products/[product_id]/</code>. Cada producto tiene su propia carpeta.
            </p>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-6 rounded-xl transition-colors">
              {editingId ? "Actualizar producto" : "Crear producto"}
            </button>
            <button type="button" onClick={cancelEdit} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-6 rounded-xl transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Products list */}
      {loading ? (
        <p className="text-center text-gray-500 py-8">Cargando productos...</p>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <span className="text-4xl block mb-3">📦</span>
          <p className="text-gray-600">No hay productos aún. Creá el primero con el botón de arriba.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:border-brand-300 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{product.name}</p>
                <p className="text-sm text-gray-500">{formatPriceArs(product.price_ars)} · {categoryLabel(product.category)}</p>
                {/* Stock status indicator */}
                <div className="mt-1 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    product.stock_status === "disponible" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {product.stock_status === "disponible" ? "✅ Disponible" : "❌ Sin stock"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => startEdit(product)} className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors">
                  ✏️ Editar
                </button>
                <button onClick={() => deleteProduct(product.id)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-colors">
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function categoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    decoracion: "Decoración",
    "juegos de mesa": "Juegos de Mesa",
    juguetes: "Juguetes",
    herramientas: "Herramientas",
  };
  return labels[cat] ?? cat;
}
