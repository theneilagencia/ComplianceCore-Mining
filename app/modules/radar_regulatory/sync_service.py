"""
Serviço de sincronização de eventos regulatórios.
Executa coleta periódica e armazena no banco.
"""

import logging
from datetime import datetime
from typing import List, Dict, Any
import psycopg2
from psycopg2.extras import Json
import os

from .scrapers.anm_scraper import get_anm_scraper
from .scrapers.cprm_scraper import get_cprm_scraper
from .scrapers.anp_scraper import get_anp_scraper
from .scrapers.ibama_scraper import get_ibama_scraper
from .scrapers.usgs_scraper import get_usgs_scraper
from .scrapers.sec_scraper import get_sec_scraper

logger = logging.getLogger(__name__)


class RadarSyncService:
    """Serviço de sincronização do Radar Regulatório."""
    
    def __init__(self):
        self.scrapers = {
            'ANM': get_anm_scraper(),
            'CPRM': get_cprm_scraper(),
            'ANP': get_anp_scraper(),
            'IBAMA': get_ibama_scraper(),
            'USGS': get_usgs_scraper(),
            'SEC': get_sec_scraper(),
        }
        
        # Conexão direta com PostgreSQL
        self.db_url = os.getenv('DATABASE_URL', 
            'postgresql://qivo_mining_user:Rf5NbORtZ1Opy88ah1cTCdE8TUxxEpq3@dpg-d3sjth6uk2gs73fqop30-a.oregon-postgres.render.com/qivo_mining')
    
    def sync_all_sources(self) -> Dict[str, Any]:
        """
        Sincroniza todas as fontes regulatórias.
        
        Returns:
            Dict com estatísticas da sincronização
        """
        logger.info("[RADAR] Iniciando sincronização de todas as fontes")
        start_time = datetime.now()
        
        stats = {
            'total_fetched': 0,
            'total_new': 0,
            'total_updated': 0,
            'total_errors': 0,
            'sources': {},
            'start_time': start_time.isoformat(),
            'end_time': None,
            'duration_seconds': None
        }
        
        conn = None
        try:
            # Conectar ao banco
            conn = psycopg2.connect(self.db_url)
            
            for source_name, scraper in self.scrapers.items():
                try:
                    logger.info(f"[RADAR] Sincronizando {source_name}...")
                    source_start = datetime.now()
                    
                    # Buscar eventos
                    events = scraper.fetch_all()
                    stats['total_fetched'] += len(events)
                    
                    # Salvar no banco
                    new_count, updated_count = self._save_events(conn, events, source_name)
                    stats['total_new'] += new_count
                    stats['total_updated'] += updated_count
                    
                    source_duration = (datetime.now() - source_start).total_seconds()
                    
                    stats['sources'][source_name] = {
                        'fetched': len(events),
                        'new': new_count,
                        'updated': updated_count,
                        'status': 'success',
                        'duration_seconds': source_duration
                    }
                    
                    logger.info(f"[RADAR] {source_name}: {len(events)} fetched, {new_count} new, {updated_count} updated ({source_duration:.2f}s)")
                    
                    # Salvar log de sincronização
                    self._save_sync_log(conn, source_name, len(events), source_duration * 1000)
                    
                except Exception as e:
                    logger.error(f"[RADAR] Erro ao sincronizar {source_name}: {e}")
                    stats['total_errors'] += 1
                    stats['sources'][source_name] = {
                        'status': 'error',
                        'error': str(e)
                    }
            
            conn.commit()
            
        except Exception as e:
            logger.error(f"[RADAR] Erro crítico na sincronização: {e}")
            if conn:
                conn.rollback()
            stats['critical_error'] = str(e)
            
        finally:
            if conn:
                conn.close()
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        stats['end_time'] = end_time.isoformat()
        stats['duration_seconds'] = duration
        
        logger.info(f"[RADAR] Sincronização concluída: {stats['total_new']} novos, {stats['total_updated']} atualizados, {stats['total_errors']} erros ({duration:.2f}s)")
        
        return stats
    
    def _save_events(self, conn, events: List[Dict], source: str) -> tuple:
        """
        Salva eventos no banco de dados.
        
        Returns:
            Tuple (new_count, updated_count)
        """
        new_count = 0
        updated_count = 0
        
        cursor = conn.cursor()
        
        for event_data in events:
            try:
                # Preparar coordenadas geográficas
                location_wkt = None
                if event_data.get('location'):
                    coords = event_data['location']['coordinates']
                    location_wkt = f'POINT({coords[0]} {coords[1]})'
                
                # Verificar se evento já existe
                cursor.execute("""
                    SELECT id FROM radar_events 
                    WHERE source = %s AND source_id = %s
                """, (event_data['source'], event_data['source_id']))
                
                existing = cursor.fetchone()
                
                if existing:
                    # Atualizar evento existente
                    cursor.execute("""
                        UPDATE radar_events SET
                            event_type = %s,
                            title = %s,
                            description = %s,
                            severity = %s,
                            location = ST_GeomFromText(%s, 4326),
                            state = %s,
                            municipality = %s,
                            event_date = %s,
                            status = %s,
                            valid = %s,
                            metadata = %s,
                            updated_at = NOW()
                        WHERE id = %s
                    """, (
                        event_data['event_type'],
                        event_data['title'],
                        event_data.get('description'),
                        event_data['severity'],
                        location_wkt,
                        event_data.get('state'),
                        event_data.get('municipality'),
                        event_data.get('event_date'),
                        event_data.get('status', 'active'),
                        event_data.get('valid', True),
                        Json(event_data.get('metadata', {})),
                        existing[0]
                    ))
                    updated_count += 1
                    
                else:
                    # Criar novo evento
                    cursor.execute("""
                        INSERT INTO radar_events (
                            source, source_id, event_type, title, description,
                            severity, location, state, municipality,
                            event_date, detection_date, status, valid, metadata
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s,
                            ST_GeomFromText(%s, 4326),
                            %s, %s, %s, NOW(), %s, %s, %s
                        )
                    """, (
                        event_data['source'],
                        event_data['source_id'],
                        event_data['event_type'],
                        event_data['title'],
                        event_data.get('description'),
                        event_data['severity'],
                        location_wkt,
                        event_data.get('state'),
                        event_data.get('municipality'),
                        event_data.get('event_date'),
                        event_data.get('status', 'active'),
                        event_data.get('valid', True),
                        Json(event_data.get('metadata', {}))
                    ))
                    new_count += 1
                
            except Exception as e:
                logger.error(f"[RADAR] Erro ao salvar evento {event_data.get('source_id')}: {e}")
                continue
        
        cursor.close()
        return new_count, updated_count
    
    def _save_sync_log(self, conn, source: str, records_fetched: int, execution_time_ms: float):
        """Salva log de sincronização no banco."""
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO radar_sync_log (source, records_fetched, execution_time_ms, status)
                VALUES (%s, %s, %s, %s)
            """, (source, records_fetched, execution_time_ms, 'success'))
            cursor.close()
            
        except Exception as e:
            logger.error(f"[RADAR] Erro ao salvar sync log: {e}")


# Singleton
_sync_service = None

def get_sync_service() -> RadarSyncService:
    """Retorna instância singleton do serviço de sincronização."""
    global _sync_service
    if _sync_service is None:
        _sync_service = RadarSyncService()
    return _sync_service
