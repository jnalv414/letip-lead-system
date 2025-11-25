'use client';

import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ErrorStateVariant = 'default' | 'not-found' | 'network' | 'permission';

interface ErrorStateProps {
  title: string;
  message?: string;
  onRetry?: () => void;
  variant?: ErrorStateVariant;
  className?: string;
}

export function ErrorState({
  title,
  message,
  onRetry,
  variant = 'default',
  className,
}: ErrorStateProps) {
  const Icon = variant === 'not-found' ? XCircle : AlertTriangle;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'error-state flex flex-col items-center justify-center py-12 px-6 text-center',
        'rounded-lg border border-destructive/30',
        'bg-destructive/5 backdrop-blur-sm',
        className
      )}
    >
      <div className="mb-4 rounded-full p-4 bg-destructive/10">
        <Icon className="h-8 w-8 text-destructive" />
      </div>

      <h3 className="text-lg font-semibold text-foreground">{title}</h3>

      {message && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{message}</p>
      )}

      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-6 gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      )}
    </motion.div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console or error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call optional onError callback
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render default error UI
      return (
        <ErrorState
          title="Something went wrong"
          message={this.state.error?.message || 'An unexpected error occurred'}
          onRetry={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
