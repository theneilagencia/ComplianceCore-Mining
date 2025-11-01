"""
Radar AI - Test Suite
=====================
Testes completos para o módulo Radar AI.

Author: QIVO Intelligence Platform
Version: 5.0.0
Date: 2025-11-01
"""

import pytest
import asyncio
import json
from datetime import datetime
from unittest.mock import patch, MagicMock, AsyncMock
from src.ai.core.radar import engine as radar_engine

@pytest.fixture
def radar():
    """Fixture para RadarEngine."""
    return radar_engine.RadarEngine()

# === ENGINE TESTS ===
class TestRadarEngine:
    """Testes do engine principal."""
    
    def test_engine_initialization(self, radar):
        """Testa inicialização do engine."""
        assert radar is not None
        assert radar.sources is not None
        assert len(radar.sources) == 5
    
    def test_get_supported_sources(self, radar):
        """Testa lista de fontes suportadas."""
        sources = radar.get_supported_sources()
        assert len(sources) == 5
        assert "ANM" in sources
        assert "JORC" in sources
        assert "NI43-101" in sources
        assert "PERC" in sources
        assert "SAMREC" in sources
    
    def test_get_source_metadata(self, radar):
        """Testa obtenção de metadados."""
        meta = radar.get_source_metadata("ANM")
        assert meta is not None
        assert meta["country"] == "Brasil"
        assert "Mineração" in meta["full_name"]
    
    @pytest.mark.asyncio
    async def test_fetch_sources(self, radar):
        """Testa busca de fontes."""
        result = await radar.fetch_sources(["ANM"])
        assert "ANM" in result
        assert result["ANM"]["status"] == "active"
        assert "latest_updates" in result["ANM"]
    
    @pytest.mark.asyncio
    async def test_analyze_changes_without_cache(self, radar):
        """Testa análise de mudanças sem cache."""
        data = await radar.fetch_sources(["ANM"])
        changes = await radar.analyze_changes(data, deep=False)
        assert isinstance(changes, list)
        # Primeira execução detecta mudanças
        assert len(changes) > 0
    
    def test_calculate_severity(self, radar):
        """Testa cálculo de severidade."""
        change = {"impact_level": "high"}
        severity = radar._calculate_severity(change)
        assert severity in ["Low", "Medium", "High", "Critical"]
    
    def test_calculate_confidence(self, radar):
        """Testa cálculo de confiança."""
        change = {"version_change": "v1.0 → v2.0", "date": "2025-10-15"}
        confidence = radar._calculate_confidence(change)
        assert 0.0 <= confidence <= 1.0

# === PERFORMANCE TESTS ===
class TestRadarPerformance:
    """Testes de performance."""
    
    @pytest.mark.asyncio
    async def test_fetch_performance(self, radar):
        """Testa performance de fetch."""
        import time
        start = time.time()
        await radar.fetch_sources()
        elapsed = time.time() - start
        assert elapsed < 2.0, f"Fetch demorou {elapsed}s (máx 2s)"
    
    @pytest.mark.asyncio
    async def test_run_cycle_performance_without_deep(self, radar):
        """Testa ciclo completo sem deep."""
        import time
        start = time.time()
        result = await radar.run_cycle(sources=["ANM"], deep=False, summarize=False)
        elapsed = time.time() - start
        assert elapsed < 3.0, f"Ciclo demorou {elapsed}s (máx 3s)"
        assert "timestamp" in result
        assert "alerts" in result

# === INTEGRATION TESTS ===
class TestRadarIntegration:
    """Testes de integração."""
    
    @pytest.mark.asyncio
    async def test_connector_initialization(self):
        """Testa inicialização do connector."""
        from app.services.integrations.radar_connector import RadarConnector
        connector = RadarConnector()
        assert connector.radar is not None
    
    @pytest.mark.asyncio
    async def test_sync_with_bridge(self):
        """Testa sincronização com Bridge."""
        from app.services.integrations.radar_connector import get_radar_connector
        connector = get_radar_connector()
        
        alert = {
            "source": "ANM",
            "summary": "Nova resolução sobre barragens",
            "severity": "High"
        }
        
        result = await connector.sync_radar_with_bridge(alert, "JORC")
        assert "original_alert" in result or "error" in result
    
    @pytest.mark.asyncio
    async def test_sync_with_validator(self):
        """Testa sincronização com Validator."""
        from app.services.integrations.radar_connector import get_radar_connector
        connector = get_radar_connector()
        
        alert = {
            "source": "ANM",
            "summary": "Atualização de norma",
            "severity": "Medium"
        }
        
        result = await connector.sync_radar_with_validator(alert)
        assert "alert" in result
        
    @pytest.mark.asyncio
    async def test_notify_changes(self):
        """Testa envio de notificações."""
        from app.services.integrations.radar_connector import get_radar_connector
        connector = get_radar_connector()
        
        alerts = [{"source": "ANM", "change": "Teste", "severity": "Low"}]
        result = await connector.notify_changes(alerts, channels=["email"])
        assert "total_sent" in result
        assert result["total_sent"] > 0

# === EDGE CASES ===
class TestRadarEdgeCases:
    """Testes de casos extremos."""
    
    @pytest.mark.asyncio
    async def test_empty_sources_list(self, radar):
        """Testa com lista vazia de fontes."""
        result = await radar.fetch_sources([])
        assert isinstance(result, dict)
        assert len(result) == 0
    
    @pytest.mark.asyncio
    async def test_invalid_source(self, radar):
        """Testa fonte inválida."""
        result = await radar.fetch_sources(["INVALID"])
        assert len(result) == 0
    
    def test_get_nonexistent_source_metadata(self, radar):
        """Testa metadados de fonte inexistente."""
        meta = radar.get_source_metadata("NONEXISTENT")
        assert meta is None
    
    @pytest.mark.asyncio
    async def test_run_cycle_all_sources(self, radar):
        """Testa ciclo com todas as fontes."""
        result = await radar.run_cycle(sources=None, deep=False)
        assert len(result["sources_monitored"]) == 5

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
