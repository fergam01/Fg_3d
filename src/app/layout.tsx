import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthProvider from "@/components/AuthProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Impresiones 3D Argentina | Catálogo y Cotizaciones",
    template: "%s | Impresiones 3D Argentina",
  },
  description:
    "Tienda online de piezas impresas en 3D. Catálogo con precios en ARS, cotización personalizada subiendo archivos STL/3MF.",
  keywords: [
    "impresión 3D",
    "Argentina",
    "STL",
    "3MF",
    "OBJ",
    "catálogo",
    "cotización",
    "piezas impresas",
    "diseño 3D",
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Impresiones 3D Argentina",
    description: "Tienda online de piezas impresas en 3D. Catálogo con precios en ARS.",
    type: "website",
    locale: "es_AR",
    siteName: "Impresiones 3D Argentina",
  },
  twitter: {
    card: "summary_large_image",
    title: "Impresiones 3D Argentina",
    description: "Tienda online de piezas impresas en 3D. Catálogo con precios en ARS.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR" className={inter.variable}>
      <body className="min-h-screen flex flex-col">
        <ErrorBoundary>
          <AuthProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
