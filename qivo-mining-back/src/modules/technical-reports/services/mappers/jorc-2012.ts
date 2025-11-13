/**
 * JORC 2012 Mapper - COMPLETE VERSION
 * Maps normalized.json to JORC 2012 standard structure
 * Based on real JORC reports analysis (96-137 pages)
 */

interface NormalizedData {
  metadata?: {
    project_name?: string;
    company?: string;
    effective_date?: string;
    report_date?: string;
    location?: string;
    country?: string;
    coordinates?: string;
    detected_standard?: string;
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
    experience_years?: number;
    responsibility?: string;
    contact?: string;
    signature?: string;
    signature_date?: string;
    role?: string;
  }>;
  drilling?: {
    total_holes?: number;
    total_meters?: number;
    drill_type?: string;
    drill_spacing?: string;
    core_recovery?: number;
  };
  sampling?: {
    method?: string;
    interval?: string;
    sample_size?: string;
    laboratory?: string;
    analytical_methods?: string[];
    qaqc_procedures?: string;
  };
  geology?: string | {
    regional?: string;
    local?: string;
    lithology?: string;
    structure?: string;
    alteration?: string;
    mineralisation_style?: string;
    deposit_type?: string;
  };
  property?: {
    license_number?: string;
    license_type?: string;
    license_area?: number;
    license_holder?: string;
    license_expiry?: string;
    regulatory_authority?: string;
    royalties?: number;
    encumbrances?: string;
  };
  economic_assumptions?: {
    recovery_rate?: number;
    mining_cost?: number;
    processing_cost?: number;
    mining_method?: string;
    processing_method?: string;
    capital_costs?: number;
    commodity_price?: number;
    npv?: number;
    irr?: number;
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
    classification: r.category || "-",
    tonnage: r.tonnage || 0,
    grades: r.grade || {},
    cutoff: r.cutoff_grade || {},
    contained_metal: r.contained_metal || {},
  }));

  const reservesTable = reserves.map(r => ({
    classification: r.category || "-",
    tonnage: r.tonnage || 0,
    grades: r.grade || {},
    contained_metal: r.contained_metal || {},
  }));

  // Handle geology as string or object
  const geologyData = typeof n.geology === 'string' ? { regional: n.geology } : (n.geology || {});

  return {
    standard: "JORC 2012",
    
    // Cover Page
    title: `JORC 2012 Technical Report for ${n.metadata?.project_name || "Project"}`,
    project_name: n.metadata?.project_name || "-",
    location: n.metadata?.location || "-",
    country: n.metadata?.country || "-",
    coordinates: n.metadata?.coordinates || "-",
    report_date: n.metadata?.report_date || new Date().toISOString().split('T')[0],
    effective_date: n.metadata?.effective_date || new Date().toISOString().split('T')[0],
    company: n.metadata?.company || "-",
    
    // Competent Person(s)
    competent_persons: (n.competent_persons || []).map(p => ({
      name: p.name || "-",
      qualification: p.qualification || "-",
      organization: p.organization || "-",
      affiliation: p.affiliation || "Independent Consultant",
      experience_years: p.experience_years || 5,
      responsibility: p.responsibility || "QP, all sections",
      contact: p.contact || "-",
      signature: p.signature || "",
      signature_date: p.signature_date || new Date().toISOString().split('T')[0],
      role: p.role || "Competent Person (JORC 2012)",
    })),
    
    // Executive Summary
    executive_summary: {
      property_description: findSection("property description").content_text || "-",
      history: findSection("history").content_text || "-",
      geology_mineralisation: findSection("geology").content_text || geologyData.regional || "-",
      deposit_types: geologyData.deposit_type || "-",
      drilling: `${n.drilling?.total_holes || 0} holes, ${n.drilling?.total_meters || 0} meters total`,
      sampling: findSection("sampling").content_text || n.sampling?.method || "-",
      data_verification: findSection("data verification").content_text || "-",
      mineral_processing: findSection("mineral processing").content_text || "-",
      resource_estimation: findSection("resource estimation").content_text || "-",
      economic_prospects: findSection("economic").content_text || "-",
      conclusions: findSection("conclusions").content_text || "-",
      recommendations: findSection("recommendations").content_text || "-",
    },
    
    // Property Description
    property: {
      license_details: n.property?.license_number || "-",
      license_type: n.property?.license_type || "-",
      license_area: n.property?.license_area || 0,
      license_holder: n.property?.license_holder || n.metadata?.company || "-",
      license_expiry: n.property?.license_expiry || "-",
      regulatory_requirements: n.property?.regulatory_authority || "-",
      royalties: n.property?.royalties || 0,
      encumbrances: n.property?.encumbrances || "None",
    },
    
    // Geology
    geology: {
      regional_geology: geologyData.regional || findSection("regional geology").content_text || "-",
      local_geology: geologyData.local || findSection("local geology").content_text || "-",
      lithology: geologyData.lithology || "-",
      structure: geologyData.structure || "-",
      alteration: geologyData.alteration || "-",
      mineralisation_style: geologyData.mineralisation_style || "-",
      deposit_type: geologyData.deposit_type || "-",
    },
    
    // Drilling
    drilling: {
      drill_type: n.drilling?.drill_type || "-",
      total_holes: n.drilling?.total_holes || 0,
      total_meters: n.drilling?.total_meters || 0,
      drill_spacing: n.drilling?.drill_spacing || "-",
      core_recovery: n.drilling?.core_recovery || 0,
      description: findSection("drilling").content_text || "-",
    },
    
    // Sampling
    sampling: {
      method: n.sampling?.method || "-",
      interval: n.sampling?.interval || "-",
      sample_size: n.sampling?.sample_size || "-",
      laboratory: n.sampling?.laboratory || "-",
      analytical_methods: n.sampling?.analytical_methods || [],
      qaqc_procedures: n.sampling?.qaqc_procedures || n.qa_qc || "-",
      description: findSection("sampling").content_text || "-",
    },
    
    // Resource Estimates
    mineral_resources: {
      table: resourcesTable,
      estimation_method: findSection("estimation method").content_text || "Kriging",
      classification_criteria: findSection("classification").content_text || "-",
      description: findSection("resource estimate").content_text || "-",
    },
    
    // Reserve Estimates (if applicable)
    ore_reserves: reserves.length > 0 ? {
      table: reservesTable,
      mining_factors: n.economic_assumptions?.mining_method || "-",
      metallurgical_factors: n.economic_assumptions?.processing_method || "-",
      description: findSection("ore reserve").content_text || "-",
    } : null,
    
    // Economic Analysis (if applicable)
    economic_assumptions: n.economic_assumptions || {},
    economic: n.economic_assumptions ? {
      mining_method: n.economic_assumptions.mining_method || "-",
      processing_method: n.economic_assumptions.processing_method || "-",
      recovery_rate: n.economic_assumptions.recovery_rate || 0,
      operating_costs: (n.economic_assumptions.mining_cost || 0) + (n.economic_assumptions.processing_cost || 0),
      capital_costs: n.economic_assumptions.capital_costs || 0,
      commodity_price: n.economic_assumptions.commodity_price || 0,
      npv: n.economic_assumptions.npv || 0,
      irr: n.economic_assumptions.irr || 0,
    } : null,
    
    // QA/QC
    qa_qc: n.qa_qc || "Not specified",
    
    // JORC Table 1 Sections
    table1: {
      section1_sampling: findSection("table 1 section 1").content_text || "-",
      section2_exploration: findSection("table 1 section 2").content_text || "-",
      section3_resources: findSection("table 1 section 3").content_text || "-",
      section4_reserves: findSection("table 1 section 4").content_text || "-",
    },
    
    // Additional Sections
    sections: {
      table1_section1: findSection("section 1"),
      table1_section2: findSection("section 2"),
      table1_section3: findSection("section 3"),
      table1_section4: findSection("section 4"),
      introduction: findSection("introduction").content_text || "-",
      terms_of_reference: findSection("terms of reference").content_text || "-",
      limitations: findSection("limitations").content_text || "-",
      accessibility: findSection("accessibility").content_text || "-",
      climate: findSection("climate").content_text || "-",
      infrastructure: findSection("infrastructure").content_text || "-",
      environmental: findSection("environmental").content_text || "-",
      social_impact: findSection("social").content_text || "-",
      adjacent_properties: findSection("adjacent").content_text || "-",
      other_data: findSection("other").content_text || "-",
      references: findSection("references").content_text || "-",
    },
    
    // Legacy fields for backward compatibility
    resources_table: resourcesTable,
    
    // Brand
    _brand: {
      logo_s3: n.brand?.logo_s3,
      company_display: n.brand?.company_display || n.metadata?.company || "-",
    },
  };
}

/**
 * Get dynamic fields for JORC 2012 manual entry
 */
export function getDynamicFields() {
  return {
    standard: "JORC_2012",
    sections: [
      {
        id: "cover",
        title: "Cover Page",
        fields: [
          { name: "project_name", label: "Project Name", type: "text", required: true },
          { name: "location", label: "Location", type: "text", required: true },
          { name: "country", label: "Country", type: "text", required: true },
          { name: "coordinates", label: "Coordinates", type: "text", required: false },
          { name: "report_date", label: "Report Date", type: "date", required: true },
          { name: "effective_date", label: "Effective Date", type: "date", required: true },
          { name: "company", label: "Client Company", type: "text", required: true },
        ],
      },
      {
        id: "competent_person",
        title: "Competent Person",
        repeatable: true,
        fields: [
          { name: "name", label: "Name", type: "text", required: true },
          { name: "qualification", label: "Qualifications (e.g., MSc, PhD)", type: "text", required: true },
          { name: "organization", label: "Organization", type: "text", required: true },
          { name: "affiliation", label: "Affiliation", type: "select", options: ["Independent Consultant", "Employee", "Other"], required: true },
          { name: "experience_years", label: "Years of Experience", type: "number", required: true },
          { name: "responsibility", label: "Responsibility", type: "text", required: true },
          { name: "contact", label: "Contact Information", type: "email", required: true },
        ],
      },
      {
        id: "property",
        title: "Property Description",
        fields: [
          { name: "license_number", label: "License Number", type: "text", required: true },
          { name: "license_type", label: "License Type", type: "text", required: true },
          { name: "license_area", label: "License Area (hectares)", type: "number", required: true },
          { name: "license_holder", label: "License Holder", type: "text", required: true },
          { name: "license_expiry", label: "License Expiry Date", type: "date", required: false },
          { name: "regulatory_authority", label: "Regulatory Authority", type: "text", required: true },
          { name: "royalties", label: "Royalties (%)", type: "number", required: false },
          { name: "encumbrances", label: "Encumbrances", type: "textarea", required: false },
        ],
      },
      {
        id: "geology",
        title: "Geology and Mineralisation",
        fields: [
          { name: "regional_geology", label: "Regional Geology", type: "textarea", required: true },
          { name: "local_geology", label: "Local Geology", type: "textarea", required: true },
          { name: "lithology", label: "Lithology", type: "text", required: true },
          { name: "structure", label: "Structure", type: "text", required: false },
          { name: "alteration", label: "Alteration", type: "text", required: false },
          { name: "mineralisation_style", label: "Mineralisation Style", type: "text", required: true },
          { name: "deposit_type", label: "Deposit Type", type: "text", required: true },
        ],
      },
      {
        id: "drilling",
        title: "Drilling",
        fields: [
          { name: "drill_type", label: "Drill Type", type: "select", options: ["Diamond", "RC", "RAB", "Aircore", "Other"], required: true },
          { name: "total_holes", label: "Total Number of Holes", type: "number", required: true },
          { name: "total_meters", label: "Total Meters Drilled", type: "number", required: true },
          { name: "drill_spacing", label: "Drill Spacing", type: "text", required: false },
          { name: "core_recovery", label: "Core Recovery (%)", type: "number", required: false },
        ],
      },
      {
        id: "sampling",
        title: "Sampling and Analysis",
        fields: [
          { name: "method", label: "Sampling Method", type: "text", required: true },
          { name: "interval", label: "Sample Interval", type: "text", required: true },
          { name: "sample_size", label: "Sample Size", type: "text", required: false },
          { name: "laboratory", label: "Laboratory", type: "text", required: true },
          { name: "analytical_methods", label: "Analytical Methods", type: "textarea", required: true },
          { name: "qaqc_procedures", label: "QA/QC Procedures", type: "textarea", required: true },
        ],
      },
      {
        id: "resources",
        title: "Mineral Resource Estimate",
        repeatable: true,
        fields: [
          { name: "category", label: "Classification", type: "select", options: ["Measured", "Indicated", "Inferred"], required: true },
          { name: "tonnage", label: "Tonnage (Mt)", type: "number", required: true },
          { name: "grade", label: "Grade (g/t or %)", type: "number", required: true },
          { name: "cutoff_grade", label: "Cut-off Grade", type: "number", required: true },
          { name: "contained_metal", label: "Contained Metal (oz or kg)", type: "number", required: false },
        ],
      },
    ],
  };
}
