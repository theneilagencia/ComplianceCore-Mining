/**
 * Lazy-loaded PDFViewer Component
 * 
 * This wrapper implements lazy loading for the PDFViewer component
 * to optimize bundle size and initial load performance.
 * 
 * Benefits:
 * - Reduces initial bundle size by ~500KB (react-pdf + pdfjs-dist)
 * - Only loads when actually needed
 * - Shows loading state during component load
 * - Improves Time to Interactive (TTI)
 * 
 * @example
 * ```tsx
 * import LazyPDFViewer from '@/components/PDFViewer.lazy';
 * 
 * <LazyPDFViewer url="https://example.com/report.pdf" title="Report" />
 * ```
 */

import { lazy, Suspense } from 'react';

const PDFViewer = lazy(() => import('./PDFViewer'));

interface LazyPDFViewerProps {
  url: string;
  title?: string;
  onLoadSuccess?: (numPages: number) => void;
  onLoadError?: (error: Error) => void;
  maxHeight?: string;
  enableDownload?: boolean;
  enableFullscreen?: boolean;
}

/**
 * Loading fallback component
 */
function PDFViewerLoading() {
  return (
    <div className="flex flex-col border rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Carregando visualizador de PDF...</p>
        </div>
      </div>
      <div className="px-4 py-2 border-t bg-gray-50">
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Lazy-loaded PDF Viewer with loading state
 */
export default function LazyPDFViewer(props: LazyPDFViewerProps) {
  return (
    <Suspense fallback={<PDFViewerLoading />}>
      <PDFViewer {...props} />
    </Suspense>
  );
}
