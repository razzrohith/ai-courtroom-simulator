/**
 * AppErrorBoundary — Phase 26: the whole app no longer white-screens on an
 * unexpected render error. Friendly recovery screen with a reload action.
 */

import { Component } from 'react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error('JudgeBench crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 text-gray-100">
          <div className="glass-panel-brass max-w-md w-full p-8 text-center space-y-4">
            <div className="text-5xl">⚖️💥</div>
            <h1 className="font-display text-xl font-bold text-brass-gradient">Mistrial Declared</h1>
            <p className="text-sm text-gray-300">
              JudgeBench hit an unexpected error and had to adjourn. Your saved sessions and case
              library are safe.
            </p>
            {this.state.message && (
              <p className="text-[11px] text-gray-500 font-mono break-words bg-white/5 rounded-lg p-2">
                {this.state.message.slice(0, 200)}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="btn-brass px-6 py-3 text-sm"
            >
              🔄 Reconvene the Court
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
