"""
QIVO Intelligence Layer - Bridge AI Schemas
Modelos Pydantic para validação de requests/responses
"""

from pydantic import BaseModel, Field, field_validator
from typing import Literal, Optional, Dict, Any


# Tipos de normas suportadas
NormType = Literal['ANM', 'JORC', 'NI43-101', 'PERC', 'SAMREC']


class BridgeRequest(BaseModel):
    """Schema para requisição de tradução normativa"""
    
    text: str = Field(
        ...,
        min_length=50,
        max_length=10000,
        description="Texto técnico a traduzir (50-10000 caracteres)"
    )
    
    source_norm: NormType = Field(
        ...,
        description="Norma regulatória de origem"
    )
    
    target_norm: NormType = Field(
        ...,
        description="Norma regulatória de destino"
    )
    
    explain: bool = Field(
        default=False,
        description="Se True, retorna justificativa das traduções"
    )
    
    @field_validator('text')
    @classmethod
    def validate_text(cls, v: str) -> str:
        """Valida e limpa o texto"""
        text = v.strip()
        if not text:
            raise ValueError("Texto não pode ser vazio")
        if len(text) < 50:
            raise ValueError("Texto muito curto. Mínimo 50 caracteres.")
        return text
    
    @field_validator('target_norm')
    @classmethod
    def validate_different_norms(cls, v: str, info) -> str:
        """Valida que origem e destino são diferentes"""
        if 'source_norm' in info.data and v == info.data['source_norm']:
            raise ValueError("Normas de origem e destino devem ser diferentes")
        return v
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "text": "A jazida apresenta recursos medidos de 10 milhões de toneladas...",
                    "source_norm": "ANM",
                    "target_norm": "JORC",
                    "explain": True
                }
            ]
        }
    }


class NormMetadata(BaseModel):
    """Metadados de uma norma regulatória"""
    
    country: str = Field(..., description="País/região de origem")
    full_name: str = Field(..., description="Nome completo da norma")
    focus: str = Field(..., description="Foco principal da norma")
    keywords: list[str] = Field(..., description="Termos-chave da norma")


class BridgeResponse(BaseModel):
    """Schema para resposta de tradução normativa"""
    
    status: Literal['success', 'error'] = Field(
        ...,
        description="Status da operação"
    )
    
    translated_text: Optional[str] = Field(
        None,
        description="Texto traduzido para norma de destino"
    )
    
    confidence: Optional[int] = Field(
        None,
        ge=0,
        le=100,
        description="Score de confiança da tradução (0-100)"
    )
    
    explanation: Optional[str] = Field(
        None,
        description="Justificativa das escolhas de tradução (se explain=True)"
    )
    
    semantic_mapping: Optional[Dict[str, str]] = Field(
        None,
        description="Mapeamento termo_origem → termo_destino"
    )
    
    source_metadata: Optional[NormMetadata] = Field(
        None,
        description="Metadados da norma de origem"
    )
    
    target_metadata: Optional[NormMetadata] = Field(
        None,
        description="Metadados da norma de destino"
    )
    
    message: Optional[str] = Field(
        None,
        description="Mensagem de erro (se status='error')"
    )
    
    timestamp: str = Field(
        ...,
        description="Timestamp ISO 8601 da operação"
    )
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "status": "success",
                    "translated_text": "The deposit presents measured resources of 10 million tonnes...",
                    "confidence": 92,
                    "explanation": "Traduzido 'jazida' para 'deposit', 'recursos medidos' para 'measured resources'...",
                    "semantic_mapping": {
                        "jazida": "deposit",
                        "recursos medidos": "measured resources"
                    },
                    "source_metadata": {
                        "country": "Brasil",
                        "full_name": "Agência Nacional de Mineração",
                        "focus": "Código de Mineração Brasileiro",
                        "keywords": ["DNPM", "lavra", "pesquisa mineral"]
                    },
                    "timestamp": "2025-11-01T14:30:00Z"
                }
            ]
        }
    }


class NormComparisonRequest(BaseModel):
    """Schema para comparação entre normas"""
    
    norm1: NormType = Field(..., description="Primeira norma a comparar")
    norm2: NormType = Field(..., description="Segunda norma a comparar")
    
    @field_validator('norm2')
    @classmethod
    def validate_different_norms(cls, v: str, info) -> str:
        """Valida que as normas são diferentes"""
        if 'norm1' in info.data and v == info.data['norm1']:
            raise ValueError("As normas devem ser diferentes")
        return v


class NormComparisonResponse(BaseModel):
    """Schema para resposta de comparação"""
    
    status: Literal['success', 'error'] = Field(..., description="Status")
    
    main_differences: Optional[list[str]] = Field(
        None,
        description="Principais diferenças entre as normas"
    )
    
    classification_systems: Optional[Dict[str, str]] = Field(
        None,
        description="Sistemas de classificação de cada norma"
    )
    
    reporting_requirements: Optional[Dict[str, str]] = Field(
        None,
        description="Requisitos de relatórios de cada norma"
    )
    
    key_equivalences: Optional[Dict[str, str]] = Field(
        None,
        description="Equivalências chave entre termos"
    )
    
    practical_impact: Optional[str] = Field(
        None,
        description="Impacto prático das diferenças"
    )
    
    message: Optional[str] = Field(None, description="Mensagem de erro")
    timestamp: str = Field(..., description="Timestamp ISO 8601")


class SupportedNormsResponse(BaseModel):
    """Schema para lista de normas suportadas"""
    
    norms: Dict[str, NormMetadata] = Field(
        ...,
        description="Dicionário de normas suportadas"
    )
    
    total: int = Field(..., description="Número total de normas")
    timestamp: str = Field(..., description="Timestamp ISO 8601")
