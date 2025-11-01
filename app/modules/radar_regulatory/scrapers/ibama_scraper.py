"""
IBAMA Scraper - Instituto Brasileiro do Meio Ambiente
Coleta dados de licenciamento ambiental, embargos e autuações.
"""

import requests
import logging
from datetime import datetime
from typing import List, Dict, Any
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class IBAMAScraper:
    """Scraper para dados do IBAMA."""
    
    BASE_URL = "https://servicos.ibama.gov.br"
    PORTAL_URL = "https://www.gov.br/ibama/pt-br"
    TIMEOUT = 30
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'QIVO-Mining-Compliance/1.0',
            'Accept': 'application/json, text/html'
        })
    
    def fetch_licencas_ambientais(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Busca licenças ambientais emitidas pelo IBAMA.
        
        Args:
            limit: Número máximo de licenças a buscar
            
        Returns:
            Lista de dicionários com informações das licenças
        """
        try:
            # Endpoint de consulta de licenças
            url = f"{self.BASE_URL}/licenciamento/consulta-empreendimentos.php"
            
            response = self.session.get(url, timeout=self.TIMEOUT)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            licencas = soup.find_all('tr', class_='licenca-row', limit=limit)
            
            logger.info(f"[IBAMA] {len(licencas)} licenças ambientais encontradas")
            
            events = []
            for licenca in licencas:
                try:
                    cols = licenca.find_all('td')
                    if len(cols) < 5:
                        continue
                    
                    event = {
                        'source': 'IBAMA',
                        'source_id': f"IBAMA-LIC-{cols[0].text.strip()}",
                        'event_type': 'environmental_license',
                        'title': f"Licença Ambiental - {cols[1].text.strip()}",
                        'description': cols[2].text.strip(),
                        'severity': self._calculate_license_severity(cols[3].text.strip()),
                        'location': None,
                        'state': cols[4].text.strip() if len(cols) > 4 else None,
                        'municipality': cols[5].text.strip() if len(cols) > 5 else None,
                        'event_date': self._parse_date(cols[6].text.strip() if len(cols) > 6 else None),
                        'status': 'active',
                        'valid': True,
                        'metadata': {
                            'numero_licenca': cols[0].text.strip(),
                            'tipo_licenca': cols[3].text.strip(),
                            'empreendedor': cols[1].text.strip()
                        }
                    }
                    
                    events.append(event)
                    
                except Exception as e:
                    logger.error(f"[IBAMA] Erro ao processar licença: {e}")
                    continue
            
            return events
            
        except requests.RequestException as e:
            logger.error(f"[IBAMA] Erro ao buscar licenças ambientais: {e}")
            return []
    
    def fetch_embargos(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Busca áreas embargadas pelo IBAMA.
        
        Args:
            limit: Número máximo de embargos a buscar
            
        Returns:
            Lista de dicionários com informações dos embargos
        """
        try:
            # Endpoint de consulta de embargos
            url = f"{self.BASE_URL}/phocadownload/embargos/embargos.csv"
            
            response = self.session.get(url, timeout=self.TIMEOUT)
            response.raise_for_status()
            
            # Parse CSV
            lines = response.text.strip().split('\n')
            header = lines[0].split(';')
            
            logger.info(f"[IBAMA] {len(lines)-1} embargos recebidos")
            
            events = []
            for line in lines[1:limit+1]:
                try:
                    values = line.split(';')
                    if len(values) < 5:
                        continue
                    
                    event = {
                        'source': 'IBAMA',
                        'source_id': f"IBAMA-EMB-{values[0]}",
                        'event_type': 'embargo',
                        'title': f"Embargo - {values[1]}",
                        'description': f"Infração: {values[2]}",
                        'severity': 'Critical',  # Embargos são sempre críticos
                        'location': None,
                        'state': values[3] if len(values) > 3 else None,
                        'municipality': values[4] if len(values) > 4 else None,
                        'event_date': self._parse_date(values[5] if len(values) > 5 else None),
                        'status': 'active',
                        'valid': True,
                        'metadata': {
                            'numero_auto': values[0],
                            'autuado': values[1],
                            'infracao': values[2],
                            'area_ha': values[6] if len(values) > 6 else None
                        }
                    }
                    
                    events.append(event)
                    
                except Exception as e:
                    logger.error(f"[IBAMA] Erro ao processar embargo: {e}")
                    continue
            
            return events
            
        except requests.RequestException as e:
            logger.error(f"[IBAMA] Erro ao buscar embargos: {e}")
            return []
    
    def fetch_autuacoes(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Busca autuações ambientais do IBAMA.
        
        Args:
            limit: Número máximo de autuações a buscar
            
        Returns:
            Lista de dicionários com informações das autuações
        """
        try:
            url = f"{self.PORTAL_URL}/acesso-a-informacao/dados-abertos/autuacoes-ambientais"
            
            response = self.session.get(url, timeout=self.TIMEOUT)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            autuacoes = soup.find_all('tr', class_='autuacao', limit=limit)
            
            logger.info(f"[IBAMA] {len(autuacoes)} autuações encontradas")
            
            events = []
            for autuacao in autuacoes:
                try:
                    cols = autuacao.find_all('td')
                    if len(cols) < 4:
                        continue
                    
                    event = {
                        'source': 'IBAMA',
                        'source_id': f"IBAMA-AUT-{cols[0].text.strip()}",
                        'event_type': 'enforcement',
                        'title': f"Autuação Ambiental - {cols[1].text.strip()}",
                        'description': cols[2].text.strip(),
                        'severity': 'High',
                        'location': None,
                        'state': cols[3].text.strip() if len(cols) > 3 else None,
                        'municipality': cols[4].text.strip() if len(cols) > 4 else None,
                        'event_date': self._parse_date(cols[5].text.strip() if len(cols) > 5 else None),
                        'status': 'active',
                        'valid': True,
                        'metadata': {
                            'numero_auto': cols[0].text.strip(),
                            'valor_multa': cols[6].text.strip() if len(cols) > 6 else None
                        }
                    }
                    
                    events.append(event)
                    
                except Exception as e:
                    logger.error(f"[IBAMA] Erro ao processar autuação: {e}")
                    continue
            
            return events
            
        except requests.RequestException as e:
            logger.error(f"[IBAMA] Erro ao buscar autuações: {e}")
            return []
    
    def fetch_noticias(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Busca notícias do portal IBAMA.
        
        Args:
            limit: Número máximo de notícias a buscar
            
        Returns:
            Lista de dicionários com informações das notícias
        """
        try:
            url = f"{self.PORTAL_URL}/assuntos/noticias"
            
            response = self.session.get(url, timeout=self.TIMEOUT)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            noticias = soup.find_all('article', class_='tileItem', limit=limit)
            
            logger.info(f"[IBAMA] {len(noticias)} notícias recebidas")
            
            events = []
            for noticia in noticias:
                try:
                    titulo = noticia.find('h2')
                    descricao = noticia.find('div', class_='tileBody')
                    link = noticia.find('a', href=True)
                    
                    if not titulo:
                        continue
                    
                    event = {
                        'source': 'IBAMA',
                        'source_id': f"IBAMA-NEWS-{hash(titulo.text.strip())}",
                        'event_type': 'news',
                        'title': titulo.text.strip(),
                        'description': descricao.text.strip() if descricao else '',
                        'severity': 'Low',
                        'location': None,
                        'state': None,
                        'municipality': None,
                        'event_date': datetime.now(),
                        'status': 'active',
                        'valid': True,
                        'metadata': {
                            'url': link.get('href') if link else None
                        }
                    }
                    
                    events.append(event)
                    
                except Exception as e:
                    logger.error(f"[IBAMA] Erro ao processar notícia: {e}")
                    continue
            
            return events
            
        except requests.RequestException as e:
            logger.error(f"[IBAMA] Erro ao buscar notícias: {e}")
            return []
    
    def fetch_all(self) -> List[Dict[str, Any]]:
        """
        Busca todos os dados disponíveis do IBAMA.
        
        Returns:
            Lista consolidada de todos os eventos
        """
        logger.info("[IBAMA] Iniciando coleta de dados")
        
        all_events = []
        
        # Buscar licenças ambientais
        all_events.extend(self.fetch_licencas_ambientais())
        
        # Buscar embargos
        all_events.extend(self.fetch_embargos())
        
        # Buscar autuações
        all_events.extend(self.fetch_autuacoes())
        
        # Buscar notícias
        all_events.extend(self.fetch_noticias())
        
        logger.info(f"[IBAMA] Total de {len(all_events)} eventos coletados")
        
        return all_events
    
    def _calculate_license_severity(self, tipo_licenca: str) -> str:
        """Calcula severidade baseada no tipo de licença."""
        tipo = tipo_licenca.upper()
        
        if 'LP' in tipo:  # Licença Prévia
            return 'Low'
        elif 'LI' in tipo:  # Licença de Instalação
            return 'Medium'
        elif 'LO' in tipo:  # Licença de Operação
            return 'High'
        else:
            return 'Medium'
    
    def _parse_date(self, date_str: str) -> datetime:
        """Converte string de data para datetime."""
        if not date_str:
            return datetime.now()
        
        try:
            return datetime.strptime(date_str, '%d/%m/%Y')
        except:
            try:
                return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            except:
                return datetime.now()


# Singleton
_ibama_scraper = None

def get_ibama_scraper() -> IBAMAScraper:
    """Retorna instância singleton do scraper IBAMA."""
    global _ibama_scraper
    if _ibama_scraper is None:
        _ibama_scraper = IBAMAScraper()
    return _ibama_scraper
