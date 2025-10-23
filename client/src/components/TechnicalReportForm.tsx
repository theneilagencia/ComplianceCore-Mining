import React, { useState, useEffect } from 'react';
import { FormField } from './FormField';
import { useFormValidation } from '../hooks/useFormValidation';
import { useAutoSave } from '../hooks/useAutoSave';
import { useApi } from '../hooks/useApi';
import { toast } from 'sonner';
import { Save, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface TechnicalReportFormProps {
  reportId?: string;
  initialData?: Partial<ReportData>;
  onSave?: (data: ReportData) => void;
}

export interface ReportData {
  // Informações Básicas
  standard: string;
  title: string;
  projectName: string;
  location: string;
  effectiveDate: string;
  
  // Pessoa Competente
  competentPerson: string;
  affiliation: string;
  professionalRegistration: string;
  
  // Executive Summary
  introduction: string;
  geology: string;
  mineralization: string;
  drilling: string;
  
  // Estimativa de Recursos
  resourceCategory: string;
  tonnage: string;
  grade: string;
  cutoffGrade: string;
  estimationMethod: string;
  
  // QA/QC
  standards: string;
  blanks: string;
  duplicates: string;
  crm: string;
}

const initialFormData: ReportData = {
  standard: 'JORC',
  title: '',
  projectName: '',
  location: '',
  effectiveDate: '',
  competentPerson: '',
  affiliation: '',
  professionalRegistration: '',
  introduction: '',
  geology: '',
  mineralization: '',
  drilling: '',
  resourceCategory: '',
  tonnage: '',
  grade: '',
  cutoffGrade: '',
  estimationMethod: '',
  standards: '',
  blanks: '',
  duplicates: '',
  crm: '',
};

export function TechnicalReportForm({
  reportId,
  initialData,
  onSave,
}: TechnicalReportFormProps) {
  const { apiFetch } = useApi();
  const [formData, setFormData] = useState<ReportData>({
    ...initialFormData,
    ...initialData,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Configuração de validação
  const validationConfig = {
    title: {
      required: true,
      minLength: 5,
      maxLength: 200,
      message: 'O título deve ter entre 5 e 200 caracteres',
    },
    projectName: {
      required: true,
      minLength: 3,
      message: 'O nome do projeto deve ter no mínimo 3 caracteres',
    },
    location: {
      required: true,
      minLength: 5,
      message: 'A localização deve ter no mínimo 5 caracteres',
    },
    effectiveDate: {
      required: true,
      pattern: /^\d{4}-\d{2}-\d{2}$/,
      message: 'Data inválida (formato: AAAA-MM-DD)',
    },
    competentPerson: {
      required: true,
      minLength: 3,
      message: 'Nome da pessoa competente é obrigatório',
    },
    affiliation: {
      required: true,
      message: 'Afiliação é obrigatória',
    },
    professionalRegistration: {
      required: true,
      message: 'Registro profissional é obrigatório',
    },
    introduction: {
      required: true,
      minLength: 50,
      message: 'A introdução deve ter no mínimo 50 caracteres',
    },
    tonnage: {
      pattern: /^\d+(\.\d+)?$/,
      message: 'Tonelagem deve ser um número válido',
    },
    grade: {
      pattern: /^\d+(\.\d+)?$/,
      message: 'Teor deve ser um número válido',
    },
  };

  const {
    errors,
    touched,
    hasErrors,
    validateAndSet,
    touchField,
    validateAll,
    getFieldError,
  } = useFormValidation(validationConfig);

  // Auto-save
  const { saveNow, loadFromLocalStorage, clearLocalStorage } = useAutoSave({
    key: reportId || 'new-report',
    data: formData,
    enabled: true,
    interval: 30000, // 30 segundos
    onSave: async (data) => {
      await saveToServer(data, true);
    },
  });

  // Carregar dados salvos do localStorage ao montar
  useEffect(() => {
    if (!initialData) {
      const saved = loadFromLocalStorage();
      if (saved) {
        setFormData(saved);
        toast.info('Rascunho recuperado', {
          description: 'Seus dados foram recuperados do último salvamento',
        });
      }
    }
  }, []);

  // Salvar no servidor
  const saveToServer = async (data: ReportData, isAutoSave = false) => {
    try {
      setIsSaving(true);

      const endpoint = reportId
        ? `/api/reports/${reportId}/save`
        : '/api/reports/save';

      const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar relatório');
      }

      const result = await response.json();
      setLastSaved(new Date());

      if (!isAutoSave) {
        toast.success('Relatório salvo com sucesso!', {
          description: `ID: ${result.reportId || reportId}`,
          duration: 3000,
        });
      }

      if (onSave) {
        onSave(data);
      }

      return result;
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      if (!isAutoSave) {
        toast.error('Erro ao salvar relatório', {
          description: error.message || 'Tente novamente',
        });
      }
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Atualizar campo
  const updateField = (field: keyof ReportData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    validateAndSet(field, value);
  };

  // Salvar manualmente
  const handleSave = async () => {
    // Marcar todos os campos como touched
    Object.keys(validationConfig).forEach((field) => touchField(field));

    // Validar todos os campos
    if (!validateAll(formData)) {
      toast.error('Formulário inválido', {
        description: 'Corrija os erros antes de salvar',
      });
      return;
    }

    await saveToServer(formData, false);
    clearLocalStorage();
  };

  // Formatar última data de salvamento
  const formatLastSaved = () => {
    if (!lastSaved) return null;
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);

    if (diff < 60) return 'Salvo agora';
    if (diff < 3600) return `Salvo há ${Math.floor(diff / 60)} minutos`;
    return `Salvo às ${lastSaved.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header com status de salvamento */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {reportId ? 'Editar Relatório' : 'Novo Relatório Técnico'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Preencha os campos abaixo. O formulário é salvo automaticamente a
              cada 30 segundos.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Status de auto-save */}
            <div className="flex items-center gap-2 text-sm">
              {isSaving ? (
                <>
                  <Clock className="h-4 w-4 text-blue-500 animate-spin" />
                  <span className="text-blue-600">Salvando...</span>
                </>
              ) : lastSaved ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">{formatLastSaved()}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-yellow-600">Não salvo</span>
                </>
              )}
            </div>

            {/* Botão salvar */}
            <button
              onClick={handleSave}
              disabled={isSaving || hasErrors}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              <Save className="h-4 w-4" />
              Salvar Agora
            </button>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <form className="space-y-8">
        {/* Seção 1: Informações Básicas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
              1
            </span>
            Informações Básicas
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <FormField
                label="Padrão Internacional"
                name="standard"
                value={formData.standard}
                onChange={(value) => updateField('standard', value)}
                onBlur={() => touchField('standard')}
                error={getFieldError('standard')}
                required
                type="text"
                placeholder="JORC, NI 43-101, PERC, SAMREC, etc."
                tooltip="Selecione o padrão internacional de relatório técnico"
                helpText="Exemplo: JORC 2012 para projetos na Austrália"
              />
            </div>

            <div className="md:col-span-2">
              <FormField
                label="Título do Relatório"
                name="title"
                value={formData.title}
                onChange={(value) => updateField('title', value)}
                onBlur={() => touchField('title')}
                error={getFieldError('title')}
                required
                type="text"
                placeholder="Ex: Mineral Resource Estimate for Gedabek Gold-Copper Project"
                tooltip="Título completo do relatório técnico"
                helpText="Use um título descritivo e profissional"
              />
            </div>

            <FormField
              label="Nome do Projeto"
              name="projectName"
              value={formData.projectName}
              onChange={(value) => updateField('projectName', value)}
              onBlur={() => touchField('projectName')}
              error={getFieldError('projectName')}
              required
              type="text"
              placeholder="Ex: Gedabek Gold-Copper Project"
              tooltip="Nome oficial do projeto minerário"
            />

            <FormField
              label="Localização"
              name="location"
              value={formData.location}
              onChange={(value) => updateField('location', value)}
              onBlur={() => touchField('location')}
              error={getFieldError('location')}
              required
              type="text"
              placeholder="Ex: Gadabay District, Azerbaijan"
              tooltip="Localização geográfica completa do projeto"
              helpText="Inclua distrito, estado/província e país"
            />

            <FormField
              label="Data Efetiva"
              name="effectiveDate"
              value={formData.effectiveDate}
              onChange={(value) => updateField('effectiveDate', value)}
              onBlur={() => touchField('effectiveDate')}
              error={getFieldError('effectiveDate')}
              required
              type="text"
              placeholder="2024-10-23"
              tooltip="Data de referência dos dados do relatório"
              helpText="Formato: AAAA-MM-DD"
            />
          </div>
        </div>

        {/* Seção 2: Pessoa Competente */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
              2
            </span>
            Pessoa Competente
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Nome Completo"
              name="competentPerson"
              value={formData.competentPerson}
              onChange={(value) => updateField('competentPerson', value)}
              onBlur={() => touchField('competentPerson')}
              error={getFieldError('competentPerson')}
              required
              type="text"
              placeholder="Ex: Dr. John Smith"
              tooltip="Nome da pessoa qualificada responsável pelo relatório"
            />

            <FormField
              label="Afiliação"
              name="affiliation"
              value={formData.affiliation}
              onChange={(value) => updateField('affiliation', value)}
              onBlur={() => touchField('affiliation')}
              error={getFieldError('affiliation')}
              required
              type="text"
              placeholder="Ex: SRK Consulting"
              tooltip="Empresa ou organização à qual a pessoa competente está afiliada"
            />

            <div className="md:col-span-2">
              <FormField
                label="Registro Profissional"
                name="professionalRegistration"
                value={formData.professionalRegistration}
                onChange={(value) =>
                  updateField('professionalRegistration', value)
                }
                onBlur={() => touchField('professionalRegistration')}
                error={getFieldError('professionalRegistration')}
                required
                type="text"
                placeholder="Ex: FAusIMM (CP) #123456"
                tooltip="Número de registro profissional e organização"
                helpText="Exemplo: FAusIMM, P.Geo, P.Eng, etc."
              />
            </div>
          </div>
        </div>

        {/* Seção 3: Executive Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
              3
            </span>
            Executive Summary
          </h3>

          <div className="space-y-6">
            <FormField
              label="Introdução"
              name="introduction"
              value={formData.introduction}
              onChange={(value) => updateField('introduction', value)}
              onBlur={() => touchField('introduction')}
              error={getFieldError('introduction')}
              required
              type="textarea"
              rows={6}
              placeholder="Descreva o contexto do projeto, objetivos do relatório e principais conclusões..."
              tooltip="Resumo executivo do relatório"
              helpText="Mínimo de 50 caracteres. Seja claro e objetivo."
            />

            <FormField
              label="Geologia"
              name="geology"
              value={formData.geology}
              onChange={(value) => updateField('geology', value)}
              onBlur={() => touchField('geology')}
              error={getFieldError('geology')}
              type="textarea"
              rows={6}
              placeholder="Descreva a geologia regional e local, litologia, estruturas..."
              tooltip="Descrição geológica do projeto"
            />

            <FormField
              label="Mineralização"
              name="mineralization"
              value={formData.mineralization}
              onChange={(value) => updateField('mineralization', value)}
              onBlur={() => touchField('mineralization')}
              error={getFieldError('mineralization')}
              type="textarea"
              rows={6}
              placeholder="Descreva os tipos de mineralização, alteração, controles estruturais..."
              tooltip="Características da mineralização"
            />

            <FormField
              label="Perfuração e Amostragem"
              name="drilling"
              value={formData.drilling}
              onChange={(value) => updateField('drilling', value)}
              onBlur={() => touchField('drilling')}
              error={getFieldError('drilling')}
              type="textarea"
              rows={6}
              placeholder="Descreva os métodos de perfuração, quantidade de furos, amostragem..."
              tooltip="Resumo das atividades de perfuração"
            />
          </div>
        </div>

        {/* Seção 4: Estimativa de Recursos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
              4
            </span>
            Estimativa de Recursos
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Categoria de Recurso"
              name="resourceCategory"
              value={formData.resourceCategory}
              onChange={(value) => updateField('resourceCategory', value)}
              onBlur={() => touchField('resourceCategory')}
              error={getFieldError('resourceCategory')}
              type="text"
              placeholder="Measured, Indicated, Inferred"
              tooltip="Classificação do recurso mineral"
              helpText="Conforme padrão JORC/NI 43-101"
            />

            <FormField
              label="Tonelagem (Mt)"
              name="tonnage"
              value={formData.tonnage}
              onChange={(value) => updateField('tonnage', value)}
              onBlur={() => touchField('tonnage')}
              error={getFieldError('tonnage')}
              type="number"
              placeholder="Ex: 25.5"
              tooltip="Tonelagem total em milhões de toneladas"
            />

            <FormField
              label="Teor Médio (%)"
              name="grade"
              value={formData.grade}
              onChange={(value) => updateField('grade', value)}
              onBlur={() => touchField('grade')}
              error={getFieldError('grade')}
              type="number"
              placeholder="Ex: 1.25"
              tooltip="Teor médio do minério principal"
            />

            <FormField
              label="Teor de Corte (%)"
              name="cutoffGrade"
              value={formData.cutoffGrade}
              onChange={(value) => updateField('cutoffGrade', value)}
              onBlur={() => touchField('cutoffGrade')}
              error={getFieldError('cutoffGrade')}
              type="number"
              placeholder="Ex: 0.5"
              tooltip="Teor mínimo considerado econômico"
            />

            <div className="md:col-span-2">
              <FormField
                label="Método de Estimativa"
                name="estimationMethod"
                value={formData.estimationMethod}
                onChange={(value) => updateField('estimationMethod', value)}
                onBlur={() => touchField('estimationMethod')}
                error={getFieldError('estimationMethod')}
                type="text"
                placeholder="Ex: Ordinary Kriging"
                tooltip="Metodologia utilizada para estimativa de recursos"
                helpText="Exemplo: Ordinary Kriging, Inverse Distance, Nearest Neighbor"
              />
            </div>
          </div>
        </div>

        {/* Seção 5: QA/QC */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
              5
            </span>
            Controle de Qualidade (QA/QC)
          </h3>

          <div className="space-y-6">
            <FormField
              label="Standards (Padrões Certificados)"
              name="standards"
              value={formData.standards}
              onChange={(value) => updateField('standards', value)}
              onBlur={() => touchField('standards')}
              error={getFieldError('standards')}
              type="textarea"
              rows={4}
              placeholder="Descreva os padrões certificados utilizados, frequência de inserção..."
              tooltip="Informações sobre padrões de referência certificados"
            />

            <FormField
              label="Blanks (Amostras em Branco)"
              name="blanks"
              value={formData.blanks}
              onChange={(value) => updateField('blanks', value)}
              onBlur={() => touchField('blanks')}
              error={getFieldError('blanks')}
              type="textarea"
              rows={4}
              placeholder="Descreva o uso de amostras em branco para detectar contaminação..."
              tooltip="Controle de contaminação usando blanks"
            />

            <FormField
              label="Duplicates (Duplicatas)"
              name="duplicates"
              value={formData.duplicates}
              onChange={(value) => updateField('duplicates', value)}
              onBlur={() => touchField('duplicates')}
              error={getFieldError('duplicates')}
              type="textarea"
              rows={4}
              placeholder="Descreva o programa de duplicatas (campo e laboratório)..."
              tooltip="Verificação de precisão analítica"
            />

            <FormField
              label="CRM (Certified Reference Materials)"
              name="crm"
              value={formData.crm}
              onChange={(value) => updateField('crm', value)}
              onBlur={() => touchField('crm')}
              error={getFieldError('crm')}
              type="textarea"
              rows={4}
              placeholder="Descreva os materiais de referência certificados utilizados..."
              tooltip="Materiais de referência para validação analítica"
            />
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600">
            {hasErrors ? (
              <span className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Corrija os erros antes de salvar
              </span>
            ) : (
              <span className="text-green-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Formulário válido
              </span>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || hasErrors}
              className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
            >
              <Save className="h-5 w-5" />
              {isSaving ? 'Salvando...' : 'Salvar Relatório'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

