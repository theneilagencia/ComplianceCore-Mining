#!/usr/bin/env python3
"""
🎨 Manus Design System Validator - QIVO v2
Validação automática e manutenção do design system shadcn/ui
"""

import os
import sys
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Tuple

# ==================== Configuration ====================

PROJECT_ROOT = Path(__file__).parent.parent
COMPONENTS_JSON = PROJECT_ROOT / "components.json"
UI_DIR = PROJECT_ROOT / "client" / "src" / "components" / "ui"
CSS_FILE = PROJECT_ROOT / "client" / "src" / "index.css"
TAILWIND_CONFIG = PROJECT_ROOT / "tailwind.config.ts"

# shadcn/ui New York style - Expected components
EXPECTED_COMPONENTS = [
    "accordion", "alert", "alert-dialog", "aspect-ratio", "avatar",
    "badge", "breadcrumb", "button", "button-group", "calendar",
    "card", "carousel", "chart", "checkbox", "collapsible",
    "command", "context-menu", "dialog", "drawer", "dropdown-menu",
    "field", "hover-card", "input", "input-group", "input-otp",
    "label", "menubar", "navigation-menu", "pagination", "popover",
    "progress", "radio-group", "resizable", "scroll-area", "select",
    "separator", "sheet", "skeleton", "slider", "sonner",
    "switch", "table", "tabs", "textarea", "toast",
    "toaster", "toggle", "toggle-group", "tooltip"
]

# Qivo Custom Colors (from index.css)
QIVO_COLORS = [
    "qivo-bg", "qivo-secondary", "qivo-accent", "qivo-warm", "qivo-soft"
]

# Design Tokens (from shadcn/ui)
DESIGN_TOKENS = {
    "colors": [
        "background", "foreground", "card", "card-foreground",
        "popover", "popover-foreground", "primary", "primary-foreground",
        "secondary", "secondary-foreground", "muted", "muted-foreground",
        "accent", "accent-foreground", "destructive", "destructive-foreground",
        "border", "input", "ring"
    ],
    "radius": ["sm", "md", "lg", "xl"],
    "sidebar": [
        "sidebar", "sidebar-foreground", "sidebar-primary",
        "sidebar-primary-foreground", "sidebar-accent",
        "sidebar-accent-foreground", "sidebar-border", "sidebar-ring"
    ],
    "chart": ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"]
}

# ==================== Helper Functions ====================

def log(message: str, level: str = "INFO"):
    """Structured logging"""
    timestamp = datetime.utcnow().isoformat()
    emoji = {"INFO": "ℹ️", "SUCCESS": "✅", "WARNING": "⚠️", "ERROR": "❌"}
    print(f"{emoji.get(level, '📝')} [{timestamp}] {message}")

def read_json(file_path: Path) -> Dict:
    """Read JSON file"""
    try:
        with open(file_path) as f:
            return json.load(f)
    except Exception as e:
        log(f"Erro ao ler {file_path}: {str(e)}", "ERROR")
        return {}

def read_file(file_path: Path) -> str:
    """Read text file"""
    try:
        return file_path.read_text()
    except Exception as e:
        log(f"Erro ao ler {file_path}: {str(e)}", "ERROR")
        return ""

# ==================== Validation Functions ====================

def validate_components_json() -> Dict[str, Any]:
    """Validate components.json configuration"""
    log("Validando components.json...")
    
    if not COMPONENTS_JSON.exists():
        return {
            "valid": False,
            "error": "components.json não encontrado",
            "config": {}
        }
    
    config = read_json(COMPONENTS_JSON)
    
    # Expected structure
    expected_keys = ["style", "rsc", "tsx", "tailwind", "aliases"]
    missing_keys = [key for key in expected_keys if key not in config]
    
    # Validate style
    expected_style = "new-york"
    correct_style = config.get("style") == expected_style
    
    # Validate tailwind config
    tailwind_config = config.get("tailwind", {})
    expected_tailwind = {
        "config": "tailwind.config.ts",
        "css": "client/src/index.css",
        "baseColor": "neutral",
        "cssVariables": True
    }
    
    tailwind_valid = all(
        tailwind_config.get(key) == value
        for key, value in expected_tailwind.items()
    )
    
    return {
        "valid": len(missing_keys) == 0 and correct_style and tailwind_valid,
        "config": config,
        "missing_keys": missing_keys,
        "correct_style": correct_style,
        "style": config.get("style"),
        "expected_style": expected_style,
        "tailwind_valid": tailwind_valid
    }

def validate_ui_components() -> Dict[str, Any]:
    """Validate UI components directory"""
    log("Validando componentes UI...")
    
    if not UI_DIR.exists():
        return {
            "valid": False,
            "error": "Diretório client/src/components/ui não encontrado",
            "components": []
        }
    
    # List all .tsx files
    component_files = list(UI_DIR.glob("*.tsx"))
    component_names = [f.stem for f in component_files]
    
    # Check for expected components
    present = [comp for comp in EXPECTED_COMPONENTS if comp in component_names]
    missing = [comp for comp in EXPECTED_COMPONENTS if comp not in component_names]
    extra = [comp for comp in component_names if comp not in EXPECTED_COMPONENTS]
    
    coverage = (len(present) / len(EXPECTED_COMPONENTS) * 100) if EXPECTED_COMPONENTS else 0
    
    return {
        "valid": len(missing) == 0,
        "total_expected": len(EXPECTED_COMPONENTS),
        "total_present": len(present),
        "total_missing": len(missing),
        "coverage": round(coverage, 2),
        "present": present,
        "missing": missing,
        "extra": extra,
        "all_components": component_names
    }

def validate_css_variables() -> Dict[str, Any]:
    """Validate CSS variables and design tokens"""
    log("Validando variáveis CSS...")
    
    if not CSS_FILE.exists():
        return {
            "valid": False,
            "error": "index.css não encontrado"
        }
    
    css_content = read_file(CSS_FILE)
    
    # Check for design tokens
    tokens_found = {category: [] for category in DESIGN_TOKENS.keys()}
    tokens_missing = {category: [] for category in DESIGN_TOKENS.keys()}
    
    for category, tokens in DESIGN_TOKENS.items():
        for token in tokens:
            pattern = f"--color-{token}:" if category != "radius" else f"--radius-{token}:"
            if pattern in css_content:
                tokens_found[category].append(token)
            else:
                tokens_missing[category].append(token)
    
    # Check for Qivo custom colors
    qivo_colors_found = []
    qivo_colors_missing = []
    
    for color in QIVO_COLORS:
        if f"--color-{color}:" in css_content:
            qivo_colors_found.append(color)
        else:
            qivo_colors_missing.append(color)
    
    # Check for Tailwind imports
    has_tailwind_import = "@import \"tailwindcss\"" in css_content
    has_animate_import = "@import \"tw-animate-css\"" in css_content
    
    all_tokens = sum(len(tokens) for tokens in DESIGN_TOKENS.values())
    found_count = sum(len(found) for found in tokens_found.values())
    coverage = (found_count / all_tokens * 100) if all_tokens else 0
    
    return {
        "valid": coverage > 90 and has_tailwind_import,
        "coverage": round(coverage, 2),
        "tokens_found": tokens_found,
        "tokens_missing": tokens_missing,
        "qivo_colors_found": qivo_colors_found,
        "qivo_colors_missing": qivo_colors_missing,
        "has_tailwind_import": has_tailwind_import,
        "has_animate_import": has_animate_import
    }

def validate_tailwind_config() -> Dict[str, Any]:
    """Validate Tailwind configuration"""
    log("Validando tailwind.config.ts...")
    
    if not TAILWIND_CONFIG.exists():
        return {
            "valid": False,
            "error": "tailwind.config.ts não encontrado"
        }
    
    config_content = read_file(TAILWIND_CONFIG)
    
    # Check for essential plugins
    has_animate = "tailwindcss-animate" in config_content
    has_typography = "@tailwindcss/typography" in config_content or "typography" in config_content
    
    # Check for content paths
    has_client_path = "client/src/**/*.{ts,tsx}" in config_content or "./client/src/**/*.{ts,tsx}" in config_content
    
    # Check for theme extensions
    has_theme_extend = "theme: {" in config_content and "extend:" in config_content
    has_colors = "colors:" in config_content
    has_border_radius = "borderRadius:" in config_content
    
    return {
        "valid": has_animate and has_client_path and has_theme_extend,
        "has_animate_plugin": has_animate,
        "has_typography_plugin": has_typography,
        "has_client_path": has_client_path,
        "has_theme_extend": has_theme_extend,
        "has_colors": has_colors,
        "has_border_radius": has_border_radius
    }

def check_component_consistency() -> Dict[str, Any]:
    """Check consistency across components"""
    log("Verificando consistência dos componentes...")
    
    if not UI_DIR.exists():
        return {"valid": False, "error": "UI directory não encontrado"}
    
    issues = []
    component_files = list(UI_DIR.glob("*.tsx"))
    
    for component_file in component_files:
        content = read_file(component_file)
        
        # Check for common patterns
        if "export" not in content:
            issues.append(f"{component_file.name}: Sem exports")
        
        if "import" not in content and len(content) > 100:
            issues.append(f"{component_file.name}: Sem imports (suspeito)")
        
        # Check for cn utility usage (from lib/utils)
        if "className" in content and "cn(" not in content and "className={" in content:
            # May not be using cn utility
            pass
    
    return {
        "valid": len(issues) == 0,
        "issues": issues,
        "total_checked": len(component_files)
    }

# ==================== Report Generation ====================

def generate_design_system_report(
    components_validation: Dict,
    ui_validation: Dict,
    css_validation: Dict,
    tailwind_validation: Dict,
    consistency_validation: Dict
) -> str:
    """Generate design system validation report"""
    
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    # Calculate overall score
    scores = []
    if components_validation.get("valid"): scores.append(100)
    else: scores.append(50)
    
    scores.append(ui_validation.get("coverage", 0))
    scores.append(css_validation.get("coverage", 0))
    
    if tailwind_validation.get("valid"): scores.append(100)
    else: scores.append(50)
    
    if consistency_validation.get("valid"): scores.append(100)
    else: scores.append(80)
    
    overall_score = sum(scores) / len(scores) if scores else 0
    
    report = f"""
## 🎨 Validação do Design System

**Data:** {timestamp}  
**Design System:** shadcn/ui (New York style)  
**Framework:** Tailwind CSS v4

---

### 📊 Score Geral

**{overall_score:.1f}%** {'✅ APROVADO' if overall_score >= 80 else '⚠️ ATENÇÃO'}

| Categoria | Score | Status |
|-----------|-------|--------|
| Configuração | {100 if components_validation.get('valid') else 50}% | {'✅' if components_validation.get('valid') else '⚠️'} |
| Componentes UI | {ui_validation.get('coverage', 0):.0f}% | {'✅' if ui_validation.get('coverage', 0) >= 80 else '⚠️'} |
| CSS Variables | {css_validation.get('coverage', 0):.0f}% | {'✅' if css_validation.get('coverage', 0) >= 90 else '⚠️'} |
| Tailwind Config | {100 if tailwind_validation.get('valid') else 50}% | {'✅' if tailwind_validation.get('valid') else '⚠️'} |
| Consistência | {100 if consistency_validation.get('valid') else 80}% | {'✅' if consistency_validation.get('valid') else '⚠️'} |

---

### ⚙️ Configuração (components.json)

**Status:** {'✅ Válido' if components_validation.get('valid') else '⚠️ Atenção necessária'}

- **Style:** {components_validation.get('style', 'N/A')} {'✅' if components_validation.get('correct_style') else f"❌ (esperado: {components_validation.get('expected_style')})"} 
- **TypeScript:** {'✅ Habilitado' if components_validation.get('config', {}).get('tsx') else '❌ Desabilitado'}
- **RSC:** {'✅ Habilitado' if components_validation.get('config', {}).get('rsc') else '⚠️ Desabilitado'}
- **CSS Variables:** {'✅ Habilitado' if components_validation.get('config', {}).get('tailwind', {}).get('cssVariables') else '❌ Desabilitado'}
- **Base Color:** {components_validation.get('config', {}).get('tailwind', {}).get('baseColor', 'N/A')}

"""
    
    if components_validation.get('missing_keys'):
        report += f"\n**⚠️ Chaves ausentes:** {', '.join(components_validation['missing_keys'])}\n"
    
    report += f"""
---

### 🧩 Componentes UI

**Status:** {ui_validation.get('total_present', 0)}/{ui_validation.get('total_expected', 0)} componentes presentes ({ui_validation.get('coverage', 0):.1f}%)

"""
    
    # Group components by category
    if ui_validation.get('present'):
        report += f"**✅ Componentes Presentes ({len(ui_validation['present'])}):**\n"
        # Show first 20
        for comp in sorted(ui_validation['present'])[:20]:
            report += f"- {comp}\n"
        if len(ui_validation['present']) > 20:
            report += f"- ... e mais {len(ui_validation['present']) - 20} componentes\n"
    
    if ui_validation.get('missing'):
        report += f"\n**⚠️ Componentes Ausentes ({len(ui_validation['missing'])}):**\n"
        for comp in sorted(ui_validation['missing']):
            report += f"- ❌ {comp}\n"
    
    if ui_validation.get('extra'):
        report += f"\n**ℹ️ Componentes Customizados ({len(ui_validation['extra'])}):**\n"
        for comp in sorted(ui_validation['extra'])[:10]:
            report += f"- 🎨 {comp}\n"
    
    report += f"""
---

### 🎨 Design Tokens (CSS Variables)

**Status:** {css_validation.get('coverage', 0):.1f}% dos tokens implementados

"""
    
    # Show tokens by category
    for category, tokens in css_validation.get('tokens_found', {}).items():
        if tokens:
            report += f"**{category.upper()}:** {len(tokens)} tokens ✅\n"
    
    if css_validation.get('qivo_colors_found'):
        report += f"\n**🎨 Qivo Custom Colors:**\n"
        for color in css_validation['qivo_colors_found']:
            report += f"- ✅ {color}\n"
    
    if css_validation.get('qivo_colors_missing'):
        report += f"\n**⚠️ Cores Qivo Ausentes:**\n"
        for color in css_validation['qivo_colors_missing']:
            report += f"- ❌ {color}\n"
    
    report += f"""
**Imports:**
- Tailwind CSS: {'✅' if css_validation.get('has_tailwind_import') else '❌'}
- Animate CSS: {'✅' if css_validation.get('has_animate_import') else '❌'}

---

### ⚡ Configuração Tailwind

**Status:** {'✅ Válido' if tailwind_validation.get('valid') else '⚠️ Atenção'}

- **Plugin Animate:** {'✅' if tailwind_validation.get('has_animate_plugin') else '❌'}
- **Plugin Typography:** {'✅' if tailwind_validation.get('has_typography_plugin') else '⚠️'}
- **Content Paths:** {'✅' if tailwind_validation.get('has_client_path') else '❌'}
- **Theme Extend:** {'✅' if tailwind_validation.get('has_theme_extend') else '❌'}
- **Custom Colors:** {'✅' if tailwind_validation.get('has_colors') else '⚠️'}
- **Border Radius:** {'✅' if tailwind_validation.get('has_border_radius') else '⚠️'}

---

### 🔍 Consistência

**Status:** {'✅ Todos os componentes consistentes' if consistency_validation.get('valid') else '⚠️ Issues encontrados'}

"""
    
    if consistency_validation.get('issues'):
        report += f"**⚠️ Issues Encontrados ({len(consistency_validation['issues'])}):**\n"
        for issue in consistency_validation['issues'][:10]:
            report += f"- {issue}\n"
    else:
        report += f"✅ Nenhum issue de consistência detectado\n"
    
    report += f"""
**Total de componentes verificados:** {consistency_validation.get('total_checked', 0)}

---

### 📌 Recomendações

"""
    
    recommendations = []
    
    if not components_validation.get('valid'):
        recommendations.append("🔴 **CRÍTICO:** Corrigir components.json para garantir configuração correta")
    
    if ui_validation.get('coverage', 0) < 80:
        recommendations.append(f"🟡 **ATENÇÃO:** {ui_validation.get('total_missing', 0)} componentes ausentes do design system")
    
    if css_validation.get('coverage', 0) < 90:
        recommendations.append("🟡 **ATENÇÃO:** Design tokens incompletos - revisar variáveis CSS")
    
    if not tailwind_validation.get('valid'):
        recommendations.append("🔴 **CRÍTICO:** Configuração do Tailwind incompleta")
    
    if consistency_validation.get('issues'):
        recommendations.append(f"🟡 **ATENÇÃO:** {len(consistency_validation['issues'])} issues de consistência detectados")
    
    if not recommendations:
        recommendations.append("✅ **Design System em conformidade!** Manter monitoramento contínuo.")
    
    for rec in recommendations:
        report += f"- {rec}\n"
    
    report += f"""

---

### 📋 Design System Stack

- **Framework:** shadcn/ui (New York style)
- **CSS Framework:** Tailwind CSS v4
- **Componentes:** {ui_validation.get('total_present', 0)} UI components
- **Tokens:** {len(DESIGN_TOKENS.get('colors', []))} cores base
- **Custom:** {len(QIVO_COLORS)} cores Qivo
- **Configuração:** components.json + tailwind.config.ts
- **Aliases:** @/components, @/lib, @/hooks, @/ui

---

**Próxima validação:** Diária às 3h UTC (junto com auditoria técnica)  
**Gerado por:** Manus Design System Validator
"""
    
    return report

# ==================== Main Function ====================

def main():
    """Main validation flow"""
    log("=" * 60)
    log("🎨 QIVO v2 - Manus Design System Validator")
    log("=" * 60)
    
    # Run all validations
    components_validation = validate_components_json()
    ui_validation = validate_ui_components()
    css_validation = validate_css_variables()
    tailwind_validation = validate_tailwind_config()
    consistency_validation = check_component_consistency()
    
    # Generate report
    report = generate_design_system_report(
        components_validation,
        ui_validation,
        css_validation,
        tailwind_validation,
        consistency_validation
    )
    
    # Append to audit report
    audit_report_path = PROJECT_ROOT / "docs" / "AUDITORIA_CONFORMIDADE_QIVO_V2.md"
    
    if audit_report_path.exists():
        with open(audit_report_path, "a") as f:
            f.write("\n" + report)
        log(f"✅ Design System report anexado: {audit_report_path}", "SUCCESS")
    else:
        # Create new report
        with open(audit_report_path, "w") as f:
            f.write("# 📊 Auditoria Técnica e Conformidade QIVO v2\n\n")
            f.write(report)
        log(f"✅ Design System report criado: {audit_report_path}", "SUCCESS")
    
    # Calculate exit code
    overall_valid = (
        components_validation.get("valid", False) and
        ui_validation.get("coverage", 0) >= 70 and
        css_validation.get("coverage", 0) >= 80
    )
    
    if not overall_valid:
        log("⚠️ Design System precisa de atenção. Verificar recomendações.", "WARNING")
        sys.exit(1)
    
    log("=" * 60)
    log("✅ Validação do Design System concluída!", "SUCCESS")
    sys.exit(0)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log(f"Erro durante validação do design system: {str(e)}", "ERROR")
        import traceback
        traceback.print_exc()
        sys.exit(1)
