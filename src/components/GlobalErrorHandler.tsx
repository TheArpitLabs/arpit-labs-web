'use client';

import { useEffect } from 'react';

export function GlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      // Lazy load error handling only when needed
      import('@/lib/errors').then(({ classifyError, logError }) => {
        const error = classifyError(event.reason);
        logError(error, { type: 'unhandled_promise_rejection' });
      }).catch(err => {
        console.error('Failed to log unhandled rejection:', err);
      });
    };

    // Handle uncaught errors
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      // Lazy load error handling only when needed
      import('@/lib/errors').then(({ classifyError, logError }) => {
        const error = classifyError(event.error);
        logError(error, {
          type: 'uncaught_error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      }).catch(err => {
        console.error('Failed to log error:', err);
      });
    };

    // Register error handlers
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Cleanup function
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null; // This component doesn't render anything
}

// HOC to wrap components with error handling
export function withGlobalErrorHandling<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WithGlobalErrorHandlingWrapper(props: P) {
    return (
      <>
        <GlobalErrorHandler />
        <Component {...props} />
      </>
    );
  };
}
