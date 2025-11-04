#!/usr/bin/env python3
"""
📊 Manus Auditor Script - QIVO v2
Comprehensive technical audit with multi-dimensional analysis
"""

import os
import sys
import json
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

# ==================== Configuration ====================

AUDIT_TYPE = os.getenv("AUDIT_TYPE", "full")
MANUS_API_KEY = os.getenv("MANUS_API_KEY")
PROJECT_ROOT = Path(__file__).parent.parent

MODULES = [
    {"name": "radar", "path": "server/modules/radar"},
    {"name": "report", "path": "server/modules/reports"},
    {"name": "bridge", "path": "server/modules/bridge"},
    {"name": "krci", "path": "server/modules/technical-reports"},
    {"name": "admin", "path": "server/modules/admin"},
    {"name": "billing", "path": "server/modules/billing"},
    {"name": "sse", "path": "server/modules/sse"},
]

# ==================== Helper Functions ====================

def log(message: str, level: str = "INFO"):
    """Structured logging"""
    timestamp = datetime.utcnow().isoformat()
    emoji = {"INFO": "ℹ️", "SUCCESS": "✅", "WARNING": "⚠️", "ERROR": "❌"}
    print(f"{emoji.get(level, '📝')} [{timestamp}] {message}")

def run_command(cmd: str, capture: bool = True) -> Optional[str]:
    """Execute shell command and return output"""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=capture,
            text=True,
            timeout=60
        )
        return result.stdout if capture else None
    except subprocess.TimeoutExpired:
        log(f"Command timeout: {cmd}", "WARNING")
        return None
    except Exception as e:
        log(f"Command error: {str(e)}", "ERROR")
        return None

def count_files(directory: str, extensions: List[str]) -> int:
    """Count files with specific extensions in directory"""
    path = PROJECT_ROOT / directory
    if not path.exists():
        return 0
    
    count = 0
    for ext in extensions:
        count += len(list(path.rglob(f"*.{ext}")))
    return count

# ==================== Audit Functions ====================

def audit_modules() -> Dict[str, Any]:
    """Audit all system modules"""
    log("Auditando módulos do sistema...")
    
    results = []
    
    for module in MODULES:
        module_path = PROJECT_ROOT / module["path"]
        
        status = {
            "name": module["name"],
            "path": module["path"],
            "exists": module_path.exists(),
            "files": 0,
            "tests": 0,
            "status": "unknown"
        }
        
        if module_path.exists():
            status["files"] = count_files(module["path"], ["ts", "tsx"])
            test_path = f"tests/unit/{module['name']}"
            status["tests"] = count_files(test_path, ["test.ts", "spec.ts"])
            status["status"] = "active" if status["files"] > 0 else "empty"
        else:
            status["status"] = "missing"
        
        results.append(status)
        
        emoji = "✅" if status["status"] == "active" else "⚠️"
        log(f"{emoji} {module['name']}: {status['files']} files, {status['tests']} tests")
    
    return {
        "total_modules": len(MODULES),
        "active": sum(1 for r in results if r["status"] == "active"),
        "missing": sum(1 for r in results if r["status"] == "missing"),
        "details": results
    }

def audit_dependencies() -> Dict[str, Any]:
    """Audit project dependencies"""
    log("Auditando dependências...")
    
    package_json_path = PROJECT_ROOT / "package.json"
    
    if not package_json_path.exists():
        return {"error": "package.json not found"}
    
    with open(package_json_path) as f:
        package_data = json.load(f)
    
    deps = package_data.get("dependencies", {})
    dev_deps = package_data.get("devDependencies", {})
    
    audit_output = run_command("cd {} && pnpm audit --json 2>/dev/null".format(PROJECT_ROOT))
    
    vulnerabilities = {"total": 0, "high": 0, "moderate": 0, "low": 0}
    
    if audit_output:
        try:
            audit_data = json.loads(audit_output)
            vulnerabilities = audit_data.get("metadata", {}).get("vulnerabilities", vulnerabilities)
        except:
            pass
    
    return {
        "total_dependencies": len(deps),
        "dev_dependencies": len(dev_deps),
        "vulnerabilities": vulnerabilities,
        "status": "healthy" if vulnerabilities["high"] == 0 else "needs_attention"
    }

def audit_code_quality() -> Dict[str, Any]:
    """Audit code quality metrics"""
    log("Analisando qualidade do código...")
    
    # Count TypeScript files
    ts_files = count_files(".", ["ts", "tsx"])
    
    # Count test files
    test_files = count_files("tests", ["test.ts", "spec.ts"])
    
    # Run type check
    typecheck_output = run_command("cd {} && pnpm run check 2>&1".format(PROJECT_ROOT))
    
    errors = 0
    if typecheck_output:
        errors = typecheck_output.count("error TS")
    
    return {
        "typescript_files": ts_files,
        "test_files": test_files,
        "test_coverage": round((test_files / ts_files * 100), 2) if ts_files > 0 else 0,
        "typecheck_errors": errors,
        "status": "good" if errors < 50 else "needs_improvement"
    }

def audit_build() -> Dict[str, Any]:
    """Audit build process"""
    log("Testando processo de build...")
    
    build_output = run_command("cd {} && NODE_ENV=production pnpm run build 2>&1".format(PROJECT_ROOT))
    
    success = False
    build_time = 0
    bundle_size = 0
    
    if build_output:
        success = "✓ built in" in build_output
        
        if success:
            # Extract build time
            if "built in" in build_output:
                try:
                    time_str = build_output.split("built in")[1].split("s")[0].strip()
                    build_time = float(time_str)
                except:
                    pass
            
            # Check dist size
            dist_path = PROJECT_ROOT / "dist" / "index.js"
            if dist_path.exists():
                bundle_size = dist_path.stat().st_size / 1024  # KB
    
    return {
        "success": success,
        "build_time_seconds": build_time,
        "bundle_size_kb": round(bundle_size, 2),
        "status": "healthy" if success else "broken"
    }

def audit_security() -> Dict[str, Any]:
    """Security audit"""
    log("Executando auditoria de segurança...")
    
    # Check for exposed secrets
    secret_patterns = ["api.key", "secret", "password", "token"]
    exposed_secrets = 0
    
    for pattern in secret_patterns:
        output = run_command(f"cd {PROJECT_ROOT} && git log --all --pretty=format: --name-only | sort -u | xargs grep -l '{pattern}' 2>/dev/null || true")
        if output:
            exposed_secrets += len(output.strip().split('\n'))
    
    # Check .env file
    env_file = PROJECT_ROOT / ".env"
    env_tracked = False
    
    if env_file.exists():
        gitignore_output = run_command("cd {} && git check-ignore .env".format(PROJECT_ROOT))
        env_tracked = gitignore_output is None
    
    return {
        "exposed_secrets": exposed_secrets,
        "env_file_tracked": env_tracked,
        "status": "secure" if exposed_secrets == 0 and not env_tracked else "warning"
    }

def audit_performance() -> Dict[str, Any]:
    """Performance audit"""
    log("Coletando métricas de performance...")
    
    url = "https://qivo-mining.onrender.com"
    
    response_time = 0
    status_code = 0
    
    curl_output = run_command(f'curl -o /dev/null -s -w "%{{http_code}}:%{{time_total}}" {url} 2>/dev/null || echo "0:0"')
    
    if curl_output and ":" in curl_output:
        try:
            parts = curl_output.strip().split(":")
            status_code = int(parts[0])
            response_time = float(parts[1])
        except:
            pass
    
    return {
        "endpoint": url,
        "status_code": status_code,
        "response_time_seconds": response_time,
        "status": "online" if status_code == 200 else "offline"
    }

# ==================== Report Generation ====================

def generate_markdown_report(audit_results: Dict[str, Any]) -> str:
    """Generate comprehensive Markdown audit report"""
    
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    report = f"""# 📊 Auditoria Técnica QIVO v2

**Data da Auditoria:** {timestamp}  
**Tipo de Auditoria:** {AUDIT_TYPE}  
**Versão:** 2.0.0

---

## 🎯 Resumo Executivo

| Categoria | Status | Detalhes |
|-----------|--------|----------|
| Módulos | {audit_results['modules']['active']}/{audit_results['modules']['total_modules']} ativos | ✅ |
| Dependências | {audit_results['dependencies']['total_dependencies']} deps | {audit_results['dependencies']['status']} |
| Qualidade de Código | {audit_results['code_quality']['typecheck_errors']} erros TS | {audit_results['code_quality']['status']} |
| Build | {'✅ Sucesso' if audit_results['build']['success'] else '❌ Falhou'} | {audit_results['build']['build_time_seconds']}s |
| Segurança | {'✅ Seguro' if audit_results['security']['exposed_secrets'] == 0 else '⚠️ Atenção'} | {audit_results['security']['status']} |
| Performance | {audit_results['performance']['status']} | {audit_results['performance']['response_time_seconds']}s |

---

## 📦 Análise de Módulos

"""
    
    for module in audit_results['modules']['details']:
        emoji = "✅" if module['status'] == "active" else "⚠️"
        report += f"### {emoji} {module['name'].upper()}\n"
        report += f"- **Path:** `{module['path']}`\n"
        report += f"- **Arquivos:** {module['files']}\n"
        report += f"- **Testes:** {module['tests']}\n"
        report += f"- **Status:** {module['status']}\n\n"
    
    report += f"""---

## 🔐 Segurança

- **Secrets Expostos:** {audit_results['security']['exposed_secrets']}
- **.env Tracked:** {'⚠️ SIM' if audit_results['security']['env_tracked'] else '✅ NÃO'}
- **Status:** {audit_results['security']['status']}

---

## ⚡ Performance

- **Endpoint:** {audit_results['performance']['endpoint']}
- **Status Code:** {audit_results['performance']['status_code']}
- **Response Time:** {audit_results['performance']['response_time_seconds']}s
- **Status:** {audit_results['performance']['status']}

---

## 📊 Métricas de Código

- **Arquivos TypeScript:** {audit_results['code_quality']['typescript_files']}
- **Arquivos de Teste:** {audit_results['code_quality']['test_files']}
- **Cobertura de Testes:** {audit_results['code_quality']['test_coverage']}%
- **Erros TypeScript:** {audit_results['code_quality']['typecheck_errors']}

---

## 🏗️ Build

- **Sucesso:** {'✅ SIM' if audit_results['build']['success'] else '❌ NÃO'}
- **Tempo de Build:** {audit_results['build']['build_time_seconds']}s
- **Tamanho do Bundle:** {audit_results['build']['bundle_size_kb']} KB

---

## 📌 Recomendações

"""
    
    recommendations = []
    
    if audit_results['dependencies']['vulnerabilities']['high'] > 0:
        recommendations.append("🔴 **CRÍTICO:** Atualizar dependências com vulnerabilidades HIGH")
    
    if audit_results['code_quality']['typecheck_errors'] > 50:
        recommendations.append("🟡 **ATENÇÃO:** Reduzir erros TypeScript (atual: {})".format(audit_results['code_quality']['typecheck_errors']))
    
    if audit_results['security']['exposed_secrets'] > 0:
        recommendations.append("🔴 **CRÍTICO:** Remover secrets expostos do histórico Git")
    
    if not audit_results['build']['success']:
        recommendations.append("🔴 **CRÍTICO:** Corrigir falhas no processo de build")
    
    if audit_results['performance']['status'] == "offline":
        recommendations.append("🔴 **CRÍTICO:** Aplicação está offline - verificar deploy")
    
    if not recommendations:
        recommendations.append("✅ **Nenhuma recomendação crítica.** Sistema operando conforme esperado.")
    
    for rec in recommendations:
        report += f"- {rec}\n"
    
    report += f"""

---

**Auditoria gerada automaticamente pelo Manus Bot**  
**Próxima auditoria:** Agendada para amanhã às 3h UTC
"""
    
    return report

# ==================== Main Function ====================

def main():
    """Main audit flow"""
    log("=" * 60)
    log("📊 QIVO v2 - Manus Technical Auditor")
    log(f"Tipo de Auditoria: {AUDIT_TYPE}")
    log("=" * 60)
    
    # Create audit logs directory
    (PROJECT_ROOT / "audit_logs").mkdir(exist_ok=True)
    
    # Run audits
    audit_results = {
        "timestamp": datetime.utcnow().isoformat(),
        "audit_type": AUDIT_TYPE,
        "modules": audit_modules(),
        "dependencies": audit_dependencies(),
        "code_quality": audit_code_quality(),
        "build": audit_build(),
        "security": audit_security(),
        "performance": audit_performance()
    }
    
    # Generate reports
    markdown_report = generate_markdown_report(audit_results)
    
    # Save Markdown report
    docs_dir = PROJECT_ROOT / "docs"
    docs_dir.mkdir(exist_ok=True)
    
    report_path = docs_dir / "AUDITORIA_CONFORMIDADE_QIVO_V2.md"
    with open(report_path, "w") as f:
        f.write(markdown_report)
    
    log(f"✅ Relatório Markdown salvo: {report_path}", "SUCCESS")
    
    # Save JSON report
    json_path = PROJECT_ROOT / "audit_logs" / f"audit_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(json_path, "w") as f:
        json.dump(audit_results, f, indent=2)
    
    log(f"✅ Relatório JSON salvo: {json_path}", "SUCCESS")
    
    log("=" * 60)
    log("✅ Auditoria técnica concluída com sucesso!", "SUCCESS")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log(f"Erro durante auditoria: {str(e)}", "ERROR")
        import traceback
        traceback.print_exc()
        sys.exit(1)
