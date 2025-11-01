"""
ANM Scraper - Agência Nacional de Mineração
============================================
Coleta dados reais da API/site da ANM.

Author: QIVO Intelligence Platform
Version: 5.1.0
Date: 2025-11-01
"""

import requests
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from bs4 import BeautifulSoup
import re

logger = logging.getLogger(__name__)

class ANMScraper:
    """Scraper para dados da ANM (Agência Nacional de Mineração)."""
    
    BASE_URL = "https://www.gov.br/anm/pt-br"
    API_URL = "https://sistemas.anm.gov.br/sied/api"  # API real da ANM
    
    def __init__(self, timeout: int = 30):
        """
        Inicializa o scraper ANM.
        
        Args:
            timeout: Timeout para requisições HTTP (segundos)
        """
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'QIVO-Radar/5.1.0 (Compliance Platform)',
            'Accept': 'application/json, text/html',
        })
    
    def fetch_processos_minerarios(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Busca processos minerários recentes da ANM.
        
        Args:
            limit: Número máximo de processos a buscar
            
        Returns:
            Lista de processos minerários
        """
        logger.info(f"[ANM] Buscando processos minerários (limit={limit})")
        
        try:
            # URL real da API da ANM (ajustar conforme documentação oficial)
            url = f"{self.API_URL}/processos"
            params = {
                'limit': limit,
                'status': 'active',
                'orderBy': 'data_protocolo:desc'
            }
            
            response = self.session.get(url, params=params, timeout=self.timeout)
            response.raise_for_status()
            
            data = response.json()
            processos = data.get('data', [])
            
            logger.info(f"[ANM] {len(processos)} processos recebidos")
            
            # Normalizar dados
            normalized = []
            for processo in processos:
                normalized.append({
                    'source': 'ANM',
                    'source_id': processo.get('numero_processo', ''),
                    'event_type': 'processo_minerario',
                    'title': f"Processo {processo.get('numero_processo', 'N/A')} - {processo.get('fase', 'N/A')}",
                    'description': processo.get('objeto', ''),
                    'severity': self._calculate_severity(processo),
                    'location': self._extract_coordinates(processo),
                    'state': processo.get('uf', ''),
                    'municipality': processo.get('municipio', ''),
                    'event_date': self._parse_date(processo.get('data_protocolo')),
                    'metadata': {
                        'numero_processo': processo.get('numero_processo'),
                        'fase': processo.get('fase'),
                        'substancia': processo.get('substancia'),
                        'area_ha': processo.get('area_ha'),
                        'titular': processo.get('titular'),
                        'cpf_cnpj': processo.get('cpf_cnpj'),
                        'ano': processo.get('ano')
                    }
                })
            
            return normalized
            
        except requests.exceptions.RequestException as e:
            logger.error(f"[ANM] Erro ao buscar processos: {e}")
            return []
        except Exception as e:
            logger.error(f"[ANM] Erro inesperado: {e}")
            return []
    
    def fetch_noticias(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Scrape notícias do portal da ANM.
        
        Args:
            limit: Número máximo de notícias
            
        Returns:
            Lista de notícias/eventos
        """
        logger.info(f"[ANM] Buscando notícias (limit={limit})")
        
        try:
            url = f"{self.BASE_URL}/assuntos/noticias"
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            articles = soup.find_all('article', class_='tile-item', limit=limit)
            
            noticias = []
            for article in articles:
                title_elem = article.find('h2', class_='tile-title')
                desc_elem = article.find('p', class_='tile-description')
                date_elem = article.find('span', class_='tile-date')
                
                if title_elem:
                    noticias.append({
                        'source': 'ANM',
                        'source_id': f"ANM-NEWS-{hash(title_elem.text)}",
                        'event_type': 'noticia',
                        'title': title_elem.text.strip(),
                        'description': desc_elem.text.strip() if desc_elem else '',
                        'severity': 'Low',  # Notícias geralmente são informativas
                        'event_date': self._parse_date(date_elem.text if date_elem else None),
                        'metadata': {
                            'url': article.find('a')['href'] if article.find('a') else ''
                        }
                    })
            
            logger.info(f"[ANM] {len(noticias)} notícias extraídas")
            return noticias
            
        except Exception as e:
            logger.error(f"[ANM] Erro ao buscar notícias: {e}")
            return []
    
    def fetch_autuacoes(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Busca autuações e fiscalizações da ANM.
        
        Args:
            limit: Número máximo de autuações
            
        Returns:
            Lista de autuações
        """
        logger.info(f"[ANM] Buscando autuações (limit={limit})")
        
        try:
            # URL da API de fiscalização (ajustar conforme documentação)
            url = f"{self.API_URL}/fiscalizacao/autuacoes"
            params = {'limit': limit, 'orderBy': 'data:desc'}
            
            response = self.session.get(url, params=params, timeout=self.timeout)
            response.raise_for_status()
            
            data = response.json()
            autuacoes = data.get('data', [])
            
            normalized = []
            for autuacao in autuacoes:
                normalized.append({
                    'source': 'ANM',
                    'source_id': autuacao.get('numero_auto', ''),
                    'event_type': 'autuacao',
                    'title': f"Autuação {autuacao.get('numero_auto', 'N/A')} - {autuacao.get('infracao', '')}",
                    'description': autuacao.get('descricao_infracao', ''),
                    'severity': 'High',  # Autuações são graves
                    'state': autuacao.get('uf', ''),
                    'municipality': autuacao.get('municipio', ''),
                    'event_date': self._parse_date(autuacao.get('data_autuacao')),
                    'metadata': {
                        'numero_auto': autuacao.get('numero_auto'),
                        'infracao': autuacao.get('infracao'),
                        'valor_multa': autuacao.get('valor_multa'),
                        'empresa': autuacao.get('empresa'),
                        'cnpj': autuacao.get('cnpj')
                    }
                })
            
            logger.info(f"[ANM] {len(normalized)} autuações processadas")
            return normalized
            
        except Exception as e:
            logger.error(f"[ANM] Erro ao buscar autuações: {e}")
            return []
    
    def fetch_all(self) -> List[Dict[str, Any]]:
        """
        Busca todos os tipos de eventos da ANM.
        
        Returns:
            Lista consolidada de eventos
        """
        logger.info("[ANM] Iniciando coleta completa")
        
        all_events = []
        
        # Processos minerários
        processos = self.fetch_processos_minerarios(limit=100)
        all_events.extend(processos)
        
        # Notícias
        noticias = self.fetch_noticias(limit=50)
        all_events.extend(noticias)
        
        # Autuações
        autuacoes = self.fetch_autuacoes(limit=100)
        all_events.extend(autuacoes)
        
        logger.info(f"[ANM] Total de {len(all_events)} eventos coletados")
        return all_events
    
    # ==================== Métodos auxiliares ====================
    
    def _calculate_severity(self, processo: Dict) -> str:
        """Calcula severidade baseada no tipo e fase do processo."""
        fase = processo.get('fase', '').lower()
        
        if 'embargo' in fase or 'suspensão' in fase:
            return 'Critical'
        elif 'autuação' in fase or 'multa' in fase:
            return 'High'
        elif 'licenciamento' in fase:
            return 'Medium'
        else:
            return 'Low'
    
    def _extract_coordinates(self, processo: Dict) -> Optional[Dict]:
        """Extrai coordenadas geográficas do processo."""
        lat = processo.get('latitude')
        lon = processo.get('longitude')
        
        if lat and lon:
            try:
                return {
                    'type': 'Point',
                    'coordinates': [float(lon), float(lat)]
                }
            except (ValueError, TypeError):
                return None
        return None
    
    def _parse_date(self, date_str: Optional[str]) -> Optional[datetime]:
        """Converte string de data para datetime."""
        if not date_str:
            return None
        
        try:
            # Tenta múltiplos formatos
            formats = [
                '%Y-%m-%d',
                '%d/%m/%Y',
                '%Y-%m-%dT%H:%M:%S',
                '%Y-%m-%d %H:%M:%S'
            ]
            
            for fmt in formats:
                try:
                    return datetime.strptime(date_str, fmt).replace(tzinfo=timezone.utc)
                except ValueError:
                    continue
            
            logger.warning(f"[ANM] Formato de data não reconhecido: {date_str}")
            return None
            
        except Exception as e:
            logger.error(f"[ANM] Erro ao parsear data: {e}")
            return None


# Singleton para uso global
_anm_scraper: Optional[ANMScraper] = None

def get_anm_scraper() -> ANMScraper:
    """Retorna instância singleton do ANMScraper."""
    global _anm_scraper
    if _anm_scraper is None:
        _anm_scraper = ANMScraper()
    return _anm_scraper
