"""
QIVO Intelligence Layer - Bridge Connector
Integração do Bridge AI com Validator e Report Generator
"""

import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

from src.ai.core.bridge import BridgeAI
from src.ai.core.validator import ValidatorAI


class BridgeConnector:
    """
    Conector para integrar Bridge AI com outros módulos QIVO
    
    Funcionalidades:
    - Sincronizar traduções com relatórios existentes
    - Atualizar documentos com equivalências normativas
    - Enriquecer análises do Validator com traduções
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Inicializa BridgeConnector
        
        Args:
            api_key: OpenAI API key (usa variável de ambiente se não fornecida)
        """
        self.bridge = BridgeAI(api_key=api_key)
        self.validator = ValidatorAI(api_key=api_key)
    
    async def sync_bridge_with_validator(
        self,
        report_id: str,
        target_norm: str = 'JORC'
    ) -> Dict[str, Any]:
        """
        Sincroniza Bridge com Validator: traduz relatório existente
        
        Args:
            report_id: ID do relatório a processar
            target_norm: Norma de destino para tradução
            
        Returns:
            Dict com status da sincronização
        """
        try:
            # 1. Buscar relatório (mock - substituir por query real)
            report_data = await self._fetch_report(report_id)
            
            if not report_data:
                return {
                    'status': 'error',
                    'message': f'Relatório {report_id} não encontrado',
                    'timestamp': self._get_timestamp()
                }
            
            # 2. Detectar norma de origem
            source_norm = await self._detect_source_norm(report_data['content'])
            
            # 3. Traduzir conteúdo
            translation_result = await self.bridge.translate_normative(
                text=report_data['content'],
                source_norm=source_norm,
                target_norm=target_norm,
                explain=True
            )
            
            if translation_result['status'] == 'error':
                return translation_result
            
            # 4. Validar tradução
            validation_result = await self.validator.validate_text(
                translation_result['translated_text']
            )
            
            # 5. Compilar resultado
            result = {
                'status': 'success',
                'report_id': report_id,
                'translation': {
                    'source_norm': source_norm,
                    'target_norm': target_norm,
                    'translated_text': translation_result['translated_text'],
                    'confidence': translation_result['confidence']
                },
                'validation': {
                    'compliance_score': validation_result.get('compliance', {}).get('compliance_score', 0),
                    'risk_level': validation_result.get('compliance', {}).get('risk_level', 'unknown')
                },
                'timestamp': self._get_timestamp()
            }
            
            # 6. Salvar resultado (mock - substituir por persistência real)
            await self._save_translation(report_id, result)
            
            return result
        
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': self._get_timestamp()
            }
    
    async def batch_translate_reports(
        self,
        report_ids: List[str],
        target_norm: str = 'JORC'
    ) -> Dict[str, Any]:
        """
        Traduz múltiplos relatórios em lote
        
        Args:
            report_ids: Lista de IDs de relatórios
            target_norm: Norma de destino
            
        Returns:
            Resultado agregado do processamento
        """
        results = []
        
        for report_id in report_ids:
            result = await self.sync_bridge_with_validator(report_id, target_norm)
            results.append(result)
        
        # Estatísticas
        successes = sum(1 for r in results if r['status'] == 'success')
        failures = len(results) - successes
        
        return {
            'status': 'completed',
            'total': len(report_ids),
            'successes': successes,
            'failures': failures,
            'results': results,
            'timestamp': self._get_timestamp()
        }
    
    async def enrich_validator_analysis(
        self,
        text: str,
        source_norm: str,
        target_norms: List[str]
    ) -> Dict[str, Any]:
        """
        Enriquece análise do Validator com traduções multi-normas
        
        Args:
            text: Texto a analisar
            source_norm: Norma original
            target_norms: Lista de normas para traduzir
            
        Returns:
            Análise enriquecida com traduções
        """
        try:
            # 1. Validação original
            validation = await self.validator.validate_text(text)
            
            # 2. Traduções paralelas
            translations = {}
            for target in target_norms:
                if target != source_norm:
                    trans_result = await self.bridge.translate_normative(
                        text=text,
                        source_norm=source_norm,
                        target_norm=target,
                        explain=False
                    )
                    if trans_result['status'] == 'success':
                        translations[target] = {
                            'text': trans_result['translated_text'][:200] + '...',  # Preview
                            'confidence': trans_result['confidence']
                        }
            
            # 3. Compilar resultado enriquecido
            return {
                'status': 'success',
                'original': {
                    'norm': source_norm,
                    'analysis': validation.get('analysis', {}),
                    'compliance': validation.get('compliance', {})
                },
                'translations': translations,
                'multi_norm_coverage': len(translations),
                'timestamp': self._get_timestamp()
            }
        
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': self._get_timestamp()
            }
    
    async def generate_cross_norm_report(
        self,
        text: str,
        base_norm: str
    ) -> Dict[str, Any]:
        """
        Gera relatório comparativo cross-norm
        
        Args:
            text: Texto base
            base_norm: Norma de referência
            
        Returns:
            Relatório com análise multi-norma
        """
        try:
            all_norms = ['ANM', 'JORC', 'NI43-101', 'PERC', 'SAMREC']
            target_norms = [n for n in all_norms if n != base_norm]
            
            # Análise enriquecida
            enriched = await self.enrich_validator_analysis(
                text=text,
                source_norm=base_norm,
                target_norms=target_norms
            )
            
            # Comparações entre normas
            comparisons = {}
            for target in target_norms:
                comparison = await self.bridge.explain_norm_difference(
                    norm1=base_norm,
                    norm2=target
                )
                if comparison.get('status') == 'success':
                    comparisons[f"{base_norm}_vs_{target}"] = {
                        'main_differences': comparison.get('main_differences', [])[:3],
                        'key_equivalences': comparison.get('key_equivalences', {})
                    }
            
            return {
                'status': 'success',
                'base_norm': base_norm,
                'enriched_analysis': enriched,
                'cross_norm_comparisons': comparisons,
                'coverage': {
                    'norms_analyzed': len(target_norms) + 1,
                    'translations_generated': len(enriched.get('translations', {})),
                    'comparisons_performed': len(comparisons)
                },
                'timestamp': self._get_timestamp()
            }
        
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e),
                'timestamp': self._get_timestamp()
            }
    
    # --- Métodos auxiliares (mocks para demonstração) ---
    
    async def _fetch_report(self, report_id: str) -> Optional[Dict[str, Any]]:
        """Mock: buscar relatório do banco de dados"""
        # Em produção, substituir por query real ao PostgreSQL/MongoDB
        return {
            'id': report_id,
            'content': 'Recursos medidos de 10 milhões de toneladas conforme norma ANM...',
            'created_at': datetime.now(timezone.utc)
        }
    
    async def _detect_source_norm(self, text: str) -> str:
        """Mock: detectar norma de origem do texto"""
        # Em produção, usar NLP ou keywords para detectar
        text_lower = text.lower()
        
        if 'anm' in text_lower or 'dnpm' in text_lower:
            return 'ANM'
        elif 'jorc' in text_lower:
            return 'JORC'
        elif 'ni 43-101' in text_lower or 'ni43-101' in text_lower:
            return 'NI43-101'
        elif 'perc' in text_lower or 'gkz' in text_lower:
            return 'PERC'
        elif 'samrec' in text_lower:
            return 'SAMREC'
        else:
            return 'JORC'  # Default
    
    async def _save_translation(self, report_id: str, result: Dict[str, Any]) -> None:
        """Mock: salvar tradução no banco de dados"""
        # Em produção, salvar em PostgreSQL/MongoDB
        pass
    
    def _get_timestamp(self) -> str:
        """Retorna timestamp ISO 8601"""
        return datetime.now(timezone.utc).isoformat()
