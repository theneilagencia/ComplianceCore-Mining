/**
 * NI 43-101 Mapper - COMPLETE VERSION
 * Maps normalized.json to NI 43-101 (Canadian) standard structure
 */

interface NormalizedData {
  metadata?: any;
  sections?: any[];
  resource_estimates?: any[];
  reserve_estimates?: any[];
  competent_persons?: any[];
  drilling?: any;
  sampling?: any;
  geology?: any;
  property?: any;
  economic_assumptions?: any;
  qa_qc?: string;
  brand?: any;
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
  
  const resourcesTable = resources.map((r: any) => ({
    category: r.category || "-",
    tonnage: r.tonnage || 0,
    grades: r.grade || {},
    cutoff: r.cutoff_grade || {},
    contained_metal: r.contained_metal || {},
  }));

  const reservesTable = reserves.map((r: any) => ({
    category: r.category || "-",
    tonnage: r.tonnage || 0,
    grades: r.grade || {},
    contained_metal: r.contained_metal || {},
  }));

  const geologyData = typeof n.geology === 'string' ? { regional: n.geology } : (n.geology || {});

  return {
    standard: "NI 43-101",
    project_name: n.metadata?.project_name || "-",
    company: n.metadata?.company || "-",
    location: n.metadata?.location || "-",
    country: n.metadata?.country || "Canada",
    report_date: n.metadata?.report_date || new Date().toISOString().split('T')[0],
    effective_date: n.metadata?.effective_date || new Date().toISOString().split('T')[0],
    
    qualified_persons: (n.competent_persons || []).map((p: any) => ({
      name: p.name || "-",
      qualification: p.qualification || "-",
      organization: p.organization || "-",
      affiliation: p.affiliation || "Independent",
      role: p.role || "Qualified Person (NI 43-101)",
    })),
    
    property: {
      location: n.metadata?.location || "-",
      mineral_tenure: n.property?.license_number || "-",
      tenure_type: n.property?.license_type || "-",
      area: n.property?.license_area || 0,
      holder: n.property?.license_holder || n.metadata?.company || "-",
    },
    
    geology: {
      regional: geologyData.regional || "-",
      local: geologyData.local || "-",
      deposit_type: geologyData.deposit_type || "-",
    },
    
    drilling: {
      total_holes: n.drilling?.total_holes || 0,
      total_meters: n.drilling?.total_meters || 0,
      drill_type: n.drilling?.drill_type || "-",
    },
    
    sampling: {
      method: n.sampling?.method || "-",
      laboratory: n.sampling?.laboratory || "-",
      qaqc: n.qa_qc || "-",
    },
    
    mineral_resources: {
      table: resourcesTable,
      estimation_method: "Kriging",
    },
    
    mineral_reserves: reserves.length > 0 ? {
      table: reservesTable,
    } : null,
    
    economic_assumptions: n.economic_assumptions || {},
    
    items: {
      item2: findSection("item 2"),
      item14: findSection("item 14"),
      item27: findSection("item 27"),
    },
    
    resources_table: resourcesTable,
    
    _brand: {
      logo_s3: n.brand?.logo_s3,
      company_display: n.brand?.company_display || n.metadata?.company || "-",
    },
  };
}

export function getDynamicFields() {
  return {
    standard: "NI_43_101",
    sections: [
      {
        id: "basic",
        title: "Basic Information",
        fields: [
          { name: "project_name", label: "Project Name", type: "text", required: true },
          { name: "location", label: "Location", type: "text", required: true },
          { name: "company", label: "Issuer", type: "text", required: true },
          { name: "report_date", label: "Report Date", type: "date", required: true },
          { name: "effective_date", label: "Effective Date", type: "date", required: true },
        ],
      },
      {
        id: "qualified_person",
        title: "Qualified Person",
        repeatable: true,
        fields: [
          { name: "name", label: "Name", type: "text", required: true },
          { name: "qualification", label: "Professional Designation", type: "text", required: true },
          { name: "organization", label: "Organization", type: "text", required: true },
        ],
      },
      {
        id: "property",
        title: "Property",
        fields: [
          { name: "mineral_tenure", label: "Mineral Tenure", type: "text", required: true },
          { name: "area", label: "Area (hectares)", type: "number", required: true },
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
