"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useCartStore } from "@/store/cart";

/** Email que se considera ADMIN */
const ADMIN_EMAIL = "fernandogam@admin.com.ar";

export default function Header() {
  const { user, signOut } = useAuth();
  const totalItems = useCartStore((s) => s.totalItems);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl" role="img" aria-label="3D">🧊</span>
            <div>
              <span className="font-bold text-lg bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent">
                Impresiones 3D
              </span>
              <p className="text-[10px] text-gray-500 -mt-1 leading-tight">Argentina</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink href="/catalog" label="Catálogo" />
            <NavLink href="/quote" label="Cotizar" />
            {isAdmin && <NavLink href="/admin" label="Admin" />}

            {/* Cart */}
            <Link href="/cart" className="relative flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">
              🛒 Carrito
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-3 bg-accent-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                <span className="text-sm text-gray-600">{isAdmin && "👑 "} {user.email}</span>
                <button onClick={signOut} className="text-sm text-red-500 hover:text-red-700 font-medium">
                  Salir
                </button>
              </div>
            ) : (
              <Link href="/auth/sign-in" className="ml-4 pl-4 border-l border-gray-200 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors">
                Iniciar sesión
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            aria-label="Abrir menú"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg p-4 flex flex-col gap-3">
            <MobileLink href="/catalog" label="📦 Catálogo" onClick={() => setMobileMenuOpen(false)} />
            <MobileLink href="/quote" label="📋 Cotizar" onClick={() => setMobileMenuOpen(false)} />
            {isAdmin && <MobileLink href="/admin" label="⚙️ Admin" onClick={() => setMobileMenuOpen(false)} />}

            <div className="flex items-center justify-between py-2 border-t pt-3">
              <span className="text-sm text-gray-600">{user?.email || "No conectado"}</span>
              {user ? (
                <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="text-sm text-red-500 font-medium">
                  Salir
                </button>
              ) : (
                <Link href="/auth/sign-in" className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  Iniciar sesión
                </Link>
              )}
            </div>

            <div className="flex items-center justify-between py-2 border-t pt-3">
              <span className="font-medium text-gray-700">🛒 Carrito</span>
              <span className="text-sm text-brand-600 font-semibold">{totalItems} ítems</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors">
      {label}
    </Link>
  );
}

function MobileLink({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return (
    <Link href={href} className="py-2 px-3 rounded-lg hover:bg-gray-50 text-sm font-medium" onClick={onClick}>
      {label}
    </Link>
  );
}
