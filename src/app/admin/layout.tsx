"use client";

import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Email que se considera ADMIN */
const ADMIN_EMAIL = "fernandogam@admin.com.ar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/auth/sign-in");
    } else if (user.email !== ADMIN_EMAIL) {
      // Si no es admin, redirigir a home
      router.push("/");
    }
  }, [user]);

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Verificando permisos...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-6 hidden lg:block">
        <Link href="/" className="text-xl font-bold mb-8 block">
          🧊 Admin Panel
        </Link>

        <nav className="space-y-2">
          <AdminNavLink href="/admin" label="📊 Dashboard" />
          <AdminNavLink href="/admin/products" label="📦 Productos" />
          <AdminNavLink href="/admin/quotations" label="📋 Cotizaciones" />
          <AdminNavLink href="/admin/orders" label="🛒 Pedidos" />
        </nav>

        {/* Logout */}
        <div className="mt-auto pt-8 border-t border-gray-700">
          <button onClick={signOut} className="text-sm text-gray-400 hover:text-white transition-colors">
            Cerrar sesión ({user.email})
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}

function AdminNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block py-2.5 px-4 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
    >
      {label}
    </Link>
  );
}
