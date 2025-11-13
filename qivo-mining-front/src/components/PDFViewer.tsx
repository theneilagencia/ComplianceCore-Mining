import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from './ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Download,
  Maximize2,
  Minimize2
} from 'lucide-react';
// CSS imports removed - causing Vite build issues
// The PDF viewer will work without these styles
// import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
// import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  /** URL do arquivo PDF para visualização */
  url: string;
  /** Título do documento (opcional) */
  title?: string;
  /** Callback quando o documento é carregado com sucesso */
  onLoadSuccess?: (numPages: number) => void;
  /** Callback quando ocorre erro no carregamento */
  onLoadError?: (error: Error) => void;
  /** Altura máxima do container (default: 600px) */
  maxHeight?: string;
  /** Habilitar download (default: true) */
  enableDownload?: boolean;
  /** Habilitar fullscreen (default: true) */
  enableFullscreen?: boolean;
}

/**
 * Componente profissional de visualização de PDFs
 * 
 * Features:
 * - Navegação entre páginas com controles intuitivos
 * - Zoom de 50% a 200% em incrementos de 10%
 * - Download do arquivo original
 * - Modo fullscreen
 * - Loading states e error handling
 * - Responsivo e acessível
 * 
 * @example
 * ```tsx
 * <PDFViewer 
 *   url="https://example.com/report.pdf"
 *   title="Relatório Técnico"
 *   onLoadSuccess={(pages) => console.log(`Loaded ${pages} pages`)}
 * />
 * ```
 */
export default function PDFViewer({
  url,
  title,
  onLoadSuccess,
  onLoadError,
  maxHeight = '600px',
  enableDownload = true,
  enableFullscreen = true,
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Zoom presets (50% to 200%)
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 2.0;
  const SCALE_STEP = 0.1;

  const handleDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    onLoadSuccess?.(numPages);
  }, [onLoadSuccess]);

  const handleDocumentLoadError = useCallback((error: Error) => {
    setLoading(false);
    setError(error.message || 'Erro ao carregar PDF');
    onLoadError?.(error);
  }, [onLoadError]);

  const goToPreviousPage = useCallback(() => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  }, [numPages]);

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + SCALE_STEP, MAX_SCALE));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - SCALE_STEP, MIN_SCALE));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1.0);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = url;
    link.download = title || 'document.pdf';
    link.click();
  }, [url, title]);

  const formatZoom = (scale: number) => `${Math.round(scale * 100)}%`;

  return (
    <div className={`flex flex-col border rounded-lg bg-white shadow-sm ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header com controles */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          {title && (
            <h3 className="text-sm font-medium text-gray-900 truncate max-w-[300px]">
              {title}
            </h3>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Navigation controls */}
          <div className="flex items-center gap-1 px-2 border-r">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousPage}
              disabled={pageNumber <= 1 || loading}
              className="h-8 px-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-700 min-w-[80px] text-center">
              {loading ? '...' : `${pageNumber} / ${numPages}`}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages || loading}
              className="h-8 px-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 px-2 border-r">
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomOut}
              disabled={scale <= MIN_SCALE || loading}
              className="h-8 px-2"
              title="Reduzir zoom"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <button
              onClick={resetZoom}
              className="text-sm text-gray-700 min-w-[50px] hover:text-gray-900 transition-colors"
              title="Resetar zoom (100%)"
            >
              {formatZoom(scale)}
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomIn}
              disabled={scale >= MAX_SCALE || loading}
              className="h-8 px-2"
              title="Aumentar zoom"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Action controls */}
          <div className="flex items-center gap-1 px-2">
            {enableDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                disabled={loading || !!error}
                className="h-8 px-2"
                title="Baixar PDF"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {enableFullscreen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="h-8 px-2"
                title={isFullscreen ? 'Sair do fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* PDF Content */}
      <div 
        className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4"
        style={{ maxHeight: isFullscreen ? '100%' : maxHeight }}
      >
        {error ? (
          <div className="text-center py-8">
            <p className="text-red-600 font-medium">Erro ao carregar PDF</p>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
          </div>
        ) : (
          <Document
            file={url}
            onLoadSuccess={handleDocumentLoadSuccess}
            onLoadError={handleDocumentLoadError}
            loading={
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-gray-600 mt-4">Carregando PDF...</p>
              </div>
            }
            error={
              <div className="text-center py-8">
                <p className="text-red-600 font-medium">Erro ao carregar PDF</p>
                <p className="text-sm text-gray-600 mt-2">Verifique se o arquivo existe e tente novamente.</p>
              </div>
            }
            className="flex justify-center"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              loading={
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                </div>
              }
              className="shadow-lg"
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        )}
      </div>

      {/* Footer com informações */}
      {!error && !loading && (
        <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-600">
          <div className="flex justify-between items-center">
            <span>
              {numPages} página{numPages !== 1 ? 's' : ''} • Zoom: {formatZoom(scale)}
            </span>
            {title && (
              <span className="truncate max-w-[200px]">{title}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
