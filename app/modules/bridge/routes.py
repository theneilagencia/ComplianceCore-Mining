"""
QIVO Intelligence Layer - Bridge AI Routes
Endpoints FastAPI para tradução normativa
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from typing import Dict, Any

from app.modules.bridge.schemas import (
    BridgeRequest,
    BridgeResponse,
    NormComparisonRequest,
    NormComparisonResponse,
    SupportedNormsResponse
)
from src.ai.core.bridge import BridgeAI


router = APIRouter(prefix="/api/bridge", tags=["Bridge AI"])

# Instância global do Bridge
bridge = None


def get_bridge():
    """Lazy initialization do BridgeAI"""
    global bridge
    if bridge is None:
        bridge = BridgeAI()
    return bridge


@router.post("/translate", response_model=BridgeResponse)
async def translate_normative(request: BridgeRequest):
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
        
    Returns:
        BridgeResponse com texto traduzido e metadados
        
    Raises:
        HTTPException: Se validação falhar ou erro no GPT
    """
    try:
        ai = get_bridge()
        
        result = await ai.translate_normative(
            text=request.text,
            source_norm=request.source_norm,
            target_norm=request.target_norm,
            explain=request.explain
        )
        
        # Se houve erro no engine, retornar com status apropriado
        if result.get('status') == 'error':
            return JSONResponse(
                status_code=500,
                content=result
            )
        
        return JSONResponse(
            status_code=200,
            content=result
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro no processamento: {str(e)}")


@router.post("/compare", response_model=NormComparisonResponse)
async def compare_norms(request: NormComparisonRequest):
    """
    Compara diferenças conceituais entre duas normas
    
    Args:
        norm1: Primeira norma
        norm2: Segunda norma
        
    Returns:
        Análise comparativa detalhada
    """
    try:
        ai = get_bridge()
        
        result = await ai.explain_norm_difference(
            norm1=request.norm1,
            norm2=request.norm2
        )
        
        if result.get('status') == 'error':
            return JSONResponse(
                status_code=500,
                content=result
            )
        
        return JSONResponse(
            status_code=200,
            content=result
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na comparação: {str(e)}")


@router.get("/norms", response_model=SupportedNormsResponse)
async def get_supported_norms():
    """
    Retorna lista de normas regulatórias suportadas
    
    Returns:
        Dicionário com metadados de cada norma
    """
    try:
        ai = get_bridge()
        norms = ai.get_supported_norms()
        
        from datetime import datetime, timezone
        
        return {
            'norms': norms,
            'total': len(norms),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar normas: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check do módulo Bridge AI"""
    try:
        import os
        api_key = os.getenv('OPENAI_API_KEY')
        
        from datetime import datetime, timezone
        
        return {
            'status': 'healthy',
            'module': 'Bridge AI',
            'version': '1.0.0',
            'openai_configured': bool(api_key),
            'supported_norms': ['ANM', 'JORC', 'NI43-101', 'PERC', 'SAMREC'],
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        return {
            'status': 'unhealthy',
            'error': str(e)
        }


@router.get("/capabilities")
async def get_capabilities():
    """Retorna capacidades do Bridge AI"""
    return {
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
    }
