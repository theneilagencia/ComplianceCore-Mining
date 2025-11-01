"""
QIVO Intelligence Layer - Bridge AI Tests
Suite de testes para tradução normativa
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
import json

from src.ai.core.bridge.engine import BridgeAI
from app.services.integrations.bridge_connector import BridgeConnector


# --- Fixtures ---

@pytest.fixture
def mock_openai_key(monkeypatch):
    """Mock da OpenAI API key"""
    monkeypatch.setenv('OPENAI_API_KEY', 'sk-test-key-12345')


@pytest.fixture
def bridge_engine(mock_openai_key):
    """Instância do BridgeAI para testes"""
    return BridgeAI()


@pytest.fixture
def bridge_connector(mock_openai_key):
    """Instância do BridgeConnector para testes"""
    return BridgeConnector()


@pytest.fixture
def sample_anm_text():
    """Texto de exemplo em padrão ANM"""
    return """
    A jazida de ouro apresenta recursos medidos de 10 milhões de toneladas
    com teor médio de 2.5 g/t Au. A pesquisa mineral foi realizada conforme
    normas da ANM, incluindo sondagem diamantada e análises de QA/QC.
    O projeto conta com lavra a céu aberto e possui RAL ativo.
    """


@pytest.fixture
def sample_jorc_text():
    """Texto de exemplo em padrão JORC"""
    return """
    The gold deposit presents measured resources of 10 million tonnes
    at an average grade of 2.5 g/t Au. Mineral exploration was conducted
    following JORC Code guidelines, including diamond drilling and QA/QC procedures.
    The project features open pit mining operations.
    """


# --- Testes do Engine ---

@pytest.mark.asyncio
class TestBridgeEngine:
    """Testes do engine de tradução"""
    
    async def test_initialization(self, bridge_engine):
        """Testa inicialização do engine"""
        assert bridge_engine.model == "gpt-4o"
        assert bridge_engine.temperature == 0.2
        assert bridge_engine.api_key == 'sk-test-key-12345'
    
    async def test_get_supported_norms(self, bridge_engine):
        """Testa listagem de normas suportadas"""
        norms = bridge_engine.get_supported_norms()
        
        assert 'ANM' in norms
        assert 'JORC' in norms
        assert 'NI43-101' in norms
        assert 'PERC' in norms
        assert 'SAMREC' in norms
        
        assert norms['ANM']['country'] == 'Brasil'
        assert norms['JORC']['country'] == 'Austrália/Internacional'
    
    async def test_invalid_source_norm(self, bridge_engine):
        """Testa validação de norma de origem inválida"""
        result = await bridge_engine.translate_normative(
            text="Sample text",
            source_norm="INVALID",
            target_norm="JORC",
            explain=False
        )
        
        assert result['status'] == 'error'
        assert 'inválida' in result['message'].lower()
    
    async def test_same_source_target_norm(self, bridge_engine):
        """Testa erro quando origem = destino"""
        result = await bridge_engine.translate_normative(
            text="Sample text for testing",
            source_norm="JORC",
            target_norm="JORC",
            explain=False
        )
        
        assert result['status'] == 'error'
        assert 'diferentes' in result['message'].lower()
    
    @pytest.mark.skipif(
        True,  # Pular por padrão (requer API key real)
        reason="Requer OpenAI API key válida"
    )
    async def test_translation_anm_to_jorc(self, bridge_engine, sample_anm_text):
        """Testa tradução ANM → JORC (requer API key real)"""
        result = await bridge_engine.translate_normative(
            text=sample_anm_text,
            source_norm="ANM",
            target_norm="JORC",
            explain=True
        )
        
        assert result['status'] == 'success'
        assert 'translated_text' in result
        assert result['confidence'] >= 70  # Confiança mínima
        assert 'explanation' in result
        assert result['source_metadata']['country'] == 'Brasil'
        assert result['target_metadata']['country'] == 'Austrália/Internacional'
    
    @pytest.mark.asyncio
    async def test_translation_with_mock_gpt(self, bridge_engine):
        """Testa tradução com GPT mockado"""
        mock_response = {
            'translated_text': 'The deposit presents measured resources...',
            'confidence': 92,
            'explanation': 'Translated key terms: jazida→deposit, recursos medidos→measured resources',
            'semantic_mapping': {
                'jazida': 'deposit',
                'recursos medidos': 'measured resources'
            }
        }
        
        with patch.object(bridge_engine.client.chat.completions, 'create') as mock_create:
            mock_completion = Mock()
            mock_completion.choices = [Mock()]
            mock_completion.choices[0].message.content = json.dumps(mock_response)
            mock_create.return_value = mock_completion
            
            result = await bridge_engine.translate_normative(
                text="A jazida apresenta recursos medidos de 10Mt",
                source_norm="ANM",
                target_norm="JORC",
                explain=True
            )
            
            assert result['status'] == 'success'
            assert result['confidence'] == 92
            assert 'explanation' in result
            assert 'semantic_mapping' in result
    
    @pytest.mark.asyncio
    async def test_explain_norm_difference(self, bridge_engine):
        """Testa comparação entre normas"""
        mock_comparison = {
            'main_differences': [
                'Classification systems differ',
                'Reporting requirements vary'
            ],
            'classification_systems': {
                'norm1': 'ANM Brazilian system',
                'norm2': 'JORC international'
            },
            'key_equivalences': {
                'recursos medidos': 'measured resources',
                'lavra': 'mining operation'
            },
            'practical_impact': 'Requires terminology adaptation'
        }
        
        with patch.object(bridge_engine.client.chat.completions, 'create') as mock_create:
            mock_completion = Mock()
            mock_completion.choices = [Mock()]
            mock_completion.choices[0].message.content = json.dumps(mock_comparison)
            mock_create.return_value = mock_completion
            
            result = await bridge_engine.explain_norm_difference(
                norm1="ANM",
                norm2="JORC"
            )
            
            assert result['status'] == 'success'
            assert 'main_differences' in result
            assert 'key_equivalences' in result


# --- Testes de Performance ---

@pytest.mark.asyncio
class TestBridgePerformance:
    """Testes de performance e tempo de resposta"""
    
    async def test_translation_response_time(self, bridge_engine):
        """Testa se tradução responde em < 10s"""
        import time
        
        mock_response = {
            'translated_text': 'Translated text here',
            'confidence': 85,
            'explanation': 'Translation explanation'
        }
        
        with patch.object(bridge_engine.client.chat.completions, 'create') as mock_create:
            mock_completion = Mock()
            mock_completion.choices = [Mock()]
            mock_completion.choices[0].message.content = json.dumps(mock_response)
            mock_create.return_value = mock_completion
            
            start = time.time()
            result = await bridge_engine.translate_normative(
                text="Test text for performance testing purposes",
                source_norm="ANM",
                target_norm="JORC",
                explain=False
            )
            elapsed = time.time() - start
            
            assert elapsed < 10.0  # Máximo 10 segundos
            assert result['status'] == 'success'
    
    async def test_confidence_threshold(self, bridge_engine):
        """Testa se confidence score está no range correto"""
        mock_response = {
            'translated_text': 'Test translation',
            'confidence': 95
        }
        
        with patch.object(bridge_engine.client.chat.completions, 'create') as mock_create:
            mock_completion = Mock()
            mock_completion.choices = [Mock()]
            mock_completion.choices[0].message.content = json.dumps(mock_response)
            mock_create.return_value = mock_completion
            
            result = await bridge_engine.translate_normative(
                text="Test text here",
                source_norm="ANM",
                target_norm="JORC",
                explain=False
            )
            
            assert 0 <= result['confidence'] <= 100
            assert result['confidence'] >= 70  # Mínimo aceitável


# --- Testes de Integração ---

@pytest.mark.asyncio
class TestBridgeIntegration:
    """Testes de integração com Validator"""
    
    async def test_bridge_connector_initialization(self, bridge_connector):
        """Testa inicialização do connector"""
        assert bridge_connector.bridge is not None
        assert bridge_connector.validator is not None
    
    async def test_sync_with_validator(self, bridge_connector):
        """Testa sincronização com Validator"""
        with patch.object(bridge_connector, '_fetch_report') as mock_fetch:
            mock_fetch.return_value = {
                'id': 'report_123',
                'content': 'A jazida apresenta recursos medidos...'
            }
            
            with patch.object(bridge_connector.bridge, 'translate_normative') as mock_translate:
                mock_translate.return_value = {
                    'status': 'success',
                    'translated_text': 'The deposit presents measured resources...',
                    'confidence': 88
                }
                
                with patch.object(bridge_connector.validator, 'validate_text') as mock_validate:
                    mock_validate.return_value = {
                        'status': 'success',
                        'compliance': {
                            'compliance_score': 85,
                            'risk_level': 'baixo'
                        }
                    }
                    
                    result = await bridge_connector.sync_bridge_with_validator(
                        report_id='report_123',
                        target_norm='JORC'
                    )
                    
                    assert result['status'] == 'success'
                    assert result['report_id'] == 'report_123'
                    assert 'translation' in result
                    assert 'validation' in result
    
    async def test_batch_translation(self, bridge_connector):
        """Testa tradução em lote"""
        report_ids = ['report_1', 'report_2', 'report_3']
        
        with patch.object(bridge_connector, 'sync_bridge_with_validator') as mock_sync:
            mock_sync.return_value = {'status': 'success'}
            
            result = await bridge_connector.batch_translate_reports(
                report_ids=report_ids,
                target_norm='JORC'
            )
            
            assert result['status'] == 'completed'
            assert result['total'] == 3
            assert mock_sync.call_count == 3
    
    async def test_enrich_validator_analysis(self, bridge_connector):
        """Testa enriquecimento de análise com traduções"""
        with patch.object(bridge_connector.validator, 'validate_text') as mock_validate:
            mock_validate.return_value = {
                'status': 'success',
                'analysis': {'summary': 'Test analysis'},
                'compliance': {'compliance_score': 90}
            }
            
            with patch.object(bridge_connector.bridge, 'translate_normative') as mock_translate:
                mock_translate.return_value = {
                    'status': 'success',
                    'translated_text': 'Translated version here...',
                    'confidence': 87
                }
                
                result = await bridge_connector.enrich_validator_analysis(
                    text="Sample text for enrichment",
                    source_norm="ANM",
                    target_norms=["JORC", "NI43-101"]
                )
                
                assert result['status'] == 'success'
                assert 'original' in result
                assert 'translations' in result
                assert result['multi_norm_coverage'] >= 0


# --- Testes de Edge Cases ---

@pytest.mark.asyncio
class TestBridgeEdgeCases:
    """Testes de casos extremos"""
    
    async def test_empty_text(self, bridge_engine):
        """Testa tratamento de texto vazio"""
        result = await bridge_engine.translate_normative(
            text="",
            source_norm="ANM",
            target_norm="JORC",
            explain=False
        )
        
        # Engine deve falhar gracefully
        assert result['status'] == 'error'
    
    async def test_very_long_text(self, bridge_engine):
        """Testa texto muito longo (truncamento)"""
        long_text = "A " * 10000  # 20k caracteres
        
        mock_response = {
            'translated_text': 'Truncated translation',
            'confidence': 75
        }
        
        with patch.object(bridge_engine.client.chat.completions, 'create') as mock_create:
            mock_completion = Mock()
            mock_completion.choices = [Mock()]
            mock_completion.choices[0].message.content = json.dumps(mock_response)
            mock_create.return_value = mock_completion
            
            result = await bridge_engine.translate_normative(
                text=long_text,
                source_norm="ANM",
                target_norm="JORC",
                explain=False
            )
            
            assert result['status'] == 'success'
            # Verificar se truncou
            call_args = mock_create.call_args
            user_message = call_args[1]['messages'][1]['content']
            assert '[... texto truncado ...]' in user_message or len(user_message) < 20000


# --- Configuração do pytest ---

if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
