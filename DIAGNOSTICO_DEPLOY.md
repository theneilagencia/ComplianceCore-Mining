# Diagnóstico do Problema de Deploy no Render

## Status Atual
- ❌ Deploy d392b88 FALHOU (status 127)
- ❌ Deploy d7177a2 FALHOU (status 127)  
- ❌ Deploy 84141dd FALHOU (status 127)
- ✅ Build local funciona perfeitamente

## Problema Identificado

O deploy está falhando no Render com **status 127** (comando não encontrado), mas o build funciona localmente.

### Causa Raiz Provável

O script `build.sh` está fazendo:
```bash
rm -rf node_modules/
pnpm install --frozen-lockfile
```

Isso pode estar causando problemas no Render porque:

1. **Timeout**: O Render pode ter timeout mais curto que o build local
2. **Memória**: Instância Standard (2GB) pode não ser suficiente
3. **pnpm-lock.yaml**: Pode estar desatualizado ou inconsistente

### Variáveis de Ambiente Críticas

**Obrigatórias para funcionamento:**
- `DATABASE_URL` - Conexão com PostgreSQL
- `JWT_SECRET` - Autenticação
- `AWS_ACCESS_KEY_ID` - Upload S3
- `AWS_SECRET_ACCESS_KEY` - Upload S3
- `S3_BUCKET` - Bucket S3
- `S3_REGION` - Região S3

**Opcionais mas recomendadas:**
- `OPENAI_API_KEY` - Análise AI de relatórios
- `GOOGLE_CLIENT_ID` - Login Google
- `GOOGLE_CLIENT_SECRET` - Login Google
- `GOOGLE_CALLBACK_URL` - Callback OAuth
- `STRIPE_SECRET_KEY` - Pagamentos
- `STRIPE_WEBHOOK_SECRET` - Webhooks Stripe

## Soluções Propostas

### Solução 1: Simplificar build.sh (RECOMENDADA)
Remover `rm -rf node_modules/` do build.sh e deixar o Render gerenciar as dependências.

### Solução 2: Aumentar recursos
Upgrade para instância com mais memória (4GB+)

### Solução 3: Otimizar pnpm-lock.yaml
Regenerar lockfile com `pnpm install` e commitar

### Solução 4: Usar cache do Render
Configurar cache de node_modules no Render

## Próximos Passos

1. ✅ Simplificar build.sh removendo limpeza agressiva
2. ⏳ Testar build localmente
3. ⏳ Fazer commit e push
4. ⏳ Verificar deploy no Render
5. ⏳ Testar upload em produção

