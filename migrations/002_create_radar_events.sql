-- ============================================
-- QIVO Radar Regulatório - Database Schema
-- ============================================
-- Tabela para armazenar eventos regulatórios de fontes externas
-- Versão: 5.1.0
-- Data: 2025-11-01

-- Drop tabela antiga se existir (cuidado em produção!)
DROP TABLE IF EXISTS radar_events CASCADE;

-- Criar tabela principal
CREATE TABLE radar_events (
    id SERIAL PRIMARY KEY,
    
    -- Identificação da fonte
    source VARCHAR(50) NOT NULL,  -- ANM, CPRM, ANP, IBAMA, USGS, SEC, etc.
    source_id VARCHAR(255) NOT NULL,  -- ID original do evento na fonte
    
    -- Tipo e classificação
    event_type VARCHAR(50) NOT NULL,  -- licenciamento, fiscalizacao, autuacao, etc.
    title TEXT NOT NULL,
    description TEXT,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    
    -- Localização (PostGIS)
    location GEOGRAPHY(Point, 4326),  -- Coordenadas WGS84
    state VARCHAR(2),  -- UF (para Brasil)
    municipality VARCHAR(255),
    address TEXT,
    
    -- Temporal
    event_date TIMESTAMP,
    detection_date TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP DEFAULT NOW(),
    
    -- Status
    status VARCHAR(50) DEFAULT 'active',  -- active, resolved, archived
    valid BOOLEAN DEFAULT true,  -- Flag para filtrar dados inválidos
    
    -- Metadados (JSONB para flexibilidade)
    metadata JSONB DEFAULT '{}',
    
    -- Auditoria
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraint para evitar duplicatas
    UNIQUE(source, source_id)
);

-- Criar índices para performance
CREATE INDEX idx_radar_events_source ON radar_events(source);
CREATE INDEX idx_radar_events_event_type ON radar_events(event_type);
CREATE INDEX idx_radar_events_severity ON radar_events(severity);
CREATE INDEX idx_radar_events_status ON radar_events(status);
CREATE INDEX idx_radar_events_valid ON radar_events(valid);
CREATE INDEX idx_radar_events_event_date ON radar_events(event_date DESC);
CREATE INDEX idx_radar_events_detection_date ON radar_events(detection_date DESC);

-- Índice geoespacial (PostGIS)
CREATE INDEX idx_radar_events_location ON radar_events USING GIST(location);

-- Índice composto para queries comuns
CREATE INDEX idx_radar_events_source_date ON radar_events(source, event_date DESC);
CREATE INDEX idx_radar_events_active ON radar_events(valid, status, detection_date DESC);

-- Índice GIN para busca em JSONB
CREATE INDEX idx_radar_events_metadata ON radar_events USING GIN(metadata);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_radar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_radar_events_updated_at
    BEFORE UPDATE ON radar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_radar_events_updated_at();

-- Tabela de cache de sincronização
CREATE TABLE radar_sync_log (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    sync_date TIMESTAMP DEFAULT NOW(),
    events_fetched INTEGER DEFAULT 0,
    events_new INTEGER DEFAULT 0,
    events_updated INTEGER DEFAULT 0,
    events_errors INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'success',  -- success, partial, failed
    error_message TEXT,
    execution_time_ms INTEGER,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_radar_sync_log_source ON radar_sync_log(source, sync_date DESC);

-- View para estatísticas rápidas
CREATE OR REPLACE VIEW radar_stats AS
SELECT 
    source,
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE valid = true) as valid_events,
    COUNT(*) FILTER (WHERE severity = 'Critical') as critical_count,
    COUNT(*) FILTER (WHERE severity = 'High') as high_count,
    COUNT(*) FILTER (WHERE severity = 'Medium') as medium_count,
    COUNT(*) FILTER (WHERE severity = 'Low') as low_count,
    MAX(detection_date) as last_detection,
    COUNT(*) FILTER (WHERE event_date >= NOW() - INTERVAL '30 days') as events_last_30days
FROM radar_events
WHERE valid = true AND status = 'active'
GROUP BY source;

-- Comentários para documentação
COMMENT ON TABLE radar_events IS 'Eventos regulatórios coletados de fontes externas (ANM, CPRM, ANP, IBAMA, USGS, SEC, Copernicus/NASA)';
COMMENT ON COLUMN radar_events.source IS 'Fonte do evento: ANM, CPRM, ANP, IBAMA, USGS, SEC, COPERNICUS, NASA';
COMMENT ON COLUMN radar_events.source_id IS 'ID original do evento na fonte externa';
COMMENT ON COLUMN radar_events.location IS 'Coordenadas geográficas (WGS84) usando PostGIS GEOGRAPHY';
COMMENT ON COLUMN radar_events.metadata IS 'Dados adicionais específicos de cada fonte (JSONB flexível)';
COMMENT ON COLUMN radar_events.valid IS 'Flag de validação - false para dados suspeitos ou incompletos';

-- Grant permissions (ajustar conforme necessário)
-- GRANT SELECT, INSERT, UPDATE ON radar_events TO qivo_app_user;
-- GRANT SELECT ON radar_stats TO qivo_app_user;

-- Seed inicial para testes (remover em produção)
-- INSERT INTO radar_events (source, source_id, event_type, title, severity, location, state, event_date, metadata)
-- VALUES 
--     ('ANM', 'TEST-001', 'licenciamento', 'Teste de Integração', 'Low', ST_GeogFromText('POINT(-43.9378 -19.9167)'), 'MG', NOW(), '{"test": true}');

-- Verificar instalação
SELECT 'Tabela radar_events criada com sucesso!' AS status;
SELECT COUNT(*) as total_events FROM radar_events;
