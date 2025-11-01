"""
CPRM Scraper - Serviço Geológico do Brasil
Coleta dados de projetos geológicos e banco de dados de mineração.
"""

import requests
import logging
from datetime import datetime
from typing import List, Dict, Any
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class CPRMScraper:
    """Scraper para dados do CPRM (Serviço Geológico do Brasil)."""
    
    BASE_URL = "https://geosgb.cprm.gov.br"
    API_URL = "https://geosgb.cprm.gov.br/api"
    TIMEOUT = 30
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'QIVO-Mining-Compliance/1.0',
            'Accept': 'application/json'
        })
    
    def fetch_projetos_geologicos(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Busca projetos geológicos ativos do CPRM.
        
        Args:
            limit: Número máximo de projetos a buscar
            
        Returns:
            Lista de dicionários com informações dos projetos
        """
        try:
            # URL da API de projetos do CPRM
            url = f"{self.API_URL}/projetos"
            
            params = {
                'limit': limit,
                'status': 'ativo',
                'orderBy': 'data_inicio:desc'
            }
            
            response = self.session.get(url, params=params, timeout=self.TIMEOUT)
            response.raise_for_status()
            
            data = response.json()
            projetos = data.get('features', [])
            
            logger.info(f"[CPRM] {len(projetos)} projetos geológicos recebidos")
            
            events = []
            for projeto in projetos:
                try:
                    props = projeto.get('properties', {})
                    geometry = projeto.get('geometry', {})
                    
                    event = {
                        'source': 'CPRM',
                        'source_id': f"CPRM-PROJ-{props.get('id', 'unknown')}",
                        'event_type': 'geological_project',
                        'title': props.get('nome', 'Projeto Geológico CPRM'),
                        'description': props.get('descricao', ''),
                        'severity': self._calculate_severity(props),
                        'location': self._extract_coordinates(geometry),
                        'state': props.get('uf'),
                        'municipality': props.get('municipio'),
                        'event_date': self._parse_date(props.get('data_inicio')),
                        'status': 'active',
                        'valid': True,
                        'metadata': {
                            'tipo_projeto': props.get('tipo'),
                            'area_km2': props.get('area'),
                            'coordenador': props.get('coordenador'),
                            'url': props.get('url')
                        }
                    }
                    
                    events.append(event)
                    
                except Exception as e:
                    logger.error(f"[CPRM] Erro ao processar projeto: {e}")
                    continue
            
            return events
            
        except requests.RequestException as e:
            logger.error(f"[CPRM] Erro ao buscar projetos geológicos: {e}")
            return []
    
    def fetch_ocorrencias_minerais(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Busca ocorrências minerais catalogadas pelo CPRM.
        
        Args:
            limit: Número máximo de ocorrências a buscar
            
        Returns:
            Lista de dicionários com informações das ocorrências
        """
        try:
            url = f"{self.API_URL}/ocorrencias-minerais"
            
            params = {
                'limit': limit,
                'orderBy': 'data_cadastro:desc'
            }
            
            response = self.session.get(url, params=params, timeout=self.TIMEOUT)
            response.raise_for_status()
            
            data = response.json()
            ocorrencias = data.get('features', [])
            
            logger.info(f"[CPRM] {len(ocorrencias)} ocorrências minerais recebidas")
            
            events = []
            for ocorrencia in ocorrencias:
                try:
                    props = ocorrencia.get('properties', {})
                    geometry = ocorrencia.get('geometry', {})
                    
                    event = {
                        'source': 'CPRM',
                        'source_id': f"CPRM-OCOR-{props.get('id', 'unknown')}",
                        'event_type': 'mineral_occurrence',
                        'title': f"Ocorrência de {props.get('substancia', 'mineral')}",
                        'description': props.get('observacoes', ''),
                        'severity': 'Medium',
                        'location': self._extract_coordinates(geometry),
                        'state': props.get('uf'),
                        'municipality': props.get('municipio'),
                        'event_date': self._parse_date(props.get('data_cadastro')),
                        'status': 'active',
                        'valid': True,
                        'metadata': {
                            'substancia': props.get('substancia'),
                            'uso': props.get('uso'),
                            'deposito': props.get('tipo_deposito'),
                            'fonte': props.get('fonte')
                        }
                    }
                    
                    events.append(event)
                    
                except Exception as e:
                    logger.error(f"[CPRM] Erro ao processar ocorrência: {e}")
                    continue
            
            return events
            
        except requests.RequestException as e:
            logger.error(f"[CPRM] Erro ao buscar ocorrências minerais: {e}")
            return []
    
    def fetch_noticias(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Busca notícias e comunicados do portal CPRM.
        
        Args:
            limit: Número máximo de notícias a buscar
            
        Returns:
            Lista de dicionários com informações das notícias
        """
        try:
            url = f"{self.BASE_URL}/pt-br/noticias"
            
            response = self.session.get(url, timeout=self.TIMEOUT)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            noticias = soup.find_all('article', class_='noticia', limit=limit)
            
            logger.info(f"[CPRM] {len(noticias)} notícias recebidas")
            
            events = []
            for noticia in noticias:
                try:
                    titulo = noticia.find('h2', class_='titulo')
                    resumo = noticia.find('p', class_='resumo')
                    data = noticia.find('time')
                    link = noticia.find('a', href=True)
                    
                    if not titulo:
                        continue
                    
                    event = {
                        'source': 'CPRM',
                        'source_id': f"CPRM-NEWS-{hash(titulo.text.strip())}",
                        'event_type': 'news',
                        'title': titulo.text.strip(),
                        'description': resumo.text.strip() if resumo else '',
                        'severity': 'Low',
                        'location': None,
                        'state': None,
                        'municipality': None,
                        'event_date': self._parse_date(data.get('datetime') if data else None),
                        'status': 'active',
                        'valid': True,
                        'metadata': {
                            'url': f"{self.BASE_URL}{link.get('href')}" if link else None
                        }
                    }
                    
                    events.append(event)
                    
                except Exception as e:
                    logger.error(f"[CPRM] Erro ao processar notícia: {e}")
                    continue
            
            return events
            
        except requests.RequestException as e:
            logger.error(f"[CPRM] Erro ao buscar notícias: {e}")
            return []
    
    def fetch_all(self) -> List[Dict[str, Any]]:
        """
        Busca todos os dados disponíveis do CPRM.
        
        Returns:
            Lista consolidada de todos os eventos
        """
        logger.info("[CPRM] Iniciando coleta de dados")
        
        all_events = []
        
        # Buscar projetos geológicos
        all_events.extend(self.fetch_projetos_geologicos())
        
        # Buscar ocorrências minerais
        all_events.extend(self.fetch_ocorrencias_minerais())
        
        # Buscar notícias
        all_events.extend(self.fetch_noticias())
        
        logger.info(f"[CPRM] Total de {len(all_events)} eventos coletados")
        
        return all_events
    
    def _calculate_severity(self, props: Dict) -> str:
        """Calcula severidade baseada no tipo de projeto."""
        tipo = props.get('tipo', '').lower()
        
        if 'ambiental' in tipo or 'risco' in tipo:
            return 'High'
        elif 'pesquisa' in tipo or 'exploração' in tipo:
            return 'Medium'
        else:
            return 'Low'
    
    def _extract_coordinates(self, geometry: Dict) -> Dict[str, Any]:
        """Extrai coordenadas do GeoJSON."""
        if not geometry or geometry.get('type') != 'Point':
            return None
        
        coords = geometry.get('coordinates', [])
        if len(coords) != 2:
            return None
        
        return {
            'type': 'Point',
            'coordinates': coords  # [longitude, latitude]
        }
    
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
_cprm_scraper = None

def get_cprm_scraper() -> CPRMScraper:
    """Retorna instância singleton do scraper CPRM."""
    global _cprm_scraper
    if _cprm_scraper is None:
        _cprm_scraper = CPRMScraper()
    return _cprm_scraper
