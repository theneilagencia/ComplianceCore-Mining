"""
Radar AI - Flask Routes
========================
Endpoints REST para monitoramento regulatório global.

Author: QIVO Intelligence Platform
Version: 5.1.0
Date: 2025-11-02
"""

import time
from datetime import datetime, timezone
from typing import Optional
from flask import Blueprint, jsonify, request

# Imports locais
from app.modules.radar.schemas import (
    RadarRequest,
    RadarResponse,
    RadarAlert,
    HealthResponse,
    CapabilitiesResponse,
    AllSourcesResponse,
    SourceInfoResponse,
    SourceMetadata,
    ComparisonRequest,
    ComparisonResponse
)

# Lazy import do engine (evita circular imports)
_radar_engine = None

def get_radar():
    """Lazy initialization do RadarEngine."""
    global _radar_engine
    if _radar_engine is None:
        try:
            from src.ai.core.radar.engine import get_radar_engine
            _radar_engine = get_radar_engine()
        except Exception as e:
            raise RuntimeError(f"Erro ao inicializar Radar Engine: {str(e)}")
    return _radar_engine


# ============================================
# FLASK BLUEPRINT
# ============================================

radar_bp = Blueprint("radar", __name__, url_prefix="/api/radar")


@radar_bp.route("/analyze", methods=["POST"])
def analyze_regulatory_changes():
    """
    Executa ciclo completo de monitoramento regulatório:
    - Busca dados de fontes oficiais (ANM, JORC, NI43-101, PERC, SAMREC)
    - Detecta mudanças e riscos emergentes
    - Classifica severidade (Low, Medium, High, Critical)
    - Gera alertas estruturados
    - Opcional: análise profunda com GPT-4o
    - Opcional: resumo executivo
    
    Performance esperada:
    - Sem deep: ~1-2 segundos
    - Com deep: ~3-7 segundos
    - Com summarize: +2-4 segundos
    """
    start_time = time.time()
    
    try:
        # Parse request JSON
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        
        radar = get_radar()
        
        # Extrai parâmetros do request
        sources = data.get("sources", None)
        deep = data.get("deep", False)
        summarize = data.get("summarize", False)
        
        # Executa ciclo de monitoramento (síncron se engine não for async)
        import asyncio
        result = asyncio.run(radar.run_cycle(
            sources=sources,
            deep=deep,
            summarize=summarize
        ))
        
        # Calcula tempo de processamento
        processing_time = round(time.time() - start_time, 2)
        
        # Formata resposta
        response_data = {
            "status": "success",
            "timestamp": result["timestamp"],
            "sources_monitored": result["sources_monitored"],
            "alerts_count": result["alerts_count"],
            "alerts": result["alerts"],
            "processing_time": processing_time
        }
        
        # Adiciona resumo se solicitado
        if "executive_summary" in result:
            response_data["executive_summary"] = result["executive_summary"]
        
        return jsonify(response_data), 200
        
    except ValueError as e:
        return jsonify({"error": f"Dados inválidos: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Erro ao executar análise: {str(e)}"}), 500


@radar_bp.route("/sources", methods=["GET"])
def list_sources():
    """
    Lista todas as fontes regulatórias suportadas:
    - ANM (Brasil)
    - JORC (Austrália)
    - NI43-101 (Canadá)
    - PERC (Rússia)
    - SAMREC (África do Sul)
    
    Cada fonte inclui metadados completos, versão atual e data da última atualização.
    """
    try:
        radar = get_radar()
        sources = radar.get_supported_sources()
        
        sources_info = []
        for source_name in sources:
            metadata_dict = radar.get_source_metadata(source_name)
            
            if metadata_dict:
                # Busca versão atual (simulada)
                version = radar._get_source_version(source_name)
                
                source_info = {
                    "source": source_name,
                    "metadata": metadata_dict,
                    "current_version": version,
                    "last_update": None  # Seria obtido de cache real
                }
                sources_info.append(source_info)
        
        return jsonify({
            "total": len(sources_info),
            "sources": sources_info
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro ao listar fontes: {str(e)}"}), 500


@radar_bp.route("/sources/<source_name>", methods=["GET"])
def get_source_info(source_name: str):
    """
    Retorna informações detalhadas sobre uma fonte específica.
    
    Args:
        source_name: Nome da fonte (ANM, JORC, NI43-101, PERC, SAMREC)
    """
    try:
        radar = get_radar()
        metadata_dict = radar.get_source_metadata(source_name)
        
        if not metadata_dict:
            return jsonify({
                "error": f"Fonte '{source_name}' não encontrada. Fontes válidas: {radar.get_supported_sources()}"
            }), 404
        
        version = radar._get_source_version(source_name)
        
        return jsonify({
            "source": source_name,
            "metadata": metadata_dict,
            "current_version": version,
            "last_update": None
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro ao obter informações: {str(e)}"}), 500


@radar_bp.route("/compare", methods=["POST"])
def compare_sources():
    """
    Compara duas fontes regulatórias identificando:
    - Diferenças principais
    - Similaridades
    - Score de compatibilidade (0-1)
    - Opcional: análise detalhada com GPT-4o
    """
    try:
        # Parse request JSON
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        
        source1 = data.get("source1")
        source2 = data.get("source2")
        deep = data.get("deep", False)
        
        if not source1 or not source2:
            return jsonify({"error": "source1 and source2 are required"}), 400
        
        radar = get_radar()
        
        # Valida que as fontes existem
        meta1 = radar.get_source_metadata(source1)
        meta2 = radar.get_source_metadata(source2)
        
        if not meta1 or not meta2:
            return jsonify({"error": "Uma ou ambas as fontes não foram encontradas"}), 404
        
        # Análise básica de diferenças
        differences = []
        similarities = []
        
        # Compara foco
        focus1 = set(meta1["focus"])
        focus2 = set(meta2["focus"])
        
        unique1 = focus1 - focus2
        unique2 = focus2 - focus1
        common = focus1 & focus2
        
        if unique1:
            differences.append(f"{request.source1} foca em: {', '.join(unique1)}")
        if unique2:
            differences.append(f"{request.source2} foca em: {', '.join(unique2)}")
        if common:
            similarities.append(f"Ambos focam em: {', '.join(common)}")
        
        # Compara idiomas
        if meta1["language"] != meta2["language"]:
            differences.append(f"Idiomas diferentes: {meta1['language']} vs {meta2['language']}")
        else:
            similarities.append(f"Mesmo idioma: {meta1['language']}")
        
        # Calcula score de compatibilidade (simplificado)
        if len(focus1) > 0 or len(focus2) > 0:
            compatibility = len(common) / (len(focus1 | focus2))
        else:
            compatibility = 0.0
        
        response_data = {
            "source1": source1,
            "source2": source2,
            "differences": differences if differences else ["Nenhuma diferença significativa detectada"],
            "similarities": similarities if similarities else ["Nenhuma similaridade detectada"],
            "compatibility_score": round(compatibility, 2)
        }
        
        # Análise profunda com GPT se solicitado
        if deep and radar.client:
            try:
                import json
                import asyncio
                context = json.dumps({
                    "source1": {"name": source1, **meta1},
                    "source2": {"name": source2, **meta2}
                }, indent=2, ensure_ascii=False)
                
                prompt = f"""Você é um especialista em regulamentação de mineração internacional.

Compare as seguintes normas regulatórias e forneça uma análise detalhada:
{context}

Inclua:
- Principais diferenças operacionais
- Similaridades conceituais
- Desafios de harmonização
- Recomendações para empresas que operam sob ambas as normas

Seja técnico e objetivo (2-3 parágrafos)."""

                gpt_response = asyncio.run(radar.client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": "Você é um analista de compliance regulatório."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=600
                ))
                
                response_data["analysis"] = gpt_response.choices[0].message.content.strip()
                
            except Exception as e:
                response_data["analysis"] = f"Erro ao gerar análise GPT: {str(e)}"
        
        return jsonify(response_data), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro ao comparar fontes: {str(e)}"}), 500


@radar_bp.route("/health", methods=["GET"])
def health_check():
    """
    Verifica saúde do módulo Radar AI.
    Health check com status de componentes e disponibilidade de recursos.
    """
    try:
        radar = get_radar()
        
        sources_count = len(radar.get_supported_sources())
        gpt_available = radar.client is not None
        
        # Determina status geral
        if gpt_available and sources_count == 5:
            overall_status = "healthy"
        elif sources_count >= 3:
            overall_status = "degraded"
        else:
            overall_status = "unhealthy"
        
        return jsonify({
            "module": "Radar AI",
            "status": overall_status,
            "version": "5.1.0",
            "sources_available": sources_count,
            "gpt_enabled": gpt_available,
            "uptime": None,  # Seria calculado com start time
            "last_check": datetime.now(timezone.utc).isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            "module": "Radar AI",
            "status": "unhealthy",
            "version": "5.1.0",
            "sources_available": 0,
            "gpt_enabled": False,
            "error": str(e),
            "last_check": datetime.now(timezone.utc).isoformat()
        }), 500


@radar_bp.route("/capabilities", methods=["GET"])
def get_capabilities():
    """
    Lista todas as capacidades e features do Radar AI.
    Retorna lista completa de features, fontes suportadas e limites.
    """
    try:
        radar = get_radar()
        
        return jsonify({
            "features": [
                "Monitoramento multi-fonte em tempo real",
                "Detecção automática de mudanças regulatórias",
                "Análise semântica com GPT-4o",
                "Classificação de severidade (Low → Critical)",
                "Geração de resumos executivos",
                "Comparação entre normas",
                "Integração com Bridge AI e Validator AI",
                "Cache inteligente de versões",
                "Recomendações de ação automatizadas"
            ],
            "supported_sources": radar.get_supported_sources(),
            "severity_levels": ["Low", "Medium", "High", "Critical"],
            "max_sources_per_request": 5,
            "deep_analysis_available": radar.client is not None
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro ao obter capabilities: {str(e)}"}), 500


# ============================================
# STATUS ENDPOINT (Compatibilidade)
# ============================================

@radar_bp.route("/status", methods=["GET"])
def radar_status():
    """Endpoint para status simplificado do módulo"""
    return jsonify({
        "module": "Radar AI",
        "status": "ativo ✅",
        "version": "5.1.0",
        "features": [
            "Monitoramento multi-fonte",
            "Análise GPT-4o",
            "Classificação de severidade",
            "Resumos executivos"
        ]
    }), 200
