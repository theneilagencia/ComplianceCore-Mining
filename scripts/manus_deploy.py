#!/usr/bin/env python3
"""
🚀 Manus Deploy Script - QIVO v2
Automated deployment to Render via API with comprehensive logging and error handling
"""

import os
import sys
import time
import json
import requests
from datetime import datetime
from typing import Dict, Any, Optional

# ==================== Configuration ====================

RENDER_API_BASE = "https://api.render.com/v1"
SERVICE_ID = os.getenv("RENDER_SERVICE_ID")
RENDER_API_KEY = os.getenv("RENDER_API_KEY")
ENVIRONMENT = os.getenv("ENVIRONMENT", "production")
COMMIT_SHA = os.getenv("COMMIT_SHA", "unknown")
COMMIT_MESSAGE = os.getenv("COMMIT_MESSAGE", "Manual deploy")
GITHUB_ACTOR = os.getenv("GITHUB_ACTOR", "unknown")

# Timeouts and retry configuration
DEPLOY_TIMEOUT_SECONDS = 600  # 10 minutes
POLL_INTERVAL_SECONDS = 20
MAX_RETRIES = 3

# ==================== Helper Functions ====================

def log(level: str, message: str, data: Optional[Dict[str, Any]] = None):
    """Structured logging with timestamp"""
    timestamp = datetime.utcnow().isoformat()
    emoji = {
        "INFO": "ℹ️",
        "SUCCESS": "✅",
        "WARNING": "⚠️",
        "ERROR": "❌",
        "DEBUG": "🔍"
    }.get(level, "📝")
    
    print(f"{emoji} [{timestamp}] {level}: {message}")
    if data:
        print(json.dumps(data, indent=2))

def get_headers() -> Dict[str, str]:
    """Generate request headers with authentication"""
    if not RENDER_API_KEY:
        log("ERROR", "RENDER_API_KEY não configurado")
        sys.exit(1)
    
    return {
        "Authorization": f"Bearer {RENDER_API_KEY}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

def validate_environment():
    """Validate required environment variables"""
    required_vars = {
        "RENDER_SERVICE_ID": SERVICE_ID,
        "RENDER_API_KEY": RENDER_API_KEY
    }
    
    missing = [var for var, value in required_vars.items() if not value]
    
    if missing:
        log("ERROR", f"Variáveis de ambiente ausentes: {', '.join(missing)}")
        sys.exit(1)
    
    log("SUCCESS", "Variáveis de ambiente validadas")

def get_service_info() -> Dict[str, Any]:
    """Fetch current service information"""
    url = f"{RENDER_API_BASE}/services/{SERVICE_ID}"
    
    try:
        response = requests.get(url, headers=get_headers(), timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        log("ERROR", f"Erro ao buscar informações do serviço: {str(e)}")
        return {}

def trigger_deploy() -> Optional[str]:
    """Trigger a new deployment"""
    url = f"{RENDER_API_BASE}/services/{SERVICE_ID}/deploys"
    
    payload = {
        "clearCache": False  # Usar cache para deploy mais rápido
    }
    
    log("INFO", f"Iniciando deploy para ambiente: {ENVIRONMENT}")
    log("DEBUG", f"Service ID: {SERVICE_ID}")
    log("DEBUG", f"Commit: {COMMIT_SHA[:8]} - {COMMIT_MESSAGE}")
    
    try:
        response = requests.post(
            url, 
            headers=get_headers(), 
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        
        deploy_data = response.json()
        deploy_id = deploy_data.get("id")
        
        log("SUCCESS", f"Deploy iniciado com sucesso! Deploy ID: {deploy_id}")
        return deploy_id
        
    except requests.exceptions.RequestException as e:
        log("ERROR", f"Erro ao iniciar deploy: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            log("DEBUG", f"Response: {e.response.text}")
        return None

def check_deploy_status(deploy_id: str) -> Dict[str, Any]:
    """Check the status of a deployment"""
    url = f"{RENDER_API_BASE}/services/{SERVICE_ID}/deploys/{deploy_id}"
    
    try:
        response = requests.get(url, headers=get_headers(), timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        log("WARNING", f"Erro ao verificar status do deploy: {str(e)}")
        return {"status": "unknown"}

def wait_for_deploy(deploy_id: str) -> bool:
    """Wait for deployment to complete with timeout"""
    start_time = time.time()
    iteration = 0
    
    log("INFO", "Aguardando conclusão do deploy...")
    
    while True:
        elapsed = time.time() - start_time
        
        if elapsed > DEPLOY_TIMEOUT_SECONDS:
            log("ERROR", f"Timeout: Deploy não concluiu em {DEPLOY_TIMEOUT_SECONDS}s")
            return False
        
        deploy_info = check_deploy_status(deploy_id)
        status = deploy_info.get("status", "unknown")
        
        iteration += 1
        log("INFO", f"[{iteration}] Status do deploy: {status} (tempo: {int(elapsed)}s)")
        
        if status == "live":
            log("SUCCESS", f"Deploy concluído com sucesso! Tempo total: {int(elapsed)}s")
            return True
        
        if status in ["build_failed", "failed", "canceled"]:
            log("ERROR", f"Deploy falhou com status: {status}")
            log("DEBUG", "Deploy info:", deploy_info)
            return False
        
        time.sleep(POLL_INTERVAL_SECONDS)

def health_check() -> bool:
    """Perform health check on deployed service"""
    service_url = "https://qivo-mining.onrender.com"
    
    log("INFO", f"Executando health check em: {service_url}")
    
    try:
        response = requests.get(service_url, timeout=10)
        
        if response.status_code == 200:
            log("SUCCESS", "Health check passou!")
            return True
        else:
            log("WARNING", f"Health check retornou status: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        log("WARNING", f"Health check falhou: {str(e)}")
        return False

def save_deploy_metadata(deploy_id: str, success: bool):
    """Save deployment metadata for history"""
    metadata = {
        "deploy_id": deploy_id,
        "timestamp": datetime.utcnow().isoformat(),
        "environment": ENVIRONMENT,
        "commit_sha": COMMIT_SHA,
        "commit_message": COMMIT_MESSAGE,
        "deployed_by": GITHUB_ACTOR,
        "success": success
    }
    
    os.makedirs("deploy_history", exist_ok=True)
    filename = f"deploy_history/{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    try:
        with open(filename, "w") as f:
            json.dump(metadata, f, indent=2)
        log("SUCCESS", f"Metadados salvos em: {filename}")
    except Exception as e:
        log("WARNING", f"Erro ao salvar metadados: {str(e)}")

# ==================== Main Function ====================

def main():
    """Main deployment flow"""
    log("INFO", "=" * 60)
    log("INFO", "🚀 QIVO v2 - Manus Automated Deploy")
    log("INFO", "=" * 60)
    
    # Step 1: Validate environment
    validate_environment()
    
    # Step 2: Get service info
    service_info = get_service_info()
    if service_info:
        log("INFO", f"Service: {service_info.get('name', 'unknown')}")
        log("INFO", f"Region: {service_info.get('region', 'unknown')}")
    
    # Step 3: Trigger deployment
    deploy_id = trigger_deploy()
    
    if not deploy_id:
        log("ERROR", "Falha ao iniciar deploy. Abortando.")
        sys.exit(1)
    
    # Step 4: Wait for deployment
    success = wait_for_deploy(deploy_id)
    
    # Step 5: Health check (if successful)
    if success:
        time.sleep(10)  # Wait for service to stabilize
        health_check()
    
    # Step 6: Save metadata
    save_deploy_metadata(deploy_id, success)
    
    # Step 7: Final status
    log("INFO", "=" * 60)
    if success:
        log("SUCCESS", "✅ Deploy concluído com sucesso!")
        log("INFO", f"URL: https://qivo-mining.onrender.com")
        sys.exit(0)
    else:
        log("ERROR", "❌ Deploy falhou. Verifique os logs do Render.")
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log("WARNING", "Deploy interrompido pelo usuário")
        sys.exit(130)
    except Exception as e:
        log("ERROR", f"Erro inesperado: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
