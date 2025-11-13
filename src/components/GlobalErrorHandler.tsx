import React from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  const isNetworkError = error.message?.includes('fetch') || error.message?.includes('Network');
  const isAuthError = error.message?.includes('Unauthorized') || error.message?.includes('401');

  const handleGoHome = () => {
    // Use window.location instead of useNavigate to avoid Router context issues
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-cyber flex items-center justify-center p-4">
      <Card className="glass-card w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <CardTitle className="text-xl text-white">
            {isNetworkError ? 'Connection Error' : 
             isAuthError ? 'Authentication Error' : 
             'Something went wrong'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-white/70 text-center">
            {isNetworkError ? 'Unable to connect to the server. Please check your internet connection.' :
             isAuthError ? 'Your session has expired. Please log in again.' :
             'An unexpected error occurred. We\'re sorry for the inconvenience.'}
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <summary className="text-red-400 text-sm font-medium cursor-pointer flex items-center">
                <Bug className="w-4 h-4 mr-2" />
                Error Details (Development)
              </summary>
              <pre className="text-red-300 text-xs mt-2 overflow-auto">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
          
          <div className="flex gap-2">
            <Button
              onClick={resetErrorBoundary}
              className="flex-1 bg-primary/20 text-primary hover:bg-primary hover:text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface GlobalErrorHandlerProps {
  children: React.ReactNode;
}

export const GlobalErrorHandler: React.FC<GlobalErrorHandlerProps> = ({ children }) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onReset={reset}
          onError={(error, errorInfo) => {
            // Log error to console in development
            if (process.env.NODE_ENV === 'development') {
              console.error('Global Error Boundary caught an error:', error, errorInfo);
            }
            
            // In production, you might want to send this to an error reporting service
            // like Sentry, LogRocket, or Bugsnag
          }}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};