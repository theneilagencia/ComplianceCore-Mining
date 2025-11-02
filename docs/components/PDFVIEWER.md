# PDFViewer Component Documentation

## Visão Geral

O `PDFViewer` é um componente React otimizado para visualização de documentos PDF com navegação, zoom, rotação e modo fullscreen. Implementa lazy loading para reduzir o bundle size em ~500KB.

## Instalação

```bash
pnpm add react-pdf pdfjs-dist
```

## Estrutura de Arquivos

```
client/src/components/
├── PDFViewer.tsx          # Componente principal
└── PDFViewer.lazy.tsx     # Wrapper com lazy loading
```

## Importação

### Lazy Loading (Recomendado)

```typescript
import { LazyPDFViewer } from '@/components/PDFViewer.lazy';

function MyComponent() {
  return (
    <LazyPDFViewer
      fileUrl="https://example.com/document.pdf"
      fileName="Report.pdf"
    />
  );
}
```

### Import Direto (Não Recomendado)

```typescript
import { PDFViewer } from '@/components/PDFViewer';

// Use apenas se precisar do componente imediatamente na tela
```

## Props

### `PDFViewerProps`

```typescript
interface PDFViewerProps {
  // URL do arquivo PDF (obrigatório)
  fileUrl: string;
  
  // Nome do arquivo para display (opcional)
  fileName?: string;
  
  // Altura do container (opcional, padrão: '600px')
  height?: string | number;
  
  // Largura do container (opcional, padrão: '100%')
  width?: string | number;
  
  // Mostrar toolbar de controles (opcional, padrão: true)
  showToolbar?: boolean;
  
  // Página inicial (opcional, padrão: 1)
  initialPage?: number;
  
  // Zoom inicial em % (opcional, padrão: 100)
  initialZoom?: number;
  
  // Callback quando página muda
  onPageChange?: (page: number) => void;
  
  // Callback quando zoom muda
  onZoomChange?: (zoom: number) => void;
  
  // Callback quando carregamento completa
  onLoadSuccess?: (numPages: number) => void;
  
  // Callback quando erro ocorre
  onLoadError?: (error: Error) => void;
  
  // Classe CSS customizada
  className?: string;
}
```

## Uso Básico

### Visualização Simples

```typescript
import { LazyPDFViewer } from '@/components/PDFViewer.lazy';

function ReportViewer() {
  return (
    <div>
      <h2>Technical Report</h2>
      <LazyPDFViewer
        fileUrl="https://cdn.example.com/reports/gold-mine-2024.pdf"
        fileName="Gold Mine Report 2024.pdf"
        height="800px"
      />
    </div>
  );
}
```

### Com Controles Customizados

```typescript
import { LazyPDFViewer } from '@/components/PDFViewer.lazy';
import { useState } from 'react';

function AdvancedViewer() {
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);

  return (
    <div>
      <div className="controls">
        <span>Page {currentPage} of {numPages}</span>
      </div>
      
      <LazyPDFViewer
        fileUrl="https://example.com/document.pdf"
        initialPage={currentPage}
        onPageChange={setCurrentPage}
        onLoadSuccess={setNumPages}
      />
    </div>
  );
}
```

## Funcionalidades

### Navegação de Páginas

```typescript
// Controles automáticos no toolbar
- Botão "Previous Page" (desabilitado na primeira página)
- Campo de input para ir direto para página específica
- Botão "Next Page" (desabilitado na última página)
- Display "Page X of Y"

// Atalhos de teclado
- ArrowLeft / PageUp: Página anterior
- ArrowRight / PageDown: Próxima página
- Home: Primeira página
- End: Última página
```

### Zoom

```typescript
// Controles automáticos no toolbar
- Botão "Zoom Out" (mínimo: 50%)
- Display "X%"
- Botão "Zoom In" (máximo: 200%)
- Botão "Fit to Width"
- Botão "Fit to Page"

// Atalhos de teclado
- Ctrl/Cmd + Plus: Zoom in
- Ctrl/Cmd + Minus: Zoom out
- Ctrl/Cmd + 0: Reset zoom (100%)

// Zoom levels: 50%, 75%, 100%, 125%, 150%, 175%, 200%
```

### Rotação

```typescript
// Controles automáticos no toolbar
- Botão "Rotate Left" (-90°)
- Botão "Rotate Right" (+90°)

// Estados: 0°, 90°, 180°, 270°
```

### Fullscreen

```typescript
// Controles automáticos no toolbar
- Botão "Fullscreen" (toggle)

// Atalhos de teclado
- F11 ou F: Ativar fullscreen
- Esc: Sair do fullscreen
```

### Download

```typescript
// Controles automáticos no toolbar
- Botão "Download" com ícone

// Behavior
- Baixa o arquivo PDF original
- Nome do arquivo preservado (ou usa fileName prop)
```

## Exemplos Avançados

### Upload Modal com Preview

```typescript
import { LazyPDFViewer } from '@/components/PDFViewer.lazy';
import { useState } from 'react';

function UploadModalWithPreview() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [showPreview, setShowPreview] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      // Criar URL local para preview
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    // Cleanup da URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  return (
    <div>
      <input type="file" accept=".pdf" onChange={handleFileChange} />
      
      {file && (
        <button onClick={() => setShowPreview(!showPreview)}>
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      )}

      {showPreview && previewUrl && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3>Upload Form</h3>
            {/* Form fields */}
          </div>
          
          <div>
            <LazyPDFViewer
              fileUrl={previewUrl}
              fileName={file?.name}
              height="600px"
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

### Template Preview Dialog

```typescript
import { LazyPDFViewer } from '@/components/PDFViewer.lazy';
import { Dialog, DialogContent } from '@/components/ui/dialog';

function TemplateEditor() {
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>();

  const generatePreview = async () => {
    // Gerar preview do template
    const result = await trpc.technicalReports.templates.preview.mutateAsync({
      templateId: 'tpl-123',
    });
    setPreviewUrl(result.previewUrl);
    setShowPreview(true);
  };

  return (
    <>
      <button onClick={generatePreview}>Preview Template</button>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl h-[90vh]">
          <LazyPDFViewer
            fileUrl={previewUrl || ''}
            height="100%"
            showToolbar={true}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
```

### Review Page com Múltiplos PDFs

```typescript
import { LazyPDFViewer } from '@/components/PDFViewer.lazy';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function ReviewMultiplePDFs({ reportId }: { reportId: string }) {
  const { data: report } = trpc.technicalReports.get.useQuery({ reportId });

  if (!report) return null;

  return (
    <Tabs defaultValue="original">
      <TabsList>
        <TabsTrigger value="original">Original Upload</TabsTrigger>
        <TabsTrigger value="annotated">Annotated Version</TabsTrigger>
        <TabsTrigger value="final">Final Report</TabsTrigger>
      </TabsList>

      <TabsContent value="original">
        <LazyPDFViewer
          fileUrl={report.originalFileUrl}
          fileName="Original Upload.pdf"
          height="800px"
        />
      </TabsContent>

      <TabsContent value="annotated">
        <LazyPDFViewer
          fileUrl={report.annotatedFileUrl}
          fileName="Annotated Version.pdf"
          height="800px"
        />
      </TabsContent>

      <TabsContent value="final">
        <LazyPDFViewer
          fileUrl={report.finalFileUrl}
          fileName="Final Report.pdf"
          height="800px"
        />
      </TabsContent>
    </Tabs>
  );
}
```

### Side-by-Side Comparison

```typescript
function PDFComparison({ url1, url2 }: { url1: string; url2: string }) {
  const [page, setPage] = useState(1);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3>Version 1</h3>
        <LazyPDFViewer
          fileUrl={url1}
          initialPage={page}
          onPageChange={setPage}
          height="800px"
        />
      </div>

      <div>
        <h3>Version 2</h3>
        <LazyPDFViewer
          fileUrl={url2}
          initialPage={page}
          onPageChange={setPage}
          height="800px"
        />
      </div>
    </div>
  );
}
```

## Otimizações

### Lazy Loading

O componente é otimizado com lazy loading para reduzir o bundle size:

```typescript
// PDFViewer.lazy.tsx
import React, { lazy, Suspense } from 'react';
import type { PDFViewerProps } from './PDFViewer';

const PDFViewer = lazy(() => import('./PDFViewer'));

export function LazyPDFViewer(props: PDFViewerProps) {
  return (
    <Suspense fallback={<PDFViewerSkeleton />}>
      <PDFViewer {...props} />
    </Suspense>
  );
}

// Skeleton de loading
function PDFViewerSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-12 bg-gray-200 rounded mb-4" />
      <div className="h-96 bg-gray-200 rounded" />
    </div>
  );
}
```

### Performance

```typescript
// Memoization
const MemoizedPDFViewer = React.memo(LazyPDFViewer);

// Uso
<MemoizedPDFViewer
  fileUrl={url}
  fileName={name}
/>
```

### Cleanup de URLs

```typescript
useEffect(() => {
  // Criar URL para preview local
  const url = URL.createObjectURL(file);
  setPreviewUrl(url);

  // Cleanup quando componente desmonta
  return () => {
    URL.revokeObjectURL(url);
  };
}, [file]);
```

## Estilização

### Classes CSS Disponíveis

```css
.pdf-viewer-container {
  /* Container principal */
}

.pdf-viewer-toolbar {
  /* Barra de ferramentas */
}

.pdf-viewer-page {
  /* Área da página PDF */
}

.pdf-viewer-loading {
  /* Estado de loading */
}

.pdf-viewer-error {
  /* Estado de erro */
}
```

### Customização com Tailwind

```typescript
<LazyPDFViewer
  fileUrl={url}
  className="shadow-lg rounded-lg border-2 border-gray-200"
  height="600px"
/>
```

## Tratamento de Erros

### Erro de Carregamento

```typescript
function PDFViewerWithErrorHandling() {
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    return (
      <div className="error-state">
        <p>Failed to load PDF: {error.message}</p>
        <button onClick={() => setError(null)}>Retry</button>
      </div>
    );
  }

  return (
    <LazyPDFViewer
      fileUrl="https://example.com/document.pdf"
      onLoadError={setError}
    />
  );
}
```

### Arquivo não encontrado

```typescript
function PDFViewerWithFallback({ fileUrl }: { fileUrl?: string }) {
  if (!fileUrl) {
    return (
      <div className="empty-state">
        <p>No PDF available</p>
      </div>
    );
  }

  return <LazyPDFViewer fileUrl={fileUrl} />;
}
```

## Estados de Loading

### Custom Loading Skeleton

```typescript
function CustomPDFViewer({ fileUrl }: { fileUrl: string }) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse" />
          <div className="h-[600px] bg-gradient-to-b from-gray-200 to-gray-300 rounded animate-pulse" />
        </div>
      }
    >
      <PDFViewer fileUrl={fileUrl} />
    </Suspense>
  );
}
```

## Accessibility

### Keyboard Navigation

Todos os controles são acessíveis via teclado:

```
Tab: Navegar entre controles
Enter/Space: Ativar botão
Arrows: Navegar páginas
+/-: Zoom
F: Fullscreen
Esc: Sair do fullscreen
```

### Screen Readers

```typescript
<button
  aria-label="Next page"
  onClick={handleNextPage}
>
  <ChevronRightIcon />
</button>
```

## Limitações

1. **PDF.js Worker**: Requer configuração do worker path
2. **Bundle Size**: ~500KB (por isso o lazy loading é importante)
3. **Formatos**: Suporta apenas PDF (não suporta DOCX, XLSX)
4. **Mobile**: Performance pode variar em dispositivos móveis
5. **Password-protected**: Não suporta PDFs com senha

## Troubleshooting

### Worker não carregado

```typescript
// Configurar worker path no App.tsx ou main.tsx
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
```

### CORS Issues

```typescript
// Adicionar proxy se necessário
const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
<LazyPDFViewer fileUrl={proxyUrl + originalUrl} />
```

### Performance em PDFs grandes

```typescript
// Limitar páginas renderizadas
<LazyPDFViewer
  fileUrl={url}
  initialPage={1}
  // Renderizar apenas página atual + vizinhas
/>
```

## Testing

### Unit Test

```typescript
import { render, screen } from '@testing-library/react';
import { LazyPDFViewer } from './PDFViewer.lazy';

test('renders PDF viewer with file', () => {
  render(
    <LazyPDFViewer
      fileUrl="test.pdf"
      fileName="Test Document.pdf"
    />
  );
  
  expect(screen.getByText('Test Document.pdf')).toBeInTheDocument();
});
```

### E2E Test

```typescript
// tests/e2e/pdf-viewer.spec.ts
import { test, expect } from '@playwright/test';

test('PDF viewer navigation', async ({ page }) => {
  await page.goto('/report/123');
  
  // Aguardar carregar
  await expect(page.locator('.pdf-viewer-page')).toBeVisible();
  
  // Próxima página
  await page.click('button[aria-label="Next page"]');
  await expect(page.locator('text=Page 2')).toBeVisible();
  
  // Zoom in
  await page.click('button[aria-label="Zoom in"]');
  await expect(page.locator('text=125%')).toBeVisible();
});
```

## Melhores Práticas

1. **Sempre usar LazyPDFViewer** ao invés de import direto
2. **Cleanup de URLs blob** para evitar memory leaks
3. **Implementar error boundaries** para erros de carregamento
4. **Usar skeleton loading** para melhor UX
5. **Validar fileUrl** antes de renderizar
6. **Memoizar quando possível** para evitar re-renders
7. **Configurar worker path** globalmente

## Recursos Adicionais

- [react-pdf Documentation](https://github.com/wojtekmaj/react-pdf)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [Upload API](../api/UPLOAD_API.md)
- [Export API](../api/EXPORT_API.md)
