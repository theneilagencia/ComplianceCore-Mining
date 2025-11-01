"""
Radar AI - Monitoramento Regulatório Global
============================================
Módulo responsável por detectar, analisar e alertar sobre mudanças
regulatórias em normas internacionais de mineração (ANM, JORC, NI43-101, PERC, SAMREC).

Author: QIVO Intelligence Platform
Version: 5.0.0
Date: 2025-11-01
"""

import asyncio
import json
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from openai import AsyncOpenAI
import os

# Metadados das fontes regulatórias
REGULATORY_SOURCES = {
    "ANM": {
        "country": "Brasil",
        "full_name": "Agência Nacional de Mineração",
        "url": "https://www.gov.br/anm/pt-br",
        "focus": ["licenciamento", "segurança operacional", "impacto ambiental"],
        "language": "pt-BR",
        "update_frequency": "mensal"
    },
    "JORC": {
        "country": "Austrália",
        "full_name": "Joint Ore Reserves Committee",
        "url": "https://www.jorc.org",
        "focus": ["recursos minerais", "reservas", "transparência"],
        "language": "en-AU",
        "update_frequency": "anual"
    },
    "NI43-101": {
        "country": "Canadá",
        "full_name": "National Instrument 43-101",
        "url": "https://www.osc.ca",
        "focus": ["divulgação técnica", "persons qualificadas", "due diligence"],
        "language": "en-CA",
        "update_frequency": "trimestral"
    },
    "PERC": {
        "country": "Rússia",
        "full_name": "Pan-European Reserves and Resources Reporting Committee",
        "url": "https://www.vnimi.ru",
        "focus": ["recursos pan-europeus", "harmonização", "classificação geológica"],
        "language": "ru-RU",
        "update_frequency": "semestral"
    },
    "SAMREC": {
        "country": "África do Sul",
        "full_name": "South African Mineral Resource Committee",
        "url": "https://www.samcode.co.za",
        "focus": ["recursos minerais", "reservas", "código sul-africano"],
        "language": "en-ZA",
        "update_frequency": "anual"
    }
}

# Níveis de severidade
SEVERITY_LEVELS = {
    "Low": {"score": 1, "color": "🟢", "threshold": 0.3},
    "Medium": {"score": 2, "color": "🟡", "threshold": 0.5},
    "High": {"score": 3, "color": "🟠", "threshold": 0.75},
    "Critical": {"score": 4, "color": "🔴", "threshold": 0.9}
}


class RadarEngine:
    """
    Engine de monitoramento regulatório que detecta, analisa e alerta
    sobre mudanças em normas globais de mineração.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Inicializa o Radar Engine.
        
        Args:
            api_key: OpenAI API key (opcional, usa env var se não fornecida)
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None
        self.sources = REGULATORY_SOURCES
        self.cache: Dict[str, Any] = {}  # Cache de versões anteriores
        
    def get_supported_sources(self) -> List[str]:
        """Retorna lista de fontes regulatórias suportadas."""
        return list(self.sources.keys())
    
    def get_source_metadata(self, source: str) -> Optional[Dict[str, Any]]:
        """
        Retorna metadados de uma fonte específica.
        
        Args:
            source: Nome da fonte (ANM, JORC, etc.)
            
        Returns:
            Dict com metadados ou None se fonte não existir
        """
        return self.sources.get(source)
    
    async def fetch_sources(
        self, 
        sources: Optional[List[str]] = None
    ) -> Dict[str, Dict[str, Any]]:
        """
        Busca dados atualizados de fontes regulatórias.
        
        Em produção, isso conectaria a APIs reais, web scrapers,
        ou feeds RSS das agências regulatórias.
        
        Args:
            sources: Lista de fontes para monitorar (default: todas)
            
        Returns:
            Dict com dados estruturados de cada fonte
        """
        target_sources = sources or self.get_supported_sources()
        results = {}
        
        for source in target_sources:
            if source not in self.sources:
                continue
            
            # Simulação de dados (em produção, seria scraping real)
            metadata = self.sources[source]
            results[source] = {
                "metadata": metadata,
                "fetched_at": datetime.now(timezone.utc).isoformat(),
                "status": "active",
                "latest_updates": self._simulate_source_data(source),
                "version": self._get_source_version(source)
            }
            
            # Simula delay de rede
            await asyncio.sleep(0.1)
        
        return results
    
    def _simulate_source_data(self, source: str) -> List[Dict[str, Any]]:
        """
        Simula dados de atualização de uma fonte.
        Em produção, isso seria substituído por parsing real.
        """
        # Simulações realistas baseadas em cada norma
        simulations = {
            "ANM": [
                {
                    "title": "Resolução ANM nº 125/2025 - Novos requisitos para barragens",
                    "date": "2025-10-15",
                    "type": "regulatory_change",
                    "impact": "high",
                    "summary": "Estabelece novos critérios de segurança para barragens de mineração classe C e D"
                },
                {
                    "title": "Portaria ANM nº 89/2025 - Atualização de taxas",
                    "date": "2025-10-20",
                    "type": "administrative",
                    "impact": "medium",
                    "summary": "Reajuste anual de taxas de fiscalização"
                }
            ],
            "JORC": [
                {
                    "title": "JORC Code 2025 - Amendment 3",
                    "date": "2025-09-30",
                    "type": "code_update",
                    "impact": "critical",
                    "summary": "Introduz requisitos adicionais para reporting de recursos em áreas sensíveis"
                }
            ],
            "NI43-101": [
                {
                    "title": "CSA Staff Notice 43-309 - ESG Disclosure",
                    "date": "2025-10-01",
                    "type": "guidance",
                    "impact": "high",
                    "summary": "Novas diretrizes sobre divulgação de fatores ESG em relatórios técnicos"
                }
            ],
            "PERC": [
                {
                    "title": "PERC Standard 2025 - Harmonização com CRIRSCO",
                    "date": "2025-08-15",
                    "type": "standard_update",
                    "impact": "medium",
                    "summary": "Alinhamento de terminologia com padrões internacionais CRIRSCO"
                }
            ],
            "SAMREC": [
                {
                    "title": "SAMREC Code 2025 Edition",
                    "date": "2025-07-01",
                    "type": "code_revision",
                    "impact": "high",
                    "summary": "Revisão completa do código incluindo novos requisitos para mineração profunda"
                }
            ]
        }
        
        return simulations.get(source, [])
    
    def _get_source_version(self, source: str) -> str:
        """Retorna versão atual da fonte (simulado)."""
        versions = {
            "ANM": "v2025.10",
            "JORC": "v2025.3",
            "NI43-101": "v2025.Q3",
            "PERC": "v2025.2",
            "SAMREC": "v2025.1"
        }
        return versions.get(source, "v1.0")
    
    async def analyze_changes(
        self,
        current_data: Dict[str, Dict[str, Any]],
        deep: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Analisa mudanças detectadas comparando com versões anteriores.
        
        Args:
            current_data: Dados atuais das fontes
            deep: Se True, faz análise semântica profunda com GPT
            
        Returns:
            Lista de mudanças detectadas com metadados
        """
        changes = []
        
        for source, data in current_data.items():
            # Compara com cache (versão anterior)
            cached_version = self.cache.get(source, {}).get("version")
            current_version = data.get("version")
            
            if cached_version != current_version:
                # Detectou mudança de versão
                for update in data.get("latest_updates", []):
                    change = {
                        "source": source,
                        "change_type": update.get("type", "unknown"),
                        "title": update.get("title", ""),
                        "date": update.get("date", ""),
                        "impact_level": update.get("impact", "low"),
                        "summary": update.get("summary", ""),
                        "detected_at": datetime.now(timezone.utc).isoformat(),
                        "version_change": f"{cached_version or 'N/A'} → {current_version}"
                    }
                    changes.append(change)
            
            # Atualiza cache
            self.cache[source] = data
        
        # Análise profunda com GPT se solicitado
        if deep and self.client and changes:
            changes = await self._deep_analyze_changes(changes)
        
        return changes
    
    async def _deep_analyze_changes(
        self,
        changes: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Realiza análise semântica profunda das mudanças usando GPT-4o.
        """
        if not self.client:
            return changes
        
        # Prepara contexto para análise
        context = json.dumps(changes, indent=2, ensure_ascii=False)
        
        prompt = f"""Você é um especialista em regulamentação de mineração internacional.

Analise as seguintes mudanças regulatórias detectadas e forneça:
1. Avaliação de impacto operacional (0-100)
2. Nível de urgência (Low, Medium, High, Critical)
3. Recomendações de ação
4. Palavras-chave de risco

Mudanças detectadas:
{context}

Responda em JSON com este formato:
{{
  "analysis": [
    {{
      "source": "fonte",
      "impact_score": 85,
      "severity": "High",
      "urgency": "30 dias",
      "recommendations": ["ação 1", "ação 2"],
      "risk_keywords": ["palavra1", "palavra2"],
      "explanation": "análise detalhada"
    }}
  ]
}}"""

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "Você é um analista de compliance regulatório especializado em mineração."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            
            analysis = json.loads(response.choices[0].message.content)
            
            # Enriquece os changes com análise GPT
            for i, change in enumerate(changes):
                if i < len(analysis.get("analysis", [])):
                    gpt_analysis = analysis["analysis"][i]
                    change.update({
                        "gpt_impact_score": gpt_analysis.get("impact_score", 0),
                        "gpt_severity": gpt_analysis.get("severity", "Low"),
                        "gpt_urgency": gpt_analysis.get("urgency", ""),
                        "gpt_recommendations": gpt_analysis.get("recommendations", []),
                        "gpt_risk_keywords": gpt_analysis.get("risk_keywords", []),
                        "gpt_explanation": gpt_analysis.get("explanation", "")
                    })
            
        except Exception as e:
            # Fallback se GPT falhar
            for change in changes:
                change["gpt_error"] = str(e)
        
        return changes
    
    def generate_alerts(
        self,
        changes: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Gera alertas classificados por severidade.
        
        Args:
            changes: Lista de mudanças detectadas
            
        Returns:
            Lista de alertas com severidade e confiança
        """
        alerts = []
        
        for change in changes:
            # Determina severidade baseado em múltiplos fatores
            severity = self._calculate_severity(change)
            confidence = self._calculate_confidence(change)
            
            alert = {
                "source": change.get("source", "unknown"),
                "change": change.get("title", ""),
                "severity": severity,
                "confidence": round(confidence, 2),
                "summary": change.get("summary", ""),
                "date": change.get("date", ""),
                "impact_level": change.get("impact_level", "low"),
                "recommendations": change.get("gpt_recommendations", []),
                "risk_keywords": change.get("gpt_risk_keywords", []),
                "version_change": change.get("version_change", ""),
                "detected_at": change.get("detected_at", "")
            }
            
            # Adiciona explicação GPT se disponível
            if "gpt_explanation" in change:
                alert["gpt_analysis"] = change["gpt_explanation"]
            
            alerts.append(alert)
        
        # Ordena por severidade (Critical → High → Medium → Low)
        severity_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
        alerts.sort(key=lambda x: (severity_order.get(x["severity"], 4), -x["confidence"]))
        
        return alerts
    
    def _calculate_severity(self, change: Dict[str, Any]) -> str:
        """
        Calcula severidade baseado em múltiplos indicadores.
        """
        # Se GPT forneceu severidade, usa ela
        if "gpt_severity" in change:
            return change["gpt_severity"]
        
        # Fallback: mapeia impact_level para severity
        impact_map = {
            "critical": "Critical",
            "high": "High",
            "medium": "Medium",
            "low": "Low"
        }
        
        impact = change.get("impact_level", "low").lower()
        return impact_map.get(impact, "Low")
    
    def _calculate_confidence(self, change: Dict[str, Any]) -> float:
        """
        Calcula confiança da detecção (0-1).
        """
        confidence = 0.5  # Base
        
        # Aumenta se tem análise GPT
        if "gpt_impact_score" in change:
            gpt_score = change["gpt_impact_score"] / 100.0
            confidence = 0.3 + (gpt_score * 0.7)
        
        # Aumenta se tem mudança de versão confirmada
        if "version_change" in change and "N/A" not in change["version_change"]:
            confidence = min(confidence + 0.15, 1.0)
        
        # Aumenta se tem data recente
        if "date" in change:
            try:
                change_date = datetime.fromisoformat(change["date"].replace("Z", "+00:00"))
                days_ago = (datetime.now(timezone.utc) - change_date).days
                if days_ago < 30:
                    confidence = min(confidence + 0.1, 1.0)
            except:
                pass
        
        return confidence
    
    async def summarize(self, findings: Dict[str, Any]) -> str:
        """
        Gera resumo executivo dos achados usando GPT-4o.
        
        Args:
            findings: Dict com timestamp e alerts
            
        Returns:
            String com resumo executivo
        """
        if not self.client:
            return self._generate_basic_summary(findings)
        
        alerts = findings.get("alerts", [])
        if not alerts:
            return "Nenhuma mudança regulatória detectada no período."
        
        context = json.dumps(alerts, indent=2, ensure_ascii=False)
        
        prompt = f"""Você é um consultor de compliance regulatório na mineração.

Gere um resumo executivo profissional (3-5 parágrafos) sobre as mudanças regulatórias detectadas.

Inclua:
- Panorama geral
- Principais riscos e oportunidades
- Prioridades de ação
- Impacto em diferentes jurisdições

Dados:
{context}

Seja objetivo, técnico e focado em decisões estratégicas."""

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "Você é um especialista em regulação de mineração global."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=800
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            return self._generate_basic_summary(findings) + f"\n\n[Nota: Erro ao gerar resumo GPT: {str(e)}]"
    
    def _generate_basic_summary(self, findings: Dict[str, Any]) -> str:
        """Gera resumo básico sem GPT."""
        alerts = findings.get("alerts", [])
        
        if not alerts:
            return "Nenhuma mudança regulatória detectada."
        
        total = len(alerts)
        by_severity = {}
        for alert in alerts:
            sev = alert.get("severity", "Low")
            by_severity[sev] = by_severity.get(sev, 0) + 1
        
        summary = f"Detectadas {total} mudanças regulatórias:\n"
        for sev in ["Critical", "High", "Medium", "Low"]:
            if sev in by_severity:
                emoji = SEVERITY_LEVELS[sev]["color"]
                summary += f"  {emoji} {sev}: {by_severity[sev]}\n"
        
        return summary.strip()
    
    async def run_cycle(
        self,
        sources: Optional[List[str]] = None,
        deep: bool = False,
        summarize: bool = False
    ) -> Dict[str, Any]:
        """
        Executa ciclo completo de monitoramento.
        
        Args:
            sources: Fontes para monitorar (default: todas)
            deep: Ativa análise profunda com GPT
            summarize: Gera resumo executivo
            
        Returns:
            Dict com timestamp, alerts e summary (se solicitado)
        """
        # 1. Busca dados das fontes
        current_data = await self.fetch_sources(sources)
        
        # 2. Analisa mudanças
        changes = await self.analyze_changes(current_data, deep=deep)
        
        # 3. Gera alertas
        alerts = self.generate_alerts(changes)
        
        # 4. Monta resultado
        result = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "sources_monitored": list(current_data.keys()),
            "alerts_count": len(alerts),
            "alerts": alerts
        }
        
        # 5. Gera resumo se solicitado
        if summarize and alerts:
            result["executive_summary"] = await self.summarize(result)
        
        return result


# Singleton para uso global
_radar_instance: Optional[RadarEngine] = None

def get_radar_engine() -> RadarEngine:
    """Retorna instância singleton do RadarEngine."""
    global _radar_instance
    if _radar_instance is None:
        _radar_instance = RadarEngine()
    return _radar_instance
