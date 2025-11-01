"""
Radar AI Connector - Integration Layer
=======================================
Integra Radar AI com Bridge AI, Validator AI e sistemas de notificação.

Author: QIVO Intelligence Platform
Version: 5.0.0
Date: 2025-11-01
"""

import asyncio
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any

# Lazy imports para evitar circular dependencies
_radar_engine = None
_bridge_engine = None
_validator_engine = None


def get_radar():
    """Lazy import do RadarEngine."""
    global _radar_engine
    if _radar_engine is None:
        from src.ai.core.radar.engine import get_radar_engine
        _radar_engine = get_radar_engine()
    return _radar_engine


def get_bridge():
    """Lazy import do BridgeAI."""
    global _bridge_engine
    if _bridge_engine is None:
        try:
            from src.ai.core.bridge.engine import BridgeAI
            _bridge_engine = BridgeAI()
        except Exception as e:
            print(f"Bridge AI não disponível: {e}")
            _bridge_engine = None
    return _bridge_engine


def get_validator():
    """Lazy import do ValidatorAI."""
    global _validator_engine
    if _validator_engine is None:
        try:
            from src.ai.core.validator.engine import ValidatorAI
            _validator_engine = ValidatorAI()
        except Exception as e:
            print(f"Validator AI não disponível: {e}")
            _validator_engine = None
    return _validator_engine


class RadarConnector:
    """
    Classe de integração entre Radar AI e outros módulos.
    """
    
    def __init__(self):
        """Inicializa o connector com engines."""
        self.radar = get_radar()
        self.bridge = get_bridge()
        self.validator = get_validator()
    
    async def sync_radar_with_bridge(
        self,
        alert: Dict[str, Any],
        target_norm: str
    ) -> Dict[str, Any]:
        """
        Sincroniza alerta do Radar com Bridge AI para tradução normativa.
        
        Args:
            alert: Alerta detectado pelo Radar
            target_norm: Norma alvo para tradução
            
        Returns:
            Dict com alerta original + versão traduzida
        """
        if not self.bridge:
            return {"error": "Bridge AI não disponível", "alert": alert}
        
        try:
            source_norm = alert.get("source", "ANM")
            text = alert.get("summary", "")
            
            # Traduz alerta para norma alvo
            translation = await self.bridge.translate_normative(
                text=text,
                source_norm=source_norm,
                target_norm=target_norm,
                explain=True
            )
            
            return {
                "original_alert": alert,
                "translated_to": target_norm,
                "translation": translation["translated_text"],
                "confidence": translation["confidence"],
                "semantic_mapping": translation.get("semantic_mapping", {}),
                "synced_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            return {
                "error": f"Erro ao sincronizar com Bridge: {str(e)}",
                "alert": alert
            }
    
    async def sync_radar_with_validator(
        self,
        alert: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Sincroniza alerta com Validator AI para ajuste de score de conformidade.
        
        Args:
            alert: Alerta detectado pelo Radar
            
        Returns:
            Dict com análise de impacto na conformidade
        """
        if not self.validator:
            return {"error": "Validator AI não disponível", "alert": alert}
        
        try:
            text = alert.get("summary", "")
            source = alert.get("source", "ANM")
            severity = alert.get("severity", "Low")
            
            # Simula validação do impacto (em produção, seria análise real)
            impact_map = {
                "Critical": -15,  # Reduz score em 15 pontos
                "High": -10,
                "Medium": -5,
                "Low": -2
            }
            
            impact_score = impact_map.get(severity, 0)
            
            return {
                "alert": alert,
                "compliance_impact": {
                    "score_adjustment": impact_score,
                    "affected_areas": self._get_affected_areas(alert),
                    "recommended_actions": alert.get("recommendations", []),
                    "urgency": severity,
                    "source_norm": source
                },
                "synced_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            return {
                "error": f"Erro ao sincronizar com Validator: {str(e)}",
                "alert": alert
            }
    
    def _get_affected_areas(self, alert: Dict[str, Any]) -> List[str]:
        """Identifica áreas afetadas pelo alerta."""
        keywords = alert.get("risk_keywords", [])
        areas = []
        
        area_mapping = {
            "barragem": ["Segurança Operacional", "Gestão de Riscos"],
            "licença": ["Licenciamento", "Compliance Regulatório"],
            "ambiental": ["Impacto Ambiental", "Sustentabilidade"],
            "recursos": ["Gestão de Recursos", "Reservas"],
            "divulgação": ["Transparência", "Reporting"],
            "segurança": ["Segurança Operacional", "HSE"]
        }
        
        for keyword in keywords:
            for key, mapped_areas in area_mapping.items():
                if key in keyword.lower():
                    areas.extend(mapped_areas)
        
        return list(set(areas)) if areas else ["Geral"]
    
    async def notify_changes(
        self,
        alerts: List[Dict[str, Any]],
        channels: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Envia notificações sobre mudanças detectadas.
        
        Args:
            alerts: Lista de alertas para notificar
            channels: Canais de notificação (email, slack, webhook, etc.)
            
        Returns:
            Dict com status das notificações enviadas
        """
        channels = channels or ["email", "webhook"]
        notifications = []
        
        for alert in alerts:
            for channel in channels:
                notification = await self._send_notification(alert, channel)
                notifications.append(notification)
        
        return {
            "total_sent": len(notifications),
            "channels": channels,
            "notifications": notifications,
            "sent_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def _send_notification(
        self,
        alert: Dict[str, Any],
        channel: str
    ) -> Dict[str, Any]:
        """Simula envio de notificação (em produção, seria integração real)."""
        
        # Simula delay de rede
        await asyncio.sleep(0.1)
        
        return {
            "channel": channel,
            "alert_id": alert.get("source", "") + "_" + str(hash(alert.get("change", ""))),
            "severity": alert.get("severity", "Low"),
            "status": "sent",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    async def enrich_alerts_with_bridge(
        self,
        alerts: List[Dict[str, Any]],
        target_norms: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Enriquece múltiplos alertas com traduções via Bridge AI.
        
        Args:
            alerts: Lista de alertas
            target_norms: Normas alvo para tradução (default: todas exceto source)
            
        Returns:
            Lista de alertas enriquecidos com traduções
        """
        enriched = []
        
        for alert in alerts:
            source_norm = alert.get("source", "ANM")
            
            # Define normas alvo (todas exceto a source)
            all_norms = ["ANM", "JORC", "NI43-101", "PERC", "SAMREC"]
            targets = target_norms or [n for n in all_norms if n != source_norm]
            
            alert_enriched = alert.copy()
            alert_enriched["translations"] = {}
            
            for target in targets:
                try:
                    translation = await self.sync_radar_with_bridge(alert, target)
                    if "error" not in translation:
                        alert_enriched["translations"][target] = translation
                except Exception as e:
                    alert_enriched["translations"][target] = {"error": str(e)}
            
            enriched.append(alert_enriched)
        
        return enriched
    
    async def generate_cross_module_report(
        self,
        alerts: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Gera relatório integrando Radar, Bridge e Validator.
        
        Args:
            alerts: Alertas do Radar
            
        Returns:
            Relatório completo com análises integradas
        """
        report = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "radar_alerts": len(alerts),
            "integrated_analysis": []
        }
        
        for alert in alerts:
            analysis = {
                "alert": alert,
                "bridge_analysis": None,
                "validator_impact": None
            }
            
            # Integra com Bridge (traduz para todas as normas)
            if self.bridge:
                try:
                    source = alert.get("source", "ANM")
                    all_norms = ["ANM", "JORC", "NI43-101", "PERC", "SAMREC"]
                    targets = [n for n in all_norms if n != source]
                    
                    translations = {}
                    for target in targets[:2]:  # Limita a 2 para performance
                        trans = await self.sync_radar_with_bridge(alert, target)
                        if "error" not in trans:
                            translations[target] = trans["translation"]
                    
                    analysis["bridge_analysis"] = {
                        "translations_available": len(translations),
                        "translations": translations
                    }
                except Exception as e:
                    analysis["bridge_analysis"] = {"error": str(e)}
            
            # Integra com Validator (impacto na conformidade)
            if self.validator:
                try:
                    impact = await self.sync_radar_with_validator(alert)
                    analysis["validator_impact"] = impact.get("compliance_impact", {})
                except Exception as e:
                    analysis["validator_impact"] = {"error": str(e)}
            
            report["integrated_analysis"].append(analysis)
        
        return report


# Singleton para uso global
_connector_instance: Optional[RadarConnector] = None

def get_radar_connector() -> RadarConnector:
    """Retorna instância singleton do RadarConnector."""
    global _connector_instance
    if _connector_instance is None:
        _connector_instance = RadarConnector()
    return _connector_instance
