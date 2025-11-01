"""
Radar AI - FastAPI Routes
==========================
Endpoints REST para monitoramento regulatório global.

Author: QIVO Intelligence Platform
Version: 5.0.0
Date: 2025-11-01
"""

import time
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse

# Flask imports para compatibilidade
try:
    from flask import Blueprint as FlaskBlueprint, jsonify as flask_jsonify
    FLASK_AVAILABLE = True
except ImportError:
    FLASK_AVAILABLE = False

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
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao inicializar Radar Engine: {str(e)}"
            )
    return _radar_engine


# ============================================
# FASTAPI ROUTER
# ============================================

router = APIRouter(
    prefix="/api/radar",
    tags=["Radar AI"],
    responses={
        500: {"description": "Internal server error"},
        400: {"description": "Bad request"}
    }
)


@router.post(
    "/analyze",
    response_model=RadarResponse,
    status_code=status.HTTP_200_OK,
    summary="Executar análise de monitoramento regulatório",
    description="""
    Executa ciclo completo de monitoramento regulatório:
    - Busca dados de fontes oficiais (ANM, JORC, NI43-101, PERC, SAMREC)
    - Detecta mudanças e riscos emergentes
    - Classifica severidade (Low, Medium, High, Critical)
    - Gera alertas estruturados
    - Opcional: análise profunda com GPT-4o
    - Opcional: resumo executivo
    
    **Performance esperada:**
    - Sem deep: ~1-2 segundos
    - Com deep: ~3-7 segundos
    - Com summarize: +2-4 segundos
    """
)
async def analyze_regulatory_changes(request: RadarRequest):
    """
    Endpoint principal para análise de mudanças regulatórias.
    
    Args:
        request: RadarRequest com sources, deep, summarize
        
    Returns:
        RadarResponse com timestamp, alerts, e opcional executive_summary
        
    Raises:
        HTTPException 400: Requisição inválida
        HTTPException 500: Erro interno
    """
    start_time = time.time()
    
    try:
        radar = get_radar()
        
        # Executa ciclo de monitoramento
        result = await radar.run_cycle(
            sources=request.sources,
            deep=request.deep,
            summarize=request.summarize
        )
        
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
        
        return RadarResponse(**response_data)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dados inválidos: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao executar análise: {str(e)}"
        )


@router.get(
    "/sources",
    response_model=AllSourcesResponse,
    status_code=status.HTTP_200_OK,
    summary="Listar todas as fontes regulatórias suportadas",
    description="""
    Retorna lista completa de fontes regulatórias monitoradas:
    - ANM (Brasil)
    - JORC (Austrália)
    - NI43-101 (Canadá)
    - PERC (Rússia)
    - SAMREC (África do Sul)
    
    Cada fonte inclui metadados completos, versão atual e data da última atualização.
    """
)
async def list_sources():
    """
    Lista todas as fontes regulatórias suportadas com metadados.
    
    Returns:
        AllSourcesResponse com lista de fontes e metadados
    """
    try:
        radar = get_radar()
        sources = radar.get_supported_sources()
        
        sources_info = []
        for source_name in sources:
            metadata_dict = radar.get_source_metadata(source_name)
            
            if metadata_dict:
                # Converte dict para SourceMetadata
                metadata = SourceMetadata(**metadata_dict)
                
                # Busca versão atual (simulada)
                version = radar._get_source_version(source_name)
                
                source_info = SourceInfoResponse(
                    source=source_name,
                    metadata=metadata,
                    current_version=version,
                    last_update=None  # Seria obtido de cache real
                )
                sources_info.append(source_info)
        
        return AllSourcesResponse(
            total=len(sources_info),
            sources=sources_info
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar fontes: {str(e)}"
        )


@router.get(
    "/sources/{source_name}",
    response_model=SourceInfoResponse,
    status_code=status.HTTP_200_OK,
    summary="Obter informações de uma fonte específica",
    description="Retorna metadados detalhados de uma fonte regulatória específica."
)
async def get_source_info(source_name: str):
    """
    Retorna informações detalhadas sobre uma fonte específica.
    
    Args:
        source_name: Nome da fonte (ANM, JORC, NI43-101, PERC, SAMREC)
        
    Returns:
        SourceInfoResponse com metadados completos
        
    Raises:
        HTTPException 404: Fonte não encontrada
    """
    try:
        radar = get_radar()
        metadata_dict = radar.get_source_metadata(source_name)
        
        if not metadata_dict:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Fonte '{source_name}' não encontrada. Fontes válidas: {radar.get_supported_sources()}"
            )
        
        metadata = SourceMetadata(**metadata_dict)
        version = radar._get_source_version(source_name)
        
        return SourceInfoResponse(
            source=source_name,
            metadata=metadata,
            current_version=version,
            last_update=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter informações: {str(e)}"
        )


@router.post(
    "/compare",
    response_model=ComparisonResponse,
    status_code=status.HTTP_200_OK,
    summary="Comparar duas fontes regulatórias",
    description="""
    Compara duas fontes regulatórias identificando:
    - Diferenças principais
    - Similaridades
    - Score de compatibilidade (0-1)
    - Opcional: análise detalhada com GPT-4o
    """
)
async def compare_sources(request: ComparisonRequest):
    """
    Compara duas fontes regulatórias.
    
    Args:
        request: ComparisonRequest com source1, source2, deep
        
    Returns:
        ComparisonResponse com diferenças, similaridades, score
    """
    try:
        radar = get_radar()
        
        # Valida que as fontes existem
        meta1 = radar.get_source_metadata(request.source1)
        meta2 = radar.get_source_metadata(request.source2)
        
        if not meta1 or not meta2:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Uma ou ambas as fontes não foram encontradas"
            )
        
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
            "source1": request.source1,
            "source2": request.source2,
            "differences": differences if differences else ["Nenhuma diferença significativa detectada"],
            "similarities": similarities if similarities else ["Nenhuma similaridade detectada"],
            "compatibility_score": round(compatibility, 2)
        }
        
        # Análise profunda com GPT se solicitado
        if request.deep and radar.client:
            try:
                import json
                context = json.dumps({
                    "source1": {"name": request.source1, **meta1},
                    "source2": {"name": request.source2, **meta2}
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

                response = await radar.client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": "Você é um analista de compliance regulatório."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=600
                )
                
                response_data["analysis"] = response.choices[0].message.content.strip()
                
            except Exception as e:
                response_data["analysis"] = f"Erro ao gerar análise GPT: {str(e)}"
        
        return ComparisonResponse(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao comparar fontes: {str(e)}"
        )


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Verificar status do Radar AI",
    description="Health check com status de componentes e disponibilidade de recursos."
)
async def health_check():
    """
    Verifica saúde do módulo Radar AI.
    
    Returns:
        HealthResponse com status, versão, componentes disponíveis
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
        
        return HealthResponse(
            module="Radar AI",
            status=overall_status,
            version="5.0.0",
            sources_available=sources_count,
            gpt_enabled=gpt_available,
            uptime=None,  # Seria calculado com start time
            last_check=datetime.now(timezone.utc).isoformat()
        )
        
    except Exception as e:
        return HealthResponse(
            module="Radar AI",
            status="unhealthy",
            version="5.0.0",
            sources_available=0,
            gpt_enabled=False,
            last_check=datetime.now(timezone.utc).isoformat()
        )


@router.get(
    "/capabilities",
    response_model=CapabilitiesResponse,
    status_code=status.HTTP_200_OK,
    summary="Listar capacidades do Radar AI",
    description="Retorna lista completa de features, fontes suportadas e limites."
)
async def get_capabilities():
    """
    Lista todas as capacidades e features do Radar AI.
    
    Returns:
        CapabilitiesResponse com features, fontes, níveis de severidade
    """
    try:
        radar = get_radar()
        
        return CapabilitiesResponse(
            features=[
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
            supported_sources=radar.get_supported_sources(),
            severity_levels=["Low", "Medium", "High", "Critical"],
            max_sources_per_request=5,
            deep_analysis_available=radar.client is not None
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter capabilities: {str(e)}"
        )


# ============================================
# FLASK BLUEPRINT (Compatibilidade)
# ============================================

if FLASK_AVAILABLE:
    radar_bp = FlaskBlueprint("radar", __name__)
    
    @radar_bp.route("/status", methods=["GET"])
    def radar_status():
        """Endpoint Flask para compatibilidade com app/__init__.py"""
        return flask_jsonify({
            "module": "Radar AI",
            "status": "ativo ✅",
            "version": "5.0.0",
            "features": [
                "Monitoramento multi-fonte",
                "Análise GPT-4o",
                "Classificação de severidade",
                "Resumos executivos"
            ]
        })
    
    @radar_bp.route("/health", methods=["GET"])
    def radar_health_flask():
        """Health check para Flask"""
        try:
            radar = get_radar()
            sources = len(radar.get_supported_sources())
            gpt = radar.client is not None
            
            return flask_jsonify({
                "module": "Radar AI",
                "status": "healthy" if (sources == 5 and gpt) else "degraded",
                "sources_available": sources,
                "gpt_enabled": gpt
            })
        except Exception as e:
            return flask_jsonify({
                "module": "Radar AI",
                "status": "unhealthy",
                "error": str(e)
            }), 500
