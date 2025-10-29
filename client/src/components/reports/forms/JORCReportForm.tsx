import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Save, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { BasicInformation } from '../sections/shared/BasicInformation';
import { CompetentPerson } from '../sections/shared/CompetentPerson';
import { Section1Sampling } from '../sections/jorc/Section1Sampling';
import { Section3Resources } from '../sections/jorc/Section3Resources';

interface JORCReportData {
  // Basic Information
  reportTitle: string;
  projectName: string;
  location: string;
  effectiveDate: string;
  
  // Competent Person
  competentPerson: {
    name: string;
    affiliation: string;
    professionalRegistration: string;
    contactDetails: string;
  };
  
  // Section 1: Sampling Techniques and Data
  section1: {
    samplingTechniques: string;
    drillingTechniques: string;
    drillSampleRecovery: string;
    logging: string;
    subSamplingTechniques: string;
    qualityOfAssayData: string;
    verificationOfSampling: string;
    locationOfDataPoints: string;
    dataSpacingAndDistribution: string;
    orientationOfData: string;
    sampleSecurity: string;
    auditsOrReviews: string;
  };
  
  // Section 3: Mineral Resources
  section3: {
    databaseIntegrity: string;
    siteVisits: string;
    geologicalInterpretation: string;
    dimensions: string;
    estimationTechniques: string;
    moisture: string;
    cutOffParameters: string;
    miningFactors: string;
    metallurgicalFactors: string;
    environmentalFactors: string;
    bulkDensity: string;
    classification: string;
    tonnage: string;
    grade: string;
    audits: string;
    relativeAccuracy: string;
  };
}

const initialData: JORCReportData = {
  reportTitle: '',
  projectName: '',
  location: '',
  effectiveDate: new Date().toISOString().split('T')[0],
  competentPerson: {
    name: '',
    affiliation: '',
    professionalRegistration: '',
    contactDetails: ''
  },
  section1: {
    samplingTechniques: '',
    drillingTechniques: '',
    drillSampleRecovery: '',
    logging: '',
    subSamplingTechniques: '',
    qualityOfAssayData: '',
    verificationOfSampling: '',
    locationOfDataPoints: '',
    dataSpacingAndDistribution: '',
    orientationOfData: '',
    sampleSecurity: '',
    auditsOrReviews: ''
  },
  section3: {
    databaseIntegrity: '',
    siteVisits: '',
    geologicalInterpretation: '',
    dimensions: '',
    estimationTechniques: '',
    moisture: '',
    cutOffParameters: '',
    miningFactors: '',
    metallurgicalFactors: '',
    environmentalFactors: '',
    bulkDensity: '',
    classification: '',
    tonnage: '',
    grade: '',
    audits: '',
    relativeAccuracy: ''
  }
};

export const JORCReportForm: React.FC = () => {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<JORCReportData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'unsaved' | 'saving' | 'saved'>('unsaved');
  const [isSaving, setIsSaving] = useState(false);

  // Load draft from localStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem('jorc_report_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(parsed);
        // Show toast notification
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-[#2f2c79] text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
        toast.innerHTML = `
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Rascunho recuperado</span>
          </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      } catch (e) {
        console.error('Failed to parse saved draft:', e);
      }
    }
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (saveStatus === 'unsaved') {
        handleAutoSave();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [formData, saveStatus]);

  const handleAutoSave = () => {
    setSaveStatus('saving');
    localStorage.setItem('jorc_report_draft', JSON.stringify(formData));
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('unsaved'), 2000);
    }, 500);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      } else if (keys.length === 2) {
        return {
          ...prev,
          [keys[0]]: {
            ...(prev[keys[0] as keyof JORCReportData] as any),
            [keys[1]]: value
          }
        };
      }
      return prev;
    });
    setSaveStatus('unsaved');
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.reportTitle) newErrors.reportTitle = 'Campo obrigatório';
    if (!formData.projectName) newErrors.projectName = 'Campo obrigatório';
    if (!formData.location) newErrors.location = 'Campo obrigatório';
    if (!formData.effectiveDate) newErrors.effectiveDate = 'Campo obrigatório';

    // Competent Person validation
    if (!formData.competentPerson.name) newErrors['competentPerson.name'] = 'Campo obrigatório';
    if (!formData.competentPerson.affiliation) newErrors['competentPerson.affiliation'] = 'Campo obrigatório';
    if (!formData.competentPerson.professionalRegistration) newErrors['competentPerson.professionalRegistration'] = 'Campo obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      // Show error toast
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      toast.textContent = 'Por favor, preencha todos os campos obrigatórios';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
      return;
    }

    setIsSaving(true);
    try {
      // TODO: API call to save report
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear draft
      localStorage.removeItem('jorc_report_draft');
      
      // Show success toast
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      toast.textContent = 'Relatório salvo com sucesso!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
      
      // Navigate back
      setTimeout(() => setLocation('/reports'), 1500);
    } catch (error) {
      console.error('Failed to save report:', error);
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      toast.textContent = 'Erro ao salvar relatório';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'unsaved':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'saving':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'saved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'unsaved':
        return 'Não salvo';
      case 'saving':
        return 'Salvando...';
      case 'saved':
        return 'Salvo agora';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white/5 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setLocation('/reports/create')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {getSaveStatusIcon()}
                <span className="text-sm text-gray-400">{getSaveStatusText()}</span>
              </div>
              
              <button
                onClick={handleAutoSave}
                disabled={saveStatus === 'saving'}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Salvar Agora
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
              JORC
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Relatório Técnico JORC 2012
              </h1>
              <p className="text-sm text-gray-400">
                Australasian Code for Reporting of Exploration Results, Mineral Resources and Ore Reserves
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-400 mt-3">
            Preencha os campos conforme a Table 1 do JORC Code 2012. O formulário é salvo automaticamente a cada 30 segundos.
          </p>
        </div>

        {/* Form Sections */}
        <div className="space-y-6">
          {/* Section: Basic Information */}
          <div className="bg-white/5 rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                1
              </div>
              <h2 className="text-xl font-bold text-white">Informações Básicas</h2>
            </div>
            <BasicInformation
              data={{
                reportTitle: formData.reportTitle,
                projectName: formData.projectName,
                location: formData.location,
                effectiveDate: formData.effectiveDate
              }}
              onChange={handleChange}
              errors={errors}
            />
          </div>

          {/* Section: Competent Person */}
          <div className="bg-white/5 rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                2
              </div>
              <h2 className="text-xl font-bold text-white">Competent Person</h2>
            </div>
            <CompetentPerson
              data={formData.competentPerson}
              onChange={handleChange}
              errors={errors}
              registrationLabel="Professional Registration"
              registrationPlaceholder="Ex: FAusIMM (CP) #123456 or AIG RPGeo #12345"
              registrationHelpText="Fellow of AusIMM (FAusIMM), Registered Professional Geoscientist (RPGeo), etc"
            />
          </div>

          {/* Section 1: Sampling Techniques and Data */}
          <div className="bg-white/5 rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Section 1: Sampling Techniques and Data</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Criteria in this section apply to all succeeding sections
                </p>
              </div>
            </div>
            <Section1Sampling
              data={formData.section1}
              onChange={handleChange}
              errors={errors}
            />
          </div>

          {/* Section 3: Mineral Resources */}
          <div className="bg-white/5 rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Section 3: Estimation and Reporting of Mineral Resources</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Criteria listed in Section 1 also apply to this section
                </p>
              </div>
            </div>
            <Section3Resources
              data={formData.section3}
              onChange={handleChange}
              errors={errors}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white/5 rounded-xl shadow-lg p-6 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              {Object.keys(errors).length === 0 ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-700 font-medium">Formulário válido</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span className="text-amber-700 font-medium">
                    {Object.keys(errors).length} campo(s) com erro
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setLocation("/reports")}
                className="px-6 py-3 text-gray-300 hover:bg-[#171a4a] rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {isSaving ? 'Salvando...' : 'Salvar Relatório'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

