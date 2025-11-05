# 🔑 Guia: Como Obter Credenciais do Google Cloud Platform

**Objetivo:** Encontrar as credenciais necessárias para verificar o status do deploy do QIVO Mining no GCP

---

## 📋 O QUE PRECISAMOS

1. **Project ID** - Identificador único do projeto
2. **Service Account Key** - Arquivo JSON com credenciais de acesso

---

## 🚀 PASSO A PASSO

### ETAPA 1: Acessar o Console GCP

1. Abra seu navegador
2. Acesse: **https://console.cloud.google.com**
3. Faça login com a conta: **vinicius.debian@theneil.com.br**
4. Senha: **Bigtrade@4484** (conforme arquivo de credenciais)

---

### ETAPA 2: Identificar o Project ID

Após fazer login, você verá o console do GCP:

#### 2.1. Localizar o Seletor de Projeto
- No **topo da página**, à esquerda, você verá um dropdown com o nome do projeto atual
- Clique nesse dropdown

#### 2.2. Encontrar o Projeto QIVO
Procure por um projeto com nome similar a:
- `qivo-mining`
- `compliancecore-mining`
- `qivo-mining-prod`
- Ou qualquer nome relacionado ao QIVO

#### 2.3. Copiar o Project ID
- Ao lado do nome do projeto, você verá o **Project ID**
- Exemplo: `qivo-mining-123456` ou `compliancecore-mining-prod`
- **COPIE ESSE ID** - vamos precisar dele!

**📝 Anote aqui:**
```
Project ID: _______________________________
```

---

### ETAPA 3: Verificar Status do Cloud Run (Opcional mas Recomendado)

Antes de criar credenciais, vamos ver o status atual:

1. No menu lateral esquerdo, procure por **"Cloud Run"**
   - Ou use a busca no topo: digite "Cloud Run"

2. Você verá uma lista de serviços
   - Procure por: **qivo-mining**

3. Observe o status:
   - 🟢 **Verde** = Serviço rodando normalmente
   - 🔴 **Vermelho** = Serviço com erro
   - ⚪ **Cinza** = Serviço parado

4. Clique no serviço **qivo-mining** para ver detalhes

5. Anote as informações:

**📝 Status Atual:**
```
Status: [ ] Rodando  [ ] Com Erro  [ ] Parado
URL: _______________________________
Última Revisão: _______________________________
```

---

### ETAPA 4: Criar/Obter Service Account Key

#### 4.1. Acessar IAM & Admin

1. No menu lateral esquerdo (☰), procure por **"IAM & Admin"**
2. Clique em **"Service Accounts"** (Contas de Serviço)

#### 4.2. Verificar Service Accounts Existentes

Você verá uma lista de service accounts. Procure por uma que tenha:
- Nome relacionado a "compute", "cloud-run", "deploy" ou "qivo"
- Ou crie uma nova (próximo passo)

#### 4.3. Opção A - Usar Service Account Existente

Se já existe uma service account adequada:

1. Clique nos **3 pontinhos** (⋮) à direita da service account
2. Selecione **"Manage keys"** (Gerenciar chaves)
3. Clique em **"Add Key"** → **"Create new key"**
4. Selecione formato **JSON**
5. Clique em **"Create"**
6. O arquivo JSON será baixado automaticamente

#### 4.4. Opção B - Criar Nova Service Account

Se não existe uma service account adequada:

1. Clique em **"+ CREATE SERVICE ACCOUNT"** (no topo)

2. Preencha:
   - **Service account name:** `qivo-deploy-manager`
   - **Service account ID:** (será preenchido automaticamente)
   - **Description:** `Service account for QIVO Mining deployment management`

3. Clique em **"CREATE AND CONTINUE"**

4. Na seção **"Grant this service account access to project"**, adicione as seguintes roles:
   - **Cloud Run Admin** (roles/run.admin)
   - **Cloud Build Editor** (roles/cloudbuild.builds.editor)
   - **Logs Viewer** (roles/logging.viewer)
   - **Service Account User** (roles/iam.serviceAccountUser)

5. Clique em **"CONTINUE"** e depois **"DONE"**

6. Agora, na lista de service accounts, encontre a que você acabou de criar

7. Clique nos **3 pontinhos** (⋮) à direita
8. Selecione **"Manage keys"**
9. Clique em **"Add Key"** → **"Create new key"**
10. Selecione formato **JSON**
11. Clique em **"Create"**
12. O arquivo JSON será baixado automaticamente

---

### ETAPA 5: Localizar o Arquivo JSON Baixado

O arquivo JSON foi baixado para sua pasta de Downloads com um nome como:
- `qivo-mining-123456-a1b2c3d4e5f6.json`
- `compliancecore-mining-prod-xyz123.json`

**📝 Localização do arquivo:**
```
Caminho: _______________________________
Nome do arquivo: _______________________________
```

---

## 📤 COMO ME ENVIAR AS CREDENCIAIS

### Método 1: Upload do Arquivo JSON (RECOMENDADO)

1. Clique no ícone de **anexo** (📎) no chat
2. Selecione o arquivo JSON que foi baixado
3. Envie para mim

### Método 2: Copiar e Colar o Conteúdo

1. Abra o arquivo JSON em um editor de texto
2. Copie **TODO** o conteúdo
3. Cole no chat com a mensagem:
   ```
   Aqui está o Service Account Key:
   [colar o conteúdo JSON aqui]
   ```

### Informações Adicionais

Também me envie:
```
Project ID: [o ID que você anotou]
Status do Cloud Run: [rodando/erro/parado]
URL do serviço (se disponível): [URL]
```

---

## ⚠️ IMPORTANTE - SEGURANÇA

- ✅ O arquivo JSON contém credenciais sensíveis
- ✅ Nunca compartilhe em locais públicos
- ✅ Após me enviar, posso ajudar a configurar rotação de chaves
- ✅ Você pode revogar essa chave a qualquer momento no console GCP

---

## 🆘 PROBLEMAS COMUNS

### "Não consigo fazer login"
- Verifique se está usando o email correto: vinicius.debian@theneil.com.br
- Tente recuperar a senha se necessário

### "Não vejo o projeto QIVO"
- Clique no seletor de projetos no topo
- Procure em "ALL" (todos os projetos)
- Verifique se sua conta tem acesso ao projeto

### "Não tenho permissão para criar Service Account"
- Você precisa ser Owner ou Editor do projeto
- Peça a alguém com permissões adequadas para criar
- Ou me forneça acesso temporário de outra forma

### "O Cloud Run está vazio"
- Pode ser que o serviço ainda não foi deployado no GCP
- Ou está em outra região
- Verifique todas as regiões disponíveis

---

## ✅ CHECKLIST

Antes de me enviar as informações, confirme:

- [ ] Fiz login no console GCP
- [ ] Identifiquei o Project ID
- [ ] Verifiquei o status do Cloud Run
- [ ] Criei/obtive o arquivo JSON da Service Account
- [ ] Tenho o arquivo JSON salvo e pronto para enviar

---

## 📞 PRÓXIMOS PASSOS

Assim que você me enviar:
1. ✅ Project ID
2. ✅ Arquivo JSON da Service Account

Eu vou:
1. Configurar o acesso ao GCP
2. Verificar o status completo do deploy
3. Analisar logs e identificar problemas
4. Propor e implementar correções
5. Validar que tudo está funcionando

---

**Estou aguardando suas informações para continuar! 🚀**
