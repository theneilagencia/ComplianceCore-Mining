/**
 * SAMREC Mapper
 * Maps normalized.json to SAMREC standard structure
 */

interface NormalizedData {
  metadata?: {
    project_name?: string;
    company?: string;
    effective_date?: string;
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
  }>;
  competent_persons?: Array<{
    name?: string;
    qualification?: string;
    organization?: string;
  }>;
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
  const tableRows = resources.map(r => ({
    category: r.category || "-",
    tonnage: r.tonnage || 0,
    grades: r.grade || {},
    cutoff: r.cutoff_grade || {},
  }));

  return {
    standard: "SAMREC",
    project_name: n.metadata?.project_name || "-",
    company: n.metadata?.company || "-",
    effective_date: n.metadata?.effective_date || "-",
    competent_persons: (n.competent_persons || []).map(p => ({
      name: p.name || "-",
      qualification: p.qualification || "-",
      organization: p.organization || "-",
      role: "Competent Person (SAMREC)",
    })),
    sections: {
      table1: findSection("table 1"),
      table2: findSection("table 2"),
    },
    resources_table: tableRows,
    _brand: {
      logo_s3: n.brand?.logo_s3,
      company_display: n.brand?.company_display || n.metadata?.company || "-",
    },
  };
}

