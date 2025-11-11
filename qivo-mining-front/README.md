# QIVO Mining Frontend

Frontend da plataforma QIVO Mining Intelligence - Regulatory Compliance & AI-Powered Reports.

## 🚀 Início Rápido

### Pré-requisitos

- Node.js >= 24.0.0
- pnpm >= 10.0.0

### Instalação

```bash
pnpm install
```

### Desenvolvimento

```bash
pnpm dev
```

O servidor de desenvolvimento estará disponível em `http://localhost:5173`

### Build

```bash
pnpm build
```

O build será gerado na pasta `dist/`

### Preview

```bash
pnpm preview
```

## 📁 Estrutura do Projeto

```
qivo-mining-front/
├── src/
│   ├── components/     # Componentes React
│   ├── pages/          # Páginas da aplicação
│   ├── modules/        # Módulos específicos (radar, technical-reports)
│   ├── lib/            # Bibliotecas e utilitários
│   ├── hooks/          # React hooks customizados
│   ├── contexts/       # Contextos React
│   ├── locales/        # Arquivos de tradução i18n
│   ├── shared/         # Código compartilhado (copiado de shared/)
│   └── utils/          # Funções utilitárias
├── public/             # Arquivos estáticos
├── dist/              # Build de produção
└── package.json
```

## 🔧 Configuração

### Variáveis de Ambiente

Copie `.env.example` para `.env` e configure as variáveis necessárias:

```bash
cp .env.example .env
```

### Principais Variáveis

- `VITE_API_URL`: URL do backend API (padrão: `http://localhost:10000`)

## 🧪 Testes

```bash
# Testes unitários
pnpm test

# Testes em modo watch
pnpm test:watch

# Testes E2E
pnpm test:e2e
```

## 📦 Deploy

O frontend pode ser deployado em qualquer plataforma de hospedagem estática:

- **Vercel**: Conecte o repositório e configure o build command: `pnpm build`
- **Netlify**: Configure o build command: `pnpm build` e publish directory: `dist`
- **Cloudflare Pages**: Configure o build command: `pnpm build` e output directory: `dist`

## 🔗 Comunicação com Backend

O frontend consome a API do backend através de:

- **tRPC**: `/api/trpc` - Para chamadas RPC tipadas
- **REST API**: `/api/*` - Para outras rotas REST

Certifique-se de que o backend está rodando e acessível na URL configurada em `VITE_API_URL`.

## 📝 Scripts Disponíveis

- `pnpm dev` - Inicia servidor de desenvolvimento
- `pnpm build` - Cria build de produção
- `pnpm preview` - Preview do build de produção
- `pnpm type-check` - Verifica tipos TypeScript
- `pnpm format` - Formata código com Prettier
- `pnpm test` - Executa testes unitários
- `pnpm test:e2e` - Executa testes E2E

## 🛠️ Tecnologias

- **React 19** - Biblioteca UI
- **Vite** - Build tool
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **tRPC** - API client tipado
- **Wouter** - Roteamento
- **Radix UI** - Componentes acessíveis
- **i18next** - Internacionalização

## 📄 Licença

MIT

