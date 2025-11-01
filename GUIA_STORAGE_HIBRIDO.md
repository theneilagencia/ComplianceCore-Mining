# 🗄️ Guia de Configuração: Storage Híbrido

## 📋 Visão Geral

O QIVO Mining agora usa um **sistema de storage híbrido** que combina:

1. **Render Persistent Disk** (Principal) - Armazenamento local rápido
2. **BUILT_IN_FORGE** (Backup/CDN) - URLs públicas e fallback

---

## 🎯 Estratégia de Storage

### Modo Híbrido (Recomendado)
```
Upload → Render Disk (local) + FORGE (URL pública)
Download → Render Disk (rápido) ou FORGE (fallback)
```

**Vantagens:**
- ✅ Performance máxima (leitura local)
- ✅ URLs públicas para compartilhamento
- ✅ Redundância automática
- ✅ Fallback se Render Disk falhar

---

## 🔧 Passo 1: Configurar Render Persistent Disk

### 1.1 Acessar Render Dashboard

1. Vá para: https://dashboard.render.com
2. Selecione seu Web Service: **qivo-mining**
3. Role até a seção **Disks**

### 1.2 Adicionar Persistent Disk

Clique em **Add Disk** e configure:

```
Mount Path: /var/data/uploads
Size: 10 GB (recomendado para começar)
```

**Importante:**
- O Mount Path DEVE ser `/var/data/uploads`
- Tamanho mínimo: 1 GB
- Você pode aumentar depois (mas não diminuir)

### 1.3 Salvar e Aguardar Deploy

O Render irá:
1. Criar o disco
2. Fazer redeploy automático
3. Montar o disco no caminho especificado

**Tempo estimado:** 2-5 minutos

---

## 🔧 Passo 2: Configurar Variáveis de Ambiente

### 2.1 Acessar Environment Variables

No Render Dashboard:
1. Vá para **Environment** tab
2. Clique em **Add Environment Variable**

### 2.2 Adicionar Variáveis do Render Disk

```bash
# Habilitar Render Disk
USE_RENDER_DISK=true

# Caminho do disco (DEVE ser igual ao Mount Path)
RENDER_DISK_PATH=/var/data/uploads
```

### 2.3 Adicionar Variáveis do BUILT_IN_FORGE

```bash
# URL da API Forge (fornecida pela Manus)
BUILT_IN_FORGE_API_URL=https://your-forge-api-url.com

# Chave de API (fornecida pela Manus)
BUILT_IN_FORGE_API_KEY=your-forge-api-key
```

**⚠️ IMPORTANTE:** Se você não tem as credenciais do BUILT_IN_FORGE, o sistema funcionará apenas com Render Disk (sem URLs públicas).

### 2.4 Salvar e Redeploy

Clique em **Save Changes** - o Render fará redeploy automático.

---

## 🧪 Passo 3: Testar Upload

### 3.1 Aguardar Deploy

Aguarde o deploy terminar (status: **Live**)

### 3.2 Testar Upload

1. Acesse: https://qivo-mining.onrender.com/reports/generate
2. Faça upload de um arquivo PDF
3. Verifique os logs

### 3.3 Verificar Logs

No Render Dashboard → **Logs**, você deve ver:

```
🗄️  Storage Configuration:
  Render Disk: ✅ Available
  FORGE: ✅ Available (ou ❌ Not configured)
  Mode: 🔄 HYBRID (Render Disk + FORGE)
```

Se aparecer:
```
📦 Using HYBRID storage (Render Disk + FORGE)
✅ Saved to Render Disk: /var/data/uploads/...
✅ Uploaded to FORGE: https://...
```

**🎉 Sucesso!** O storage híbrido está funcionando!

---

## 🔍 Modos de Operação

### Modo 1: Híbrido (Render Disk + FORGE)

**Quando:** Ambos configurados

```bash
USE_RENDER_DISK=true
RENDER_DISK_PATH=/var/data/uploads
BUILT_IN_FORGE_API_URL=https://...
BUILT_IN_FORGE_API_KEY=...
```

**Comportamento:**
- Upload salva em ambos
- Download usa Render Disk (mais rápido)
- URLs públicas via FORGE

---

### Modo 2: Apenas Render Disk

**Quando:** Apenas Render Disk configurado

```bash
USE_RENDER_DISK=true
RENDER_DISK_PATH=/var/data/uploads
# BUILT_IN_FORGE não configurado
```

**Comportamento:**
- Upload salva apenas localmente
- Download via endpoint `/api/storage/download/:key`
- **Sem URLs públicas** (arquivos acessíveis apenas via API)

---

### Modo 3: Apenas FORGE

**Quando:** Apenas FORGE configurado

```bash
USE_RENDER_DISK=false
BUILT_IN_FORGE_API_URL=https://...
BUILT_IN_FORGE_API_KEY=...
```

**Comportamento:**
- Upload vai direto para FORGE
- URLs públicas disponíveis
- Sem armazenamento local

---

## 💰 Custos

### Render Persistent Disk

| Tamanho | Custo/mês |
|---------|-----------|
| 1 GB    | ~$1       |
| 5 GB    | ~$5       |
| 10 GB   | ~$10      |
| 50 GB   | ~$50      |
| 100 GB  | ~$100     |

**Fonte:** https://render.com/pricing

### BUILT_IN_FORGE

- Depende do plano Manus
- Consulte: https://manus.im/pricing

---

## 🐛 Troubleshooting

### Erro: "No storage backend available"

**Causa:** Nenhum storage configurado

**Solução:**
1. Configure Render Disk OU BUILT_IN_FORGE
2. Verifique variáveis de ambiente
3. Faça redeploy

---

### Erro: "Render Disk not available"

**Causa:** Disco não montado ou caminho errado

**Solução:**
1. Verifique se o disco foi criado no Render Dashboard
2. Confirme que `RENDER_DISK_PATH` = Mount Path
3. Aguarde deploy completo
4. Verifique logs: `ls -la /var/data/uploads`

---

### Erro: "BUILT_IN_FORGE not configured"

**Causa:** Credenciais FORGE faltando

**Solução:**
1. Adicione `BUILT_IN_FORGE_API_URL`
2. Adicione `BUILT_IN_FORGE_API_KEY`
3. Faça redeploy

**OU** use apenas Render Disk (modo 2)

---

### Upload funciona mas não gera URL pública

**Causa:** Modo "Apenas Render Disk" (sem FORGE)

**Solução:**
- Configure BUILT_IN_FORGE para URLs públicas
- OU use endpoint `/api/storage/download/:key` para acessar arquivos

---

## 📊 Monitoramento

### Verificar Status do Storage

```bash
# Via logs do Render
# Procure por: "🗄️  Storage Configuration:"
```

### Verificar Uso do Disco

No Render Dashboard:
1. Vá para **Disks** tab
2. Veja uso atual e capacidade

### Aumentar Tamanho do Disco

1. Render Dashboard → **Disks**
2. Clique no disco
3. Aumente o tamanho
4. Aguarde redeploy

**⚠️ Não é possível diminuir o tamanho!**

---

## 🚀 Próximos Passos

### Opção A: Configuração Mínima (Gratuita)

1. ✅ Configure apenas BUILT_IN_FORGE
2. ✅ Sem custos de disco
3. ❌ Sem cache local

### Opção B: Configuração Recomendada (Paga)

1. ✅ Configure Render Disk (10 GB)
2. ✅ Configure BUILT_IN_FORGE
3. ✅ Performance máxima
4. ✅ Redundância

### Opção C: Configuração Econômica

1. ✅ Configure Render Disk (1 GB)
2. ❌ Sem BUILT_IN_FORGE
3. ✅ Baixo custo ($1/mês)
4. ❌ Sem URLs públicas

---

## 📞 Suporte

### Problemas com Render Disk
- Documentação: https://render.com/docs/disks
- Suporte: https://render.com/support

### Problemas com BUILT_IN_FORGE
- Documentação: https://manus.im/docs
- Suporte: https://help.manus.im

### Problemas com o Código
- GitHub Issues: [seu-repo]/issues
- Email: [seu-email]

---

## ✅ Checklist de Configuração

- [ ] Render Persistent Disk criado
- [ ] Mount Path: `/var/data/uploads`
- [ ] Variável `USE_RENDER_DISK=true`
- [ ] Variável `RENDER_DISK_PATH=/var/data/uploads`
- [ ] Variável `BUILT_IN_FORGE_API_URL` (opcional)
- [ ] Variável `BUILT_IN_FORGE_API_KEY` (opcional)
- [ ] Deploy concluído com sucesso
- [ ] Logs mostram storage disponível
- [ ] Upload testado e funcionando

---

**🎉 Pronto! Seu storage híbrido está configurado!**

