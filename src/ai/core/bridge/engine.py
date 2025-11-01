"""
QIVO Intelligence Layer - Bridge AI Engine
Tradução semântica entre normas regulatórias globais
"""

import os
import json
from typing import Dict, Any, Optional, Literal
from openai import AsyncOpenAI
from datetime import datetime, timezone


# Tipos de normas suportadas
NormType = Literal['ANM', 'JORC', 'NI43-101', 'PERC', 'SAMREC']


class BridgeAI:
    """
    Engine de tradução semântica entre normas regulatórias de mineração
    
    Suporta:
    - ANM (Brasil - Agência Nacional de Mineração)
    - JORC (Austrália/Internacional)
    - NI 43-101 (Canadá)
    - PERC (Rússia)
    - SAMREC (África do Sul)
    """
    
    # Mapeamento de normas e suas características
    NORMS_METADATA = {
        'ANM': {
            'country': 'Brasil',
            'full_name': 'Agência Nacional de Mineração',
            'focus': 'Código de Mineração Brasileiro',
            'keywords': ['DNPM', 'lavra', 'pesquisa mineral', 'jazida', 'RAL', 'CFEM']
        },
        'JORC': {
            'country': 'Austrália/Internacional',
            'full_name': 'Joint Ore Reserves Committee',
            'focus': 'Recursos e Reservas Minerais',
            'keywords': ['measured', 'indicated', 'inferred', 'competent person', 'JORC Code']
        },
        'NI43-101': {
            'country': 'Canadá',
            'full_name': 'Canadian National Instrument 43-101',
            'focus': 'Divulgação de Projetos Minerais',
            'keywords': ['qualified person', 'technical report', 'CIM', 'mineral resource', 'mineral reserve']
        },
        'PERC': {
            'country': 'Rússia',
            'full_name': 'Russian Reserves and Resources Classification',
            'focus': 'Classificação Russa de Reservas',
            'keywords': ['A, B, C1, C2', 'GKZ', 'proved reserves', 'probable reserves']
        },
        'SAMREC': {
            'country': 'África do Sul',
            'full_name': 'South African Mineral Resource Committee',
            'focus': 'Código Sul-Africano',
            'keywords': ['SAMREC Code', 'competent person', 'mineral resource', 'mineral reserve']
        }
    }
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Inicializa Bridge AI
        
        Args:
            api_key: OpenAI API key (usa variável de ambiente se não fornecida)
        """
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY não configurada")
        
        self.client = AsyncOpenAI(api_key=self.api_key)
        
        # Configurações do modelo
        self.model = "gpt-4o"  # GPT-4 Turbo para melhor raciocínio
        self.max_tokens = 3000
        self.temperature = 0.2  # Baixa para consistência em traduções técnicas
    
    async def translate_normative(
        self,
        text: str,
        source_norm: NormType,
        target_norm: NormType,
        explain: bool = False
    ) -> Dict[str, Any]:
        """
        Traduz texto entre normas regulatórias
        
        Args:
            text: Texto técnico a traduzir
            source_norm: Norma de origem (ANM, JORC, NI43-101, PERC, SAMREC)
            target_norm: Norma de destino
            explain: Se True, inclui justificativa semântica
            
        Returns:
            Dict com:
                - translated_text: Texto traduzido
                - confidence: Score de confiança 0-100
                - explanation: Justificativa (se explain=True)
                - source_metadata: Metadados da norma origem
                - target_metadata: Metadados da norma destino
        """
        try:
            # Validar normas
            if source_norm not in self.NORMS_METADATA:
                raise ValueError(f"Norma de origem inválida: {source_norm}")
            if target_norm not in self.NORMS_METADATA:
                raise ValueError(f"Norma de destino inválida: {target_norm}")
            if source_norm == target_norm:
                raise ValueError("Normas de origem e destino devem ser diferentes")
            
            # Limitar tamanho do texto
            max_chars = 8000
            if len(text) > max_chars:
                text = text[:max_chars] + "\n\n[... texto truncado ...]"
            
            # Construir prompt especializado
            system_prompt = self._build_system_prompt(source_norm, target_norm)
            user_prompt = self._build_user_prompt(text, source_norm, target_norm, explain)
            
            # Chamar GPT-4
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                response_format={"type": "json_object"}  # Forçar JSON
            )
            
            # Parsear resposta
            result_json = json.loads(response.choices[0].message.content)
            
            # Compilar resultado final
            result = {
                'status': 'success',
                'translated_text': result_json.get('translated_text', ''),
                'confidence': result_json.get('confidence', 0),
                'source_metadata': self.NORMS_METADATA[source_norm],
                'target_metadata': self.NORMS_METADATA[target_norm],
                'timestamp': self._get_timestamp()
            }
            
            if explain:
                result['explanation'] = result_json.get('explanation', '')
                result['semantic_mapping'] = result_json.get('semantic_mapping', {})
            
            return result
        
        except json.JSONDecodeError as e:
            return {
                'status': 'error',
                'message': f'Erro ao parsear resposta do GPT: {str(e)}',
                'timestamp': self._get_timestamp()
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': self._get_timestamp()
            }
    
    def _build_system_prompt(self, source_norm: NormType, target_norm: NormType) -> str:
        """Constrói prompt de sistema especializado"""
        source_meta = self.NORMS_METADATA[source_norm]
        target_meta = self.NORMS_METADATA[target_norm]
        
        return f"""Você é um especialista internacional em normas regulatórias de mineração.
Sua tarefa é traduzir semanticamente textos técnicos entre diferentes códigos regulatórios.

NORMA DE ORIGEM:
- Código: {source_norm}
- País: {source_meta['country']}
- Nome: {source_meta['full_name']}
- Foco: {source_meta['focus']}
- Termos-chave: {', '.join(source_meta['keywords'])}

NORMA DE DESTINO:
- Código: {target_norm}
- País: {target_meta['country']}
- Nome: {target_meta['full_name']}
- Foco: {target_meta['focus']}
- Termos-chave: {', '.join(target_meta['keywords'])}

REGRAS DE TRADUÇÃO:
1. Mantenha equivalência técnica e legal
2. Use terminologia oficial da norma de destino
3. Preserve classificações de recursos/reservas
4. Adapte unidades de medida se necessário
5. Mantenha rigor técnico e compliance

FORMATO DE RESPOSTA (JSON):
{{
    "translated_text": "Texto traduzido completo",
    "confidence": 85,
    "explanation": "Justificativa das escolhas de tradução",
    "semantic_mapping": {{
        "termo_origem": "termo_destino"
    }}
}}

O campo "confidence" deve ser um score de 0 a 100 baseado em:
- Clareza do texto original (30%)
- Equivalência direta de termos (40%)
- Contexto regulatório (30%)"""
    
    def _build_user_prompt(
        self,
        text: str,
        source_norm: NormType,
        target_norm: NormType,
        explain: bool
    ) -> str:
        """Constrói prompt do usuário"""
        explain_instruction = ""
        if explain:
            explain_instruction = """
ATENÇÃO: Inclua uma explicação detalhada das escolhas de tradução, destacando:
- Termos que mudaram e por quê
- Equivalências regulatórias aplicadas
- Adaptações necessárias ao contexto da norma de destino
- Possíveis diferenças de interpretação
"""
        
        return f"""Traduza o seguinte texto técnico de mineração:

NORMA DE ORIGEM: {source_norm}
NORMA DE DESTINO: {target_norm}

TEXTO ORIGINAL:
---
{text}
---
{explain_instruction}
Retorne APENAS JSON válido no formato especificado."""
    
    def _get_timestamp(self) -> str:
        """Retorna timestamp ISO 8601"""
        return datetime.now(timezone.utc).isoformat()
    
    def get_supported_norms(self) -> Dict[str, Dict[str, Any]]:
        """Retorna lista de normas suportadas com metadados"""
        return self.NORMS_METADATA.copy()
    
    async def explain_norm_difference(
        self,
        norm1: NormType,
        norm2: NormType
    ) -> Dict[str, Any]:
        """
        Explica diferenças conceituais entre duas normas
        
        Args:
            norm1: Primeira norma
            norm2: Segunda norma
            
        Returns:
            Dict com análise comparativa
        """
        try:
            if norm1 not in self.NORMS_METADATA or norm2 not in self.NORMS_METADATA:
                raise ValueError("Normas inválidas")
            
            system_prompt = """Você é um especialista em normas regulatórias de mineração.
Compare e contraste as diferenças fundamentais entre dois códigos regulatórios."""
            
            user_prompt = f"""Compare as seguintes normas de mineração:

NORMA 1: {norm1} - {self.NORMS_METADATA[norm1]['full_name']}
NORMA 2: {norm2} - {self.NORMS_METADATA[norm2]['full_name']}

Forneça uma análise comparativa em JSON:
{{
    "main_differences": ["diferença 1", "diferença 2", ...],
    "classification_systems": {{"norm1": "descrição", "norm2": "descrição"}},
    "reporting_requirements": {{"norm1": "requisitos", "norm2": "requisitos"}},
    "key_equivalences": {{"termo_norm1": "termo_norm2"}},
    "practical_impact": "Impacto prático das diferenças"
}}"""
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=2000,
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            result['status'] = 'success'
            result['timestamp'] = self._get_timestamp()
            
            return result
        
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': self._get_timestamp()
            }
