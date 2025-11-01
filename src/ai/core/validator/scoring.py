"""
QIVO Intelligence Layer - Compliance Scoring Module
Avalia e pontua conformidade regulatória
"""

from typing import Dict, Any, List
from enum import Enum


class RiskLevel(str, Enum):
    """Níveis de risco de compliance"""
    LOW = "baixo"
    MODERATE = "moderado"
    HIGH = "alto"
    CRITICAL = "crítico"


class ComplianceScorer:
    """Avalia conformidade de documentos técnicos"""
    
    # Palavras-chave por categoria
    JORC_KEYWORDS = [
        'jorc', 'resource', 'reserve', 'measured', 'indicated', 'inferred',
        'mineral resource', 'ore reserve', 'proven', 'probable'
    ]
    
    NI_43_101_KEYWORDS = [
        'ni 43-101', 'ni43-101', 'technical report', 'cim', 'qualified person',
        'mineral reserve', 'mineral resource'
    ]
    
    PRMS_KEYWORDS = [
        'prms', 'petroleum resource', '1p', '2p', '3p', 'proved', 'probable',
        'possible', 'contingent resource'
    ]
    
    QA_QC_KEYWORDS = [
        'qa/qc', 'quality assurance', 'quality control', 'sampling', 'assay',
        'check sample', 'blank', 'duplicate', 'certified reference material', 'crm'
    ]
    
    COMPLIANCE_KEYWORDS = [
        'compliance', 'regulation', 'standard', 'guideline', 'requirement',
        'competent person', 'qualified person', 'certification', 'audit'
    ]
    
    def __init__(self):
        self.scoring_weights = {
            'jorc': 0.25,
            'ni_43_101': 0.25,
            'prms': 0.15,
            'qa_qc': 0.20,
            'compliance': 0.15
        }
    
    def evaluate(self, analysis: str) -> Dict[str, Any]:
        """
        Avalia conformidade e gera score
        
        Args:
            analysis: Texto da análise do documento
            
        Returns:
            Dict com score, risk_level e breakdown detalhado
        """
        text_lower = analysis.lower()
        
        # Calcular scores por categoria
        scores = {
            'jorc': self._count_keywords(text_lower, self.JORC_KEYWORDS),
            'ni_43_101': self._count_keywords(text_lower, self.NI_43_101_KEYWORDS),
            'prms': self._count_keywords(text_lower, self.PRMS_KEYWORDS),
            'qa_qc': self._count_keywords(text_lower, self.QA_QC_KEYWORDS),
            'compliance': self._count_keywords(text_lower, self.COMPLIANCE_KEYWORDS)
        }
        
        # Calcular score ponderado (0-100)
        weighted_score = sum(
            min(scores[key] * 10, 100) * weight
            for key, weight in self.scoring_weights.items()
        )
        
        compliance_score = min(int(weighted_score), 100)
        
        # Determinar nível de risco
        risk_level = self._determine_risk(compliance_score)
        
        # Gerar breakdown detalhado
        breakdown = {
            'jorc_mentions': scores['jorc'],
            'ni_43_101_mentions': scores['ni_43_101'],
            'prms_mentions': scores['prms'],
            'qa_qc_mentions': scores['qa_qc'],
            'compliance_terms': scores['compliance']
        }
        
        # Identificar pontos fortes e fracos
        strengths = [k for k, v in scores.items() if v >= 3]
        weaknesses = [k for k, v in scores.items() if v < 2]
        
        return {
            'compliance_score': compliance_score,
            'risk_level': risk_level.value,
            'breakdown': breakdown,
            'strengths': strengths,
            'weaknesses': weaknesses,
            'recommendations': self._generate_recommendations(weaknesses)
        }
    
    def _count_keywords(self, text: str, keywords: List[str]) -> int:
        """Conta ocorrências de palavras-chave"""
        count = 0
        for keyword in keywords:
            count += text.count(keyword.lower())
        return count
    
    def _determine_risk(self, score: int) -> RiskLevel:
        """Determina nível de risco baseado no score"""
        if score >= 80:
            return RiskLevel.LOW
        elif score >= 60:
            return RiskLevel.MODERATE
        elif score >= 40:
            return RiskLevel.HIGH
        else:
            return RiskLevel.CRITICAL
    
    def _generate_recommendations(self, weaknesses: List[str]) -> List[str]:
        """Gera recomendações baseadas em pontos fracos"""
        recommendations = []
        
        recommendation_map = {
            'jorc': "Aumentar referências ao código JORC e classificação de recursos/reservas",
            'ni_43_101': "Incluir mais informações sobre NI 43-101 e pessoa qualificada",
            'prms': "Adicionar detalhes sobre classificação de recursos petrolíferos (PRMS)",
            'qa_qc': "Fortalecer descrição de procedimentos de QA/QC e amostragem",
            'compliance': "Melhorar documentação de conformidade regulatória"
        }
        
        for weakness in weaknesses:
            if weakness in recommendation_map:
                recommendations.append(recommendation_map[weakness])
        
        if not recommendations:
            recommendations.append("Documento apresenta boa conformidade geral")
        
        return recommendations
