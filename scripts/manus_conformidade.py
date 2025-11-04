#!/usr/bin/env python3
"""
🔍 Manus Conformidade Script - QIVO v2
Validação automática de conformidade com especificação técnica
"""

import os
import sys
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Tuple

# ==================== Configuration ====================

PROJECT_ROOT = Path(__file__).parent.parent
DOC_PATH = PROJECT_ROOT / "docs" / "especificacao-tecnica-qivo.docx"
REPORT_PATH = PROJECT_ROOT / "docs" / "AUDITORIA_CONFORMIDADE_QIVO_V2.md"

# Required modules from specification
REQUIRED_MODULES = [
    {"name": "Radar", "path": "server/modules/radar", "description": "Monitoramento regulatório"},
    {"name": "Report", "path": "server/modules/reports", "description": "Geração de relatórios"},
    {"name": "Bridge", "path": "server/modules/bridge", "description": "Integração APIs externas"},
    {"name": "KRCI", "path": "server/modules/technical-reports", "description": "Auditoria KRCI"},
    {"name": "Admin", "path": "server/modules/admin", "description": "Administração"},
]

# Required technologies from specification
REQUIRED_TECHNOLOGIES = {
    "backend": ["Node.js", "Express", "tRPC", "Drizzle ORM"],
    "frontend": ["React", "Vite", "Tailwind", "shadcn/ui"],
    "infrastructure": ["Render", "Supabase", "PostgreSQL", "pgvector"],
    "ai": ["OpenAI", "IA preditiva", "GPT"],
    "automation": ["Manus", "GitHub Actions"],
}

# Required features from specification
REQUIRED_FEATURES = [
    "SSE (Server-Sent Events)",
    "Upload pipeline",
    "Real-time notifications",
    "Authentication (Google OAuth)",
    "Billing (Stripe)",
    "Multi-tenancy",
]

# ==================== Helper Functions ====================

def log(message: str, level: str = "INFO"):
    """Structured logging"""
    timestamp = datetime.utcnow().isoformat()
    emoji = {"INFO": "ℹ️", "SUCCESS": "✅", "WARNING": "⚠️", "ERROR": "❌"}
    print(f"{emoji.get(level, '📝')} [{timestamp}] {message}")

def check_file_exists(path: Path) -> bool:
    """Check if file or directory exists"""
    return path.exists()

def read_docx_content(doc_path: Path) -> str:
    """Read content from .docx file"""
    try:
        from docx import Document
        doc = Document(doc_path)
        content = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
        return content
    except ImportError:
        log("Biblioteca python-docx não instalada. Pulando análise de .docx", "WARNING")
        return ""
    except Exception as e:
        log(f"Erro ao ler documento: {str(e)}", "WARNING")
        return ""

def check_modules_compliance() -> Tuple[List[Dict], List[str]]:
    """Check if all required modules exist"""
    log("Verificando módulos obrigatórios...")
    
    compliant = []
    missing = []
    
    for module in REQUIRED_MODULES:
        module_path = PROJECT_ROOT / module["path"]
        exists = check_file_exists(module_path)
        
        status = {
            "name": module["name"],
            "path": module["path"],
            "description": module["description"],
            "exists": exists,
            "status": "✅" if exists else "❌"
        }
        
        if exists:
            compliant.append(status)
            log(f"✅ {module['name']}: {module['path']}", "SUCCESS")
        else:
            missing.append(module["name"])
            log(f"❌ {module['name']}: AUSENTE - {module['path']}", "WARNING")
    
    return compliant, missing

def check_technologies_compliance() -> Tuple[Dict[str, List[str]], Dict[str, List[str]]]:
    """Check if required technologies are present in codebase"""
    log("Verificando tecnologias obrigatórias...")
    
    found = {category: [] for category in REQUIRED_TECHNOLOGIES.keys()}
    missing = {category: [] for category in REQUIRED_TECHNOLOGIES.keys()}
    
    # Check package.json for dependencies
    package_json = PROJECT_ROOT / "package.json"
    package_content = ""
    
    if package_json.exists():
        with open(package_json) as f:
            package_content = f.read()
    
    # Check key source files
    source_files = []
    for pattern in ["server/**/*.ts", "client/**/*.tsx", "*.config.ts"]:
        source_files.extend(PROJECT_ROOT.rglob(pattern.replace("**", "*")))
    
    source_content = ""
    for file in list(source_files)[:50]:  # Limit to first 50 files
        try:
            source_content += file.read_text()
        except:
            pass
    
    # Check each technology
    for category, technologies in REQUIRED_TECHNOLOGIES.items():
        for tech in technologies:
            # Search in package.json and source files
            if re.search(tech, package_content, re.IGNORECASE) or re.search(tech, source_content, re.IGNORECASE):
                found[category].append(tech)
                log(f"✅ {tech} encontrado", "SUCCESS")
            else:
                missing[category].append(tech)
                log(f"⚠️ {tech} não detectado", "WARNING")
    
    return found, missing

def check_features_compliance() -> Tuple[List[str], List[str]]:
    """Check if required features are implemented"""
    log("Verificando features obrigatórias...")
    
    implemented = []
    missing = []
    
    # Search in codebase
    source_files = []
    for pattern in ["server/**/*.ts", "client/**/*.tsx"]:
        source_files.extend(list(PROJECT_ROOT.rglob(pattern.replace("**", "*")))[:100])
    
    source_content = ""
    for file in source_files:
        try:
            source_content += file.read_text()
        except:
            pass
    
    for feature in REQUIRED_FEATURES:
        # Simple text search (can be improved with AST parsing)
        search_term = feature.replace("(", "").replace(")", "").split()[0]
        
        if re.search(search_term, source_content, re.IGNORECASE):
            implemented.append(feature)
            log(f"✅ {feature} implementado", "SUCCESS")
        else:
            missing.append(feature)
            log(f"⚠️ {feature} não detectado", "WARNING")
    
    return implemented, missing

def check_spec_document_compliance() -> Dict[str, Any]:
    """Check compliance with specification document"""
    log("Verificando documento de especificação técnica...")
    
    if not DOC_PATH.exists():
        log(f"Documento não encontrado: {DOC_PATH}", "WARNING")
        return {
            "document_exists": False,
            "compliant": False,
            "message": "Documento de especificação técnica não encontrado"
        }
    
    content = read_docx_content(DOC_PATH)
    
    if not content:
        return {
            "document_exists": True,
            "compliant": False,
            "message": "Não foi possível ler o conteúdo do documento"
        }
    
    # Check for key terms
    terms_found = []
    terms_missing = []
    
    all_terms = (
        [m["name"] for m in REQUIRED_MODULES] +
        [t for techs in REQUIRED_TECHNOLOGIES.values() for t in techs] +
        REQUIRED_FEATURES
    )
    
    for term in all_terms:
        if re.search(term, content, re.IGNORECASE):
            terms_found.append(term)
        else:
            terms_missing.append(term)
    
    compliance_percentage = (len(terms_found) / len(all_terms) * 100) if all_terms else 0
    
    return {
        "document_exists": True,
        "compliant": compliance_percentage > 70,
        "compliance_percentage": round(compliance_percentage, 2),
        "terms_found": len(terms_found),
        "terms_total": len(all_terms),
        "terms_missing": terms_missing[:10]  # First 10 missing terms
    }

# ==================== Report Generation ====================

def generate_compliance_report(
    modules_compliant: List[Dict],
    modules_missing: List[str],
    tech_found: Dict[str, List[str]],
    tech_missing: Dict[str, List[str]],
    features_implemented: List[str],
    features_missing: List[str],
    spec_compliance: Dict[str, Any]
) -> str:
    """Generate comprehensive compliance report"""
    
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    # Calculate overall compliance score
    module_score = (len(modules_compliant) / len(REQUIRED_MODULES) * 100) if REQUIRED_MODULES else 0
    
    tech_total = sum(len(techs) for techs in REQUIRED_TECHNOLOGIES.values())
    tech_found_count = sum(len(techs) for techs in tech_found.values())
    tech_score = (tech_found_count / tech_total * 100) if tech_total else 0
    
    feature_score = (len(features_implemented) / len(REQUIRED_FEATURES) * 100) if REQUIRED_FEATURES else 0
    
    overall_score = (module_score + tech_score + feature_score + spec_compliance.get("compliance_percentage", 0)) / 4
    
    report = f"""
## 🔎 Verificação de Conformidade Técnica

**Data:** {timestamp}  
**Versão:** 2.0.0

---

### 📊 Score Geral de Conformidade

**{overall_score:.1f}%** {'✅ APROVADO' if overall_score >= 70 else '⚠️ ATENÇÃO NECESSÁRIA'}

| Categoria | Score | Status |
|-----------|-------|--------|
| Módulos | {module_score:.0f}% | {'✅' if module_score >= 80 else '⚠️'} |
| Tecnologias | {tech_score:.0f}% | {'✅' if tech_score >= 70 else '⚠️'} |
| Features | {feature_score:.0f}% | {'✅' if feature_score >= 70 else '⚠️'} |
| Documentação | {spec_compliance.get('compliance_percentage', 0):.0f}% | {'✅' if spec_compliance.get('compliant', False) else '⚠️'} |

---

### 📦 Conformidade de Módulos

**Status:** {len(modules_compliant)}/{len(REQUIRED_MODULES)} módulos presentes

"""
    
    for module in modules_compliant:
        report += f"- {module['status']} **{module['name']}** - `{module['path']}` - {module['description']}\n"
    
    if modules_missing:
        report += f"\n**⚠️ Módulos Ausentes:**\n"
        for module_name in modules_missing:
            report += f"- ❌ {module_name}\n"
    
    report += "\n---\n\n### 🔧 Conformidade de Tecnologias\n\n"
    
    for category, technologies in tech_found.items():
        report += f"#### {category.upper()}\n"
        for tech in technologies:
            report += f"- ✅ {tech}\n"
        
        if tech_missing.get(category):
            for tech in tech_missing[category]:
                report += f"- ⚠️ {tech} (não detectado)\n"
        report += "\n"
    
    report += "---\n\n### ✨ Conformidade de Features\n\n"
    
    for feature in features_implemented:
        report += f"- ✅ {feature}\n"
    
    if features_missing:
        report += f"\n**⚠️ Features Faltando:**\n"
        for feature in features_missing:
            report += f"- ❌ {feature}\n"
    
    report += "\n---\n\n### 📄 Conformidade com Especificação Técnica\n\n"
    
    if spec_compliance.get("document_exists"):
        report += f"- **Documento encontrado:** ✅ `{DOC_PATH.relative_to(PROJECT_ROOT)}`\n"
        report += f"- **Termos encontrados:** {spec_compliance.get('terms_found', 0)}/{spec_compliance.get('terms_total', 0)}\n"
        report += f"- **Conformidade:** {spec_compliance.get('compliance_percentage', 0):.1f}%\n"
        
        if spec_compliance.get('terms_missing'):
            report += f"\n**⚠️ Termos não encontrados no documento:**\n"
            for term in spec_compliance['terms_missing']:
                report += f"- {term}\n"
    else:
        report += "- **Documento encontrado:** ❌\n"
        report += "- **Status:** Especificação técnica ausente ou inacessível\n"
    
    report += "\n---\n\n### 📌 Recomendações\n\n"
    
    recommendations = []
    
    if modules_missing:
        recommendations.append(f"🔴 **CRÍTICO:** Implementar módulos ausentes: {', '.join(modules_missing)}")
    
    if overall_score < 70:
        recommendations.append(f"🟡 **ATENÇÃO:** Score de conformidade abaixo de 70% (atual: {overall_score:.1f}%)")
    
    if not spec_compliance.get("document_exists"):
        recommendations.append("🟡 **ATENÇÃO:** Adicionar documento de especificação técnica em `docs/especificacao-tecnica-qivo.docx`")
    
    if not recommendations:
        recommendations.append("✅ **Sistema em conformidade!** Continuar monitoramento diário.")
    
    for rec in recommendations:
        report += f"- {rec}\n"
    
    report += f"""

---

**Próxima auditoria:** Agendada para amanhã às 3h UTC  
**Gerado por:** Manus Conformidade Bot
"""
    
    return report

# ==================== Main Function ====================

def main():
    """Main compliance check flow"""
    log("=" * 60)
    log("🔍 QIVO v2 - Manus Conformidade Técnica")
    log("=" * 60)
    
    # Run all compliance checks
    modules_compliant, modules_missing = check_modules_compliance()
    tech_found, tech_missing = check_technologies_compliance()
    features_implemented, features_missing = check_features_compliance()
    spec_compliance = check_spec_document_compliance()
    
    # Generate report
    compliance_report = generate_compliance_report(
        modules_compliant,
        modules_missing,
        tech_found,
        tech_missing,
        features_implemented,
        features_missing,
        spec_compliance
    )
    
    # Append to existing audit report or create new
    if REPORT_PATH.exists():
        with open(REPORT_PATH, "a") as f:
            f.write("\n" + compliance_report)
        log(f"✅ Relatório atualizado: {REPORT_PATH}", "SUCCESS")
    else:
        with open(REPORT_PATH, "w") as f:
            f.write("# 📊 Auditoria Técnica e Conformidade QIVO v2\n\n")
            f.write(compliance_report)
        log(f"✅ Relatório criado: {REPORT_PATH}", "SUCCESS")
    
    # Calculate exit code based on compliance
    module_score = (len(modules_compliant) / len(REQUIRED_MODULES) * 100) if REQUIRED_MODULES else 0
    
    if module_score < 80:
        log("⚠️ Módulos críticos ausentes. Intervenção necessária.", "WARNING")
        sys.exit(1)
    
    log("=" * 60)
    log("✅ Verificação de conformidade concluída!", "SUCCESS")
    sys.exit(0)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log(f"Erro durante verificação de conformidade: {str(e)}", "ERROR")
        import traceback
        traceback.print_exc()
        sys.exit(1)
