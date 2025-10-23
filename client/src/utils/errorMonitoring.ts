// Global error monitoring for UX issues
export function initErrorMonitoring() {
  // Only in production
  if (import.meta.env.MODE !== 'production') {
    return;
  }

  // Listen for JavaScript errors
  window.addEventListener('error', (event) => {
    reportError({
      type: 'javascript_error',
      message: event.message,
      pathname: window.location.pathname,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    });
  });

  // Listen for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    reportError({
      type: 'unhandled_rejection',
      message: event.reason?.message || String(event.reason),
      pathname: window.location.pathname,
      stack: event.reason?.stack,
    });
  });

  // Listen for resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      reportError({
        type: 'resource_error',
        message: `Failed to load resource: ${(event.target as HTMLElement)?.tagName}`,
        pathname: window.location.pathname,
        src: (event.target as any)?.src || (event.target as any)?.href,
      });
    }
  }, true);
}

async function reportError(errorData: any) {
  try {
    await fetch('/api/ux/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        m: errorData.message,
        p: errorData.pathname,
        ...errorData,
      }),
    });
  } catch (err) {
    // Silently fail to avoid infinite error loops
    console.error('Failed to report error:', err);
  }
}

// Export function to manually report UX issues
export function reportUXIssue(message: string, context?: any) {
  reportError({
    type: 'manual_report',
    message,
    pathname: window.location.pathname,
    ...context,
  });
}

