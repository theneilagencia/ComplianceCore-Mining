// Fixtures para testes do módulo de relatórios técnicos

export const mockJORCData = {
  project_name: "Projeto Teste Ouro",
  location: { 
    lat: -23.5505, 
    lon: -46.6333,
    municipality: "Itabira",
    state: "MG",
    country: "Brazil"
  },
  commodity: "gold",
  resource_estimate: {
    measured: { 
      tonnage: 1000000, 
      grade: 2.5,
      contained_metal: 2500000 
    },
    indicated: { 
      tonnage: 2000000, 
      grade: 2.0,
      contained_metal: 4000000
    },
    inferred: { 
      tonnage: 500000, 
      grade: 1.5,
      contained_metal: 750000
    }
  },
  drilling_data: {
    total_holes: 150,
    total_meters: 25000,
    average_depth: 166.67
  },
  sampling_data: {
    total_samples: 5000,
    sample_interval: 1.0,
    recovery_rate: 95.5
  }
};

export const mockNI43Data = {
  project_name: "Test Gold Project",
  location: { 
    latitude: -23.5505, 
    longitude: -46.6333,
    municipality: "Itabira",
    state: "MG",
    country: "Brazil"
  },
  commodity: "gold",
  mineral_resource: {
    measured: { 
      tonnes: 1000000, 
      grade_gpt: 2.5,
      contained_ounces: 80729
    },
    indicated: { 
      tonnes: 2000000, 
      grade_gpt: 2.0,
      contained_ounces: 128366
    },
    inferred: { 
      tonnes: 500000, 
      grade_gpt: 1.5,
      contained_ounces: 24137
    }
  },
  drilling_summary: {
    total_drillholes: 150,
    total_meters: 25000,
    average_depth_m: 166.67
  }
};

export const mockCBRRData = {
  nome_projeto: "Projeto Teste Ouro",
  localizacao: {
    latitude: -23.5505,
    longitude: -46.6333,
    municipio: "Itabira",
    estado: "MG",
    pais: "Brasil"
  },
  substancia: "ouro",
  recurso_mineral: {
    medida: {
      toneladas: 1000000,
      teor_gpt: 2.5,
      metal_contido_g: 2500000
    },
    indicada: {
      toneladas: 2000000,
      teor_gpt: 2.0,
      metal_contido_g: 4000000
    },
    inferida: {
      toneladas: 500000,
      teor_gpt: 1.5,
      metal_contido_g: 750000
    }
  }
};

export const mockPDFBuffer = Buffer.from("Mock PDF content for testing");
export const mockDOCXBuffer = Buffer.from("Mock DOCX content for testing");

export const mockCSVData = `Sample ID,Depth (m),Au (g/t),Cu (%)
S001,10.5,2.3,1.5
S002,15.2,3.1,2.0
S003,20.8,1.8,1.2
S004,25.5,2.9,1.8
S005,30.2,2.1,1.4`;

export const mockXLSXData = {
  sheets: [
    {
      name: "Drilling Data",
      rows: [
        ["Hole ID", "Depth (m)", "Azimuth", "Dip"],
        ["DH001", "150.5", "45", "-60"],
        ["DH002", "200.2", "90", "-65"],
        ["DH003", "175.8", "135", "-70"]
      ]
    },
    {
      name: "Assay Results",
      rows: [
        ["Sample ID", "Hole ID", "From (m)", "To (m)", "Au (g/t)"],
        ["S001", "DH001", "10.0", "11.0", "2.3"],
        ["S002", "DH001", "11.0", "12.0", "3.1"],
        ["S003", "DH002", "15.0", "16.0", "1.8"]
      ]
    }
  ]
};

export const mockJORCSections = [
  'sampling_techniques',
  'drilling_techniques',
  'sampling_data',
  'sample_analysis',
  'estimation_methodology',
  'cut_off_parameters',
  'mining_factors',
  'metallurgical_factors',
  'environmental_factors',
  'bulk_density',
  'classification',
  'audits_reviews',
  'discussion_relative_accuracy'
];

export const validCommodities = [
  'gold',
  'copper',
  'iron',
  'lithium',
  'nickel',
  'zinc',
  'silver',
  'platinum',
  'palladium',
  'cobalt'
];

export const mockMetadata = {
  title: "Technical Report - Test Project",
  author: "Qualified Person Name",
  subject: "Mineral Resource Estimate",
  keywords: ["JORC", "gold", "resource", "mining"],
  creationDate: new Date("2025-10-31"),
  standard: "JORC 2012",
  version: "1.0"
};

export const mockBranding = {
  logo: "/path/to/logo.png",
  primaryColor: "#2f2c79",
  secondaryColor: "#b96e48",
  companyName: "QIVO Mining",
  reportTitle: "Technical Report"
};

