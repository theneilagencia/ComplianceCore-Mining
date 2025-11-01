# 🛰️ QIVO Radar Regulatório - Plano de Correção Completo

**Versão:** 5.1.0  
**Data:** 2025-11-01  
**Objetivo:** Substituir dados simulados por integrações reais com fontes regulatórias

---

## 📋 SUMÁRIO EXECUTIVO

### Problemas Identificados

1. ❌ **Dados Simulados**: `_simulate_source_data()` retorna dados falsos
2. ❌ **Sem Integração Real**: Nenhuma requisição HTTP às APIs externas
3. ❌ **Schema Inadequado**: Banco de dados não tem tabela `radar_events`
4. ❌ **Sem Endpoints Flask**: Frontend não tem rota `/api/radar/events`
5. ❌ **Sem Logging**: Impossível debugar problemas de integração

### Solução Implementada

✅ **Schema SQL Completo**: `migrations/002_create_radar_events.sql`  
✅ **Scraper ANM Real**: `app/modules/radar_regulatory/scrapers/anm_scraper.py`  
✅ **Estrutura de Pastas**: `app/modules/radar_regulatory/` criada  

---

## 🔧 ETAPAS DE IMPLEMENTAÇÃO

### ETAPA 1: Criar Schema no Banco de Dados ✅

```bash
# Executar migração SQL
cd /Users/viniciusguimaraes/Documents/GITHUB/ComplianceCore-Mining

psql "postgresql://qivo_mining_user:Rf5NbORtZ1Opy88ah1cTCdE8TUxxEpq3@dpg-d3sjth6uk2gs73fqop30-a.oregon-postgres.render.com/qivo_mining" < migrations/002_create_radar_events.sql
```

**Resultado Esperado:**
```
CREATE TABLE
CREATE INDEX (8 vezes)
CREATE TRIGGER
CREATE VIEW
Tabela radar_events criada com sucesso!
```

---

### ETAPA 2: Implementar Scrapers Adicionais

Criar os seguintes arquivos em `app/modules/radar_regulatory/scrapers/`:

#### 2.1 CPRM Scraper
```python
# app/modules/radar_regulatory/scrapers/cprm_scraper.py
"""
CPRM - Serviço Geológico do Brasil
Coleta dados de projetos geológicos e banco de dados de mineração.
"""

import requests
from typing import List, Dict, Any

class CPRMScraper:
    BASE_URL = "https://geosgb.cprm.gov.br/geosgb/api"
    
    def fetch_projetos(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Busca projetos geológicos do CPRM."""
        # Implementar requisição real à API do CPRM
        pass
```

#### 2.2 ANP Scraper
```python
# app/modules/radar_regulatory/scrapers/anp_scraper.py
"""
ANP - Agência Nacional do Petróleo, Gás Natural e Biocombustíveis
Coleta dados de licitações e concessões de blocos.
"""

class ANPScraper:
    BASE_URL = "https://www.gov.br/anp/pt-br"
    
    def fetch_licitacoes(self) -> List[Dict[str, Any]]:
        """Busca rodadas de licitação."""
        pass
```

#### 2.3 IBAMA Scraper
```python
# app/modules/radar_regulatory/scrapers/ibama_scraper.py
"""
IBAMA - Instituto Brasileiro do Meio Ambiente
Coleta dados de licenciamento ambiental e embargos.
"""

class IBAMAScraper:
    BASE_URL = "https://servicos.ibama.gov.br/licenciamento/api"
    
    def fetch_licencas(self) -> List[Dict[str, Any]]:
        """Busca licenças ambientais."""
        pass
```

---

### ETAPA 3: Criar Serviço de Sincronização

```python
# app/modules/radar_regulatory/sync_service.py
"""
Serviço de sincronização de eventos regulatórios.
Executa coleta periódica e armazena no banco.
"""

import logging
from datetime import datetime
from typing import List, Dict, Any
from app import db
from app.models import RadarEvent
from .scrapers.anm_scraper import get_anm_scraper
# from .scrapers.cprm_scraper import get_cprm_scraper
# from .scrapers.anp_scraper import get_anp_scraper
# from .scrapers.ibama_scraper import get_ibama_scraper

logger = logging.getLogger(__name__)

class RadarSyncService:
    """Serviço de sincronização do Radar Regulatório."""
    
    def __init__(self):
        self.scrapers = {
            'ANM': get_anm_scraper(),
            # 'CPRM': get_cprm_scraper(),
            # 'ANP': get_anp_scraper(),
            # 'IBAMA': get_ibama_scraper(),
        }
    
    def sync_all_sources(self) -> Dict[str, Any]:
        """
        Sincroniza todas as fontes regulatórias.
        
        Returns:
            Dict com estatísticas da sincronização
        """
        logger.info("[RADAR] Iniciando sincronização de todas as fontes")
        
        stats = {
            'total_fetched': 0,
            'total_new': 0,
            'total_updated': 0,
            'total_errors': 0,
            'sources': {}
        }
        
        for source_name, scraper in self.scrapers.items():
            try:
                logger.info(f"[RADAR] Sincronizando {source_name}...")
                
                # Buscar eventos
                events = scraper.fetch_all()
                stats['total_fetched'] += len(events)
                
                # Salvar no banco
                new_count, updated_count = self._save_events(events, source_name)
                stats['total_new'] += new_count
                stats['total_updated'] += updated_count
                
                stats['sources'][source_name] = {
                    'fetched': len(events),
                    'new': new_count,
                    'updated': updated_count,
                    'status': 'success'
                }
                
                logger.info(f"[RADAR] {source_name}: {len(events)} fetched, {new_count} new, {updated_count} updated")
                
            except Exception as e:
                logger.error(f"[RADAR] Erro ao sincronizar {source_name}: {e}")
                stats['total_errors'] += 1
                stats['sources'][source_name] = {
                    'status': 'error',
                    'error': str(e)
                }
        
        logger.info(f"[RADAR] Sincronização concluída: {stats['total_new']} novos, {stats['total_updated']} atualizados")
        
        # Salvar log de sincronização
        self._save_sync_log(stats)
        
        return stats
    
    def _save_events(self, events: List[Dict], source: str) -> tuple:
        """
        Salva eventos no banco de dados.
        
        Returns:
            Tuple (new_count, updated_count)
        """
        new_count = 0
        updated_count = 0
        
        for event_data in events:
            try:
                # Verificar se evento já existe
                existing = RadarEvent.query.filter_by(
                    source=event_data['source'],
                    source_id=event_data['source_id']
                ).first()
                
                if existing:
                    # Atualizar evento existente
                    for key, value in event_data.items():
                        setattr(existing, key, value)
                    updated_count += 1
                else:
                    # Criar novo evento
                    new_event = RadarEvent(**event_data)
                    db.session.add(new_event)
                    new_count += 1
                
            except Exception as e:
                logger.error(f"[RADAR] Erro ao salvar evento: {e}")
                continue
        
        db.session.commit()
        return new_count, updated_count
    
    def _save_sync_log(self, stats: Dict):
        """Salva log de sincronização no banco."""
        # Implementar salvamento na tabela radar_sync_log
        pass

# Singleton
_sync_service = None

def get_sync_service() -> RadarSyncService:
    global _sync_service
    if _sync_service is None:
        _sync_service = RadarSyncService()
    return _sync_service
```

---

### ETAPA 4: Criar Modelo SQLAlchemy

```python
# app/models.py (adicionar ao arquivo existente)
from app import db
from geoalchemy2 import Geography
from sqlalchemy.dialects.postgresql import JSONB

class RadarEvent(db.Model):
    """Modelo para eventos regulatórios."""
    
    __tablename__ = 'radar_events'
    
    id = db.Column(db.Integer, primary_key=True)
    source = db.Column(db.String(50), nullable=False, index=True)
    source_id = db.Column(db.String(255), nullable=False)
    event_type = db.Column(db.String(50), nullable=False, index=True)
    title = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    severity = db.Column(db.String(20), nullable=False)
    
    # Geolocalização (PostGIS)
    location = db.Column(Geography('POINT', srid=4326))
    state = db.Column(db.String(2))
    municipality = db.Column(db.String(255))
    address = db.Column(db.Text)
    
    # Temporal
    event_date = db.Column(db.DateTime(timezone=True))
    detection_date = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    last_updated = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    
    # Status
    status = db.Column(db.String(50), default='active')
    valid = db.Column(db.Boolean, default=True, index=True)
    
    # Metadados
    metadata = db.Column(JSONB, default={})
    
    # Auditoria
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('source', 'source_id', name='uq_source_source_id'),
    )
    
    def to_dict(self):
        """Converte para dicionário."""
        return {
            'id': self.id,
            'source': self.source,
            'source_id': self.source_id,
            'event_type': self.event_type,
            'title': self.title,
            'description': self.description,
            'severity': self.severity,
            'location': self._location_to_geojson(),
            'state': self.state,
            'municipality': self.municipality,
            'event_date': self.event_date.isoformat() if self.event_date else None,
            'detection_date': self.detection_date.isoformat() if self.detection_date else None,
            'status': self.status,
            'valid': self.valid,
            'metadata': self.metadata
        }
    
    def _location_to_geojson(self):
        """Converte location PostGIS para GeoJSON."""
        if self.location:
            # Implementar conversão
            pass
        return None
```

---

### ETAPA 5: Criar Endpoints Flask

```python
# app/modules/radar_regulatory/routes.py
"""
Endpoints Flask para o Radar Regulatório.
"""

from flask import Blueprint, jsonify, request
from app.models import RadarEvent
from .sync_service import get_sync_service
import logging

logger = logging.getLogger(__name__)

radar_bp = Blueprint('radar_regulatory', __name__, url_prefix='/api/radar')

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
        
        # Query base
        query = RadarEvent.query.filter_by(valid=valid, status='active')
        
        # Aplicar filtros
        if source:
            query = query.filter_by(source=source)
        if event_type:
            query = query.filter_by(event_type=event_type)
        if severity:
            query = query.filter_by(severity=severity)
        if state:
            query = query.filter_by(state=state)
        
        # Ordenar e paginar
        query = query.order_by(RadarEvent.detection_date.desc())
        total = query.count()
        events = query.limit(limit).offset(offset).all()
        
        return jsonify({
            'status': 'success',
            'total': total,
            'limit': limit,
            'offset': offset,
            'events': [event.to_dict() for event in events]
        })
        
    except Exception as e:
        logger.error(f"[RADAR] Erro ao buscar eventos: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@radar_bp.route('/sync', methods=['POST'])
def trigger_sync():
    """
    POST /api/radar/sync
    
    Dispara sincronização manual de todas as fontes.
    """
    try:
        sync_service = get_sync_service()
        stats = sync_service.sync_all_sources()
        
        return jsonify({
            'status': 'success',
            'message': 'Sincronização concluída',
            'stats': stats
        })
        
    except Exception as e:
        logger.error(f"[RADAR] Erro na sincronização: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@radar_bp.route('/stats', methods=['GET'])
def get_stats():
    """
    GET /api/radar/stats
    
    Retorna estatísticas do radar.
    """
    try:
        # Query na view radar_stats
        query = db.session.execute(text("SELECT * FROM radar_stats"))
        stats = [dict(row) for row in query]
        
        return jsonify({
            'status': 'success',
            'stats': stats
        })
        
    except Exception as e:
        logger.error(f"[RADAR] Erro ao buscar estatísticas: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500
```

---

### ETAPA 6: Registrar Blueprint no Flask

```python
# app/__init__.py (adicionar ao arquivo existente)
from app.modules.radar_regulatory.routes import radar_bp

def create_app():
    # ... código existente ...
    
    # Registrar blueprint do Radar Regulatory
    app.register_blueprint(radar_bp)
    
    return app
```

---

### ETAPA 7: Configurar Sincronização Automática

```python
# app/tasks.py (criar se não existir)
"""
Tarefas agendadas para sincronização periódica.
"""

from apscheduler.schedulers.background import BackgroundScheduler
from app.modules.radar_regulatory.sync_service import get_sync_service
import logging

logger = logging.getLogger(__name__)

def start_scheduler():
    """Inicia scheduler para tarefas periódicas."""
    scheduler = BackgroundScheduler()
    
    # Sincronização diária às 6h da manhã
    scheduler.add_job(
        func=sync_radar_daily,
        trigger='cron',
        hour=6,
        minute=0,
        id='radar_sync_daily'
    )
    
    scheduler.start()
    logger.info("[SCHEDULER] Scheduler iniciado")

def sync_radar_daily():
    """Tarefa de sincronização diária do radar."""
    logger.info("[SCHEDULER] Iniciando sincronização diária do radar")
    
    sync_service = get_sync_service()
    stats = sync_service.sync_all_sources()
    
    logger.info(f"[SCHEDULER] Sincronização concluída: {stats}")
```

---

### ETAPA 8: Atualizar Frontend React

```typescript
// frontend/src/services/radarService.ts
export interface RadarEvent {
  id: number;
  source: string;
  source_id: string;
  event_type: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  state?: string;
  municipality?: string;
  event_date?: string;
  detection_date: string;
  status: string;
  valid: boolean;
  metadata: any;
}

export class RadarService {
  private static BASE_URL = '/api/radar';
  
  static async getEvents(filters?: {
    source?: string;
    event_type?: string;
    severity?: string;
    state?: string;
    limit?: number;
    offset?: number;
  }): Promise<RadarEvent[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await fetch(`${this.BASE_URL}/events?${params}`);
    if (!response.ok) throw new Error('Failed to fetch events');
    
    const data = await response.json();
    return data.events;
  }
  
  static async triggerSync(): Promise<any> {
    const response = await fetch(`${this.BASE_URL}/sync`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to trigger sync');
    
    return response.json();
  }
  
  static async getStats(): Promise<any> {
    const response = await fetch(`${this.BASE_URL}/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    
    return response.json();
  }
}
```

---

### ETAPA 9: Atualizar Componente de Mapa

```tsx
// frontend/src/components/RadarMap.tsx
import React, { useEffect, useState } from 'react';
import { RadarService, RadarEvent } from '../services/radarService';

export const RadarMap: React.FC = () => {
  const [events, setEvents] = useState<RadarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    source: undefined,
    severity: undefined,
  });
  
  useEffect(() => {
    loadEvents();
  }, [filters]);
  
  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await RadarService.getEvents(filters);
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      {/* Filtros */}
      <div className="filters">
        <select onChange={(e) => setFilters({...filters, source: e.target.value})}>
          <option value="">Todas as fontes</option>
          <option value="ANM">ANM</option>
          <option value="CPRM">CPRM</option>
          <option value="ANP">ANP</option>
          <option value="IBAMA">IBAMA</option>
        </select>
        
        <select onChange={(e) => setFilters({...filters, severity: e.target.value})}>
          <option value="">Todas as severidades</option>
          <option value="Low">Baixa</option>
          <option value="Medium">Média</option>
          <option value="High">Alta</option>
          <option value="Critical">Crítica</option>
        </select>
      </div>
      
      {/* Mapa Mapbox/Leaflet */}
      <div className="map-container">
        {loading ? (
          <div>Carregando eventos...</div>
        ) : (
          <MapComponent events={events} />
        )}
      </div>
      
      {/* Lista de eventos */}
      <div className="events-list">
        {events.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
};
```

---

## 🧪 TESTES E VALIDAÇÃO

### Teste 1: Verificar Schema do Banco
```sql
\d radar_events
SELECT COUNT(*) FROM radar_events;
SELECT * FROM radar_stats;
```

### Teste 2: Testar Scraper ANM
```python
from app.modules.radar_regulatory.scrapers.anm_scraper import get_anm_scraper

scraper = get_anm_scraper()
events = scraper.fetch_all()
print(f"Total de eventos: {len(events)}")
for event in events[:5]:
    print(f"- {event['title']} ({event['severity']})")
```

### Teste 3: Testar Endpoint
```bash
# Buscar eventos
curl http://localhost:5000/api/radar/events?limit=10

# Disparar sincronização
curl -X POST http://localhost:5000/api/radar/sync

# Ver estatísticas
curl http://localhost:5000/api/radar/stats
```

### Teste 4: Verificar Logs
```bash
tail -f logs/radar.log
```

---

## 📊 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] **1. Executar migração SQL** (`002_create_radar_events.sql`)
- [ ] **2. Instalar dependências Python**
  ```bash
  pip install requests beautifulsoup4 geoalchemy2
  ```
- [ ] **3. Criar todos os scrapers** (ANM, CPRM, ANP, IBAMA)
- [ ] **4. Implementar sync_service.py**
- [ ] **5. Adicionar modelo RadarEvent** ao `app/models.py`
- [ ] **6. Criar routes.py** com endpoints Flask
- [ ] **7. Registrar blueprint** no `app/__init__.py`
- [ ] **8. Configurar scheduler** para sincronização automática
- [ ] **9. Atualizar frontend** com RadarService
- [ ] **10. Testar integração completa**
- [ ] **11. Configurar logging** em `config.py`
- [ ] **12. Deploy em produção**
- [ ] **13. Monitorar primeira sincronização**
- [ ] **14. Validar dados no mapa**
- [ ] **15. Documentar no README**

---

## 🚀 DEPLOY EM PRODUÇÃO

### 1. Configurar Variáveis de Ambiente
```bash
# No Render.com
ENABLE_RADAR_SYNC=true
RADAR_SYNC_HOUR=6  # Sincronizar às 6h
```

### 2. Executar Migração no Render
```bash
# Via Shell do Render
python manage.py db upgrade
```

### 3. Testar Sincronização Manual
```bash
curl -X POST https://compliancecore-mining.onrender.com/api/radar/sync
```

### 4. Monitorar Logs
```bash
# No Render Dashboard → Logs
# Procurar por: "[RADAR]"
```

---

## 📚 DOCUMENTAÇÃO ADICIONAL

### APIs Oficiais Disponíveis

1. **ANM - API SIED**
   - URL: https://sistemas.anm.gov.br/sied/api
   - Doc: https://www.gov.br/anm/pt-br/assuntos/dados-abertos
   
2. **CPRM - GeoSGB**
   - URL: https://geosgb.cprm.gov.br/geosgb/api
   - Doc: https://www.gov.br/cprm/pt-br/assuntos/dados-abertos

3. **ANP - Dados Abertos**
   - URL: https://www.gov.br/anp/pt-br/assuntos/dados-abertos
   
4. **IBAMA - Licenciamento**
   - URL: https://servicos.ibama.gov.br/licenciamento/
   - Doc: Usar web scraping (sem API pública)

---

## ✅ CRITÉRIO DE ACEITE

Para considerar a implementação completa e aprovada:

- ✅ Banco de dados com tabela `radar_events` criada
- ✅ Pelo menos 1 scraper funcionando (ANM)
- ✅ Endpoint `/api/radar/events` retornando dados reais
- ✅ Frontend mostrando eventos no mapa
- ✅ Logs confirmando integração bem-sucedida
- ✅ Sincronização automática configurada
- ✅ Sem erros 404/500 nos endpoints
- ✅ QA >= 95% de sucesso

---

**Autor:** QIVO Intelligence Team  
**Versão:** 5.1.0  
**Status:** 🟡 EM IMPLEMENTAÇÃO
