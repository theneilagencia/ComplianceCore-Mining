# ✅ Checklist de Validação: Upload V2

**Data:** 01 de Novembro de 2025  
**Objetivo:** Validar que o novo sistema de upload atômico funciona corretamente

---

## 📋 Pré-Implementação

- [ ] Backup do código atual criado
- [ ] Documentação lida e compreendida
- [ ] Ambiente de desenvolvimento funcionando (`pnpm dev`)
- [ ] Acesso ao banco de dados PostgreSQL configurado
- [ ] Acesso ao painel do Render configurado

---

## 🛠️ Implementação

### Backend

- [ ] Arquivo `uploadsV2.ts` criado em `server/modules/technical-reports/routers/`
- [ ] Import de `uploadsV2Router` adicionado ao router principal
- [ ] Rota `uploadsV2` registrada no router principal
- [ ] Código compila sem erros TypeScript

### Frontend

- [ ] Arquivo `UploadModalV2.tsx` criado em `client/src/modules/technical-reports/components/`
- [ ] Import do novo componente atualizado onde necessário
- [ ] Código compila sem erros TypeScript
- [ ] Interface renderiza corretamente

---

## 🧪 Testes Funcionais

### Teste 1: Upload Básico

- [ ] Arquivo PDF selecionado via interface
- [ ] Botão "Iniciar Upload" clicado
- [ ] Toast de "Enviando e processando arquivo..." exibido
- [ ] Upload concluído sem erros
- [ ] Toast de "Processamento iniciado!" exibido
- [ ] Modal fechado automaticamente após 2 segundos

### Teste 2: Validação no Banco de Dados

Conecte-se ao banco e execute:

```sql
-- Verificar último upload
SELECT * FROM uploads ORDER BY "createdAt" DESC LIMIT 1;
```

**Validações:**
- [ ] Registro existe na tabela `uploads`
- [ ] Campo `id` preenchido (formato: `upl_...`)
- [ ] Campo `reportId` preenchido (formato: `rpt_...`)
- [ ] Campo `status` = `'completed'`
- [ ] Campo `s3Url` preenchido com URL válida
- [ ] Campo `completedAt` preenchido com timestamp

```sql
-- Verificar report correspondente
SELECT * FROM reports ORDER BY "createdAt" DESC LIMIT 1;
```

**Validações:**
- [ ] Registro existe na tabela `reports`
- [ ] Campo `id` corresponde ao `reportId` do upload
- [ ] Campo `status` = `'parsing'` (ou `'needs_review'`/`'ready_for_audit'`)
- [ ] Campo `s3OriginalUrl` preenchido com URL válida
- [ ] Campo `title` = nome do arquivo

### Teste 3: Validação no Storage

**Render Disk:**
```bash
# Conectar ao shell do serviço no Render
# Verificar se arquivo existe
ls -lh /var/data/uploads/tenants/*/uploads/upl_*/
```

- [ ] Arquivo existe no diretório correto
- [ ] Tamanho do arquivo corresponde ao original

**Cloudinary:**
- [ ] Acessar painel web do Cloudinary
- [ ] Verificar se arquivo foi salvo (se Render Disk falhar)
- [ ] URL pública acessível

### Teste 4: Parsing Assíncrono

Aguarde 30-60 segundos após o upload e execute:

```sql
SELECT id, status, "detectedStandard", "s3NormalizedUrl" 
FROM reports 
WHERE id = 'rpt_...' -- ID do report criado
```

**Validações:**
- [ ] Campo `status` mudou de `'parsing'` para `'needs_review'` ou `'ready_for_audit'`
- [ ] Campo `detectedStandard` preenchido (ex: `'JORC_2012'`)
- [ ] Campo `s3NormalizedUrl` preenchido com URL do JSON normalizado
- [ ] Campo `parsingSummary` contém objeto JSON com resumo

### Teste 5: Tratamento de Erros

**5.1. Arquivo Inválido:**
- [ ] Tentar upload de arquivo não-PDF (ex: `.txt`)
- [ ] Sistema aceita ou rejeita conforme esperado

**5.2. Arquivo Grande:**
- [ ] Tentar upload de arquivo > 50 MB
- [ ] Sistema exibe erro apropriado

**5.3. Sem Autenticação:**
- [ ] Fazer logout
- [ ] Tentar acessar modal de upload
- [ ] Sistema redireciona para login ou exibe erro

---

## 🚀 Deploy e Produção

### Deploy no Render

- [ ] Código commitado no Git
- [ ] Push para branch `main`
- [ ] Deploy automático iniciado no Render
- [ ] Build concluído sem erros
- [ ] Serviço online (HTTP 200)

### Teste em Produção

- [ ] Acessar URL de produção: https://compliancecore-mining-1.onrender.com
- [ ] Fazer login
- [ ] Repetir Teste 1 (Upload Básico)
- [ ] Repetir Teste 2 (Validação no Banco)
- [ ] Repetir Teste 3 (Validação no Storage)
- [ ] Repetir Teste 4 (Parsing Assíncrono)

---

## 📊 Logs e Monitoramento

### Logs do Backend

```bash
# Logs locais (desenvolvimento)
pnpm dev
# Observar saída do console

# Logs do Render (produção)
# Acessar Render Dashboard → Logs
```

**Validações:**
- [ ] Log `[Upload V2] Starting unified upload` aparece
- [ ] Log `[Upload V2] Uploading to storage...` aparece
- [ ] Log `[Upload V2] Creating database records...` aparece
- [ ] Log `[Upload V2] Database records created successfully` aparece
- [ ] Log `[Upload V2] Returning success response` aparece
- [ ] Log `[Upload V2] Starting async parsing...` aparece (após alguns segundos)
- [ ] Log `[Upload V2] Parsing completed successfully` aparece (após parsing)
- [ ] Nenhum erro ou stack trace aparece

### Logs do Frontend

```javascript
// Abrir DevTools → Console
// Observar requisições de rede (Network tab)
```

**Validações:**
- [ ] Requisição `POST /api/trpc/technicalReports.uploadsV2.uploadAndProcessReport` enviada
- [ ] Status HTTP = 200
- [ ] Resposta contém `uploadId`, `reportId`, `s3Url`
- [ ] Nenhum erro no console

---

## 🗑️ Limpeza (Após Validação Completa)

- [ ] Remover endpoints antigos (`initiate`, `uploadFile`, `complete`) de `uploads.ts`
- [ ] Remover `UploadModal.tsx` antigo
- [ ] Renomear `UploadModalV2.tsx` para `UploadModal.tsx`
- [ ] Atualizar imports em todos os arquivos que usam o componente
- [ ] Remover comentários de debug excessivos
- [ ] Atualizar documentação do projeto

---

## 📝 Notas e Observações

**Data do Teste:** _______________  
**Testado por:** _______________  
**Ambiente:** [ ] Desenvolvimento [ ] Produção

**Problemas Encontrados:**

```
(Descreva aqui quaisquer problemas ou comportamentos inesperados)
```

**Soluções Aplicadas:**

```
(Descreva as soluções ou workarounds aplicados)
```

---

## ✅ Aprovação Final

- [ ] Todos os testes passaram
- [ ] Sistema está estável em produção
- [ ] Documentação atualizada
- [ ] Código antigo removido
- [ ] Equipe treinada no novo fluxo

**Aprovado por:** _______________  
**Data:** _______________

---

**Preparado por:** Manus AI  
**Versão:** 1.0

