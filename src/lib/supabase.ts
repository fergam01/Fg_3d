// ============================================================
// SUPABASE CLIENT - Cliente para Supabase (Browser)
// ============================================================

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Crea el cliente Supabase. Si las credenciales están vacías (dev),
 * usa valores placeholder para evitar crash en prerendering.
 */
function createSupabaseClient() {
  // En desarrollo sin credenciales, usar un proyecto dummy que no falle
  const url = supabaseUrl || "https://placeholder.supabase.co";
  const key = supabaseAnonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIn0.placeholder";

  return createClient(url, key);
}

export const supabase = createSupabaseClient();

// ──────────────────────────────────────────────
// STORAGE: Buckets y operaciones
// ──────────────────────────────────────────────

const BUCKET_PRODUCTS = "products";
const BUCKET_QUOTATIONS = "quotations";

/**
 * Sube un archivo a Supabase Storage.
 * @param bucket - Nombre del bucket ('products' | 'quotations')
 * @param filePath - Ruta dentro del bucket (ej: 'stl/modelo-01.stl')
 * @param file - Objeto File/Blob a subir
 */
export async function uploadFile(
  bucket: "products" | "quotations",
  filePath: string,
  file: Blob | File
) {
  const storageBucket = bucket === "products" ? BUCKET_PRODUCTS : BUCKET_QUOTATIONS;

  const { data, error } = await supabase.storage
    .from(storageBucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw new Error(`Error subiendo archivo: ${error.message}`);
  return data;
}

/**
 * Obtiene la URL pública de un archivo en Supabase Storage.
 */
export function getPublicFileUrl(bucketName: string, path: string): string {
  const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
  return data?.publicUrl ?? "";
}

/**
 * Elimina un archivo de Supabase Storage.
 */
export async function deleteFile(bucketName: string, path: string) {
  const { error } = await supabase.storage.from(bucketName).remove([path]);
  if (error) throw new Error(`Error eliminando archivo: ${error.message}`);
}
