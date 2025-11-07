/**
 * ANM Mapper
 * Maps normalized.json to ANM standard structure
 */

interface NormalizedData {
  metadata?: {
    project_name?: string;
    company?: string;
    effective_date?: string;
    report_date?: string;
    location?: string;
    country?: string;
  };
  sections?: Array<{
    title?: string;
    content_text?: string;
  }>;
  resource_estimates?: Array<{
    category?: string;
    tonnage?: number;
    grade?: Record<string, number>;
    cutoff_grade?: Record<string, number>;
    contained_metal?: Record<string, number>;
  }>;
  reserve_estimates?: Array<{
    category?: string;
    tonnage?: number;
    grade?: Record<string, number>;
    contained_metal?: Record<string, number>;
  }>;
  competent_persons?: Array<{
    name?: string;
    qualification?: string;
    organization?: string;
    affiliation?: string;
    role?: string;
  }>;
  drilling?: {
    total_holes?: number;
    total_meters?: number;
    drill_type?: string;
  };
  sampling?: {
    method?: string;
    laboratory?: string;
  };
  geology?: any;
  property?: {
    license_number?: string;
    license_type?: string;
    license_area?: number;
    license_holder?: string;
  };
  economic_assumptions?: {
    recovery_rate?: number;
    mining_cost?: number;
    processing_cost?: number;
    mining_method?: string;
    processing_method?: string;
  };
  qa_qc?: string;
  brand?: {
    logo_s3?: string;
    company_display?: string;
  };
}

export function toStandard(n: NormalizedData) {
  const sections = n.sections || [];
  
  function findSection(titleSubstring: string) {
    for (const s of sections) {
      const title = (s.title || "").toLowerCase();
      if (title.includes(titleSubstring.toLowerCase())) {
        return s;
      }
    }
    return { title: "", content_text: "" };
  }

  const resources = n.resource_estimates || [];
  const reserves = n.reserve_estimates || [];
  
  const resourcesTable = resources.map(r => ({
    category: r.category || "-",
    tonnage: r.tonnage || 0,
    grades: r.grade || {},
    cutoff: r.cutoff_grade || {},
    contained_metal: r.contained_metal || {},
  }));

  const reservesTable = reserves.map(r => ({
    category: r.category || "-",
    tonnage: r.tonnage || 0,
    grades: r.grade || {},
    contained_metal: r.contained_metal || {},
  }));

  const geologyData = typeof n.geology === 'string' ? { regional: n.geology } : (n.geology || {});

  return {
    standard: "ANM",
    
    // Basic Information
    project_name: n.metadata?.project_name || "-",
    company: n.metadata?.company || "-",
    location: n.metadata?.location || "-",
    country: n.metadata?.country || "-",
    report_date: n.metadata?.report_date || new Date().toISOString().split('T')[0],
    effective_date: n.metadata?.effective_date || new Date().toISOString().split('T')[0],
    
    // Competent/Qualified Persons
    competent_persons: (n.competent_persons || []).map(p => ({
      name: p.name || "-",
      qualification: p.qualification || "-",
      organization: p.organization || "-",
      affiliation: p.affiliation || "Independent",
      role: p.role || "Competent Person (ANM)",
    })),
    
    // Property
    property: {
      license_number: n.property?.license_number || "-",
      license_type: n.property?.license_type || "-",
      license_area: n.property?.license_area || 0,
      license_holder: n.property?.license_holder || n.metadata?.company || "-",
    },
    
    // Geology
    geology: {
      regional: geologyData.regional || "-",
      local: geologyData.local || "-",
      deposit_type: geologyData.deposit_type || "-",
    },
    
    // Drilling
    drilling: {
      total_holes: n.drilling?.total_holes || 0,
      total_meters: n.drilling?.total_meters || 0,
      drill_type: n.drilling?.drill_type || "-",
    },
    
    // Sampling
    sampling: {
      method: n.sampling?.method || "-",
      laboratory: n.sampling?.laboratory || "-",
      qaqc: n.qa_qc || "-",
    },
    
    // Resources
    mineral_resources: {
      table: resourcesTable,
      estimation_method: "Kriging",
    },
    
    // Reserves (if applicable)
    mineral_reserves: reserves.length > 0 ? {
      table: reservesTable,
    } : null,
    
    // Economic
    economic_assumptions: n.economic_assumptions || {},
    
    // Sections
    sections: {
      section1: findSection("section 1"),
      section2: findSection("section 2"),
      section3: findSection("section 3"),
    },
    
    // Legacy compatibility
    resources_table: resourcesTable,
    
    // Brand
    _brand: {
      logo_s3: n.brand?.logo_s3,
      company_display: n.brand?.company_display || n.metadata?.company || "-",
    },
  };
}

/**
 * Get dynamic fields for ANM manual entry
 */
export function getDynamicFields() {
  return {
    standard: "ANM",
    sections: [
      {
        id: "basic",
        title: "Basic Information",
        fields: [
          { name: "project_name", label: "Project Name", type: "text", required: true },
          { name: "location", label: "Location", type: "text", required: true },
          { name: "company", label: "Company", type: "text", required: true },
          { name: "report_date", label: "Report Date", type: "date", required: true },
          { name: "effective_date", label: "Effective Date", type: "date", required: true },
        ],
      },
      {
        id: "competent_person",
        title: "Competent Person",
        repeatable: true,
        fields: [
          { name: "name", label: "Name", type: "text", required: true },
          { name: "qualification", label: "Qualification", type: "text", required: true },
          { name: "organization", label: "Organization", type: "text", required: true },
        ],
      },
      {
        id: "property",
        title: "Property",
        fields: [
          { name: "license_number", label: "License Number", type: "text", required: true },
          { name: "license_area", label: "Area (hectares)", type: "number", required: true },
        ],
      },
      {
        id: "resources",
        title: "Mineral Resources",
        repeatable: true,
        fields: [
          { name: "category", label: "Classification", type: "select", options: ["Measured", "Indicated", "Inferred"], required: true },
          { name: "tonnage", label: "Tonnage (Mt)", type: "number", required: true },
          { name: "grade", label: "Grade", type: "number", required: true },
        ],
      },
    ],
  };
}
