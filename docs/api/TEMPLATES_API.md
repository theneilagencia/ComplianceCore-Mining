# Templates API Documentation

## Visão Geral

A Templates API permite criar, gerenciar e aplicar templates customizados para exportação de relatórios técnicos com estrutura, formatação e branding personalizados.

## Arquitetura

```
Cliente → tRPC → Templates Router → Template Engine → Storage → Cache
```

## Endpoints

### `templates.create`

Cria um novo template customizado.

**Tipo:** Mutation  
**Autenticação:** Requerida

#### Input

```typescript
{
  name: string;                        // Nome do template
  description?: string;                // Descrição
  category: 'pdf' | 'docx' | 'xlsx';  // Formato do template
  standard: 'JORC' | 'NI43-101' | 'PERC' | 'SAMREC' | 'NAEN';
  config: {
    // Configurações de estilo
    styles?: {
      primaryColor?: string;           // Ex: "#2F2C79"
      secondaryColor?: string;
      fontFamily?: string;             // Ex: "Arial"
      fontSize?: number;               // Em pontos
      lineHeight?: number;
      margins?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
      };
    };
    
    // Configurações de cabeçalho/rodapé
    header?: {
      enabled: boolean;
      content: string;
      height: number;
      alignment: 'left' | 'center' | 'right';
    };
    
    footer?: {
      enabled: boolean;
      content: string;
      height: number;
      showPageNumber: boolean;
    };
    
    // Configurações de seções
    sections?: Array<{
      id: string;
      title: string;
      enabled: boolean;
      order: number;
      customContent?: string;
    }>;
    
    // Logo e branding
    branding?: {
      logoUrl?: string;
      companyName?: string;
      showWatermark?: boolean;
      watermarkText?: string;
    };
  };
  isPublic?: boolean;                  // Padrão: false
  tags?: string[];                     // Tags para busca
}
```

#### Output

```typescript
{
  templateId: string;
  name: string;
  createdAt: Date;
  version: number;                     // Versão inicial: 1
}
```

#### Exemplo de Uso

```typescript
import { trpc } from '@/lib/trpc';

const createTemplate = trpc.technicalReports.templates.create.useMutation({
  onSuccess: (data) => {
    console.log('Template created:', data.templateId);
  },
});

const handleCreate = () => {
  createTemplate.mutate({
    name: 'Modelo JORC - Vale',
    description: 'Template corporativo para relatórios JORC',
    category: 'pdf',
    standard: 'JORC',
    config: {
      styles: {
        primaryColor: '#00A859',       // Verde Vale
        fontFamily: 'Arial',
        fontSize: 11,
        margins: { top: 72, right: 72, bottom: 72, left: 72 },
      },
      header: {
        enabled: true,
        content: 'Vale S.A. - Relatório Técnico',
        height: 50,
        alignment: 'center',
      },
      footer: {
        enabled: true,
        content: 'Confidencial',
        height: 40,
        showPageNumber: true,
      },
      branding: {
        logoUrl: 'https://cdn.vale.com/logo.png',
        companyName: 'Vale S.A.',
        showWatermark: true,
        watermarkText: 'CONFIDENCIAL',
      },
    },
    tags: ['vale', 'jorc', 'corporativo'],
  });
};
```

---

### `templates.update`

Atualiza um template existente (cria nova versão).

**Tipo:** Mutation  
**Autenticação:** Requerida

#### Input

```typescript
{
  templateId: string;
  name?: string;
  description?: string;
  config?: {...};                      // Mesma estrutura do create
  tags?: string[];
  versionNote?: string;                // Nota sobre mudanças
}
```

#### Output

```typescript
{
  templateId: string;
  version: number;                     // Versão incrementada
  updatedAt: Date;
}
```

---

### `templates.get`

Obtém detalhes de um template específico.

**Tipo:** Query  
**Autenticação:** Requerida

#### Input

```typescript
{
  templateId: string;
  version?: number;                    // Opcional, usa última se omitido
}
```

#### Output

```typescript
{
  templateId: string;
  name: string;
  description?: string;
  category: 'pdf' | 'docx' | 'xlsx';
  standard: string;
  config: {...};                       // Configuração completa
  version: number;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;                  // Quantas vezes foi usado
  tags: string[];
}
```

---

### `templates.list`

Lista templates disponíveis.

**Tipo:** Query  
**Autenticação:** Requerida

#### Input

```typescript
{
  limit?: number;                      // Padrão: 20
  offset?: number;                     // Padrão: 0
  category?: 'pdf' | 'docx' | 'xlsx';
  standard?: 'JORC' | 'NI43-101' | 'PERC' | 'SAMREC' | 'NAEN';
  isPublic?: boolean;                  // null = todos
  tags?: string[];                     // Filtrar por tags
  search?: string;                     // Busca por nome/descrição
  orderBy?: 'createdAt' | 'usageCount' | 'name';
  orderDir?: 'asc' | 'desc';
}
```

#### Output

```typescript
{
  templates: Array<{
    templateId: string;
    name: string;
    description?: string;
    category: string;
    standard: string;
    isPublic: boolean;
    createdBy: string;
    createdAt: Date;
    usageCount: number;
    tags: string[];
    preview?: string;                  // URL da imagem de preview
  }>;
  total: number;
  hasMore: boolean;
}
```

---

### `templates.delete`

Remove um template (soft delete).

**Tipo:** Mutation  
**Autenticação:** Requerida (apenas criador ou admin)

#### Input

```typescript
{
  templateId: string;
}
```

#### Output

```typescript
{
  templateId: string;
  deleted: boolean;
  message: string;
}
```

---

### `templates.duplicate`

Duplica um template existente.

**Tipo:** Mutation  
**Autenticação:** Requerida

#### Input

```typescript
{
  templateId: string;
  newName: string;
  version?: number;                    // Opcional
}
```

#### Output

```typescript
{
  templateId: string;                  // ID do novo template
  name: string;
  createdAt: Date;
}
```

---

### `templates.preview`

Gera preview de um template aplicado a dados de exemplo.

**Tipo:** Mutation  
**Autenticação:** Requerida

#### Input

```typescript
{
  templateId: string;
  version?: number;
  sampleData?: {                       // Dados de exemplo
    reportTitle?: string;
    projectName?: string;
    date?: Date;
  };
}
```

#### Output

```typescript
{
  previewUrl: string;                  // URL da imagem de preview
  expiresAt: Date;
}
```

---

### `templates.getVersions`

Lista todas as versões de um template.

**Tipo:** Query  
**Autenticação:** Requerida

#### Input

```typescript
{
  templateId: string;
}
```

#### Output

```typescript
{
  versions: Array<{
    version: number;
    createdAt: Date;
    createdBy: string;
    note?: string;
    changes?: string[];                // Lista de mudanças
  }>;
}
```

---

### `templates.restore`

Restaura uma versão anterior de um template.

**Tipo:** Mutation  
**Autenticação:** Requerida

#### Input

```typescript
{
  templateId: string;
  version: number;                     // Versão a restaurar
}
```

#### Output

```typescript
{
  templateId: string;
  version: number;                     // Nova versão criada
  restoredFrom: number;
}
```

---

## Configuração de Template

### Estilos

```typescript
styles: {
  primaryColor: '#2F2C79',             // Cor principal
  secondaryColor: '#FF6B6B',           // Cor secundária
  fontFamily: 'Arial',                 // Fonte principal
  fontSize: 11,                        // Tamanho base
  lineHeight: 1.5,                     // Espaçamento de linha
  margins: {
    top: 72,                           // 1 polegada (72pt)
    right: 72,
    bottom: 72,
    left: 72,
  },
}
```

### Cabeçalho e Rodapé

```typescript
header: {
  enabled: true,
  content: 'Minha Empresa - Relatório Técnico',
  height: 50,                          // Em pontos
  alignment: 'center',                 // 'left' | 'center' | 'right'
}

footer: {
  enabled: true,
  content: 'Confidencial - Uso Interno',
  height: 40,
  showPageNumber: true,                // Adiciona "Página X de Y"
}
```

### Seções

```typescript
sections: [
  {
    id: 'sumario_executivo',
    title: 'Executive Summary',
    enabled: true,
    order: 1,
    customContent: 'Este relatório apresenta...',
  },
  {
    id: 'geologia',
    title: 'Regional Geology',
    enabled: true,
    order: 2,
  },
  // ... mais seções
]
```

### Branding

```typescript
branding: {
  logoUrl: 'https://example.com/logo.png',
  companyName: 'Minha Empresa Mineração',
  showWatermark: true,
  watermarkText: 'CONFIDENCIAL',       // Diagonal no fundo
}
```

---

## Exemplos Completos

### Criar Template com Preview

```typescript
function CreateTemplateWithPreview() {
  const [templateId, setTemplateId] = useState<string>();

  const createMutation = trpc.technicalReports.templates.create.useMutation({
    onSuccess: (data) => setTemplateId(data.templateId),
  });

  const previewMutation = trpc.technicalReports.templates.preview.useMutation();

  const handleCreate = async () => {
    const result = await createMutation.mutateAsync({
      name: 'Template JORC Premium',
      category: 'pdf',
      standard: 'JORC',
      config: {
        styles: {
          primaryColor: '#1E40AF',
          fontFamily: 'Helvetica',
          fontSize: 12,
          margins: { top: 90, right: 72, bottom: 72, left: 72 },
        },
        header: {
          enabled: true,
          content: 'Technical Report - JORC 2012',
          height: 60,
          alignment: 'center',
        },
        branding: {
          companyName: 'GoldMine Corp',
          showWatermark: true,
          watermarkText: 'DRAFT',
        },
      },
    });

    // Gerar preview
    const preview = await previewMutation.mutateAsync({
      templateId: result.templateId,
      sampleData: {
        reportTitle: 'Gold Project Resource Estimation',
        projectName: 'Aurora Gold Mine',
        date: new Date(),
      },
    });

    window.open(preview.previewUrl, '_blank');
  };

  return <button onClick={handleCreate}>Criar e Visualizar</button>;
}
```

### Template Editor Completo

```typescript
function TemplateEditor({ templateId }: { templateId?: string }) {
  const [config, setConfig] = useState<any>({});

  const { data: template } = trpc.technicalReports.templates.get.useQuery(
    { templateId: templateId! },
    { enabled: !!templateId }
  );

  const createMutation = trpc.technicalReports.templates.create.useMutation();
  const updateMutation = trpc.technicalReports.templates.update.useMutation();

  useEffect(() => {
    if (template) {
      setConfig(template.config);
    }
  }, [template]);

  const handleSave = async () => {
    if (templateId) {
      await updateMutation.mutateAsync({
        templateId,
        config,
        versionNote: 'Updated via editor',
      });
    } else {
      await createMutation.mutateAsync({
        name: 'New Template',
        category: 'pdf',
        standard: 'JORC',
        config,
      });
    }
  };

  return (
    <div>
      <h2>{templateId ? 'Edit Template' : 'New Template'}</h2>
      
      {/* Color Picker */}
      <div>
        <label>Primary Color</label>
        <input
          type="color"
          value={config.styles?.primaryColor || '#000000'}
          onChange={(e) =>
            setConfig({
              ...config,
              styles: { ...config.styles, primaryColor: e.target.value },
            })
          }
        />
      </div>

      {/* Font Family */}
      <div>
        <label>Font Family</label>
        <select
          value={config.styles?.fontFamily || 'Arial'}
          onChange={(e) =>
            setConfig({
              ...config,
              styles: { ...config.styles, fontFamily: e.target.value },
            })
          }
        >
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
        </select>
      </div>

      {/* Header/Footer Toggle */}
      <div>
        <label>
          <input
            type="checkbox"
            checked={config.header?.enabled || false}
            onChange={(e) =>
              setConfig({
                ...config,
                header: { ...config.header, enabled: e.target.checked },
              })
            }
          />
          Enable Header
        </label>
      </div>

      <button onClick={handleSave}>Save Template</button>
    </div>
  );
}
```

### Aplicar Template em Export

```typescript
function ExportWithTemplate({ reportId }: { reportId: string }) {
  const { data: templates } = trpc.technicalReports.templates.list.useQuery({
    category: 'pdf',
    standard: 'JORC',
  });

  const [selectedTemplate, setSelectedTemplate] = useState<string>();

  const exportMutation = trpc.technicalReports.export.pdf.useMutation();

  const handleExport = async () => {
    const result = await exportMutation.mutateAsync({
      reportId,
      standard: 'JORC',
      templateId: selectedTemplate,  // Usar template customizado
    });

    window.location.href = result.fileUrl;
  };

  return (
    <div>
      <select onChange={(e) => setSelectedTemplate(e.target.value)}>
        <option value="">Default Template</option>
        {templates?.templates.map((t) => (
          <option key={t.templateId} value={t.templateId}>
            {t.name}
          </option>
        ))}
      </select>

      <button onClick={handleExport}>Export with Template</button>
    </div>
  );
}
```

---

## Versionamento

Cada atualização de template cria uma nova versão:

```typescript
// Versão 1 (criação)
{
  version: 1,
  createdAt: '2024-01-01T10:00:00Z',
  createdBy: 'user-123',
}

// Versão 2 (atualização)
{
  version: 2,
  createdAt: '2024-01-15T14:30:00Z',
  createdBy: 'user-123',
  note: 'Changed primary color to blue',
  changes: ['styles.primaryColor: #FF0000 → #0000FF'],
}

// Usar versão específica
const { data } = trpc.technicalReports.templates.get.useQuery({
  templateId: 'tpl-123',
  version: 1,  // Usar versão 1
});
```

---

## Templates Públicos

Templates podem ser marcados como públicos para compartilhamento:

```typescript
// Criar template público
await createMutation.mutateAsync({
  name: 'JORC Standard Template',
  category: 'pdf',
  standard: 'JORC',
  isPublic: true,  // Disponível para todos os usuários
  config: {...},
});

// Listar apenas templates públicos
const { data } = trpc.technicalReports.templates.list.useQuery({
  isPublic: true,
  orderBy: 'usageCount',
  orderDir: 'desc',
});
```

---

## Validações e Limites

### Limites

- **Máximo de templates por usuário**: 50
- **Tamanho máximo da config**: 100 KB
- **Máximo de versões mantidas**: 20
- **URL de logo**: Máximo 500 caracteres
- **Tags**: Máximo 10 por template

### Validações

- **Name**: 3-100 caracteres
- **Description**: Máximo 500 caracteres
- **Colors**: Formato hexadecimal (#RRGGBB)
- **Font size**: 8-24 pontos
- **Margins**: 0-144 pontos (0-2 polegadas)

---

## Melhores Práticas

1. **Sempre versionar mudanças** com notas descritivas
2. **Usar preview** antes de aplicar em relatórios reais
3. **Duplicar templates** ao invés de modificar existentes
4. **Tags consistentes** para facilitar busca
5. **Templates públicos** apenas para padrões aprovados
6. **Backup de configs** importantes
7. **Testar em múltiplos formatos** (PDF, DOCX, XLSX)

---

## Recursos Adicionais

- [Export API](./EXPORT_API.md)
- [Upload API](./UPLOAD_API.md)
- [Template Engine](../../server/modules/technical-reports/services/template-engine.ts)
- [Design System](../../docs/DESIGN_SYSTEM_VALIDATION.md)
