"""
SEC Scraper - Securities and Exchange Commission
Coleta dados de divulgações de mineração de empresas listadas nos EUA.
"""

import requests
import logging
from datetime import datetime
from typing import List, Dict, Any
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class SECScraper:
    """Scraper para dados da SEC relacionados a mineração."""
    
    BASE_URL = "https://www.sec.gov"
    EDGAR_URL = "https://www.sec.gov/cgi-bin/browse-edgar"
    TIMEOUT = 30
    
    # Empresas de mineração listadas para monitorar
    MINING_COMPANIES = [
        'FCMX',   # Freeport-McMoRan
        'NEM',    # Newmont Corporation
        'GOLD',   # Barrick Gold
        'AEM',    # Agnico Eagle Mines
        'KGC',    # Kinross Gold
        'BTG',    # B2Gold
        'PAAS',   # Pan American Silver
        'HL',     # Hecla Mining
        'CDE',    # Coeur Mining
        'AG'      # First Majestic Silver
    ]
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'QIVO Mining Compliance qivo@example.com',
            'Accept': 'application/json, text/html'
        })
    
    def fetch_mining_filings(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Busca últimos filings (10-K, 8-K, etc.) de empresas de mineração.
        
        Args:
            limit: Número máximo de filings por empresa
            
        Returns:
            Lista de dicionários com informações dos filings
        """
        all_events = []
        
        for ticker in self.MINING_COMPANIES[:5]:  # Limitar a 5 empresas por sync
            try:
                events = self._fetch_company_filings(ticker, limit=10)
                all_events.extend(events)
                
            except Exception as e:
                logger.error(f"[SEC] Erro ao buscar filings de {ticker}: {e}")
                continue
        
        logger.info(f"[SEC] {len(all_events)} filings recebidos")
        return all_events
    
    def _fetch_company_filings(self, ticker: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Busca filings de uma empresa específica."""
        try:
            # API EDGAR Search
            url = f"{self.EDGAR_URL}"
            
            params = {
                'action': 'getcompany',
                'ticker': ticker,
                'type': '8-K',  # Material events
                'dateb': '',
                'owner': 'exclude',
                'output': 'atom',
                'count': limit
            }
            
            response = self.session.get(url, params=params, timeout=self.TIMEOUT)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'xml')
            entries = soup.find_all('entry')
            
            events = []
            for entry in entries:
                try:
                    title = entry.find('title')
                    summary = entry.find('summary')
                    link = entry.find('link')
                    updated = entry.find('updated')
                    
                    if not title:
                        continue
                    
                    event = {
                        'source': 'SEC',
                        'source_id': f"SEC-{ticker}-{hash(title.text)}",
                        'event_type': 'regulatory_filing',
                        'title': f"{ticker}: {title.text.strip()}",
                        'description': summary.text.strip() if summary else '',
                        'severity': self._calculate_filing_severity(title.text),
                        'location': None,
                        'state': None,
                        'municipality': None,
                        'event_date': self._parse_date(updated.text if updated else None),
                        'status': 'active',
                        'valid': True,
                        'metadata': {
                            'ticker': ticker,
                            'filing_type': '8-K',
                            'url': link.get('href') if link else None
                        }
                    }
                    
                    events.append(event)
                    
                except Exception as e:
                    logger.error(f"[SEC] Erro ao processar filing: {e}")
                    continue
            
            return events
            
        except requests.RequestException as e:
            logger.error(f"[SEC] Erro ao buscar filings de {ticker}: {e}")
            return []
    
    def fetch_enforcement_actions(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Busca ações de enforcement da SEC relacionadas a mineração.
        
        Args:
            limit: Número máximo de ações a buscar
            
        Returns:
            Lista de dicionários com informações das ações
        """
        try:
            url = f"{self.BASE_URL}/litigation/litreleases.shtml"
            
            response = self.session.get(url, timeout=self.TIMEOUT)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            releases = soup.find_all('tr', class_='release', limit=limit)
            
            logger.info(f"[SEC] {len(releases)} ações de enforcement encontradas")
            
            events = []
            for release in releases:
                try:
                    cols = release.find_all('td')
                    if len(cols) < 2:
                        continue
                    
                    title = cols[1].text.strip()
                    
                    # Filtrar apenas casos relacionados a mineração
                    if not any(word in title.lower() for word in ['mining', 'mineral', 'gold', 'silver', 'copper']):
                        continue
                    
                    link = cols[1].find('a', href=True)
                    date_text = cols[0].text.strip()
                    
                    event = {
                        'source': 'SEC',
                        'source_id': f"SEC-ENF-{hash(title)}",
                        'event_type': 'enforcement',
                        'title': title,
                        'description': 'SEC Enforcement Action',
                        'severity': 'Critical',  # Enforcement é sempre crítico
                        'location': None,
                        'state': None,
                        'municipality': None,
                        'event_date': self._parse_date(date_text),
                        'status': 'active',
                        'valid': True,
                        'metadata': {
                            'url': f"{self.BASE_URL}{link.get('href')}" if link else None
                        }
                    }
                    
                    events.append(event)
                    
                except Exception as e:
                    logger.error(f"[SEC] Erro ao processar enforcement: {e}")
                    continue
            
            return events
            
        except requests.RequestException as e:
            logger.error(f"[SEC] Erro ao buscar enforcement actions: {e}")
            return []
    
    def fetch_all(self) -> List[Dict[str, Any]]:
        """
        Busca todos os dados disponíveis da SEC.
        
        Returns:
            Lista consolidada de todos os eventos
        """
        logger.info("[SEC] Iniciando coleta de dados")
        
        all_events = []
        
        # Buscar filings de mineração
        all_events.extend(self.fetch_mining_filings())
        
        # Buscar enforcement actions
        all_events.extend(self.fetch_enforcement_actions())
        
        logger.info(f"[SEC] Total de {len(all_events)} eventos coletados")
        
        return all_events
    
    def _calculate_filing_severity(self, title: str) -> str:
        """Calcula severidade baseada no tipo de filing."""
        title_lower = title.lower()
        
        if any(word in title_lower for word in ['investigation', 'violation', 'fraud', 'restatement']):
            return 'Critical'
        elif any(word in title_lower for word in ['acquisition', 'merger', 'bankruptcy']):
            return 'High'
        elif '10-K' in title or '10-Q' in title:
            return 'Medium'
        else:
            return 'Low'
    
    def _parse_date(self, date_str: str) -> datetime:
        """Converte string de data para datetime."""
        if not date_str:
            return datetime.now()
        
        try:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except:
            try:
                return datetime.strptime(date_str, '%Y-%m-%d')
            except:
                return datetime.now()


# Singleton
_sec_scraper = None

def get_sec_scraper() -> SECScraper:
    """Retorna instância singleton do scraper SEC."""
    global _sec_scraper
    if _sec_scraper is None:
        _sec_scraper = SECScraper()
    return _sec_scraper
