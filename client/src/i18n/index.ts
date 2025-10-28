/**
 * i18n System - QIVO Mining
 * 
 * Supported languages: PT (Portuguese), EN (English), ES (Spanish), FR (French)
 * Features:
 * - Auto-detection from browser
 * - Manual language switching
 * - Persistent storage in localStorage
 */

export type Locale = 'pt' | 'en' | 'es' | 'fr';

export const SUPPORTED_LOCALES: Locale[] = ['pt', 'en', 'es', 'fr'];

export const LOCALE_NAMES: Record<Locale, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
  fr: 'Français',
};

/**
 * Detect browser language
 */
export function detectBrowserLocale(): Locale {
  const browserLang = navigator.language.toLowerCase();
  
  // Exact match
  if (SUPPORTED_LOCALES.includes(browserLang as Locale)) {
    return browserLang as Locale;
  }
  
  // Prefix match (e.g., 'pt-BR' → 'pt')
  const prefix = browserLang.split('-')[0] as Locale;
  if (SUPPORTED_LOCALES.includes(prefix)) {
    return prefix;
  }
  
  // Default to Portuguese
  return 'pt';
}

/**
 * Get stored locale or auto-detect
 */
export function getInitialLocale(): Locale {
  const stored = localStorage.getItem('locale');
  if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
    return stored as Locale;
  }
  return detectBrowserLocale();
}

/**
 * Save locale to localStorage
 */
export function saveLocale(locale: Locale): void {
  localStorage.setItem('locale', locale);
}

/**
 * Translation function
 */
export function t(key: string, locale: Locale, params?: Record<string, string | number>): string {
  const translation = translations[locale]?.[key] || translations['pt'][key] || key;
  
  if (!params) {
    return translation;
  }
  
  // Replace {{param}} with values
  return translation.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
    return String(params[paramKey] ?? `{{${paramKey}}}`);
  });
}

/**
 * Translations
 */
const translations: Record<Locale, Record<string, string>> = {
  pt: {
    // Common
    'common.loading': 'Carregando...',
    'common.error': 'Erro',
    'common.success': 'Sucesso',
    'common.cancel': 'Cancelar',
    'common.save': 'Salvar',
    'common.delete': 'Excluir',
    'common.edit': 'Editar',
    'common.view': 'Visualizar',
    'common.download': 'Baixar',
    'common.upload': 'Enviar',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.export': 'Exportar',
    'common.import': 'Importar',
    'common.back': 'Voltar',
    'common.next': 'Próximo',
    'common.previous': 'Anterior',
    'common.finish': 'Concluir',
    'common.close': 'Fechar',
    'common.confirm': 'Confirmar',
    'common.yes': 'Sim',
    'common.no': 'Não',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.reports': 'Relatórios',
    'nav.generate': 'Gerar Relatório',
    'nav.audit': 'Auditoria & KRCI',
    'nav.precert': 'Pré-Certificação',
    'nav.export': 'Exportar Padrões',
    'nav.esg': 'ESG Reporting',
    'nav.valuation': 'Valuation Automático',
    'nav.radar': 'Radar Regulatório',
    'nav.governance': 'Governança & Segurança',
    'nav.help': 'Ajuda & Suporte',
    'nav.support': 'Central de Suporte',
    'nav.account': 'Conta',
    'nav.subscription': 'Assinatura',
    'nav.settings': 'Configurações',
    'nav.admin': 'Administração',
    'nav.logout': 'Sair',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Bem-vindo, {{name}}',
    'dashboard.stats.reports': 'Relatórios',
    'dashboard.stats.audits': 'Auditorias',
    'dashboard.stats.projects': 'Projetos',
    'dashboard.stats.compliance': 'Conformidade',
    
    // Reports
    'reports.title': 'Relatórios Técnicos',
    'reports.generate': 'Gerar Novo Relatório',
    'reports.list': 'Lista de Relatórios',
    'reports.status.draft': 'Rascunho',
    'reports.status.processing': 'Processando',
    'reports.status.ready': 'Pronto',
    'reports.status.audited': 'Auditado',
    'reports.standard': 'Padrão',
    'reports.standard.jorc': 'JORC 2012',
    'reports.standard.ni43101': 'NI 43-101',
    'reports.standard.perc': 'PERC',
    'reports.standard.samrec': 'SAMREC',
    
    // KRCI
    'krci.title': 'Auditoria KRCI',
    'krci.scan': 'Executar Scan',
    'krci.mode.light': 'Light (30 regras críticas)',
    'krci.mode.full': 'Full (70 regras)',
    'krci.mode.deep': 'Deep (100+ regras)',
    'krci.score': 'Score de Conformidade',
    'krci.passed': 'Aprovadas',
    'krci.failed': 'Reprovadas',
    'krci.category.tenure': 'Tenure',
    'krci.category.geo': 'Geologia',
    'krci.category.esg': 'ESG',
    'krci.category.norma': 'Normas',
    'krci.category.satelite': 'Satélite',
    'krci.category.benchmark': 'Benchmark',
    
    // ESG
    'esg.title': 'ESG Reporting',
    'esg.environmental': 'Ambiental',
    'esg.social': 'Social',
    'esg.governance': 'Governança',
    'esg.score': 'Score ESG',
    'esg.rating': 'Rating',
    'esg.framework': 'Framework',
    'esg.framework.gri': 'GRI',
    'esg.framework.sasb': 'SASB',
    'esg.framework.tcfd': 'TCFD',
    'esg.framework.cdp': 'CDP',
    
    // Valuation
    'valuation.title': 'Valuation Automático',
    'valuation.npv': 'VPL (Valor Presente Líquido)',
    'valuation.irr': 'TIR (Taxa Interna de Retorno)',
    'valuation.payback': 'Payback',
    'valuation.sensitivity': 'Análise de Sensibilidade',
    'valuation.commodity': 'Commodity',
    'valuation.price': 'Preço',
    'valuation.opex': 'OPEX',
    'valuation.capex': 'CAPEX',
    'valuation.grade': 'Teor',
    
    // Subscription
    'subscription.title': 'Assinatura',
    'subscription.plan': 'Plano',
    'subscription.status': 'Status',
    'subscription.status.active': 'Ativo',
    'subscription.status.canceled': 'Cancelado',
    'subscription.status.past_due': 'Vencido',
    'subscription.billing': 'Faturamento',
    'subscription.invoices': 'Faturas',
    'subscription.portal': 'Portal do Cliente',
    'subscription.change_plan': 'Mudar Plano',
    'subscription.cancel': 'Cancelar Assinatura',
  },
  
  en: {
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.download': 'Download',
    'common.upload': 'Upload',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.finish': 'Finish',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.reports': 'Reports',
    'nav.generate': 'Generate Report',
    'nav.audit': 'Audit & KRCI',
    'nav.precert': 'Pre-Certification',
    'nav.export': 'Export Standards',
    'nav.esg': 'ESG Reporting',
    'nav.valuation': 'Automatic Valuation',
    'nav.radar': 'Regulatory Radar',
    'nav.governance': 'Governance & Security',
    'nav.help': 'Help & Support',
    'nav.support': 'Support Center',
    'nav.account': 'Account',
    'nav.subscription': 'Subscription',
    'nav.settings': 'Settings',
    'nav.admin': 'Administration',
    'nav.logout': 'Logout',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.welcome': 'Welcome, {{name}}',
    'dashboard.stats.reports': 'Reports',
    'dashboard.stats.audits': 'Audits',
    'dashboard.stats.projects': 'Projects',
    'dashboard.stats.compliance': 'Compliance',
    
    // Reports
    'reports.title': 'Technical Reports',
    'reports.generate': 'Generate New Report',
    'reports.list': 'Reports List',
    'reports.status.draft': 'Draft',
    'reports.status.processing': 'Processing',
    'reports.status.ready': 'Ready',
    'reports.status.audited': 'Audited',
    'reports.standard': 'Standard',
    'reports.standard.jorc': 'JORC 2012',
    'reports.standard.ni43101': 'NI 43-101',
    'reports.standard.perc': 'PERC',
    'reports.standard.samrec': 'SAMREC',
    
    // KRCI
    'krci.title': 'KRCI Audit',
    'krci.scan': 'Run Scan',
    'krci.mode.light': 'Light (30 critical rules)',
    'krci.mode.full': 'Full (70 rules)',
    'krci.mode.deep': 'Deep (100+ rules)',
    'krci.score': 'Compliance Score',
    'krci.passed': 'Passed',
    'krci.failed': 'Failed',
    'krci.category.tenure': 'Tenure',
    'krci.category.geo': 'Geology',
    'krci.category.esg': 'ESG',
    'krci.category.norma': 'Standards',
    'krci.category.satelite': 'Satellite',
    'krci.category.benchmark': 'Benchmark',
    
    // ESG
    'esg.title': 'ESG Reporting',
    'esg.environmental': 'Environmental',
    'esg.social': 'Social',
    'esg.governance': 'Governance',
    'esg.score': 'ESG Score',
    'esg.rating': 'Rating',
    'esg.framework': 'Framework',
    'esg.framework.gri': 'GRI',
    'esg.framework.sasb': 'SASB',
    'esg.framework.tcfd': 'TCFD',
    'esg.framework.cdp': 'CDP',
    
    // Valuation
    'valuation.title': 'Automatic Valuation',
    'valuation.npv': 'NPV (Net Present Value)',
    'valuation.irr': 'IRR (Internal Rate of Return)',
    'valuation.payback': 'Payback',
    'valuation.sensitivity': 'Sensitivity Analysis',
    'valuation.commodity': 'Commodity',
    'valuation.price': 'Price',
    'valuation.opex': 'OPEX',
    'valuation.capex': 'CAPEX',
    'valuation.grade': 'Grade',
    
    // Subscription
    'subscription.title': 'Subscription',
    'subscription.plan': 'Plan',
    'subscription.status': 'Status',
    'subscription.status.active': 'Active',
    'subscription.status.canceled': 'Canceled',
    'subscription.status.past_due': 'Past Due',
    'subscription.billing': 'Billing',
    'subscription.invoices': 'Invoices',
    'subscription.portal': 'Customer Portal',
    'subscription.change_plan': 'Change Plan',
    'subscription.cancel': 'Cancel Subscription',
  },
  
  es: {
    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.view': 'Ver',
    'common.download': 'Descargar',
    'common.upload': 'Subir',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.export': 'Exportar',
    'common.import': 'Importar',
    'common.back': 'Volver',
    'common.next': 'Siguiente',
    'common.previous': 'Anterior',
    'common.finish': 'Finalizar',
    'common.close': 'Cerrar',
    'common.confirm': 'Confirmar',
    'common.yes': 'Sí',
    'common.no': 'No',
    
    // Navigation
    'nav.dashboard': 'Panel',
    'nav.reports': 'Informes',
    'nav.generate': 'Generar Informe',
    'nav.audit': 'Auditoría & KRCI',
    'nav.precert': 'Pre-Certificación',
    'nav.export': 'Exportar Estándares',
    'nav.esg': 'Informes ESG',
    'nav.valuation': 'Valoración Automática',
    'nav.radar': 'Radar Regulatorio',
    'nav.governance': 'Gobernanza & Seguridad',
    'nav.help': 'Ayuda & Soporte',
    'nav.support': 'Centro de Soporte',
    'nav.account': 'Cuenta',
    'nav.subscription': 'Suscripción',
    'nav.settings': 'Configuración',
    'nav.admin': 'Administración',
    'nav.logout': 'Salir',
    
    // Dashboard
    'dashboard.title': 'Panel',
    'dashboard.welcome': 'Bienvenido, {{name}}',
    'dashboard.stats.reports': 'Informes',
    'dashboard.stats.audits': 'Auditorías',
    'dashboard.stats.projects': 'Proyectos',
    'dashboard.stats.compliance': 'Cumplimiento',
    
    // Reports
    'reports.title': 'Informes Técnicos',
    'reports.generate': 'Generar Nuevo Informe',
    'reports.list': 'Lista de Informes',
    'reports.status.draft': 'Borrador',
    'reports.status.processing': 'Procesando',
    'reports.status.ready': 'Listo',
    'reports.status.audited': 'Auditado',
    'reports.standard': 'Estándar',
    'reports.standard.jorc': 'JORC 2012',
    'reports.standard.ni43101': 'NI 43-101',
    'reports.standard.perc': 'PERC',
    'reports.standard.samrec': 'SAMREC',
    
    // KRCI
    'krci.title': 'Auditoría KRCI',
    'krci.scan': 'Ejecutar Escaneo',
    'krci.mode.light': 'Light (30 reglas críticas)',
    'krci.mode.full': 'Full (70 reglas)',
    'krci.mode.deep': 'Deep (100+ reglas)',
    'krci.score': 'Puntuación de Cumplimiento',
    'krci.passed': 'Aprobadas',
    'krci.failed': 'Reprobadas',
    'krci.category.tenure': 'Tenencia',
    'krci.category.geo': 'Geología',
    'krci.category.esg': 'ESG',
    'krci.category.norma': 'Normas',
    'krci.category.satelite': 'Satélite',
    'krci.category.benchmark': 'Benchmark',
    
    // ESG
    'esg.title': 'Informes ESG',
    'esg.environmental': 'Ambiental',
    'esg.social': 'Social',
    'esg.governance': 'Gobernanza',
    'esg.score': 'Puntuación ESG',
    'esg.rating': 'Calificación',
    'esg.framework': 'Marco',
    'esg.framework.gri': 'GRI',
    'esg.framework.sasb': 'SASB',
    'esg.framework.tcfd': 'TCFD',
    'esg.framework.cdp': 'CDP',
    
    // Valuation
    'valuation.title': 'Valoración Automática',
    'valuation.npv': 'VPN (Valor Presente Neto)',
    'valuation.irr': 'TIR (Tasa Interna de Retorno)',
    'valuation.payback': 'Payback',
    'valuation.sensitivity': 'Análisis de Sensibilidad',
    'valuation.commodity': 'Commodity',
    'valuation.price': 'Precio',
    'valuation.opex': 'OPEX',
    'valuation.capex': 'CAPEX',
    'valuation.grade': 'Ley',
    
    // Subscription
    'subscription.title': 'Suscripción',
    'subscription.plan': 'Plan',
    'subscription.status': 'Estado',
    'subscription.status.active': 'Activo',
    'subscription.status.canceled': 'Cancelado',
    'subscription.status.past_due': 'Vencido',
    'subscription.billing': 'Facturación',
    'subscription.invoices': 'Facturas',
    'subscription.portal': 'Portal del Cliente',
    'subscription.change_plan': 'Cambiar Plan',
    'subscription.cancel': 'Cancelar Suscripción',
  },
  
  fr: {
    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.view': 'Voir',
    'common.download': 'Télécharger',
    'common.upload': 'Téléverser',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.export': 'Exporter',
    'common.import': 'Importer',
    'common.back': 'Retour',
    'common.next': 'Suivant',
    'common.previous': 'Précédent',
    'common.finish': 'Terminer',
    'common.close': 'Fermer',
    'common.confirm': 'Confirmer',
    'common.yes': 'Oui',
    'common.no': 'Non',
    
    // Navigation
    'nav.dashboard': 'Tableau de bord',
    'nav.reports': 'Rapports',
    'nav.generate': 'Générer un rapport',
    'nav.audit': 'Audit & KRCI',
    'nav.precert': 'Pré-Certification',
    'nav.export': 'Exporter les normes',
    'nav.esg': 'Rapports ESG',
    'nav.valuation': 'Évaluation automatique',
    'nav.radar': 'Radar réglementaire',
    'nav.governance': 'Gouvernance & Sécurité',
    'nav.help': 'Aide & Support',
    'nav.support': 'Centre de support',
    'nav.account': 'Compte',
    'nav.subscription': 'Abonnement',
    'nav.settings': 'Paramètres',
    'nav.admin': 'Administration',
    'nav.logout': 'Déconnexion',
    
    // Dashboard
    'dashboard.title': 'Tableau de bord',
    'dashboard.welcome': 'Bienvenue, {{name}}',
    'dashboard.stats.reports': 'Rapports',
    'dashboard.stats.audits': 'Audits',
    'dashboard.stats.projects': 'Projets',
    'dashboard.stats.compliance': 'Conformité',
    
    // Reports
    'reports.title': 'Rapports techniques',
    'reports.generate': 'Générer un nouveau rapport',
    'reports.list': 'Liste des rapports',
    'reports.status.draft': 'Brouillon',
    'reports.status.processing': 'En cours',
    'reports.status.ready': 'Prêt',
    'reports.status.audited': 'Audité',
    'reports.standard': 'Norme',
    'reports.standard.jorc': 'JORC 2012',
    'reports.standard.ni43101': 'NI 43-101',
    'reports.standard.perc': 'PERC',
    'reports.standard.samrec': 'SAMREC',
    
    // KRCI
    'krci.title': 'Audit KRCI',
    'krci.scan': 'Lancer le scan',
    'krci.mode.light': 'Light (30 règles critiques)',
    'krci.mode.full': 'Full (70 règles)',
    'krci.mode.deep': 'Deep (100+ règles)',
    'krci.score': 'Score de conformité',
    'krci.passed': 'Réussies',
    'krci.failed': 'Échouées',
    'krci.category.tenure': 'Tenure',
    'krci.category.geo': 'Géologie',
    'krci.category.esg': 'ESG',
    'krci.category.norma': 'Normes',
    'krci.category.satelite': 'Satellite',
    'krci.category.benchmark': 'Benchmark',
    
    // ESG
    'esg.title': 'Rapports ESG',
    'esg.environmental': 'Environnemental',
    'esg.social': 'Social',
    'esg.governance': 'Gouvernance',
    'esg.score': 'Score ESG',
    'esg.rating': 'Note',
    'esg.framework': 'Cadre',
    'esg.framework.gri': 'GRI',
    'esg.framework.sasb': 'SASB',
    'esg.framework.tcfd': 'TCFD',
    'esg.framework.cdp': 'CDP',
    
    // Valuation
    'valuation.title': 'Évaluation automatique',
    'valuation.npv': 'VAN (Valeur actuelle nette)',
    'valuation.irr': 'TRI (Taux de rendement interne)',
    'valuation.payback': 'Payback',
    'valuation.sensitivity': 'Analyse de sensibilité',
    'valuation.commodity': 'Commodity',
    'valuation.price': 'Prix',
    'valuation.opex': 'OPEX',
    'valuation.capex': 'CAPEX',
    'valuation.grade': 'Teneur',
    
    // Subscription
    'subscription.title': 'Abonnement',
    'subscription.plan': 'Plan',
    'subscription.status': 'Statut',
    'subscription.status.active': 'Actif',
    'subscription.status.canceled': 'Annulé',
    'subscription.status.past_due': 'Échu',
    'subscription.billing': 'Facturation',
    'subscription.invoices': 'Factures',
    'subscription.portal': 'Portail client',
    'subscription.change_plan': 'Changer de plan',
    'subscription.cancel': 'Annuler l\'abonnement',
  },
};

