#!/usr/bin/env bash
#
# 🔄 QIVO Mining - Rebase Clean Script
# Fluxo automatizado de rebase seguro com detecção de conflitos
#
# Uso: ./rebase-clean.sh [--force] [--no-backup]
#

set -e  # Exit on error

# ============================================
# 🎨 COLORS & FORMATTING
# ============================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ============================================
# 📝 LOGGING FUNCTIONS
# ============================================
log_info() {
    echo -e "${BLUE}ℹ️  ${1}${RESET}"
}

log_success() {
    echo -e "${GREEN}✅ ${1}${RESET}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  ${1}${RESET}"
}

log_error() {
    echo -e "${RED}❌ ${1}${RESET}"
}

log_step() {
    echo ""
    echo -e "${CYAN}${BOLD}========================================${RESET}"
    echo -e "${CYAN}${BOLD}${1}${RESET}"
    echo -e "${CYAN}${BOLD}========================================${RESET}"
}

# ============================================
# 🔧 UTILITY FUNCTIONS
# ============================================
check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "Comando '$1' não encontrado. Instale antes de continuar."
        exit 1
    fi
}

pause_process() {
    local process_name=$1
    local pids=$(pgrep -f "$process_name" 2>/dev/null || echo "")
    
    if [ -n "$pids" ]; then
        log_info "Pausando processo: $process_name (PIDs: $pids)"
        for pid in $pids; do
            kill -STOP "$pid" 2>/dev/null || true
        done
        echo "$pids" > "/tmp/rebase-paused-$process_name.pid"
        return 0
    fi
    return 1
}

resume_process() {
    local process_name=$1
    local pid_file="/tmp/rebase-paused-$process_name.pid"
    
    if [ -f "$pid_file" ]; then
        local pids=$(cat "$pid_file")
        log_info "Retomando processo: $process_name (PIDs: $pids)"
        for pid in $pids; do
            kill -CONT "$pid" 2>/dev/null || true
        done
        rm -f "$pid_file"
    fi
}

clean_caches() {
    log_step "🧹 ETAPA 5: Limpando Caches"
    
    # TypeScript cache
    if [ -d ".vscode/.tscache" ]; then
        log_info "Removendo .vscode/.tscache"
        rm -rf .vscode/.tscache
    fi
    
    # Node modules cache
    if [ -d "node_modules/.cache" ]; then
        log_info "Removendo node_modules/.cache"
        rm -rf node_modules/.cache
    fi
    
    # Vite cache
    if [ -d "node_modules/.vite" ]; then
        log_info "Removendo node_modules/.vite"
        rm -rf node_modules/.vite
    fi
    
    # Turbo cache
    if [ -d ".turbo" ]; then
        log_info "Removendo .turbo"
        rm -rf .turbo
    fi
    
    # Git locks
    if [ -f ".git/index.lock" ]; then
        log_warning "Removendo .git/index.lock (lock file órfão)"
        rm -f .git/index.lock
    fi
    
    log_success "Caches limpos com sucesso"
}

# ============================================
# 🚀 MAIN REBASE FLOW
# ============================================
main() {
    log_step "🔄 QIVO Mining - Rebase Clean Script"
    echo -e "${BOLD}Repositório:${RESET} $(git remote get-url origin 2>/dev/null || echo 'N/A')"
    echo -e "${BOLD}Branch Atual:${RESET} $(git branch --show-current)"
    echo -e "${BOLD}Último Commit:${RESET} $(git log -1 --oneline)"
    echo ""
    
    # Parse arguments
    FORCE_MODE=false
    NO_BACKUP=false
    
    for arg in "$@"; do
        case $arg in
            --force)
                FORCE_MODE=true
                ;;
            --no-backup)
                NO_BACKUP=true
                ;;
            --help)
                echo "Uso: ./rebase-clean.sh [--force] [--no-backup]"
                echo ""
                echo "Opções:"
                echo "  --force       Pula confirmação inicial"
                echo "  --no-backup   Não faz backup com git stash"
                echo "  --help        Mostra esta mensagem"
                exit 0
                ;;
        esac
    done
    
    # Check prerequisites
    check_command git
    check_command pgrep
    
    # Check if in git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Não está em um repositório Git válido"
        exit 1
    fi
    
    # Check if rebase is already in progress
    if [ -d ".git/rebase-merge" ] || [ -d ".git/rebase-apply" ]; then
        log_warning "Rebase já em andamento!"
        echo ""
        read -p "Deseja abortar o rebase atual e começar de novo? (s/N): " abort_choice
        if [[ "$abort_choice" =~ ^[Ss]$ ]]; then
            git rebase --abort
            log_success "Rebase abortado"
        else
            log_info "Continuando com rebase existente..."
        fi
    fi
    
    # Confirmation
    if [ "$FORCE_MODE" = false ]; then
        echo ""
        log_warning "Este script irá:"
        echo "  1. Pausar GitHub Copilot e VS Code"
        echo "  2. Fazer backup do estado atual (git stash)"
        echo "  3. Executar git fetch + rebase com origin/main"
        echo "  4. Limpar caches"
        echo "  5. Restaurar processos e stash"
        echo ""
        read -p "Continuar? (s/N): " confirm
        if [[ ! "$confirm" =~ ^[Ss]$ ]]; then
            log_info "Operação cancelada pelo usuário"
            exit 0
        fi
    fi
    
    # ============================================
    # ETAPA 1: Pausar Processos
    # ============================================
    log_step "⏸️  ETAPA 1: Pausando Processos"
    
    COPILOT_PAUSED=false
    VSCODE_PAUSED=false
    MONITOR_PAUSED=false
    
    if pause_process "copilot-agent"; then
        COPILOT_PAUSED=true
        log_success "GitHub Copilot pausado"
    else
        log_info "GitHub Copilot não está rodando"
    fi
    
    if pause_process "Code Helper"; then
        VSCODE_PAUSED=true
        log_success "VS Code Helper pausado"
    else
        log_info "VS Code Helper não está rodando"
    fi
    
    if [ -f "monitor_copilot.sh" ] && pause_process "monitor_copilot"; then
        MONITOR_PAUSED=true
        log_success "Monitor Copilot pausado"
    fi
    
    sleep 1
    
    # ============================================
    # ETAPA 2: Backup com Git Stash
    # ============================================
    log_step "💾 ETAPA 2: Backup com Git Stash"
    
    STASH_CREATED=false
    
    if [ "$NO_BACKUP" = false ]; then
        if git diff --quiet && git diff --cached --quiet; then
            log_info "Nenhuma alteração local para fazer backup"
        else
            STASH_NAME="rebase-clean-backup-$(date +%Y%m%d-%H%M%S)"
            log_info "Criando stash: $STASH_NAME"
            git stash push -u -m "$STASH_NAME"
            STASH_CREATED=true
            log_success "Backup criado com sucesso"
        fi
    else
        log_warning "Backup desabilitado com --no-backup"
    fi
    
    # ============================================
    # ETAPA 3: Git Fetch
    # ============================================
    log_step "📡 ETAPA 3: Git Fetch"
    
    log_info "Buscando alterações de origin/main..."
    if git fetch origin main; then
        log_success "Fetch concluído"
        
        # Show comparison
        LOCAL=$(git rev-parse @)
        REMOTE=$(git rev-parse origin/main)
        BASE=$(git merge-base @ origin/main)
        
        if [ "$LOCAL" = "$REMOTE" ]; then
            log_success "Branch já está atualizada com origin/main"
        elif [ "$LOCAL" = "$BASE" ]; then
            log_info "Seu branch está atrás de origin/main"
        elif [ "$REMOTE" = "$BASE" ]; then
            log_info "Seu branch está à frente de origin/main"
        else
            log_warning "Branches divergiram - rebase necessário"
        fi
        
        echo ""
        log_info "Commits em origin/main não presentes localmente:"
        git log --oneline HEAD..origin/main | head -5
    else
        log_error "Falha no git fetch"
        exit 1
    fi
    
    # ============================================
    # ETAPA 4: Git Rebase
    # ============================================
    log_step "🔄 ETAPA 4: Git Rebase"
    
    log_info "Executando: git rebase origin/main"
    
    if git rebase origin/main; then
        log_success "Rebase concluído com sucesso!"
    else
        log_error "CONFLITOS DETECTADOS no rebase!"
        echo ""
        log_warning "Arquivos com conflito:"
        git diff --name-only --diff-filter=U | while read file; do
            echo -e "  ${RED}●${RESET} $file"
        done
        echo ""
        log_info "Para resolver conflitos:"
        echo -e "  1. Abra os arquivos listados acima"
        echo -e "  2. Resolva os marcadores de conflito (<<<<<<<, =======, >>>>>>>)"
        echo -e "  3. Execute: ${BOLD}git add <arquivo>${RESET}"
        echo -e "  4. Execute: ${BOLD}git rebase --continue${RESET}"
        echo ""
        log_info "Ou para abortar:"
        echo -e "  ${BOLD}git rebase --abort${RESET}"
        echo ""
        
        # Resume processes before exiting
        [ "$COPILOT_PAUSED" = true ] && resume_process "copilot-agent"
        [ "$VSCODE_PAUSED" = true ] && resume_process "Code Helper"
        [ "$MONITOR_PAUSED" = true ] && resume_process "monitor_copilot"
        
        exit 1
    fi
    
    # ============================================
    # ETAPA 5: Clean Caches
    # ============================================
    clean_caches
    
    # ============================================
    # ETAPA 6: Restore Stash
    # ============================================
    log_step "♻️  ETAPA 6: Restaurando Stash"
    
    if [ "$STASH_CREATED" = true ]; then
        log_info "Restaurando alterações do stash..."
        if git stash pop; then
            log_success "Stash restaurado com sucesso"
        else
            log_error "Falha ao restaurar stash - pode haver conflitos"
            log_info "Execute manualmente: git stash pop"
        fi
    else
        log_info "Nenhum stash para restaurar"
    fi
    
    # ============================================
    # ETAPA 7: Resume Processes
    # ============================================
    log_step "▶️  ETAPA 7: Retomando Processos"
    
    [ "$COPILOT_PAUSED" = true ] && resume_process "copilot-agent"
    [ "$VSCODE_PAUSED" = true ] && resume_process "Code Helper"
    [ "$MONITOR_PAUSED" = true ] && resume_process "monitor_copilot"
    
    log_success "Processos retomados"
    
    # ============================================
    # ETAPA 8: Final Summary
    # ============================================
    log_step "✅ REBASE CONCLUÍDO COM SUCESSO!"
    
    echo ""
    log_info "Próximos Passos Recomendados:"
    echo ""
    echo -e "  1️⃣  Validar TypeScript:"
    echo -e "     ${BOLD}pnpm tsc --noEmit${RESET}"
    echo ""
    echo -e "  2️⃣  Validar Build:"
    echo -e "     ${BOLD}pnpm build${RESET}"
    echo ""
    echo -e "  3️⃣  Rodar Testes:"
    echo -e "     ${BOLD}pnpm test${RESET}"
    echo ""
    echo -e "  4️⃣  Push para Remote:"
    echo -e "     ${BOLD}git push origin HEAD:main${RESET}"
    echo ""
    
    log_info "Estado Final:"
    echo -e "  Branch: ${BOLD}$(git branch --show-current)${RESET}"
    echo -e "  Último Commit: ${BOLD}$(git log -1 --oneline)${RESET}"
    echo -e "  Status: ${GREEN}${BOLD}✅ LIMPO${RESET}"
    echo ""
}

# ============================================
# 🚨 ERROR HANDLING
# ============================================
trap 'log_error "Script interrompido. Retomando processos..."; resume_process "copilot-agent"; resume_process "Code Helper"; resume_process "monitor_copilot"; exit 1' INT TERM

# ============================================
# 🎬 EXECUTE MAIN
# ============================================
main "$@"
