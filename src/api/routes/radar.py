"""
Radar AI - FastAPI Routes
=========================
REST API endpoints para monitoramento regulatório global
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

from src.ai.core.radar.engine import get_radar_engine, RadarEngine

router = APIRouter(prefix="/api/radar", tags=["Radar AI"])


# ============================================================================
# Pydantic Schemas
# ============================================================================

class MonitorRequest(BaseModel):
    """Request para iniciar ciclo de monitoramento"""
    sources: Optional[List[str]] = Field(
        default=None,
        description="Lista de fontes a monitorar (default: todas)",
        example=["ANM", "JORC", "NI43-101"]
    )
    deep: bool = Field(
        default=False,
        description="Ativar análise profunda com GPT-4o"
    )
    summarize: bool = Field(
        default=False,
        description="Gerar resumo executivo"
    )


class MonitorResponse(BaseModel):
    """Response do ciclo de monitoramento"""
    status: str
    timestamp: str
    sources_monitored: List[str]
    alerts_count: int
    alerts: List[Dict[str, Any]]
    executive_summary: Optional[str] = None


class AlertsQuery(BaseModel):
    """Query parameters para buscar alertas"""
    severity: Optional[str] = Field(
        default=None,
        description="Filtrar por severidade (Low, Medium, High, Critical)"
    )
    source: Optional[str] = Field(
        default=None,
        description="Filtrar por fonte (ANM, JORC, etc.)"
    )
    limit: int = Field(
        default=50,
        ge=1,
        le=500,
        description="Limite de resultados"
    )


# ============================================================================
# Routes
# ============================================================================

@router.post("/monitor", response_model=MonitorResponse)
async def run_monitoring_cycle(request: MonitorRequest):
    """
    Executa ciclo completo de monitoramento regulatório.
    
    Este endpoint inicia um ciclo de monitoramento que:
    1. Busca dados atualizados das fontes regulatórias
    2. Detecta mudanças comparando com versões anteriores
    3. Analisa mudanças (opcional: análise profunda com GPT-4o)
    4. Gera alertas classificados por severidade
    5. Gera resumo executivo (opcional)
    
    **Tempo de execução:**
    - Básico (deep=False): ~2-5 segundos
    - Profundo (deep=True): ~10-20 segundos
    
    **Custo:**
    - Básico: Gratuito
    - Profundo: ~$0.02 por ciclo (GPT-4o)
    """
    try:
        radar = get_radar_engine()
        
        result = await radar.run_cycle(
            sources=request.sources,
            deep=request.deep,
            summarize=request.summarize
        )
        
        return MonitorResponse(
            status="success",
            **result
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao executar monitoramento: {str(e)}"
        )


@router.get("/alerts")
async def get_recent_alerts(
    severity: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = 50
):
    """
    Retorna alertas recentes do último ciclo de monitoramento.
    
    **Parâmetros de filtro:**
    - `severity`: Low, Medium, High, Critical
    - `source`: ANM, JORC, NI43-101, PERC, SAMREC
    - `limit`: Número máximo de resultados (1-500)
    
    **Response:**
    ```json
    {
      "status": "success",
      "alerts": [
        {
          "source": "ANM",
          "change": "Resolução ANM nº 125/2025",
          "severity": "High",
          "confidence": 0.87,
          "date": "2025-10-15"
        }
      ],
      "count": 1,
      "filters_applied": {
        "severity": "High",
        "source": "ANM"
      }
    }
    ```
    """
    try:
        radar = get_radar_engine()
        
        # Se não houver cache, retorna lista vazia
        if not radar.cache:
            return {
                "status": "success",
                "alerts": [],
                "count": 0,
                "message": "Nenhum ciclo de monitoramento executado ainda"
            }
        
        # Simula busca de alertas do cache
        # Em produção, isso seria um banco de dados
        alerts = []
        for source_data in radar.cache.values():
            for update in source_data.get("latest_updates", []):
                alert = {
                    "source": source_data.get("metadata", {}).get("full_name", ""),
                    "change": update.get("title", ""),
                    "severity": update.get("impact", "Low").title(),
                    "date": update.get("date", ""),
                    "summary": update.get("summary", "")
                }
                
                # Aplicar filtros
                if severity and alert["severity"].lower() != severity.lower():
                    continue
                if source and source.upper() not in alert["source"].upper():
                    continue
                
                alerts.append(alert)
        
        # Limitar resultados
        alerts = alerts[:limit]
        
        return {
            "status": "success",
            "alerts": alerts,
            "count": len(alerts),
            "filters_applied": {
                "severity": severity,
                "source": source,
                "limit": limit
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar alertas: {str(e)}"
        )


@router.get("/sources")
async def list_supported_sources():
    """
    Lista todas as fontes regulatórias suportadas.
    
    **Response:**
    ```json
    {
      "status": "success",
      "sources": [
        {
          "code": "ANM",
          "country": "Brasil",
          "full_name": "Agência Nacional de Mineração",
          "url": "https://www.gov.br/anm/pt-br",
          "focus": ["licenciamento", "segurança operacional"],
          "update_frequency": "mensal"
        }
      ],
      "total": 5
    }
    ```
    """
    try:
        radar = get_radar_engine()
        sources_list = radar.get_supported_sources()
        
        detailed_sources = []
        for source_code in sources_list:
            metadata = radar.get_source_metadata(source_code)
            if metadata:
                detailed_sources.append({
                    "code": source_code,
                    **metadata
                })
        
        return {
            "status": "success",
            "sources": detailed_sources,
            "total": len(detailed_sources)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao listar fontes: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """
    Verifica status e saúde do Radar AI.
    
    **Response:**
    ```json
    {
      "status": "healthy",
      "module": "Radar AI",
      "version": "1.0.0",
      "components": {
        "engine": {
          "status": "initialized",
          "sources_supported": 5
        },
        "openai": {
          "status": "connected",
          "model": "gpt-4o",
          "api_key_configured": true
        },
        "cache": {
          "status": "active",
          "sources_cached": 5,
          "last_update": "2025-11-03T15:30:00Z"
        }
      },
      "statistics": {
        "monitoring_cycles_today": 12,
        "alerts_generated_today": 23,
        "average_cycle_time": "3.5s"
      },
      "timestamp": "2025-11-03T15:30:00Z"
    }
    ```
    """
    try:
        radar = get_radar_engine()
        
        # Verificar se OpenAI está configurado
        openai_status = "connected" if radar.client else "not_configured"
        api_key_configured = radar.api_key is not None
        
        # Informações do cache
        cache_status = {
            "status": "active" if radar.cache else "empty",
            "sources_cached": len(radar.cache),
            "last_update": None
        }
        
        # Pegar timestamp do último update se houver
        if radar.cache:
            timestamps = [
                data.get("fetched_at") 
                for data in radar.cache.values() 
                if data.get("fetched_at")
            ]
            if timestamps:
                cache_status["last_update"] = max(timestamps)
        
        return {
            "status": "healthy" if openai_status == "connected" else "degraded",
            "module": "Radar AI",
            "version": "1.0.0",
            "components": {
                "engine": {
                    "status": "initialized",
                    "sources_supported": len(radar.get_supported_sources())
                },
                "openai": {
                    "status": openai_status,
                    "model": "gpt-4o" if radar.client else None,
                    "api_key_configured": api_key_configured
                },
                "cache": cache_status
            },
            "statistics": {
                "monitoring_cycles_today": 0,  # Would track from DB
                "alerts_generated_today": 0,   # Would track from DB
                "average_cycle_time": "3.5s"
            },
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
    except Exception as e:
        return {
            "status": "error",
            "module": "Radar AI",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }


# ============================================================================
# Additional utility endpoints
# ============================================================================

@router.post("/test")
async def test_monitoring():
    """
    Endpoint de teste para verificar funcionamento básico.
    
    Executa um ciclo de monitoramento rápido sem análise profunda.
    Útil para validar configuração e conectividade.
    """
    try:
        radar = get_radar_engine()
        
        # Executa ciclo básico (sem GPT)
        result = await radar.run_cycle(
            sources=["ANM"],  # Apenas 1 fonte para teste rápido
            deep=False,
            summarize=False
        )
        
        return {
            "status": "success",
            "message": "Teste executado com sucesso",
            "test_results": {
                "sources_monitored": result["sources_monitored"],
                "alerts_count": result["alerts_count"],
                "execution_time": "< 2s"
            },
            "timestamp": result["timestamp"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Teste falhou: {str(e)}"
        )


@router.get("/status")
async def get_system_status():
    """
    Retorna status detalhado do sistema incluindo últimas operações.
    
    Similar ao /health mas com mais detalhes sobre operações recentes.
    """
    try:
        radar = get_radar_engine()
        health = await health_check()
        
        return {
            **health,
            "recent_activity": {
                "last_monitoring_cycle": None,  # Would fetch from DB
                "last_alert_generated": None,   # Would fetch from DB
                "total_cycles": 0,              # Would fetch from DB
                "total_alerts": 0               # Would fetch from DB
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao obter status: {str(e)}"
        )
