"""
Script para popular banco com dados de exemplo para demonstração.
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

import psycopg2
from psycopg2.extras import Json
from datetime import datetime, timedelta
import random

DB_URL = 'postgresql://qivo_mining_user:Rf5NbORtZ1Opy88ah1cTCdE8TUxxEpq3@dpg-d3sjth6uk2gs73fqop30-a.oregon-postgres.render.com/qivo_mining'

# Dados de exemplo
EXAMPLE_EVENTS = [
    {
        'source': 'ANM',
        'source_id': 'ANM-DEMO-001',
        'event_type': 'mining_process',
        'title': 'Processo de Autorização de Pesquisa - Minério de Ferro',
        'description': 'Processo 12345/2024 para pesquisa de minério de ferro em área de 500 hectares.',
        'severity': 'Medium',
        'state': 'MG',
        'municipality': 'Itabira',
        'location': 'POINT(-43.2273 -19.6162)',
    },
    {
        'source': 'ANM',
        'source_id': 'ANM-DEMO-002',
        'event_type': 'enforcement',
        'title': 'Auto de Infração por Lavra Sem Autorização',
        'description': 'Multa aplicada por operação de lavra sem autorização válida.',
        'severity': 'High',
        'state': 'PA',
        'municipality': 'Parauapebas',
        'location': 'POINT(-49.9025 -6.0675)',
    },
    {
        'source': 'CPRM',
        'source_id': 'CPRM-DEMO-001',
        'event_type': 'geological_project',
        'title': 'Projeto Geológico - Mapeamento de Ouro Aluvionar',
        'description': 'Projeto de mapeamento geológico em região de garimpo.',
        'severity': 'Low',
        'state': 'GO',
        'municipality': 'Alto Horizonte',
        'location': 'POINT(-49.2333 -14.1844)',
    },
    {
        'source': 'IBAMA',
        'source_id': 'IBAMA-DEMO-001',
        'event_type': 'environmental_license',
        'title': 'Licença de Operação - Mineradora XYZ',
        'description': 'Licença de Operação concedida para operação de extração de bauxita.',
        'severity': 'High',
        'state': 'PA',
        'municipality': 'Paragominas',
        'location': 'POINT(-47.3514 -2.9975)',
    },
    {
        'source': 'IBAMA',
        'source_id': 'IBAMA-DEMO-002',
        'event_type': 'embargo',
        'title': 'Embargo - Área de Preservação Permanente',
        'description': 'Embargo de área de 100 hectares por desmatamento irregular.',
        'severity': 'Critical',
        'state': 'MT',
        'municipality': 'Alta Floresta',
        'location': 'POINT(-56.0875 -9.8658)',
    },
    {
        'source': 'USGS',
        'source_id': 'USGS-DEMO-001',
        'event_type': 'earthquake',
        'title': 'M 5.2 - 23 km SW of Elko, Nevada',
        'description': 'Earthquake of magnitude 5.2 near mining region.',
        'severity': 'Medium',
        'state': None,
        'municipality': 'Elko, Nevada',
        'location': 'POINT(-115.7631 40.8324)',
    },
    {
        'source': 'SEC',
        'source_id': 'SEC-DEMO-001',
        'event_type': 'regulatory_filing',
        'title': 'FCMX: Material Event - Mine Accident Report',
        'description': '8-K Filing reporting material mining incident.',
        'severity': 'Critical',
        'state': None,
        'municipality': None,
        'location': None,
    },
    {
        'source': 'ANP',
        'source_id': 'ANP-DEMO-001',
        'event_type': 'bidding_round',
        'title': '18ª Rodada de Licitações - Blocos Exploratórios',
        'description': 'Licitação de 92 blocos exploratórios em bacias sedimentares.',
        'severity': 'High',
        'state': None,
        'municipality': None,
        'location': None,
    },
]

def populate_demo_data():
    """Popula banco com dados de demonstração."""
    print("Conectando ao banco de dados...")
    conn = psycopg2.connect(DB_URL)
    cursor = conn.cursor()
    
    print(f"Inserindo {len(EXAMPLE_EVENTS)} eventos de exemplo...")
    
    for event in EXAMPLE_EVENTS:
        try:
            # Data aleatória nos últimos 30 dias
            days_ago = random.randint(1, 30)
            event_date = datetime.now() - timedelta(days=days_ago)
            
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
                ON CONFLICT (source, source_id) DO UPDATE SET
                    title = EXCLUDED.title,
                    updated_at = NOW()
            """, (
                event['source'],
                event['source_id'],
                event['event_type'],
                event['title'],
                event['description'],
                event['severity'],
                event.get('location'),
                event.get('state'),
                event.get('municipality'),
                event_date,
                'active',
                True,
                Json({'demo': True, 'created_by': 'populate_demo_data'})
            ))
            
            print(f"✓ {event['source']}: {event['title']}")
            
        except Exception as e:
            print(f"✗ Erro ao inserir {event['source_id']}: {e}")
            continue
    
    conn.commit()
    
    # Verificar total
    cursor.execute("SELECT COUNT(*) FROM radar_events")
    total = cursor.fetchone()[0]
    
    print(f"\n✅ Total de eventos no banco: {total}")
    
    # Mostrar estatísticas
    cursor.execute("SELECT * FROM radar_stats")
    stats = cursor.fetchall()
    
    print("\n📊 Estatísticas por fonte:")
    for stat in stats:
        print(f"  {stat[0]}: {stat[1]} eventos ({stat[2]} críticos, {stat[3]} altos, {stat[4]} médios, {stat[5]} baixos)")
    
    cursor.close()
    conn.close()
    
    print("\n✅ Dados de demonstração inseridos com sucesso!")

if __name__ == '__main__':
    populate_demo_data()
