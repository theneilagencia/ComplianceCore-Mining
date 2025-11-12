-- AI Report Generator - Complete Database Schema
-- Version: 1.0.0
-- Date: 2025-11-05

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- COMPETENT PERSONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS competent_persons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Personal Information
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  
  -- Professional Information
  organization VARCHAR(255) NOT NULL,
  professional_membership VARCHAR(255) NOT NULL, -- e.g., "AusIMM", "SME", "CBRR"
  registration_number VARCHAR(100) NOT NULL,
  years_experience INTEGER NOT NULL CHECK (years_experience >= 5),
  
  -- Areas of Competence (array)
  areas_of_competence TEXT[] NOT NULL DEFAULT '{}',
  -- e.g., ['Exploration', 'Mineral Resources', 'Ore Reserves', 'Metallurgy']
  
  -- Signature
  signature_url TEXT, -- S3 URL to signature image
  signature_uploaded_at TIMESTAMP,
  
  -- Accreditation
  is_accredited BOOLEAN DEFAULT FALSE,
  accreditation_body VARCHAR(255), -- e.g., "CBRR", "JORC", "SME"
  accreditation_date DATE,
  accreditation_expiry DATE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_competent_persons_email ON competent_persons(email);
CREATE INDEX idx_competent_persons_active ON competent_persons(is_active);
CREATE INDEX idx_competent_persons_membership ON competent_persons(professional_membership);

-- ============================================================================
-- TECHNICAL REPORTS
-- ============================================================================

CREATE TYPE report_standard AS ENUM (
  'JORC_2012',
  'NI_43_101',
  'PERC',
  'SAMREC',
  'SEC_SK_1300',
  'CRIRSCO',
  'CBRR',
  'ANM',
  'ANP',
  'CPRM',
  'IBAMA'
);

CREATE TYPE report_type AS ENUM (
  'Exploration Results',
  'Mineral Resources',
  'Mineral Reserves',
  'Technical Report Summary',
  'Pre-Feasibility Study',
  'Feasibility Study'
);

CREATE TYPE report_status AS ENUM (
  'draft',
  'in_review',
  'approved',
  'published',
  'archived'
);

CREATE TABLE IF NOT EXISTS technical_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Information
  project_name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  standard report_standard NOT NULL,
  report_type report_type NOT NULL,
  
  -- Dates
  report_date DATE NOT NULL,
  effective_date DATE NOT NULL,
  
  -- Location
  country VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  region VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Commodities (array)
  commodities TEXT[] NOT NULL DEFAULT '{}',
  -- e.g., ['Gold', 'Copper', 'Silver']
  
  -- Status and Workflow
  status report_status DEFAULT 'draft',
  version INTEGER DEFAULT 1,
  
  -- Files
  docx_file_url TEXT, -- S3 URL to generated DOCX
  pdf_file_url TEXT, -- S3 URL to generated PDF
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  
  -- Soft delete
  deleted_at TIMESTAMP
);

CREATE INDEX idx_technical_reports_status ON technical_reports(status);
CREATE INDEX idx_technical_reports_standard ON technical_reports(standard);
CREATE INDEX idx_technical_reports_created_by ON technical_reports(created_by);
CREATE INDEX idx_technical_reports_deleted ON technical_reports(deleted_at);

-- ============================================================================
-- REPORT COMPETENT PERSONS (Many-to-Many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_competent_persons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES technical_reports(id) ON DELETE CASCADE,
  competent_person_id UUID NOT NULL REFERENCES competent_persons(id) ON DELETE CASCADE,
  
  -- Role in this report
  role VARCHAR(255) NOT NULL, -- e.g., "Lead Geologist", "Resource Estimator"
  responsibility TEXT, -- e.g., "Responsible for Sections 1-10"
  
  -- Consent
  consent_given BOOLEAN DEFAULT FALSE,
  consent_date TIMESTAMP,
  consent_form_url TEXT, -- S3 URL to signed consent form
  
  -- Order (for multiple CPs)
  display_order INTEGER DEFAULT 1,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_report_cps_report ON report_competent_persons(report_id);
CREATE INDEX idx_report_cps_person ON report_competent_persons(competent_person_id);

-- ============================================================================
-- REPORT FIGURES
-- ============================================================================

CREATE TYPE figure_type AS ENUM (
  'location_map',
  'property_map',
  'geological_map',
  'drill_hole_plan',
  'cross_section',
  'long_section',
  'block_model',
  'chart',
  'photo',
  'other'
);

CREATE TABLE IF NOT EXISTS report_figures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES technical_reports(id) ON DELETE CASCADE,
  
  -- Figure Information
  type figure_type NOT NULL,
  title VARCHAR(500) NOT NULL,
  caption TEXT,
  number INTEGER NOT NULL, -- Figure 1, Figure 2, etc.
  
  -- File Information
  file_url TEXT NOT NULL, -- S3 URL
  file_size BIGINT NOT NULL, -- bytes
  mime_type VARCHAR(100) NOT NULL,
  
  -- Image Metadata
  width INTEGER,
  height INTEGER,
  dpi INTEGER,
  
  -- GIS Metadata (optional)
  scale VARCHAR(50), -- e.g., "1:10,000"
  datum VARCHAR(50), -- e.g., "WGS84"
  projection VARCHAR(100), -- e.g., "UTM Zone 23S"
  
  -- Order
  display_order INTEGER DEFAULT 1,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_report_figures_report ON report_figures(report_id);
CREATE INDEX idx_report_figures_type ON report_figures(type);
CREATE INDEX idx_report_figures_number ON report_figures(report_id, number);

-- ============================================================================
-- REPORT CHAPTERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES technical_reports(id) ON DELETE CASCADE,
  
  -- Chapter Information
  chapter_number INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT, -- Markdown or HTML content
  
  -- Hierarchy
  parent_chapter_id UUID REFERENCES report_chapters(id),
  level INTEGER DEFAULT 1, -- 1 = main chapter, 2 = subsection, etc.
  
  -- Order
  display_order INTEGER DEFAULT 1,
  
  -- Status
  is_complete BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_report_chapters_report ON report_chapters(report_id);
CREATE INDEX idx_report_chapters_order ON report_chapters(report_id, display_order);

-- ============================================================================
-- JORC TABLE 1 (and equivalents)
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_table1 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES technical_reports(id) ON DELETE CASCADE,
  
  -- Section 1: Sampling Techniques and Data
  sampling_techniques TEXT,
  drilling_techniques TEXT,
  drill_sample_recovery TEXT,
  logging TEXT,
  sub_sampling_techniques TEXT,
  quality_of_assay_data TEXT,
  verification_of_sampling TEXT,
  location_of_data_points TEXT,
  data_spacing TEXT,
  orientation_of_data TEXT,
  sample_security TEXT,
  audits_or_reviews_s1 TEXT,
  
  -- Section 2: Reporting of Exploration Results
  mineral_tenement TEXT,
  exploration_by_others TEXT,
  geology TEXT,
  drill_hole_information TEXT,
  data_aggregation TEXT,
  relationship_between_widths TEXT,
  diagrams TEXT,
  balanced_reporting TEXT,
  other_exploration_data TEXT,
  further_work TEXT,
  
  -- Section 3: Estimation and Reporting of Mineral Resources
  database_integrity TEXT,
  site_visits_s3 TEXT,
  geological_interpretation TEXT,
  dimensions TEXT,
  estimation_techniques TEXT,
  moisture TEXT,
  cut_off_parameters_s3 TEXT,
  mining_factors_s3 TEXT,
  metallurgical_factors_s3 TEXT,
  environmental_factors TEXT,
  bulk_density TEXT,
  classification_s3 TEXT,
  audits_or_reviews_s3 TEXT,
  discussion_of_accuracy_s3 TEXT,
  
  -- Section 4: Estimation and Reporting of Ore Reserves
  mineral_resource_estimate TEXT,
  site_visits_s4 TEXT,
  study_status TEXT,
  cut_off_parameters_s4 TEXT,
  mining_factors_s4 TEXT,
  metallurgical_factors_s4 TEXT,
  environmental_s4 TEXT,
  infrastructure TEXT,
  costs TEXT,
  revenue_factors TEXT,
  market_assessment TEXT,
  economic TEXT,
  social TEXT,
  other_s4 TEXT,
  classification_s4 TEXT,
  audits_or_reviews_s4 TEXT,
  discussion_of_accuracy_s4 TEXT,
  
  -- Completion Status
  section1_complete BOOLEAN DEFAULT FALSE,
  section2_complete BOOLEAN DEFAULT FALSE,
  section3_complete BOOLEAN DEFAULT FALSE,
  section4_complete BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(report_id)
);

CREATE INDEX idx_report_table1_report ON report_table1(report_id);

-- ============================================================================
-- REPORT VERSIONS (for version control)
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES technical_reports(id) ON DELETE CASCADE,
  
  version INTEGER NOT NULL,
  
  -- Snapshot of report data (JSONB)
  report_data JSONB NOT NULL,
  
  -- Files at this version
  docx_file_url TEXT,
  pdf_file_url TEXT,
  
  -- Change Information
  change_description TEXT,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(report_id, version)
);

CREATE INDEX idx_report_versions_report ON report_versions(report_id);
CREATE INDEX idx_report_versions_version ON report_versions(report_id, version DESC);

-- ============================================================================
-- REPORT COMMENTS (for review workflow)
-- ============================================================================

CREATE TABLE IF NOT EXISTS report_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES technical_reports(id) ON DELETE CASCADE,
  
  -- Comment Information
  chapter_id UUID REFERENCES report_chapters(id),
  section VARCHAR(255), -- e.g., "Table 1 - Section 3"
  comment TEXT NOT NULL,
  
  -- Status
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP,
  
  -- Author
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_report_comments_report ON report_comments(report_id);
CREATE INDEX idx_report_comments_chapter ON report_comments(chapter_id);
CREATE INDEX idx_report_comments_resolved ON report_comments(is_resolved);

-- ============================================================================
-- REPORT APPROVALS (for workflow)
-- ============================================================================

CREATE TYPE approval_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'changes_requested'
);

CREATE TABLE IF NOT EXISTS report_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES technical_reports(id) ON DELETE CASCADE,
  
  -- Approver
  approver_id UUID NOT NULL REFERENCES users(id),
  approver_role VARCHAR(100), -- e.g., "Competent Person", "Technical Reviewer", "Manager"
  
  -- Approval
  status approval_status DEFAULT 'pending',
  comments TEXT,
  approved_at TIMESTAMP,
  
  -- Order (for multi-stage approval)
  approval_order INTEGER DEFAULT 1,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_report_approvals_report ON report_approvals(report_id);
CREATE INDEX idx_report_approvals_approver ON report_approvals(approver_id);
CREATE INDEX idx_report_approvals_status ON report_approvals(status);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_competent_persons_updated_at BEFORE UPDATE ON competent_persons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_technical_reports_updated_at BEFORE UPDATE ON technical_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_figures_updated_at BEFORE UPDATE ON report_figures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_chapters_updated_at BEFORE UPDATE ON report_chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_table1_updated_at BEFORE UPDATE ON report_table1
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_comments_updated_at BEFORE UPDATE ON report_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_approvals_updated_at BEFORE UPDATE ON report_approvals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Complete Report Information
CREATE OR REPLACE VIEW v_reports_complete AS
SELECT 
  r.*,
  json_agg(DISTINCT jsonb_build_object(
    'id', cp.id,
    'name', cp.name,
    'title', cp.title,
    'role', rcp.role,
    'consent_given', rcp.consent_given
  )) FILTER (WHERE cp.id IS NOT NULL) AS competent_persons,
  COUNT(DISTINCT rf.id) AS figure_count,
  COUNT(DISTINCT rc.id) AS chapter_count,
  (rt.section1_complete AND rt.section2_complete AND rt.section3_complete AND rt.section4_complete) AS table1_complete
FROM technical_reports r
LEFT JOIN report_competent_persons rcp ON r.id = rcp.report_id
LEFT JOIN competent_persons cp ON rcp.competent_person_id = cp.id
LEFT JOIN report_figures rf ON r.id = rf.report_id
LEFT JOIN report_chapters rc ON r.id = rc.report_id
LEFT JOIN report_table1 rt ON r.id = rt.report_id
WHERE r.deleted_at IS NULL
GROUP BY r.id, rt.section1_complete, rt.section2_complete, rt.section3_complete, rt.section4_complete;

-- View: Report Progress
CREATE OR REPLACE VIEW v_report_progress AS
SELECT 
  r.id,
  r.project_name,
  r.status,
  COUNT(DISTINCT rcp.id) AS competent_persons_count,
  COUNT(DISTINCT rf.id) AS figures_count,
  COUNT(DISTINCT rc.id) AS chapters_count,
  COUNT(DISTINCT rc.id) FILTER (WHERE rc.is_complete = TRUE) AS chapters_complete,
  (rt.section1_complete AND rt.section2_complete) AS exploration_complete,
  (rt.section3_complete) AS resources_complete,
  (rt.section4_complete) AS reserves_complete,
  CASE 
    WHEN r.status = 'published' THEN 100
    WHEN r.status = 'approved' THEN 95
    WHEN r.status = 'in_review' THEN 80
    ELSE (
      (CASE WHEN COUNT(DISTINCT rcp.id) > 0 THEN 20 ELSE 0 END) +
      (CASE WHEN COUNT(DISTINCT rf.id) >= 6 THEN 20 ELSE COUNT(DISTINCT rf.id) * 3 END) +
      (CASE WHEN COUNT(DISTINCT rc.id) > 0 THEN (COUNT(DISTINCT rc.id) FILTER (WHERE rc.is_complete = TRUE)::FLOAT / COUNT(DISTINCT rc.id) * 40) ELSE 0 END) +
      (CASE WHEN rt.section1_complete AND rt.section2_complete AND rt.section3_complete THEN 20 ELSE 0 END)
    )
  END AS progress_percentage
FROM technical_reports r
LEFT JOIN report_competent_persons rcp ON r.id = rcp.report_id
LEFT JOIN report_figures rf ON r.id = rf.report_id
LEFT JOIN report_chapters rc ON r.id = rc.report_id
LEFT JOIN report_table1 rt ON r.id = rt.report_id
WHERE r.deleted_at IS NULL
GROUP BY r.id, r.project_name, r.status, rt.section1_complete, rt.section2_complete, rt.section3_complete, rt.section4_complete;

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Insert sample competent person
-- INSERT INTO competent_persons (name, title, email, organization, professional_membership, registration_number, years_experience, areas_of_competence)
-- VALUES ('Dr. John Smith', 'Senior Geologist', 'john.smith@example.com', 'ABC Mining Consultants', 'AusIMM', 'CP123456', 15, ARRAY['Exploration', 'Mineral Resources']);

-- ============================================================================
-- PERMISSIONS (to be configured based on user roles)
-- ============================================================================

-- Grant permissions to appropriate roles
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO role_geologist;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO role_viewer;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO role_admin;
