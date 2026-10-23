"use client";

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary that catches rendering errors and shows a friendly fallback.
 * Wraps any subtree so unhandled component crashes don't break the entire page.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, _info: ErrorInfo) {
    // Log to console for debugging; replace with Sentry/etc. in production
    console.error("ErrorBoundary caught:", error);
  }

  private handleReset() {
    this.setState({ hasError: false, error: null });
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[40vh] flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <span className="text-5xl block mb-4">⚠️</span>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Algo salió mal</h2>
            <p className="text-gray-600 mb-6">
              Hubo un error al cargar esta sección. Intentá recargar la página.
            </p>
            <button
              onClick={() => this.handleReset()}
              className="bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 px-5 rounded-lg transition-colors"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
