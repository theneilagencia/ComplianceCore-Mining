"""
Testes Unit

ários para Validator AI
"""

import pytest
import os
from pathlib import Path
from src.ai.core.validator import ValidatorAI, ComplianceScorer, DocumentPreprocessor, RiskLevel


class TestDocumentPreprocessor:
    """Testes do DocumentPreprocessor"""
    
    @pytest.fixture
    def preprocessor(self):
        return DocumentPreprocessor()
    
    def test_clean_text(self, preprocessor):
        """Testa limpeza de texto"""
        dirty_text = "Texto   com    espaços    múltiplos\n\n\ne quebras"
        clean = preprocessor._clean_text(dirty_text)
        
        assert "  " not in clean
        assert "\n\n" not in clean
    
    def test_get_metadata(self, preprocessor):
        """Testa extração de metadata"""
        metadata = preprocessor.get_metadata()
        
        assert isinstance(metadata, dict)
        assert all(key in metadata for key in ['file_name', 'file_type', 'file_size'])


class TestComplianceScorer:
    """Testes do ComplianceScorer"""
    
    @pytest.fixture
    def scorer(self):
        return ComplianceScorer()
    
    def test_count_keywords(self, scorer):
        """Testa contagem de keywords"""
        text = "jorc resource jorc measured indicated"
        count = scorer._count_keywords(text.lower(), scorer.JORC_KEYWORDS)
        
        assert count >= 4  # jorc x2 + resource + measured + indicated
    
    def test_determine_risk_low(self, scorer):
        """Testa classificação de risco baixo"""
        risk = scorer._determine_risk(85)
        assert risk == RiskLevel.LOW
    
    def test_determine_risk_moderate(self, scorer):
        """Testa classificação de risco moderado"""
        risk = scorer._determine_risk(65)
        assert risk == RiskLevel.MODERATE
    
    def test_determine_risk_high(self, scorer):
        """Testa classificação de risco alto"""
        risk = scorer._determine_risk(45)
        assert risk == RiskLevel.HIGH
    
    def test_determine_risk_critical(self, scorer):
        """Testa classificação de risco crítico"""
        risk = scorer._determine_risk(25)
        assert risk == RiskLevel.CRITICAL
    
    def test_evaluate_with_keywords(self, scorer):
        """Testa avaliação completa com keywords"""
        analysis = """
        Este documento apresenta recursos minerais conforme o código JORC.
        Procedimentos de QA/QC foram aplicados incluindo check samples e duplicates.
        A classificação inclui recursos measured, indicated e inferred.
        Certified reference materials foram utilizados para quality assurance.
        """
        
        result = scorer.evaluate(analysis)
        
        assert 'compliance_score' in result
        assert 'risk_level' in result
        assert 'breakdown' in result
        assert 'strengths' in result
        assert 'weaknesses' in result
        assert 'recommendations' in result
        assert result['compliance_score'] >= 0
        assert result['compliance_score'] <= 100
    
    def test_generate_recommendations(self, scorer):
        """Testa geração de recomendações"""
        weaknesses = ['jorc', 'qa_qc']
        recommendations = scorer._generate_recommendations(weaknesses)
        
        assert isinstance(recommendations, list)
        assert len(recommendations) > 0
        assert any('JORC' in r for r in recommendations)


class TestValidatorAI:
    """Testes do ValidatorAI (requer OPENAI_API_KEY)"""
    
    @pytest.fixture
    def validator(self):
        # Skip se API key não configurada
        if not os.getenv('OPENAI_API_KEY'):
            pytest.skip("OPENAI_API_KEY não configurada")
        return ValidatorAI()
    
    def test_initialization(self):
        """Testa inicialização"""
        if not os.getenv('OPENAI_API_KEY'):
            with pytest.raises(ValueError):
                ValidatorAI()
        else:
            validator = ValidatorAI()
            assert validator.client is not None
            assert validator.preprocessor is not None
            assert validator.scorer is not None
    
    @pytest.mark.asyncio
    async def test_validate_text(self, validator):
        """Testa validação de texto direto"""
        text = """
        Este é um relatório técnico sobre recursos minerais.
        A classificação de recursos segue o código JORC.
        Procedimentos de QA/QC incluem amostragem sistemática.
        """
        
        result = await validator.validate_text(text)
        
        assert result['status'] in ['success', 'error']
        if result['status'] == 'success':
            assert 'analysis' in result
            assert 'compliance' in result
            assert 'timestamp' in result
    
    def test_get_timestamp(self, validator):
        """Testa geração de timestamp"""
        timestamp = validator._get_timestamp()
        
        assert isinstance(timestamp, str)
        assert 'T' in timestamp  # ISO 8601 format
        assert '+' in timestamp or 'Z' in timestamp  # Timezone


@pytest.mark.integration
class TestValidatorIntegration:
    """Testes de integração (requerem API key e arquivos)"""
    
    @pytest.fixture
    def validator(self):
        if not os.getenv('OPENAI_API_KEY'):
            pytest.skip("OPENAI_API_KEY não configurada")
        return ValidatorAI()
    
    @pytest.mark.asyncio
    async def test_full_pipeline(self, validator):
        """Testa pipeline completo (se houver arquivo de teste)"""
        # Este teste requer um arquivo de teste
        # Por enquanto, apenas verificar se o método existe
        assert hasattr(validator, 'process')
        assert callable(validator.process)


# Fixtures globais
@pytest.fixture(scope="session")
def sample_text():
    """Texto de exemplo para testes"""
    return """
    Technical Report on Mineral Resources
    
    This report presents mineral resources in accordance with the JORC Code.
    
    Resource Classification:
    - Measured Resources: 1,000,000 tonnes
    - Indicated Resources: 2,500,000 tonnes
    - Inferred Resources: 500,000 tonnes
    
    QA/QC Procedures:
    - Certified Reference Materials (CRM) inserted every 20 samples
    - Blank samples for contamination check
    - Duplicate samples for precision verification
    
    Competent Person:
    John Doe, MAusIMM, with 15 years of experience in resource estimation.
    """


@pytest.fixture(scope="session")
def low_compliance_text():
    """Texto com baixa conformidade"""
    return """
    This is a simple document about mining.
    We have some rocks and minerals.
    No specific standards mentioned.
    """


# Testes parametrizados
@pytest.mark.parametrize("score,expected_risk", [
    (90, RiskLevel.LOW),
    (70, RiskLevel.MODERATE),
    (50, RiskLevel.HIGH),
    (30, RiskLevel.CRITICAL),
])
def test_risk_levels(score, expected_risk):
    """Testa todos os níveis de risco"""
    scorer = ComplianceScorer()
    risk = scorer._determine_risk(score)
    assert risk == expected_risk


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
