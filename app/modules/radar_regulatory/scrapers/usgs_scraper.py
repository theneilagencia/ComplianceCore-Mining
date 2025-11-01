"""
USGS Scraper - United States Geological Survey
Coleta dados de mineração, geologia e eventos sísmicos nos EUA.
"""

import requests
import logging
from datetime import datetime
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


class USGSScraper:
    """Scraper para dados do USGS."""
    
    BASE_URL = "https://earthquake.usgs.gov"
    MINERALS_URL = "https://www.usgs.gov/centers/national-minerals-information-center"
    API_URL = "https://earthquake.usgs.gov/fdsnws/event/1"
    TIMEOUT = 30
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'QIVO-Mining-Compliance/1.0',
            'Accept': 'application/json'
        })
    
    def fetch_earthquakes(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Busca terremotos significativos que podem afetar operações de mineração.
        
        Args:
            limit: Número máximo de eventos a buscar
            
        Returns:
            Lista de dicionários com informações dos terremotos
        """
        try:
            # API GeoJSON do USGS
            url = f"{self.API_URL}/query"
            
            params = {
                'format': 'geojson',
                'limit': limit,
                'minmagnitude': 4.0,  # Apenas terremotos significativos
                'orderby': 'time'
            }
            
            response = self.session.get(url, params=params, timeout=self.TIMEOUT)
            response.raise_for_status()
            
            data = response.json()
            features = data.get('features', [])
            
            logger.info(f"[USGS] {len(features)} terremotos recebidos")
            
            events = []
            for feature in features:
                try:
                    props = feature.get('properties', {})
                    geometry = feature.get('geometry', {})
                    coords = geometry.get('coordinates', [])
                    
                    magnitude = props.get('mag', 0)
                    
                    event = {
                        'source': 'USGS',
                        'source_id': f"USGS-EQ-{feature.get('id')}",
                        'event_type': 'earthquake',
                        'title': props.get('title', 'Earthquake'),
                        'description': f"Magnitude {magnitude} - {props.get('place', 'Unknown location')}",
                        'severity': self._calculate_earthquake_severity(magnitude),
                        'location': {
                            'type': 'Point',
                            'coordinates': [coords[0], coords[1]]  # [lon, lat]
                        } if len(coords) >= 2 else None,
                        'state': None,
                        'municipality': props.get('place'),
                        'event_date': datetime.fromtimestamp(props.get('time', 0) / 1000),
                        'status': 'active',
                        'valid': True,
                        'metadata': {
                            'magnitude': magnitude,
                            'depth_km': coords[2] if len(coords) > 2 else None,
                            'url': props.get('url'),
                            'tsunami': props.get('tsunami', 0)
                        }
                    }
                    
                    events.append(event)
                    
                except Exception as e:
                    logger.error(f"[USGS] Erro ao processar terremoto: {e}")
                    continue
            
            return events
            
        except requests.RequestException as e:
            logger.error(f"[USGS] Erro ao buscar terremotos: {e}")
            return []
    
    def fetch_mineral_commodities(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Busca relatórios de commodities minerais dos EUA.
        
        Args:
            limit: Número máximo de relatórios a buscar
            
        Returns:
            Lista de dicionários com informações dos relatórios
        """
        try:
            # USGS Mineral Commodity Summaries
            url = "https://www.usgs.gov/centers/national-minerals-information-center/mineral-commodity-summaries"
            
            response = self.session.get(url, timeout=self.TIMEOUT)
            response.raise_for_status()
            
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(response.text, 'html.parser')
            
            reports = soup.find_all('div', class_='publication-item', limit=limit)
            
            logger.info(f"[USGS] {len(reports)} relatórios minerais encontrados")
            
            events = []
            for report in reports:
                try:
                    titulo = report.find('h3')
                    descricao = report.find('p', class_='description')
                    link = report.find('a', href=True)
                    
                    if not titulo:
                        continue
                    
                    event = {
                        'source': 'USGS',
                        'source_id': f"USGS-MINERAL-{hash(titulo.text.strip())}",
                        'event_type': 'mineral_report',
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
                            'url': link.get('href') if link else None,
                            'tipo': 'commodity_summary'
                        }
                    }
                    
                    events.append(event)
                    
                except Exception as e:
                    logger.error(f"[USGS] Erro ao processar relatório: {e}")
                    continue
            
            return events
            
        except requests.RequestException as e:
            logger.error(f"[USGS] Erro ao buscar relatórios minerais: {e}")
            return []
    
    def fetch_all(self) -> List[Dict[str, Any]]:
        """
        Busca todos os dados disponíveis do USGS.
        
        Returns:
            Lista consolidada de todos os eventos
        """
        logger.info("[USGS] Iniciando coleta de dados")
        
        all_events = []
        
        # Buscar terremotos
        all_events.extend(self.fetch_earthquakes())
        
        # Buscar relatórios minerais
        all_events.extend(self.fetch_mineral_commodities())
        
        logger.info(f"[USGS] Total de {len(all_events)} eventos coletados")
        
        return all_events
    
    def _calculate_earthquake_severity(self, magnitude: float) -> str:
        """Calcula severidade baseada na magnitude do terremoto."""
        if magnitude >= 7.0:
            return 'Critical'
        elif magnitude >= 6.0:
            return 'High'
        elif magnitude >= 5.0:
            return 'Medium'
        else:
            return 'Low'


# Singleton
_usgs_scraper = None

def get_usgs_scraper() -> USGSScraper:
    """Retorna instância singleton do scraper USGS."""
    global _usgs_scraper
    if _usgs_scraper is None:
        _usgs_scraper = USGSScraper()
    return _usgs_scraper
