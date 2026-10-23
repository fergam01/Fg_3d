"use client";

import { useState, useCallback } from "react";
import { getPublicFileUrl, uploadFile } from "@/lib/supabase";
import { formatNumberAr } from "@/types";

/** Extensiones válidas para archivos 3D */
const VALID_3D_EXTENSIONS = [".stl", ".3mf", ".obj"];
/** Extensiones válidas para imágenes de referencia */
const VALID_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const ALL_VALID_EXTENSIONS = [...VALID_3D_EXTENSIONS, ...VALID_IMAGE_EXTENSIONS];
const MAX_FILE_SIZE_MB = 100; // 100 MB máximo por archivo 3D / 5MB para imágenes

/** Tipos de servicio disponibles */
const SERVICE_TYPES = [
  { value: "archivo", label: "📁 Archivo existente (STL/3MF/OBJ)", desc: "Tenés un modelo listo? Subilo y te cotizamos." },
  { value: "diseno_impresion", label: "🎨 Diseño + Impresión", desc: "Contanos tu idea y nosotros lo diseñamos e imprimimos para vos." },
] as const;

/** Datos del formulario de cotización */
interface QuoteFormData {
  name: string;
  email: string;
  phone?: string;
  serviceType: "archivo" | "diseno" | "diseno_impresion";
  projectDescription: string;
  notes: string;
}

/** Estado de archivos adjuntos */
interface AttachedFile {
  file: File;
  type: "3d_model" | "reference_image";
  name: string;
  size: number;
}

/**
 * Formulario de cotización expandido para soportar:
 * - Cotización basada en archivo existente (.STL/.3MF/.OBJ)
 * - Servicio de diseño desde cero (sin archivo previo)
 * - Servicio integral de diseño + impresión
 */
export default function QuoteForm() {
  const [formData, setFormData] = useState<QuoteFormData>({
    name: "",
    email: "",
    phone: "",
    serviceType: "archivo",
    projectDescription: "",
    notes: "",
  });
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Manejadores de drag & drop ──
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.length) {
      Array.from(e.dataTransfer.files).forEach(validateAndSetFile);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      Array.from(e.target.files).forEach(validateAndSetFile);
    }
  }, []);

  function validateAndSetFile(selectedFile: File) {
    setError(null);
    const ext = "." + selectedFile.name.split(".").pop()?.toLowerCase();

    // Determinar tipo de archivo
    const is3DModel = VALID_3D_EXTENSIONS.includes(ext);
    const isImageRef = VALID_IMAGE_EXTENSIONS.includes(ext);

    if (!is3DModel && !isImageRef) {
      setError(
        `Formato "${ext}" no válido. Aceptamos ${ALL_VALID_EXTENSIONS.join(", ")} para modelos 3D y ${VALID_IMAGE_EXTENSIONS.join(", ")} para referencias.`
      );
      return;
    }

    // Validar tamaño según tipo
    const maxSize = isImageRef ? 5 * 1024 * 1024 : MAX_FILE_SIZE_MB * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError(
        `El archivo excede el límite de ${isImageRef ? "5 MB" : `${MAX_FILE_SIZE_MB} MB`}`
      );
      return;
    }

    setAttachedFiles((prev) => [
      ...prev,
      {
        file: selectedFile,
        type: is3DModel ? "3d_model" : "reference_image",
        name: selectedFile.name,
        size: selectedFile.size,
      },
    ]);
  }

  function removeAttachedFile(index: number) {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Validación del formulario ──
  function validateForm(): boolean {
    if (!formData.name.trim()) {
      setError("El nombre es obligatorio.");
      return false;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("El email es obligatorio y debe ser válido.");
      return false;
    }

    // Para servicios de diseño, la descripción es obligatoria
    if (formData.serviceType !== "archivo" && !formData.projectDescription.trim()) {
      setError("La descripción del proyecto es obligatoria para servicios de diseño.");
      return false;
    }

    // Para servicio basado en archivo, al menos un modelo 3D es obligatorio
    if (formData.serviceType === "archivo") {
      const has3DModel = attachedFiles.some((f) => f.type === "3d_model");
      if (!has3DModel) {
        setError("Para cotización basada en archivo, subí al menos un modelo 3D (.STL/.3MF/.OBJ).");
        return false;
      }
    }

    // Para diseño desde cero o diseño+impresión, la descripción es obligatoria (ya validada arriba)

    return true;
  }

  // ── Submit del formulario ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setUploading(true);

    try {
      // Subir archivos a Supabase Storage con timestamps únicos por archivo
      const uploadedFiles: Array<{ url: string; name: string; type: "3d_model" | "reference_image"; format?: string }> = [];

      for (let i = 0; i < attachedFiles.length; i++) {
        const attached = attachedFiles[i];
        // Timestamp único por archivo para evitar colisiones
        const timestamp = Date.now() + i;

        if (attached.type === "3d_model") {
          const fileName = `${formData.serviceType}/${timestamp}-${attached.file.name}`;
          await uploadFile("quotations", fileName, attached.file);
          const url = getPublicFileUrl("quotations", fileName);
          uploadedFiles.push({
            url,
            name: attached.file.name,
            type: "3d_model",
            format: attached.file.name.split(".").pop()?.toLowerCase(),
          });
        } else {
          const fileName = `refs/${timestamp}-${attached.file.name}`;
          await uploadFile("quotations", fileName, attached.file);
          const url = getPublicFileUrl("quotations", fileName);
          uploadedFiles.push({ url, name: attached.file.name, type: "reference_image" });
        }
      }

      // Log de la cotización registrada (en producción se inserta en Supabase DB)
      const quotationData = {
        service_type: formData.serviceType,
        project_description: formData.projectDescription,
        notes: formData.notes,
        uploaded_files: uploadedFiles.map((f) => ({ url: f.url, name: f.name, type: f.type })),
        user_name: formData.name,
        user_email: formData.email,
        user_phone: formData.phone,
      };

      console.log("Cotización registrada:", quotationData);

      setSubmitted(true);
    } catch (err) {
      setError(`Error al subir los archivos: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploading(false);
    }
  };

  // ── Si ya se envió, mostrar confirmación ──
  if (submitted) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Cotización enviada!</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Recibimos tu solicitud de{" "}
          <strong>{serviceTypeLabel(formData.serviceType)}</strong>. Te responderemos en menos de 24hs a <strong>{formData.email}</strong>.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setFormData({ name: "", email: "", phone: "", serviceType: "archivo", projectDescription: "", notes: "" });
            setAttachedFiles([]);
          }}
          className="bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 px-6 rounded-xl transition-colors"
        >
          Enviar otra cotización
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Selector de tipo de servicio ── */}
      <fieldset className="space-y-3">
        <legend className="text-lg font-bold text-gray-900 mb-2">¿Qué necesitás?</legend>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SERVICE_TYPES.map((st) => (
            <label
              key={st.value}
              className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                formData.serviceType === st.value
                  ? "border-brand-500 bg-brand-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="serviceType"
                value={st.value}
                checked={formData.serviceType === st.value}
                onChange={() => setFormData({ ...formData, serviceType: st.value as QuoteFormData["serviceType"] })}
                className="sr-only"
              />
              <span className="font-semibold text-sm">{st.label}</span>
              <span className="text-xs text-gray-500 mt-1">{st.desc}</span>
              {formData.serviceType === st.value && (
                <span className="absolute top-2 right-2 w-3 h-3 bg-brand-600 rounded-full" />
              )}
            </label>
          ))}
        </div>
      </fieldset>

      {/* ── Descripción del proyecto (requerida para diseño y diseño+impresión) ── */}
      {(formData.serviceType === "diseno" || formData.serviceType === "diseno_impresion") && (
        <Field label="Descripción del proyecto *">
          <textarea
            required
            value={formData.projectDescription}
            onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all resize-y min-h-[120px]"
            placeholder={
              formData.serviceType === "diseno"
                ? "Contanos tu idea: ¿qué querés diseñar? Dimensiones aproximadas, uso previsto, estilo..."
                : "Describí qué necesitás: modelo 3D + impresión. Incluí detalles sobre material, tamaño y cantidad."
            }
            rows={5}
          />
          <p className="text-xs text-gray-400 mt-1">Mínimo 20 caracteres. Sé lo más detallado posible para una cotización precisa.</p>
        </Field>
      )}

      {/* ── Zona de carga de archivos (disponible para todos los tipos, obligatorio solo para 'archivo') ── */}
      <div className="space-y-3">
        <p className="text-sm font-bold text-gray-900 mb-2">Archivos adjuntos</p>

        {formData.serviceType === "archivo" && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
              dragActive
                ? "border-brand-500 bg-brand-50 scale-[1.02]"
                : "border-gray-300 hover:border-brand-400"
            }`}
          >
            <input
              type="file"
              accept={VALID_3D_EXTENSIONS.join(",")}
              multiple
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              aria-label="Seleccionar archivo 3D (.STL, .3MF, .OBJ)"
            />

            <div className="space-y-3">
              <span className="text-5xl block">📁</span>
              <p className="font-semibold text-gray-700">
                Arrastrá tu modelo 3D aquí o hacé clic para seleccionar
              </p>
              <p className="text-sm text-gray-500">
                Formatos: {VALID_3D_EXTENSIONS.join(" • ")} — Máx. {MAX_FILE_SIZE_MB} MB por archivo
              </p>
            </div>
          </div>
        )}

        {/* Carga de imágenes de referencia (para cualquier tipo) */}
          {attachedFiles.filter((f) => f.type === "3d_model").length > 0 && (
            <div className="space-y-2">
              {attachedFiles
                .filter((f) => f.type === "3d_model")
                .map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                      <span>🧊</span>
                      <span>{file.name}</span>
                      <span className="text-gray-400">({formatNumberAr(file.size)} bytes)</span>
                    </div>
                    <button type="button" onClick={() => removeAttachedFile(attachedFiles.indexOf(file))} className="text-red-500 hover:text-red-700 text-sm font-medium">
                      ✕ Eliminar
                    </button>
                  </div>
                ))}
            </div>
          )}

        {/* Carga de imágenes de referencia (para cualquier tipo) */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-600">📸 Imágenes de referencia (opcional)</p>
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-colors">
            <div className="text-center">
              <span className="text-lg block mb-1">📷</span>
              <p className="text-sm text-gray-600 font-medium">Click para subir imágenes de referencia</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG o WebP (máx. 5MB c/u)</p>
            </div>
            <input type="file" accept={VALID_IMAGE_EXTENSIONS.join(",")} multiple onChange={handleFileSelect} className="hidden" />
          </label>

          {/* Lista de imágenes adjuntas */}
          {attachedFiles.filter((f) => f.type === "reference_image").length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {attachedFiles
                .filter((f) => f.type === "reference_image")
                .map((file, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-gray-200">
                    <img src={URL.createObjectURL(file.file)} alt={file.name} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeAttachedFile(attachedFiles.indexOf(file))} className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Campos del formulario ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nombre completo *" required>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
            placeholder="Tu nombre"
          />
        </Field>

        <Field label="Email *" required>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
            placeholder="tu@email.com"
          />
        </Field>

        <Field label="Teléfono (opcional)">
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
            placeholder="+54 11 XXXX-XXXX"
          />
        </Field>

        <Field label="Notas adicionales (opcional)">
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all resize-none"
            placeholder="Material preferido, cantidad, detalles adicionales..."
            rows={1}
          />
        </Field>
      </div>

      {/* ── Error / Info ── */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={uploading || (attachedFiles.length === 0 && formData.serviceType !== "archivo")}
        className={`w-full py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
          uploading || (attachedFiles.length === 0 && formData.serviceType !== "archivo")
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-200 active:scale-[0.98]"
        }`}
      >
        {uploading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Enviando solicitud...
          </span>
        ) : (
          "📤 Solicitar cotización"
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Te responderemos con la cotización en menos de 24hs hábiles.
      </p>
    </form>
  );
}

/* ──────────────────────────────────────────────
   Helper: label para tipo de servicio
   ────────────────────────────────────────────── */

function serviceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    archivo: "cotización basada en archivo",
    diseno_impresion: "diseño + impresión",
  };
  return labels[type] ?? type;
}

/* ──────────────────────────────────────────────
   Componente Field (reutilizable)
   ────────────────────────────────────────────── */

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
