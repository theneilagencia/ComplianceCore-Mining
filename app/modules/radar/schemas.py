"""
Radar AI - Pydantic Schemas
============================
Modelos de validação para requisições e respostas do Radar AI.

Author: QIVO Intelligence Platform
Version: 5.0.0
Date: 2025-11-01
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime


# Tipos literais para validação
SeverityLevel = Literal["Low", "Medium", "High", "Critical"]
ChangeType = Literal["regulatory_change", "code_update", "guidance", "standard_update", "code_revision", "administrative", "unknown"]
SourceName = Literal["ANM", "JORC", "NI43-101", "PERC", "SAMREC"]


class SourceMetadata(BaseModel):
    """Metadados de uma fonte regulatória."""
    
    country: str = Field(..., description="País de origem da norma")
    full_name: str = Field(..., description="Nome completo da agência/código")
    url: str = Field(..., description="URL oficial da fonte")
    focus: List[str] = Field(..., description="Áreas de foco da regulamentação")
    language: str = Field(..., description="Idioma principal")
    update_frequency: str = Field(..., description="Frequência de atualização")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "country": "Brasil",
                "full_name": "Agência Nacional de Mineração",
                "url": "https://www.gov.br/anm/pt-br",
                "focus": ["licenciamento", "segurança operacional"],
                "language": "pt-BR",
                "update_frequency": "mensal"
            }
        }
    }


class RadarAlert(BaseModel):
    """Alerta de mudança regulatória detectada."""
    
    source: SourceName = Field(..., description="Fonte da mudança (ANM, JORC, etc.)")
    change: str = Field(..., min_length=10, max_length=500, description="Título da mudança")
    severity: SeverityLevel = Field(..., description="Nível de severidade")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confiança da detecção (0-1)")
    summary: str = Field(..., min_length=20, max_length=2000, description="Resumo da mudança")
    date: Optional[str] = Field(None, description="Data da mudança (ISO 8601)")
    impact_level: Optional[str] = Field(None, description="Nível de impacto original")
    recommendations: List[str] = Field(default_factory=list, description="Recomendações de ação")
    risk_keywords: List[str] = Field(default_factory=list, description="Palavras-chave de risco")
    version_change: Optional[str] = Field(None, description="Mudança de versão detectada")
    detected_at: str = Field(..., description="Timestamp da detecção")
    gpt_analysis: Optional[str] = Field(None, description="Análise detalhada do GPT")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "source": "ANM",
                "change": "Resolução ANM nº 125/2025 - Novos requisitos para barragens",
                "severity": "High",
                "confidence": 0.93,
                "summary": "Estabelece novos critérios de segurança para barragens classe C e D",
                "date": "2025-10-15",
                "impact_level": "high",
                "recommendations": [
                    "Revisar inventário de barragens",
                    "Atualizar planos de emergência"
                ],
                "risk_keywords": ["barragem", "segurança", "classe C"],
                "version_change": "v2025.09 → v2025.10",
                "detected_at": "2025-11-01T12:00:00Z"
            }
        }
    }


class RadarRequest(BaseModel):
    """Requisição para análise do Radar AI."""
    
    sources: Optional[List[SourceName]] = Field(
        default=None,
        description="Fontes específicas para monitorar (default: todas)"
    )
    deep: bool = Field(
        default=False,
        description="Ativa análise semântica profunda com GPT-4o"
    )
    summarize: bool = Field(
        default=False,
        description="Gera resumo executivo dos achados"
    )
    
    @field_validator("sources")
    @classmethod
    def validate_sources(cls, v):
        """Valida que as fontes existem."""
        if v is not None:
            valid_sources = ["ANM", "JORC", "NI43-101", "PERC", "SAMREC"]
            for source in v:
                if source not in valid_sources:
                    raise ValueError(f"Fonte inválida: {source}. Fontes válidas: {valid_sources}")
        return v
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "sources": ["ANM", "JORC"],
                "deep": True,
                "summarize": True
            }
        }
    }


class RadarResponse(BaseModel):
    """Resposta do Radar AI com alertas detectados."""
    
    status: Literal["success", "error"] = Field(..., description="Status da operação")
    timestamp: str = Field(..., description="Timestamp da análise (ISO 8601)")
    sources_monitored: List[str] = Field(..., description="Fontes que foram monitoradas")
    alerts_count: int = Field(..., ge=0, description="Número total de alertas")
    alerts: List[RadarAlert] = Field(..., description="Lista de alertas detectados")
    executive_summary: Optional[str] = Field(None, description="Resumo executivo (se solicitado)")
    processing_time: Optional[float] = Field(None, description="Tempo de processamento (segundos)")
    error: Optional[str] = Field(None, description="Mensagem de erro (se houver)")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "status": "success",
                "timestamp": "2025-11-01T12:00:00Z",
                "sources_monitored": ["ANM", "JORC"],
                "alerts_count": 2,
                "alerts": [
                    {
                        "source": "ANM",
                        "change": "Resolução ANM nº 125/2025",
                        "severity": "High",
                        "confidence": 0.93,
                        "summary": "Novos requisitos para barragens",
                        "date": "2025-10-15",
                        "detected_at": "2025-11-01T12:00:00Z"
                    }
                ],
                "processing_time": 2.5
            }
        }
    }


class SourceInfoResponse(BaseModel):
    """Informações sobre uma fonte regulatória."""
    
    source: SourceName = Field(..., description="Nome da fonte")
    metadata: SourceMetadata = Field(..., description="Metadados completos")
    current_version: Optional[str] = Field(None, description="Versão atual")
    last_update: Optional[str] = Field(None, description="Data da última atualização")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "source": "ANM",
                "metadata": {
                    "country": "Brasil",
                    "full_name": "Agência Nacional de Mineração",
                    "url": "https://www.gov.br/anm/pt-br",
                    "focus": ["licenciamento", "segurança operacional"],
                    "language": "pt-BR",
                    "update_frequency": "mensal"
                },
                "current_version": "v2025.10",
                "last_update": "2025-10-15"
            }
        }
    }


class AllSourcesResponse(BaseModel):
    """Lista de todas as fontes suportadas."""
    
    total: int = Field(..., ge=0, description="Total de fontes suportadas")
    sources: List[SourceInfoResponse] = Field(..., description="Lista de fontes com metadados")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "total": 5,
                "sources": [
                    {
                        "source": "ANM",
                        "metadata": {
                            "country": "Brasil",
                            "full_name": "Agência Nacional de Mineração",
                            "url": "https://www.gov.br/anm/pt-br",
                            "focus": ["licenciamento"],
                            "language": "pt-BR",
                            "update_frequency": "mensal"
                        }
                    }
                ]
            }
        }
    }


class HealthResponse(BaseModel):
    """Status de saúde do Radar AI."""
    
    module: str = Field(default="Radar AI", description="Nome do módulo")
    status: Literal["healthy", "degraded", "unhealthy"] = Field(..., description="Status geral")
    version: str = Field(default="5.0.0", description="Versão do módulo")
    sources_available: int = Field(..., ge=0, description="Fontes disponíveis")
    gpt_enabled: bool = Field(..., description="GPT-4o disponível")
    uptime: Optional[float] = Field(None, description="Tempo ativo (segundos)")
    last_check: str = Field(..., description="Última verificação (ISO 8601)")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "module": "Radar AI",
                "status": "healthy",
                "version": "5.0.0",
                "sources_available": 5,
                "gpt_enabled": True,
                "uptime": 3600.5,
                "last_check": "2025-11-01T12:00:00Z"
            }
        }
    }


class CapabilitiesResponse(BaseModel):
    """Capacidades e features do Radar AI."""
    
    features: List[str] = Field(..., description="Lista de funcionalidades disponíveis")
    supported_sources: List[SourceName] = Field(..., description="Fontes regulatórias suportadas")
    severity_levels: List[SeverityLevel] = Field(..., description="Níveis de severidade")
    max_sources_per_request: int = Field(default=5, description="Máximo de fontes por requisição")
    deep_analysis_available: bool = Field(..., description="Análise profunda disponível")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "features": [
                    "Monitoramento multi-fonte",
                    "Análise semântica com GPT-4o",
                    "Classificação automática de severidade",
                    "Geração de resumos executivos",
                    "Integração com Bridge e Validator AI"
                ],
                "supported_sources": ["ANM", "JORC", "NI43-101", "PERC", "SAMREC"],
                "severity_levels": ["Low", "Medium", "High", "Critical"],
                "max_sources_per_request": 5,
                "deep_analysis_available": True
            }
        }
    }


class ComparisonRequest(BaseModel):
    """Requisição para comparação entre duas fontes."""
    
    source1: SourceName = Field(..., description="Primeira fonte")
    source2: SourceName = Field(..., description="Segunda fonte")
    deep: bool = Field(default=False, description="Análise profunda com GPT")
    
    @field_validator("source2")
    @classmethod
    def validate_different_sources(cls, v, info):
        """Valida que as fontes são diferentes."""
        if "source1" in info.data and v == info.data["source1"]:
            raise ValueError("As fontes devem ser diferentes")
        return v
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "source1": "ANM",
                "source2": "JORC",
                "deep": True
            }
        }
    }


class ComparisonResponse(BaseModel):
    """Resposta da comparação entre fontes."""
    
    source1: SourceName = Field(..., description="Primeira fonte")
    source2: SourceName = Field(..., description="Segunda fonte")
    differences: List[str] = Field(..., description="Principais diferenças")
    similarities: List[str] = Field(..., description="Principais similaridades")
    compatibility_score: float = Field(..., ge=0.0, le=1.0, description="Score de compatibilidade")
    analysis: Optional[str] = Field(None, description="Análise detalhada (se deep=True)")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "source1": "ANM",
                "source2": "JORC",
                "differences": [
                    "ANM foca mais em licenciamento ambiental",
                    "JORC é mais rigoroso em reporting de recursos"
                ],
                "similarities": [
                    "Ambos exigem profissionais qualificados",
                    "Foco em transparência e due diligence"
                ],
                "compatibility_score": 0.72,
                "analysis": "As normas possuem 72% de compatibilidade..."
            }
        }
    }
