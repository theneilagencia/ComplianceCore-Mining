"""
Endpoints Flask para o Radar Regulatório.
"""

from flask import Blueprint, jsonify, request
import logging
import psycopg2
import os
from psycopg2.extras import RealDictCursor
from .sync_service import get_sync_service

logger = logging.getLogger(__name__)

radar_bp = Blueprint('radar_regulatory', __name__, url_prefix='/api/radar')

# Database URL
DB_URL = os.getenv('DATABASE_URL', 
    'postgresql://qivo_mining_user:Rf5NbORtZ1Opy88ah1cTCdE8TUxxEpq3@dpg-d3sjth6uk2gs73fqop30-a.oregon-postgres.render.com/qivo_mining')


@radar_bp.route('/events', methods=['GET'])
def get_events():
    """
    GET /api/radar/events
    
    Retorna eventos regulatórios com filtros.
    
    Query Params:
        - source: Filtrar por fonte (ANM, CPRM, etc.)
        - event_type: Tipo de evento
        - severity: Nível de severidade
        - state: UF (para Brasil)
        - valid: true/false
        - limit: Limite de resultados (default: 100)
        - offset: Paginação
    """
    try:
        # Parâmetros de query
        source = request.args.get('source')
        event_type = request.args.get('event_type')
        severity = request.args.get('severity')
        state = request.args.get('state')
        valid = request.args.get('valid', 'true').lower() == 'true'
        limit = int(request.args.get('limit', 100))
        offset = int(request.args.get('offset', 0))
        
        # Conectar ao banco
        conn = psycopg2.connect(DB_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Construir query base
        query = """
            SELECT 
                id, source, source_id, event_type, title, description,
                severity, 
                ST_AsGeoJSON(location) as location,
                state, municipality, event_date, detection_date,
                status, valid, metadata, created_at, updated_at
            FROM radar_events
            WHERE valid = %s AND status = 'active'
        """
        params = [valid]
        
        # Aplicar filtros
        if source:
            query += " AND source = %s"
            params.append(source)
        
        if event_type:
            query += " AND event_type = %s"
            params.append(event_type)
        
        if severity:
            query += " AND severity = %s"
            params.append(severity)
        
        if state:
            query += " AND state = %s"
            params.append(state)
        
        # Contar total
        count_query = f"SELECT COUNT(*) as total FROM ({query}) as subq"
        cursor.execute(count_query, params)
        total = cursor.fetchone()['total']
        
        # Ordenar e paginar
        query += " ORDER BY detection_date DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        # Converter para JSON
        events = []
        for row in rows:
            event = dict(row)
            # Converter datas para ISO string
            if event.get('event_date'):
                event['event_date'] = event['event_date'].isoformat()
            if event.get('detection_date'):
                event['detection_date'] = event['detection_date'].isoformat()
            if event.get('created_at'):
                event['created_at'] = event['created_at'].isoformat()
            if event.get('updated_at'):
                event['updated_at'] = event['updated_at'].isoformat()
            
            events.append(event)
        
        cursor.close()
        conn.close()
        
        logger.info(f"[RADAR API] Retornando {len(events)} de {total} eventos (filtros: source={source}, type={event_type})")
        
        return jsonify({
            'status': 'success',
            'total': total,
            'limit': limit,
            'offset': offset,
            'events': events
        })
        
    except Exception as e:
        logger.error(f"[RADAR API] Erro ao buscar eventos: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@radar_bp.route('/events/<int:event_id>', methods=['GET'])
def get_event_detail(event_id):
    """
    GET /api/radar/events/<id>
    
    Retorna detalhes de um evento específico.
    """
    try:
        conn = psycopg2.connect(DB_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("""
            SELECT 
                id, source, source_id, event_type, title, description,
                severity, 
                ST_AsGeoJSON(location) as location,
                state, municipality, event_date, detection_date,
                status, valid, metadata, created_at, updated_at
            FROM radar_events
            WHERE id = %s
        """, (event_id,))
        
        row = cursor.fetchone()
        
        if not row:
            cursor.close()
            conn.close()
            return jsonify({'status': 'error', 'message': 'Event not found'}), 404
        
        event = dict(row)
        
        # Converter datas
        if event.get('event_date'):
            event['event_date'] = event['event_date'].isoformat()
        if event.get('detection_date'):
            event['detection_date'] = event['detection_date'].isoformat()
        if event.get('created_at'):
            event['created_at'] = event['created_at'].isoformat()
        if event.get('updated_at'):
            event['updated_at'] = event['updated_at'].isoformat()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'event': event
        })
        
    except Exception as e:
        logger.error(f"[RADAR API] Erro ao buscar evento {event_id}: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@radar_bp.route('/sync', methods=['POST'])
def trigger_sync():
    """
    POST /api/radar/sync
    
    Dispara sincronização manual de todas as fontes.
    """
    try:
        logger.info("[RADAR API] Sincronização manual iniciada")
        
        sync_service = get_sync_service()
        stats = sync_service.sync_all_sources()
        
        return jsonify({
            'status': 'success',
            'message': 'Sincronização concluída',
            'stats': stats
        })
        
    except Exception as e:
        logger.error(f"[RADAR API] Erro na sincronização: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@radar_bp.route('/stats', methods=['GET'])
def get_stats():
    """
    GET /api/radar/stats
    
    Retorna estatísticas do radar.
    """
    try:
        conn = psycopg2.connect(DB_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Query na view radar_stats
        cursor.execute("SELECT * FROM radar_stats ORDER BY source")
        stats = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'stats': [dict(row) for row in stats]
        })
        
    except Exception as e:
        logger.error(f"[RADAR API] Erro ao buscar estatísticas: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@radar_bp.route('/sources', methods=['GET'])
def get_sources():
    """
    GET /api/radar/sources
    
    Retorna lista de fontes disponíveis.
    """
    sources = [
        {
            'code': 'ANM',
            'name': 'Agência Nacional de Mineração',
            'country': 'Brasil',
            'types': ['mining_process', 'news', 'enforcement']
        },
        {
            'code': 'CPRM',
            'name': 'Serviço Geológico do Brasil',
            'country': 'Brasil',
            'types': ['geological_project', 'mineral_occurrence', 'news']
        },
        {
            'code': 'ANP',
            'name': 'Agência Nacional do Petróleo',
            'country': 'Brasil',
            'types': ['bidding_round', 'concession', 'news']
        },
        {
            'code': 'IBAMA',
            'name': 'Instituto Brasileiro do Meio Ambiente',
            'country': 'Brasil',
            'types': ['environmental_license', 'embargo', 'enforcement', 'news']
        },
        {
            'code': 'USGS',
            'name': 'United States Geological Survey',
            'country': 'USA',
            'types': ['earthquake', 'mineral_report']
        },
        {
            'code': 'SEC',
            'name': 'Securities and Exchange Commission',
            'country': 'USA',
            'types': ['regulatory_filing', 'enforcement']
        }
    ]
    
    return jsonify({
        'status': 'success',
        'sources': sources
    })


@radar_bp.route('/health', methods=['GET'])
def health_check():
    """
    GET /api/radar/health
    
    Health check do módulo Radar.
    """
    try:
        # Testar conexão com banco
        conn = psycopg2.connect(DB_URL)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM radar_events")
        count = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'total_events': count
        })
        
    except Exception as e:
        logger.error(f"[RADAR API] Health check falhou: {e}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500
