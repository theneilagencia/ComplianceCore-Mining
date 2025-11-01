"""
ANP Scraper - Agência Nacional do Petróleo, Gás Natural e Biocombustíveis
Coleta dados de licitações, concessões e regulamentações.
"""

import requests
import logging
from datetime import datetime
from typing import List, Dict, Any
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class ANPScraper:
    """Scraper para dados da ANP."""
    
    BASE_URL = "https://www.gov.br/anp/pt-br"
    API_URL = "https://dados.anp.gov.br/api/3/action"
    TIMEOUT = 30
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'QIVO-Mining-Compliance/1.0',
            'Accept': 'application/json'
        })
    
    def fetch_rodadas_licitacao(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Busca rodadas de licitação de blocos exploratórios.
        
        Args:
            limit: Número máximo de rodadas a buscar
            
        Returns:
            Lista de dicionários com informações das licitações
        """
        try:
            # Buscar dados de licitações
            url = f"{self.BASE_URL}/assuntos/exploracao-e-producao-de-oleo-e-gas/licitacoes"
            
            response = self.session.get(url, timeout=self.TIMEOUT)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            licitacoes = soup.find_all('div', class_='tile-content', limit=limit)
            
            logger.info(f"[ANP] {len(licitacoes)} rodadas de licitação encontradas")
            
            events = []
            for licitacao in licitacoes:
                try:
                    titulo = licitacao.find('h2')
                    descricao = licitacao.find('p', class_='description')
                    link = licitacao.find('a', href=True)
                    
                    if not titulo:
                        continue
                    
                    event = {
                        'source': 'ANP',
                        'source_id': f"ANP-LIC-{hash(titulo.text.strip())}",
                        'event_type': 'bidding_round',
                        'title': titulo.text.strip(),
                        'description': descricao.text.strip() if descricao else '',
                        'severity': 'High',  # Licitações são importantes
                        'location': None,
                        'state': None,
                        'municipality': None,
                        'event_date': datetime.now(),
                        'status': 'active',
                        'valid': True,
                        'metadata': {
                            'url': f"{self.BASE_URL}{link.get('href')}" if link else None,
                            'tipo': 'licitação'
                        }
                    }
                    
                    events.append(event)
                    
                except Exception as e:
                    logger.error(f"[ANP] Erro ao processar licitação: {e}")
                    continue
            
            return events
            
        except requests.RequestException as e:
            logger.error(f"[ANP] Erro ao buscar licitações: {e}")
            return []
    
    def fetch_concessoes(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Busca concessões ativas de blocos.
        
        Args:
            limit: Número máximo de concessões a buscar
            
        Returns:
            Lista de dicionários com informações das concessões
        """
        try:
            # API de dados abertos da ANP
            url = f"{self.API_URL}/datastore_search"
            
            params = {
                'resource_id': 'concessoes-vigentes',
                'limit': limit
            }
            
            response = self.session.get(url, params=params, timeout=self.TIMEOUT)
            response.raise_for_status()
            
            data = response.json()
            concessoes = data.get('result', {}).get('records', [])
            
            logger.info(f"[ANP] {len(concessoes)} concessões recebidas")
            
            events = []
            for concessao in concessoes:
                try:
                    event = {
                        'source': 'ANP',
                        'source_id': f"ANP-CONC-{concessao.get('id', 'unknown')}",
                        'event_type': 'concession',
                        'title': f"Concessão {concessao.get('bloco', 'Bloco')} - {concessao.get('concessionaria', '')}",
                        'description': f"Bacia: {concessao.get('bacia', 'N/A')}",
                        'severity': 'Medium',
                        'location': None,
                        'state': concessao.get('uf'),
                        'municipality': None,
                        'event_date': self._parse_date(concessao.get('data_assinatura')),
                        'status': 'active',
                        'valid': True,
                        'metadata': {
                            'bloco': concessao.get('bloco'),
                            'bacia': concessao.get('bacia'),
                            'concessionaria': concessao.get('concessionaria'),
                            'fase': concessao.get('fase')
                        }
                    }
                    
                    events.append(event)
                    
                except Exception as e:
                    logger.error(f"[ANP] Erro ao processar concessão: {e}")
                    continue
            
            return events
            
        except requests.RequestException as e:
            logger.error(f"[ANP] Erro ao buscar concessões: {e}")
            return []
    
    def fetch_noticias(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Busca notícias regulatórias da ANP.
        
        Args:
            limit: Número máximo de notícias a buscar
            
        Returns:
            Lista de dicionários com informações das notícias
        """
        try:
            url = f"{self.BASE_URL}/assuntos/noticias"
            
            response = self.session.get(url, timeout=self.TIMEOUT)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            noticias = soup.find_all('article', class_='tileItem', limit=limit)
            
            logger.info(f"[ANP] {len(noticias)} notícias recebidas")
            
            events = []
            for noticia in noticias:
                try:
                    titulo = noticia.find('h2', class_='tileHeadline')
                    descricao = noticia.find('div', class_='tileBody')
                    link = noticia.find('a', href=True)
                    data_elem = noticia.find('span', class_='documentByLine')
                    
                    if not titulo:
                        continue
                    
                    event = {
                        'source': 'ANP',
                        'source_id': f"ANP-NEWS-{hash(titulo.text.strip())}",
                        'event_type': 'news',
                        'title': titulo.text.strip(),
                        'description': descricao.text.strip() if descricao else '',
                        'severity': 'Low',
                        'location': None,
                        'state': None,
                        'municipality': None,
                        'event_date': self._parse_date(data_elem.text if data_elem else None),
                        'status': 'active',
                        'valid': True,
                        'metadata': {
                            'url': link.get('href') if link else None
                        }
                    }
                    
                    events.append(event)
                    
                except Exception as e:
                    logger.error(f"[ANP] Erro ao processar notícia: {e}")
                    continue
            
            return events
            
        except requests.RequestException as e:
            logger.error(f"[ANP] Erro ao buscar notícias: {e}")
            return []
    
    def fetch_all(self) -> List[Dict[str, Any]]:
        """
        Busca todos os dados disponíveis da ANP.
        
        Returns:
            Lista consolidada de todos os eventos
        """
        logger.info("[ANP] Iniciando coleta de dados")
        
        all_events = []
        
        # Buscar licitações
        all_events.extend(self.fetch_rodadas_licitacao())
        
        # Buscar concessões
        all_events.extend(self.fetch_concessoes())
        
        # Buscar notícias
        all_events.extend(self.fetch_noticias())
        
        logger.info(f"[ANP] Total de {len(all_events)} eventos coletados")
        
        return all_events
    
    def _parse_date(self, date_str: str) -> datetime:
        """Converte string de data para datetime."""
        if not date_str:
            return datetime.now()
        
        try:
            # Tentar formato ISO
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except:
            try:
                # Tentar formato brasileiro
                return datetime.strptime(date_str, '%d/%m/%Y')
            except:
                return datetime.now()


# Singleton
_anp_scraper = None

def get_anp_scraper() -> ANPScraper:
    """Retorna instância singleton do scraper ANP."""
    global _anp_scraper
    if _anp_scraper is None:
        _anp_scraper = ANPScraper()
    return _anp_scraper
