"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

/** Email que se considera ADMIN en el sistema */
const ADMIN_EMAIL = "fernandogam@admin.com.ar";

export default function SignInPage() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        alert("Cuenta creada. Revisá tu email para confirmar.");
      } else {
        await signIn(email, password);
        // Redirect based on user role
        const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        router.push(isAdmin ? "/admin" : "/catalog");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Error al autenticar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-gray-100 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-gray-900">
            🧊 Impresiones 3D
          </Link>
          <p className="mt-2 text-sm text-gray-500">Panel de Administración</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {isSignUp ? "Crear cuenta" : "Iniciar sesión"}
          </h2>

          {/* Info admin */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
            <p>El email <strong>{ADMIN_EMAIL}</strong> tendrá acceso de administrador.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-200 active:scale-[0.98]"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Procesando...
                </span>
              ) : isSignUp ? "Crear cuenta" : "Iniciar sesión"}
            </button>
          </form>

          {/* Toggle sign in / sign up */}
          <div className="mt-6 text-center">
            {isSignUp ? (
              <p className="text-sm text-gray-600">
                ¿Ya tenés cuenta?{" "}
                <button onClick={() => setIsSignUp(false)} className="text-brand-600 font-medium hover:underline">
                  Iniciar sesión
                </button>
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                ¿No tenés cuenta?{" "}
                <button onClick={() => setIsSignUp(true)} className="text-brand-600 font-medium hover:underline">
                  Crear cuenta
                </button>
              </p>
            )}
          </div>

          {/* Back to home */}
          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-brand-600 transition-colors">
              ← Volver a la tienda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
