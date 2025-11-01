"""
Script de teste rápido para validar a sincronização.
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

import logging
from app.modules.radar_regulatory.scrapers.anm_scraper import get_anm_scraper

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_anm_scraper():
    """Testa o scraper ANM."""
    logger.info("Testando ANM Scraper...")
    
    scraper = get_anm_scraper()
    
    # Buscar poucos eventos para teste
    eventos = scraper.fetch_all()
    
    logger.info(f"Total de eventos coletados: {len(eventos)}")
    
    if eventos:
        logger.info("\nPrimeiros 3 eventos:")
        for i, evento in enumerate(eventos[:3], 1):
            logger.info(f"\n{i}. {evento['title']}")
            logger.info(f"   Fonte: {evento['source']}")
            logger.info(f"   Tipo: {evento['event_type']}")
            logger.info(f"   Severidade: {evento['severity']}")
            logger.info(f"   Estado: {evento.get('state', 'N/A')}")

if __name__ == '__main__':
    test_anm_scraper()
