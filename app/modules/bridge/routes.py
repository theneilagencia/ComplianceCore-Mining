"""
QIVO Intelligence Layer - Bridge AI Routes
Endpoints Flask para tradução normativa
"""

from flask import Blueprint, jsonify, request
from typing import Dict, Any

from app.modules.bridge.schemas import (
    BridgeRequest,
    BridgeResponse,
    NormComparisonRequest,
    NormComparisonResponse,
    SupportedNormsResponse
)
from src.ai.core.bridge import BridgeAI


bridge_bp = Blueprint("bridge", __name__, url_prefix="/api/bridge")

# Instância global do Bridge
bridge = None


def get_bridge():
    """Lazy initialization do BridgeAI"""
    global bridge
    if bridge is None:
        bridge = BridgeAI()
    return bridge


@bridge_bp.route("/translate", methods=["POST"])
def translate_normative():
    """
    Traduz texto técnico entre normas regulatórias
    
    Normas suportadas:
    - ANM (Brasil)
    - JORC (Austrália/Internacional)
    - NI43-101 (Canadá)
    - PERC (Rússia)
    - SAMREC (África do Sul)
    
    Args:
        text: Texto técnico (50-10000 caracteres)
        source_norm: Norma de origem
        target_norm: Norma de destino
        explain: Se True, retorna justificativa
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        
        ai = get_bridge()
        
        import asyncio
        result = asyncio.run(ai.translate_normative(
            text=data.get('text'),
            source_norm=data.get('source_norm'),
            target_norm=data.get('target_norm'),
            explain=data.get('explain', False)
        ))
        
        # Se houve erro no engine, retornar com status apropriado
        if result.get('status') == 'error':
            return jsonify(result), 500
        
        return jsonify(result), 200
    
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Erro no processamento: {str(e)}"}), 500


@bridge_bp.route("/compare", methods=["POST"])
def compare_norms():
    """
    Compara diferenças conceituais entre duas normas
    
    Args:
        norm1: Primeira norma
        norm2: Segunda norma
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        
        ai = get_bridge()
        
        import asyncio
        result = asyncio.run(ai.explain_norm_difference(
            norm1=data.get('norm1'),
            norm2=data.get('norm2')
        ))
        
        if result.get('status') == 'error':
            return jsonify(result), 500
        
        return jsonify(result), 200
    
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Erro na comparação: {str(e)}"}), 500


@bridge_bp.route("/norms", methods=["GET"])
def get_supported_norms():
    """
    Retorna lista de normas regulatórias suportadas
    """
    try:
        ai = get_bridge()
        norms = ai.get_supported_norms()
        
        from datetime import datetime, timezone
        
        return jsonify({
            'norms': norms,
            'total': len(norms),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 200
    
    except Exception as e:
        return jsonify({"error": f"Erro ao listar normas: {str(e)}"}), 500


@bridge_bp.route("/health", methods=["GET"])
def health_check():
    """Health check do módulo Bridge AI"""
    try:
        import os
        api_key = os.getenv('OPENAI_API_KEY')
        
        from datetime import datetime, timezone
        
        return jsonify({
            'status': 'healthy',
            'module': 'Bridge AI',
            'version': '1.0.0',
            'openai_configured': bool(api_key),
            'supported_norms': ['ANM', 'JORC', 'NI43-101', 'PERC', 'SAMREC'],
            'timestamp': datetime.now(timezone.utc).isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500


@bridge_bp.route("/capabilities", methods=["GET"])
def get_capabilities():
    """Retorna capacidades do Bridge AI"""
    return jsonify({
        'module': 'Bridge AI - Tradução Normativa',
        'version': '1.0.0',
        'features': {
            'translation': {
                'description': 'Tradução semântica entre normas',
                'supported_norms': ['ANM', 'JORC', 'NI43-101', 'PERC', 'SAMREC'],
                'explainability': True,
                'confidence_scoring': True
            },
            'comparison': {
                'description': 'Análise comparativa entre normas',
                'outputs': [
                    'Principais diferenças',
                    'Sistemas de classificação',
                    'Requisitos de relatórios',
                    'Equivalências chave',
                    'Impacto prático'
                ]
            }
        },
        'endpoints': {
            '/api/bridge/translate': 'POST - Traduz texto entre normas',
            '/api/bridge/compare': 'POST - Compara duas normas',
            '/api/bridge/norms': 'GET - Lista normas suportadas',
            '/api/bridge/health': 'GET - Status do módulo',
            '/api/bridge/capabilities': 'GET - Capacidades disponíveis'
        },
        'integration': {
            'validator': 'Compatível com Validator AI',
            'report_generator': 'Compatível com Report Generator',
            'audit': 'Integrado com Audit/KRCI'
        }
    }), 200


@bridge_bp.route("/status", methods=["GET"])
def bridge_status():
    """Endpoint para status simplificado do módulo"""
    return jsonify({
        "module": "Bridge AI",
        "status": "ativo ✅",
        "version": "1.0.0"
    }), 200
