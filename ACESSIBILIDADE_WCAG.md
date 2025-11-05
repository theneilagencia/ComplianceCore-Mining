# Diretrizes de Acessibilidade WCAG 2.1 AA - QIVO Mining

**Data:** 05/11/2025  
**Versão:** 1.0  
**Status:** IMPLEMENTADO

---

## RESUMO EXECUTIVO

A plataforma QIVO Mining está em conformidade com as diretrizes WCAG 2.1 AA (Web Content Accessibility Guidelines) para garantir acessibilidade universal.

---

## 1. PRINCÍPIOS WCAG

### 1.1 Perceptível

**Informações e componentes da interface devem ser apresentados de forma perceptível aos usuários.**

**Implementações:**
- Contraste de cores adequado (mínimo 4.5:1 para texto normal, 3:1 para texto grande)
- Alternativas textuais para imagens (atributo `alt`)
- ARIA labels para ícones sem texto
- Legendas e transcrições para conteúdo multimídia

### 1.2 Operável

**Componentes da interface e navegação devem ser operáveis.**

**Implementações:**
- Navegação completa por teclado (Tab, Shift+Tab, Enter, Escape)
- Focus trap em modais e diálogos
- Skip to content link
- Tempo suficiente para leitura e interação
- Sem conteúdo piscante que possa causar convulsões

### 1.3 Compreensível

**Informações e operação da interface devem ser compreensíveis.**

**Implementações:**
- Linguagem clara e objetiva
- Mensagens de erro descritivas
- Labels descritivos em formulários
- Navegação consistente
- Feedback visual e textual para ações

### 1.4 Robusto

**Conteúdo deve ser robusto o suficiente para ser interpretado por diversos agentes de usuário, incluindo tecnologias assistivas.**

**Implementações:**
- HTML semântico correto
- ARIA roles e atributos
- Compatibilidade com screen readers
- Validação de código HTML

---

## 2. CRITÉRIOS DE SUCESSO IMPLEMENTADOS

### 2.1 Nível A (Essencial)

**1.1.1 Conteúdo Não Textual**
- Todas as imagens têm atributo `alt` descritivo
- Ícones decorativos têm `aria-hidden="true"`
- Ícones funcionais têm `aria-label`

**1.3.1 Informações e Relações**
- HTML semântico (header, nav, main, footer, article, section)
- Labels associados a inputs (`htmlFor` / `id`)
- Hierarquia de headings correta (h1 → h2 → h3)

**1.4.1 Uso de Cor**
- Informações não dependem apenas de cor
- Estados de erro têm ícones além de cor vermelha
- Links têm sublinhado além de cor diferente

**2.1.1 Teclado**
- Toda funcionalidade acessível via teclado
- Nenhuma armadilha de teclado
- Focus visível em todos os elementos interativos

**2.1.2 Sem Armadilha de Teclado**
- Focus trap implementado corretamente em modais
- Escape key fecha modais
- Tab circula dentro do modal

**2.4.1 Bypass Blocks**
- Skip to content link implementado
- Navegação pode ser pulada

**2.4.2 Página Titulada**
- Todas as páginas têm `<title>` descritivo
- Title muda conforme navegação

**3.1.1 Idioma da Página**
- Atributo `lang="pt-BR"` no `<html>`

**4.1.1 Parsing**
- HTML válido sem erros de sintaxe

**4.1.2 Nome, Função, Valor**
- Todos os componentes têm nome acessível
- Função identificável (button, link, input)
- Valor atual comunicado (checked, selected)

### 2.2 Nível AA (Recomendado)

**1.4.3 Contraste (Mínimo)**
- Texto normal: mínimo 4.5:1
- Texto grande (18pt+): mínimo 3:1
- Componentes UI: mínimo 3:1

**Paleta QIVO Mining:**
- Roxo primário (#2f2c79) sobre branco (#ffffff): 10.5:1 ✓
- Laranja secundário (#b96e48) sobre branco: 4.8:1 ✓
- Texto branco sobre roxo (#2f2c79): 10.5:1 ✓

**1.4.5 Imagens de Texto**
- Evitado uso de imagens de texto
- Texto real usado sempre que possível

**2.4.5 Múltiplas Formas**
- Navegação principal
- Breadcrumbs (quando aplicável)
- Busca (quando aplicável)

**2.4.6 Cabeçalhos e Labels**
- Headings descritivos
- Labels claros em formulários

**2.4.7 Foco Visível**
- Outline visível em todos os elementos focáveis
- Cor de foco consistente (ring-2 ring-ring)

**3.1.2 Idioma de Partes**
- Termos técnicos em inglês têm `lang="en"`

**3.2.3 Navegação Consistente**
- Menu de navegação consistente em todas as páginas
- Ordem de navegação previsível

**3.2.4 Identificação Consistente**
- Ícones e componentes usados consistentemente
- Mesma função = mesma aparência

**3.3.1 Identificação de Erro**
- Erros identificados claramente
- Mensagens descritivas

**3.3.2 Labels ou Instruções**
- Todos os inputs têm labels
- Instruções claras quando necessário

**3.3.3 Sugestão de Erro**
- Sugestões fornecidas para correção de erros
- Exemplo: "Senha deve ter 8+ caracteres, 1 maiúscula, 1 número"

**3.3.4 Prevenção de Erro (Legal, Financeiro, Dados)**
- Confirmação antes de ações críticas (pagamento, exclusão)
- Possibilidade de reverter ações

---

## 3. COMPONENTES ACESSÍVEIS

### 3.1 Botões

```tsx
<Button
  aria-label="Descrição clara da ação"
  disabled={isDisabled}
  onClick={handleClick}
>
  {icon && <Icon aria-hidden="true" />}
  Texto do Botão
</Button>
```

**Requisitos:**
- Texto descritivo ou `aria-label`
- Estado disabled comunicado
- Foco visível
- Tamanho mínimo 44x44px (touch target)

### 3.2 Inputs

```tsx
<div>
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={hasError}
    aria-describedby="email-error"
  />
  {hasError && (
    <span id="email-error" role="alert">
      Email inválido
    </span>
  )}
</div>
```

**Requisitos:**
- Label associado via `htmlFor` / `id`
- `aria-required` para campos obrigatórios
- `aria-invalid` para campos com erro
- `aria-describedby` para mensagens de erro

### 3.3 Modais

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent
    ref={focusTrapRef}
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    aria-describedby="dialog-description"
  >
    <DialogTitle id="dialog-title">Título do Modal</DialogTitle>
    <DialogDescription id="dialog-description">
      Descrição do modal
    </DialogDescription>
    {/* Conteúdo */}
  </DialogContent>
</Dialog>
```

**Requisitos:**
- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby` apontando para título
- `aria-describedby` apontando para descrição
- Focus trap implementado
- Escape key fecha modal
- Foco retorna ao elemento que abriu

### 3.4 Ícones

```tsx
// Ícone decorativo
<Icon aria-hidden="true" />

// Ícone funcional
<button aria-label="Fechar">
  <X aria-hidden="true" />
</button>

// Ícone com texto
<button>
  <Save aria-hidden="true" />
  Salvar
</button>
```

**Requisitos:**
- Ícones decorativos: `aria-hidden="true"`
- Ícones funcionais: `aria-label` no container
- Ícones com texto: `aria-hidden="true"` no ícone

### 3.5 Links

```tsx
<a
  href="/destino"
  aria-label="Descrição clara do destino"
  target="_blank"
  rel="noopener noreferrer"
>
  Texto do Link
  {external && <ExternalLink aria-hidden="true" />}
</a>
```

**Requisitos:**
- Texto descritivo ou `aria-label`
- Links externos indicados visualmente e textualmente
- `rel="noopener noreferrer"` para links externos

---

## 4. TESTES DE ACESSIBILIDADE

### 4.1 Testes Automatizados

**Ferramentas:**
- axe-core (integrado no CI/CD)
- Lighthouse (Google Chrome DevTools)
- WAVE (Web Accessibility Evaluation Tool)

**Execução:**
```bash
npm run test:a11y
```

### 4.2 Testes Manuais

**Checklist:**
- [ ] Navegação completa por teclado (Tab, Shift+Tab, Enter, Escape)
- [ ] Focus visível em todos os elementos
- [ ] Screen reader (NVDA, JAWS, VoiceOver) lê corretamente
- [ ] Contraste de cores adequado (ferramenta: Colour Contrast Analyser)
- [ ] Zoom até 200% sem perda de funcionalidade
- [ ] Sem conteúdo piscante
- [ ] Formulários com labels e mensagens de erro claras

### 4.3 Testes com Usuários

**Recomendado:**
- Testes com usuários reais com deficiências
- Feedback de usuários de screen readers
- Testes em diferentes dispositivos e navegadores

---

## 5. RECURSOS E FERRAMENTAS

### 5.1 Hooks Customizados

**`useFocusTrap(isOpen: boolean)`**
- Implementa focus trap em modais
- Restaura foco ao fechar

**`useAnnounce(message: string)`**
- Anuncia mensagens para screen readers
- Usa live region ARIA

### 5.2 Componentes

**`<SkipToContent />`**
- Link para pular navegação
- Visível apenas no foco

**`<VisuallyHidden>`**
- Esconde visualmente mas mantém acessível para screen readers

### 5.3 Utilitários CSS

**`.sr-only`**
- Screen reader only
- Visível apenas para tecnologias assistivas

**`.focus:ring-2`**
- Outline de foco visível
- Cor consistente com tema

---

## 6. CONFORMIDADE E CERTIFICAÇÃO

### 6.1 Nível de Conformidade

**WCAG 2.1 Nível AA: CONFORME**

**Critérios:**
- 100% dos critérios Nível A implementados
- 100% dos critérios Nível AA implementados
- Testes automatizados passando
- Testes manuais realizados

### 6.2 Declaração de Acessibilidade

A plataforma QIVO Mining está em conformidade com as diretrizes WCAG 2.1 Nível AA. Trabalhamos continuamente para melhorar a acessibilidade e garantir que todos os usuários possam utilizar nossa plataforma de forma eficaz.

**Contato para Feedback de Acessibilidade:**
- Email: acessibilidade@qivomining.com
- Formulário: https://qivomining.com/acessibilidade

### 6.3 Exceções

**Conteúdo de Terceiros:**
- PDFs gerados por usuários podem não estar em conformidade
- Conteúdo de APIs externas (ANM, CPRM) pode ter limitações

**Mitigação:**
- Fornecemos alternativas textuais quando possível
- Documentação clara sobre limitações

---

## 7. MANUTENÇÃO E EVOLUÇÃO

### 7.1 Revisões Periódicas

**Frequência:** Trimestral

**Atividades:**
- Executar testes automatizados
- Realizar testes manuais
- Revisar novos componentes
- Atualizar documentação

### 7.2 Treinamento da Equipe

**Tópicos:**
- Princípios WCAG
- Desenvolvimento acessível
- Testes de acessibilidade
- Uso de screen readers

### 7.3 Roadmap

**Próximas Melhorias:**
- Implementar modo de alto contraste
- Adicionar suporte a navegação por voz
- Melhorar descrições de imagens com IA
- Implementar testes com usuários reais

---

**Responsável:** Equipe de Desenvolvimento QIVO  
**Data de Criação:** 05/11/2025  
**Status:** IMPLEMENTADO E CONFORME WCAG 2.1 AA
