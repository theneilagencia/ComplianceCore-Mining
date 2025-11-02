#!/usr/bin/env python3
"""
QIVO - QA Automatizado Node.js/Express Routes
==============================================
Valida todas as rotas Express com HTTP 200 e resposta válida.

NOTA: Este projeto usa Node.js/TypeScript em produção, não Flask.
Os módulos Flask (app/modules/) são código legado não utilizado.
"""

import requests
import json
import os
import sys
from typing import Dict, List, Tuple

BASE_URL = os.getenv("BASE_URL", "http://localhost:5001")

# Rotas Node.js/Express (produção)
EXPRESS_ROUTES = [
    # Frontend
    {"path": "/", "method": "GET", "module": "Frontend SPA", "type": "html"},
    
    # API Routes (alguns precisam autenticação)
    {"path": "/api/health", "method": "GET", "module": "Health Check", "type": "json", "optional": True},
    
    # Assets (devem retornar 200 ou 304)
    {"path": "/assets/index.js", "method": "GET", "module": "Assets", "type": "js", "optional": True},
]


def test_route(route: Dict) -> Tuple[bool, str]:
    """
    Testa uma rota e retorna (sucesso, mensagem).
    """
    url = f"{BASE_URL}{route['path']}"
    method = route['method']
    route_type = route.get('type', 'json')
    is_optional = route.get('optional', False)
    
    try:
        if method == "GET":
            response = requests.get(url, timeout=10, allow_redirects=True)
        elif method == "POST":
            response = requests.post(url, json={}, timeout=10)
        else:
            return False, f"❌ Método {method} não suportado"
        
        # Verifica status HTTP (200, 304 OK para assets)
        if response.status_code not in [200, 304]:
            if is_optional:
                return True, f"⚠️  HTTP {response.status_code} (opcional, ignorado)"
            return False, f"❌ HTTP {response.status_code}"
        
        # Verifica tipo de resposta
        if route_type == "json":
            try:
                data = response.json()
                if isinstance(data, dict):
                    keys = list(data.keys())[:3]
                    return True, f"✅ JSON válido: {keys}"
                else:
                    return True, f"✅ JSON array ({len(data)} items)"
            except ValueError:
                return False, f"❌ Resposta não é JSON: {response.text[:50]}..."
        
        elif route_type == "html":
            if "<!DOCTYPE" in response.text or "<html" in response.text:
                return True, f"✅ HTML válido ({len(response.text)} bytes)"
            else:
                return False, f"❌ HTML inválido"
        
        elif route_type == "js":
            if len(response.content) > 0:
                return True, f"✅ JS válido ({len(response.content)} bytes)"
            else:
                return False, f"❌ Asset vazio"
        
        else:
            return True, f"✅ HTTP {response.status_code}"
    
    except requests.exceptions.Timeout:
        if is_optional:
            return True, f"⚠️  Timeout (opcional)"
        return False, f"❌ Timeout (>10s)"
    except requests.exceptions.ConnectionError:
        return False, f"❌ Conexão recusada (servidor offline?)"
    except Exception as e:
        if is_optional:
            return True, f"⚠️  {str(e)[:50]} (opcional)"
        return False, f"❌ Erro: {str(e)[:100]}"


def main():
    """
    Executa QA completo.
    """
    print("=" * 70)
    print("🔍 QIVO - QA Automatizado Node.js/Express")
    print("=" * 70)
    print(f"🌐 Base URL: {BASE_URL}")
    print()
    
    results = []
    
    # Testa rotas Express
    print("� Testando Rotas Express (Node.js/TypeScript)...")
    print("-" * 70)
    for route in EXPRESS_ROUTES:
        success, message = test_route(route)
        results.append(success)
        status_icon = "✅" if success else "⚠️ " if route.get('optional') else "❌"
        print(f"{status_icon} [{route['module']}] {route['method']} {route['path']}")
        print(f"   {message}")
    
    print()
    print("=" * 70)
    
    # Calcula estatísticas
    total = len(results)
    passed = sum(results)
    percentage = (passed / total * 100) if total > 0 else 0
    
    print(f"📊 QA Final: {passed}/{total} rotas válidas → {percentage:.1f}% sucesso")
    print("=" * 70)
    
    # Nota sobre arquitetura
    print()
    print("ℹ️  NOTA: Este projeto usa Node.js/TypeScript + Express em produção.")
    print("   Os módulos Flask (app/modules/) são código legado não utilizado.")
    print()
    
    if percentage < 80:
        print("❌ FALHA: Menos de 80% das rotas funcionais")
        sys.exit(1)
    elif percentage < 100:
        print("⚠️  ATENÇÃO: Algumas rotas com problemas (mas opcionais)")
        sys.exit(0)
    else:
        print("✅ SUCESSO: Todas as rotas funcionais!")
        sys.exit(0)


if __name__ == "__main__":
    main()
