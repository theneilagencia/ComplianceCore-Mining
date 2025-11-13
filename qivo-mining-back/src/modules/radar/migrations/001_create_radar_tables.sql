-- ============================================================================
-- Radar Regulatório - Migration 001
-- Creates all tables for the Radar module
-- ============================================================================

-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For full-text search

-- ============================================================================
-- 1. API Sources Configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS radar_api_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL, -- 'gfw', 'usgs', 'worldbank', 'anm', 'cprm', 'ibama', 'copernicus', 'newsapi'
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'error'
  is_free BOOLEAN NOT NULL DEFAULT true,
  cost_per_request DECIMAL(10, 6) DEFAULT 0,
  monthly_quota INTEGER,
  base_url TEXT,
  api_key_required BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  last_sync_at TIMESTAMP,
  last_error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radar_api_sources_type ON radar_api_sources(type);
CREATE INDEX IF NOT EXISTS idx_radar_api_sources_status ON radar_api_sources(status);

-- ============================================================================
-- 2. API Usage Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS radar_api_usage (
  id BIGSERIAL PRIMARY KEY,
  source_id INTEGER NOT NULL REFERENCES radar_api_sources(id) ON DELETE CASCADE,
  endpoint VARCHAR(255),
  method VARCHAR(10) DEFAULT 'GET',
  status_code INTEGER,
  response_time_ms INTEGER,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  cost DECIMAL(10, 6) DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radar_api_usage_source_id ON radar_api_usage(source_id);
CREATE INDEX IF NOT EXISTS idx_radar_api_usage_created_at ON radar_api_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_radar_api_usage_status_code ON radar_api_usage(status_code);

-- ============================================================================
-- 3. Regulatory Changes / Alerts
-- ============================================================================

CREATE TABLE IF NOT EXISTS radar_changes (
  id BIGSERIAL PRIMARY KEY,
  source_id INTEGER NOT NULL REFERENCES radar_api_sources(id) ON DELETE CASCADE,
  external_id VARCHAR(255),
  title TEXT NOT NULL,
  description TEXT,
  summary TEXT,
  category VARCHAR(100),
  severity VARCHAR(20) DEFAULT 'medium',
  country_code CHAR(2),
  state_province VARCHAR(100),
  city VARCHAR(100),
  coordinates GEOMETRY(Point, 4326),
  bbox GEOMETRY(Polygon, 4326),
  affected_commodities TEXT[],
  affected_companies TEXT[],
  tags TEXT[],
  url TEXT,
  published_at TIMESTAMP,
  valid_until TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  relevance_score DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radar_changes_source_id ON radar_changes(source_id);
CREATE INDEX IF NOT EXISTS idx_radar_changes_category ON radar_changes(category);
CREATE INDEX IF NOT EXISTS idx_radar_changes_severity ON radar_changes(severity);
CREATE INDEX IF NOT EXISTS idx_radar_changes_country_code ON radar_changes(country_code);
CREATE INDEX IF NOT EXISTS idx_radar_changes_published_at ON radar_changes(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_radar_changes_is_read ON radar_changes(is_read);
CREATE INDEX IF NOT EXISTS idx_radar_changes_is_archived ON radar_changes(is_archived);
CREATE INDEX IF NOT EXISTS idx_radar_changes_relevance_score ON radar_changes(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_radar_changes_coordinates ON radar_changes USING GIST(coordinates);
CREATE INDEX IF NOT EXISTS idx_radar_changes_bbox ON radar_changes USING GIST(bbox);
CREATE INDEX IF NOT EXISTS idx_radar_changes_title_trgm ON radar_changes USING GIN(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_radar_changes_description_trgm ON radar_changes USING GIN(description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_radar_changes_commodities ON radar_changes USING GIN(affected_commodities);
CREATE INDEX IF NOT EXISTS idx_radar_changes_companies ON radar_changes USING GIN(affected_companies);
CREATE INDEX IF NOT EXISTS idx_radar_changes_tags ON radar_changes USING GIN(tags);

-- ============================================================================
-- 4. User Alerts / Notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS radar_user_alerts (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  change_id BIGINT NOT NULL REFERENCES radar_changes(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  notified_at TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radar_user_alerts_user_id ON radar_user_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_radar_user_alerts_change_id ON radar_user_alerts(change_id);
CREATE INDEX IF NOT EXISTS idx_radar_user_alerts_is_read ON radar_user_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_radar_user_alerts_created_at ON radar_user_alerts(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_radar_user_alerts_unique ON radar_user_alerts(user_id, change_id);

-- ============================================================================
-- 5. User Monitoring Preferences
-- ============================================================================

CREATE TABLE IF NOT EXISTS radar_user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  monitored_countries TEXT[] DEFAULT '{}',
  monitored_states TEXT[] DEFAULT '{}',
  monitored_cities TEXT[] DEFAULT '{}',
  monitored_commodities TEXT[] DEFAULT '{}',
  monitored_companies TEXT[] DEFAULT '{}',
  monitored_categories TEXT[] DEFAULT '{}',
  min_severity VARCHAR(20) DEFAULT 'medium',
  notification_email BOOLEAN DEFAULT true,
  notification_push BOOLEAN DEFAULT false,
  notification_whatsapp BOOLEAN DEFAULT false,
  digest_frequency VARCHAR(20) DEFAULT 'daily',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radar_user_preferences_user_id ON radar_user_preferences(user_id);

-- ============================================================================
-- 6. Cached Data
-- ============================================================================

CREATE TABLE IF NOT EXISTS radar_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(255) NOT NULL UNIQUE,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radar_cache_expires_at ON radar_cache(expires_at);

-- ============================================================================
-- 7. ANM Data (Processos Minerários)
-- ============================================================================

CREATE TABLE IF NOT EXISTS anm_processos (
  id BIGSERIAL PRIMARY KEY,
  numero_processo VARCHAR(50) NOT NULL UNIQUE,
  ano INTEGER,
  nome_area VARCHAR(255),
  fase VARCHAR(100),
  ult_evento VARCHAR(255),
  substancia VARCHAR(255),
  uso VARCHAR(100),
  uf CHAR(2),
  municipio VARCHAR(100),
  area_ha DECIMAL(12, 2),
  disponibilidade VARCHAR(50),
  prioridade_obtencao VARCHAR(50),
  data_protocolo DATE,
  data_publicacao_dou DATE,
  coordinates GEOMETRY(Point, 4326),
  bbox GEOMETRY(Polygon, 4326),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anm_processos_uf ON anm_processos(uf);
CREATE INDEX IF NOT EXISTS idx_anm_processos_municipio ON anm_processos(municipio);
CREATE INDEX IF NOT EXISTS idx_anm_processos_substancia ON anm_processos(substancia);
CREATE INDEX IF NOT EXISTS idx_anm_processos_fase ON anm_processos(fase);
CREATE INDEX IF NOT EXISTS idx_anm_processos_coordinates ON anm_processos USING GIST(coordinates);
CREATE INDEX IF NOT EXISTS idx_anm_processos_bbox ON anm_processos USING GIST(bbox);

-- ============================================================================
-- 8. ANM CFEM (Arrecadação)
-- ============================================================================

CREATE TABLE IF NOT EXISTS anm_cfem (
  id BIGSERIAL PRIMARY KEY,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  uf CHAR(2) NOT NULL,
  municipio VARCHAR(100),
  substancia VARCHAR(255),
  valor_reais DECIMAL(15, 2),
  quantidade DECIMAL(15, 2),
  unidade VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anm_cfem_ano_mes ON anm_cfem(ano, mes);
CREATE INDEX IF NOT EXISTS idx_anm_cfem_uf ON anm_cfem(uf);
CREATE INDEX IF NOT EXISTS idx_anm_cfem_substancia ON anm_cfem(substancia);

-- ============================================================================
-- 9. IBAMA Licenças
-- ============================================================================

CREATE TABLE IF NOT EXISTS ibama_licencas (
  id BIGSERIAL PRIMARY KEY,
  numero_licenca VARCHAR(50) NOT NULL UNIQUE,
  tipo_licenca VARCHAR(10),
  empreendimento VARCHAR(255),
  empreendedor VARCHAR(255),
  uf CHAR(2),
  municipio VARCHAR(100),
  atividade TEXT,
  data_emissao DATE,
  data_validade DATE,
  status VARCHAR(50),
  coordinates GEOMETRY(Point, 4326),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ibama_licencas_uf ON ibama_licencas(uf);
CREATE INDEX IF NOT EXISTS idx_ibama_licencas_tipo ON ibama_licencas(tipo_licenca);
CREATE INDEX IF NOT EXISTS idx_ibama_licencas_status ON ibama_licencas(status);
CREATE INDEX IF NOT EXISTS idx_ibama_licencas_data_validade ON ibama_licencas(data_validade);
CREATE INDEX IF NOT EXISTS idx_ibama_licencas_coordinates ON ibama_licencas USING GIST(coordinates);

-- ============================================================================
-- 10. IBAMA Embargos
-- ============================================================================

CREATE TABLE IF NOT EXISTS ibama_embargos (
  id BIGSERIAL PRIMARY KEY,
  numero_auto VARCHAR(50) NOT NULL UNIQUE,
  data_auto DATE,
  uf CHAR(2),
  municipio VARCHAR(100),
  cpf_cnpj VARCHAR(20),
  nome_infrator VARCHAR(255),
  descricao TEXT,
  area_ha DECIMAL(12, 2),
  valor_multa DECIMAL(15, 2),
  coordinates GEOMETRY(Point, 4326),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ibama_embargos_uf ON ibama_embargos(uf);
CREATE INDEX IF NOT EXISTS idx_ibama_embargos_data_auto ON ibama_embargos(data_auto DESC);
CREATE INDEX IF NOT EXISTS idx_ibama_embargos_cpf_cnpj ON ibama_embargos(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_ibama_embargos_coordinates ON ibama_embargos USING GIST(coordinates);

-- ============================================================================
-- 11. USGS Mineral Deposits
-- ============================================================================

CREATE TABLE IF NOT EXISTS usgs_deposits (
  id BIGSERIAL PRIMARY KEY,
  dep_id VARCHAR(50) NOT NULL UNIQUE,
  site_name VARCHAR(255),
  country VARCHAR(100),
  state_province VARCHAR(100),
  commodity TEXT[],
  deposit_type VARCHAR(100),
  development_status VARCHAR(100),
  production_size VARCHAR(50),
  ore_tonnage DECIMAL(15, 2),
  grade VARCHAR(100),
  year_discovered INTEGER,
  year_production_began INTEGER,
  coordinates GEOMETRY(Point, 4326) NOT NULL,
  url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usgs_deposits_country ON usgs_deposits(country);
CREATE INDEX IF NOT EXISTS idx_usgs_deposits_commodity ON usgs_deposits USING GIN(commodity);
CREATE INDEX IF NOT EXISTS idx_usgs_deposits_coordinates ON usgs_deposits USING GIST(coordinates);

-- ============================================================================
-- 12. Satellite Monitoring (Copernicus/GFW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS radar_satellite_alerts (
  id BIGSERIAL PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium',
  area_name VARCHAR(255),
  coordinates GEOMETRY(Point, 4326) NOT NULL,
  bbox GEOMETRY(Polygon, 4326),
  area_ha DECIMAL(12, 2),
  confidence VARCHAR(20),
  ndvi_before DECIMAL(5, 3),
  ndvi_after DECIMAL(5, 3),
  change_percentage DECIMAL(5, 2),
  alert_date DATE NOT NULL,
  image_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radar_satellite_alerts_source ON radar_satellite_alerts(source);
CREATE INDEX IF NOT EXISTS idx_radar_satellite_alerts_type ON radar_satellite_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_radar_satellite_alerts_date ON radar_satellite_alerts(alert_date DESC);
CREATE INDEX IF NOT EXISTS idx_radar_satellite_alerts_coordinates ON radar_satellite_alerts USING GIST(coordinates);
CREATE INDEX IF NOT EXISTS idx_radar_satellite_alerts_bbox ON radar_satellite_alerts USING GIST(bbox);

-- ============================================================================
-- Functions and Triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_radar_api_sources_updated_at') THEN
    CREATE TRIGGER update_radar_api_sources_updated_at
      BEFORE UPDATE ON radar_api_sources
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_radar_changes_updated_at') THEN
    CREATE TRIGGER update_radar_changes_updated_at
      BEFORE UPDATE ON radar_changes
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_radar_user_preferences_updated_at') THEN
    CREATE TRIGGER update_radar_user_preferences_updated_at
      BEFORE UPDATE ON radar_user_preferences
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_anm_processos_updated_at') THEN
    CREATE TRIGGER update_anm_processos_updated_at
      BEFORE UPDATE ON anm_processos
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ibama_licencas_updated_at') THEN
    CREATE TRIGGER update_ibama_licencas_updated_at
      BEFORE UPDATE ON ibama_licencas
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_usgs_deposits_updated_at') THEN
    CREATE TRIGGER update_usgs_deposits_updated_at
      BEFORE UPDATE ON usgs_deposits
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- ============================================================================
-- Seed Data
-- ============================================================================

INSERT INTO radar_api_sources (name, type, status, is_free, monthly_quota, base_url, api_key_required, config) VALUES
  ('Global Forest Watch', 'gfw', 'active', true, 10000, 'https://data-api.globalforestwatch.org', true, '{"description": "Deforestation and forest monitoring"}'),
  ('USGS Mineral Resources', 'usgs', 'active', true, NULL, 'https://mrdata.usgs.gov', false, '{"description": "Mineral deposits and commodity data"}'),
  ('World Bank Data', 'worldbank', 'active', true, NULL, 'https://api.worldbank.org/v2', false, '{"description": "Economic indicators and ESG data"}'),
  ('ANM Dados Abertos', 'anm', 'active', true, NULL, 'https://dados.gov.br', false, '{"description": "Brazilian mining processes and CFEM"}'),
  ('CPRM/SGB GeoSGB', 'cprm', 'active', true, NULL, 'https://geosgb.sgb.gov.br/geoserver', false, '{"description": "Brazilian geological and mineral resources"}'),
  ('IBAMA Dados Abertos', 'ibama', 'active', true, NULL, 'https://dados.gov.br', false, '{"description": "Environmental licenses and embargoes"}'),
  ('Copernicus Data Space', 'copernicus', 'active', true, 2000, 'https://sh.dataspace.copernicus.eu', true, '{"description": "Satellite imagery and environmental monitoring"}'),
  ('NewsAPI', 'newsapi', 'inactive', false, 250000, 'https://newsapi.org/v2', true, '{"description": "Global news aggregation", "cost_per_request": 0.0018}')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Log migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 001 completed successfully at %', NOW();
END$$;
