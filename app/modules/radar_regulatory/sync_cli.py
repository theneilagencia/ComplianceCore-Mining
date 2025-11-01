"""
Script CLI para executar sincronização do Radar Regulatório.
"""

import sys
import os
import logging

# Adicionar diretório raiz ao path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from app.modules.radar_regulatory.sync_service import get_sync_service

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('radar_sync.log')
    ]
)

logger = logging.getLogger(__name__)


def main():
    """Executa sincronização de todas as fontes."""
    logger.info("=" * 60)
    logger.info("QIVO Radar Regulatory - Sincronização Iniciada")
    logger.info("=" * 60)
    
    try:
        sync_service = get_sync_service()
        stats = sync_service.sync_all_sources()
        
        logger.info("=" * 60)
        logger.info("SINCRONIZAÇÃO CONCLUÍDA")
        logger.info("=" * 60)
        logger.info(f"Total fetched: {stats['total_fetched']}")
        logger.info(f"Total new: {stats['total_new']}")
        logger.info(f"Total updated: {stats['total_updated']}")
        logger.info(f"Total errors: {stats['total_errors']}")
        logger.info(f"Duration: {stats['duration_seconds']:.2f}s")
        
        for source, source_stats in stats['sources'].items():
            logger.info(f"\n{source}:")
            logger.info(f"  Status: {source_stats.get('status')}")
            if source_stats.get('status') == 'success':
                logger.info(f"  Fetched: {source_stats.get('fetched')}")
                logger.info(f"  New: {source_stats.get('new')}")
                logger.info(f"  Updated: {source_stats.get('updated')}")
            else:
                logger.error(f"  Error: {source_stats.get('error')}")
        
        return 0 if stats['total_errors'] == 0 else 1
        
    except Exception as e:
        logger.error(f"Erro crítico: {e}")
        return 1


if __name__ == '__main__':
    sys.exit(main())
