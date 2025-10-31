# Guia de Configuração de GitHub Repository Secrets

## 📋 Visão Geral

Este guia mostra como adicionar **Repository Secrets** no GitHub para o QIVO Mining Platform. Os secrets são usados para armazenar informações sensíveis que não devem ser expostas no código, como URLs de banco de dados e webhooks de deploy.

---

## 🔐 Secrets Necessários

### Lista de Secrets a Adicionar

| Nome | Valor | Descrição |
|------|-------|-----------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | URL de conexão PostgreSQL do Render |
| `RENDER_DEPLOY_HOOK` | `https://api.render.com/deploy/srv-...` | Webhook para trigger de deploy |
| `FLASK_ENV` | `production` | Ambiente de execução Flask |
| `PORT` | `5050` | Porta do servidor no Render |

---

## 📝 Passo a Passo

### 1. Acesse as Configurações do Repositório

1. Vá para: https://github.com/theneilagencia/ComplianceCore-Mining
2. Clique na aba **Settings** (⚙️)
3. No menu lateral esquerdo, clique em **Secrets and variables**
4. Clique em **Actions**

### 2. Adicione Cada Secret

Para cada secret da lista acima:

#### 2.1. Clique em "New repository secret"

#### 2.2. Preencha os Campos

**Nome**: Digite exatamente como mostrado (ex: `DATABASE_URL`)  
**Value**: Cole o valor correspondente

#### 2.3. Clique em "Add secret"

---

## 🔑 Valores dos Secrets

### 1. DATABASE_URL

**Como obter:**

1. Acesse o Render Dashboard: https://dashboard.render.com
2. Clique no serviço **qivo-mining**
3. Vá em **Environment** no menu lateral
4. Procure pela variável `DATABASE_URL`
5. Clique no ícone de **copiar** (📋)
6. Cole o valor no GitHub Secret

**Formato esperado:**
```
postgresql://user:password@host.region.render.com:5432/database_name
```

**Exemplo:**
```
postgresql://qivo_mining_user:abc123xyz@dpg-xyz123.oregon-postgres.render.com:5432/qivo_mining_db
```

---

### 2. RENDER_DEPLOY_HOOK

**Valor:**
```
https://api.render.com/deploy/srv-d3sk5h1r0fns738ibdg0?key=kXmr1yvPUYc
```

**Como obter (se precisar regenerar):**

1. Acesse o Render Dashboard: https://dashboard.render.com
2. Clique no serviço **qivo-mining**
3. Vá em **Settings** no menu lateral
4. Role até a seção **Deploy Hook**
5. Clique no ícone de **copiar** (📋)
6. Cole o valor no GitHub Secret

**⚠️ IMPORTANTE**: Esta URL é **privada** e permite fazer deploy do seu serviço. Nunca a compartilhe publicamente!

---

### 3. FLASK_ENV

**Valor:**
```
production
```

**Descrição:**
Define o ambiente de execução do Flask (se aplicável no projeto). Em produção, sempre use `production` para:
- Desabilitar debug mode
- Otimizar performance
- Ativar cache
- Desabilitar reloading automático

**Valores possíveis:**
- `production` - Para produção (use este)
- `development` - Para desenvolvimento local
- `testing` - Para testes automatizados

---

### 4. PORT

**Valor:**
```
5050
```

**Descrição:**
Porta em que o servidor Node.js/Express será executado no Render.

**Por que 5050?**
- É a porta padrão configurada no Render para este serviço
- Diferente da porta 3000 usada em desenvolvimento local
- Configurada no arquivo `render.yaml` e nas variáveis de ambiente

---

## 🎯 Verificação

Após adicionar todos os secrets, você deve ver:

```
✓ DATABASE_URL          Updated X minutes ago
✓ RENDER_DEPLOY_HOOK    Updated X minutes ago  
✓ FLASK_ENV             Updated X minutes ago
✓ PORT                  Updated X minutes ago
```

---

## 🔄 Uso nos GitHub Actions

Esses secrets podem ser usados em workflows do GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Render Deploy
        run: |
          curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK }}"
      
      - name: Run Database Migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          PORT: ${{ secrets.PORT }}
          FLASK_ENV: ${{ secrets.FLASK_ENV }}
        run: |
          npm run db:migrate
```

---

## 🛡️ Segurança

### Boas Práticas

1. **NUNCA faça commit de secrets no código**
   - Use sempre GitHub Secrets ou variáveis de ambiente
   - Verifique o `.gitignore` antes de fazer commit

2. **Rotacione secrets regularmente**
   - Especialmente após mudanças de equipe
   - Ou se suspeitar de vazamento

3. **Use secrets diferentes por ambiente**
   - Desenvolvimento: valores de teste
   - Produção: valores reais

4. **Limite acesso aos secrets**
   - Apenas administradores do repositório podem ver/editar
   - Colaboradores não têm acesso aos valores

5. **Monitore uso**
   - Revise logs de Actions regularmente
   - Configure alertas de segurança

### O Que Fazer em Caso de Vazamento

Se um secret for exposto acidentalmente:

1. **DATABASE_URL**
   - Regenere as credenciais no Render
   - Atualize o secret no GitHub
   - Reinicie o serviço

2. **RENDER_DEPLOY_HOOK**
   - Regenere o webhook no Render (Settings > Deploy Hook > Regenerate)
   - Atualize o secret no GitHub

3. **Outros secrets**
   - Rotacione imediatamente
   - Verifique logs de acesso
   - Notifique a equipe

---

## 🔧 Troubleshooting

### Erro: "Secret not found"

**Solução:**
- Verifique se o nome do secret está correto (case-sensitive)
- Confirme que o secret foi adicionado no repositório correto
- Aguarde alguns segundos após adicionar (pode haver delay)

### Erro: "Invalid DATABASE_URL format"

**Solução:**
- Verifique o formato: `postgresql://user:pass@host:port/db`
- Confirme que não há espaços extras
- Teste a conexão localmente primeiro

### Erro: "Deploy hook failed"

**Solução:**
- Verifique se a URL do webhook está completa
- Confirme que inclui o parâmetro `?key=...`
- Teste com curl:
  ```bash
  curl -X POST "https://api.render.com/deploy/srv-...?key=..."
  ```

### Secret não está sendo usado no workflow

**Solução:**
- Verifique a sintaxe: `${{ secrets.SECRET_NAME }}`
- Confirme que o workflow tem permissões corretas
- Verifique se o secret está no repositório correto (não em fork)

---

## 📚 Recursos Adicionais

### Documentação Oficial

- **GitHub Secrets**: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **Render Environment Variables**: https://render.com/docs/environment-variables
- **Render Deploy Hooks**: https://render.com/docs/deploy-hooks

### Comandos Úteis

```bash
# Listar secrets (apenas nomes, não valores)
gh secret list

# Remover um secret
gh secret remove SECRET_NAME

# Adicionar secret via CLI (requer permissões)
echo "valor" | gh secret set SECRET_NAME
```

### Links Rápidos

- **GitHub Secrets**: https://github.com/theneilagencia/ComplianceCore-Mining/settings/secrets/actions
- **Render Dashboard**: https://dashboard.render.com/web/srv-d3sk5h1r0fns738ibdg0
- **Render Environment**: https://dashboard.render.com/web/srv-d3sk5h1r0fns738ibdg0/env

---

## ✅ Checklist de Configuração

Use este checklist para garantir que tudo está configurado:

- [ ] Acesso às configurações do repositório no GitHub
- [ ] Secret `DATABASE_URL` adicionado com valor do Render
- [ ] Secret `RENDER_DEPLOY_HOOK` adicionado com webhook URL
- [ ] Secret `FLASK_ENV` adicionado com valor `production`
- [ ] Secret `PORT` adicionado com valor `5050`
- [ ] Todos os secrets verificados na página de Secrets
- [ ] Workflow de deploy testado (se aplicável)
- [ ] Documentação revisada e atualizada

---

## 🆘 Precisa de Ajuda?

Se você encontrar problemas ao configurar os secrets:

1. **Verifique as permissões**: Você precisa ser administrador do repositório
2. **Consulte a documentação**: [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
3. **Abra uma issue**: https://github.com/theneilagencia/ComplianceCore-Mining/issues
4. **Contate o suporte do Render**: https://render.com/docs/support

---

**Última atualização**: 31 de outubro de 2025  
**Versão**: 1.0.0  
**Autor**: QIVO Mining Team

