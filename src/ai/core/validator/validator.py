"""
QIVO Intelligence Layer - Validator AI Core
Análise de conformidade regulatória com OpenAI GPT
"""

import os
from typing import Dict, Any, Optional
from openai import AsyncOpenAI
from .preprocessor import DocumentPreprocessor
from .scoring import ComplianceScorer


class ValidatorAI:
    """
    Validador de conformidade regulatória para documentos técnicos de mineração
    Suporta: JORC, NI 43-101, PRMS
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Inicializa Validator AI
        
        Args:
            api_key: OpenAI API key (usa variável de ambiente se não fornecida)
        """
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY não configurada")
        
        self.client = AsyncOpenAI(api_key=self.api_key)
        self.preprocessor = DocumentPreprocessor()
        self.scorer = ComplianceScorer()
        
        # Configurações do modelo
        self.model = "gpt-4o"  # Ou gpt-4-turbo se disponível
        self.max_tokens = 2000
        self.temperature = 0.3  # Baixa para respostas mais consistentes
    
    async def process(self, file_path: str) -> Dict[str, Any]:
        """
        Processa documento completo: extração → análise → scoring
        
        Args:
            file_path: Caminho do arquivo a analisar
            
        Returns:
            Dict com análise completa
        """
        try:
            # 1. Preprocessar documento
            text = await self.preprocessor.preprocess_text(file_path)
            metadata = self.preprocessor.get_metadata()
            
            if not text or len(text) < 100:
                return {
                    'status': 'error',
                    'message': 'Documento muito curto ou vazio',
                    'metadata': metadata
                }
            
            # 2. Analisar com GPT
            analysis = await self._analyze_with_gpt(text)
            
            # 3. Calcular compliance score
            scoring_result = self.scorer.evaluate(analysis)
            
            # 4. Compilar resultado
            result = {
                'status': 'success',
                'metadata': metadata,
                'analysis': {
                    'summary': analysis[:500] + '...' if len(analysis) > 500 else analysis,
                    'full_text': analysis
                },
                'compliance': scoring_result,
                'timestamp': self._get_timestamp()
            }
            
            return result
        
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': self._get_timestamp()
            }
    
    async def _analyze_with_gpt(self, text: str) -> str:
        """
        Analisa texto com GPT-4 para compliance
        
        Args:
            text: Texto preprocessado
            
        Returns:
            Análise textual do GPT
        """
        # Limitar texto para não exceder token limit
        max_chars = 12000  # ~3000 tokens
        if len(text) > max_chars:
            text = text[:max_chars] + "\n\n[... documento truncado ...]"
        
        system_prompt = """Você é um especialista em conformidade regulatória de mineração.
Analise o documento técnico fornecido e avalie sua conformidade com os seguintes códigos:

- JORC Code (Joint Ore Reserves Committee)
- NI 43-101 (Canadian National Instrument)
- PRMS (Petroleum Resources Management System)

Identifique:
1. Padrões regulatórios mencionados
2. Classificações de recursos/reservas
3. Procedimentos de QA/QC descritos
4. Qualificação de pessoas competentes
5. Gaps de conformidade

Seja objetivo e técnico."""

        user_prompt = f"""Analise este documento técnico de mineração para conformidade regulatória:

{text}

Forneça uma análise detalhada focando em conformidade com JORC, NI 43-101 e PRMS."""
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )
            
            analysis = response.choices[0].message.content
            return analysis or "Análise não gerada"
        
        except Exception as e:
            raise ValueError(f"Erro na análise GPT: {str(e)}")
    
    def _get_timestamp(self) -> str:
        """Retorna timestamp ISO 8601"""
        from datetime import datetime, timezone
        return datetime.now(timezone.utc).isoformat()
    
    async def validate_text(self, text: str) -> Dict[str, Any]:
        """
        Valida texto diretamente (sem arquivo)
        
        Args:
            text: Texto a analisar
            
        Returns:
            Dict com análise
        """
        try:
            analysis = await self._analyze_with_gpt(text)
            scoring_result = self.scorer.evaluate(analysis)
            
            return {
                'status': 'success',
                'analysis': {
                    'summary': analysis[:500] + '...' if len(analysis) > 500 else analysis,
                    'full_text': analysis
                },
                'compliance': scoring_result,
                'timestamp': self._get_timestamp()
            }
        
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': self._get_timestamp()
            }
