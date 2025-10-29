import { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, AlertCircle, Info, Save } from 'lucide-react';
import { toast } from 'sonner';

interface WizardStep {
  id: number;
  title: string;
  description: string;
  fields: WizardField[];
}

interface WizardField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox';
  required: boolean;
  tooltip: string;
  options?: { value: string; label: string }[];
  validation?: (value: any) => string | null;
}

const GOVERNANCE_STEPS: WizardStep[] = [
  {
    id: 1,
    title: 'Informações da Empresa',
    description: 'Dados básicos da organização para avaliação de governança',
    fields: [
      {
        name: 'companyName',
        label: 'Nome da Empresa',
        type: 'text',
        required: true,
        tooltip: 'Razão social completa da empresa mineradora',
      },
      {
        name: 'country',
        label: 'País de Operação',
        type: 'select',
        required: true,
        tooltip: 'País principal onde a empresa opera',
        options: [
          { value: 'BR', label: 'Brasil' },
          { value: 'CL', label: 'Chile' },
          { value: 'PE', label: 'Peru' },
          { value: 'AU', label: 'Austrália' },
          { value: 'CA', label: 'Canadá' },
          { value: 'ZA', label: 'África do Sul' },
        ],
      },
      {
        name: 'employees',
        label: 'Número de Funcionários',
        type: 'number',
        required: true,
        tooltip: 'Total de funcionários diretos da empresa',
        validation: (value) => value < 1 ? 'Deve ser maior que 0' : null,
      },
      {
        name: 'revenue',
        label: 'Receita Anual (USD)',
        type: 'number',
        required: true,
        tooltip: 'Receita anual em dólares americanos',
        validation: (value) => value < 0 ? 'Deve ser um valor positivo' : null,
      },
    ],
  },
  {
    id: 2,
    title: 'Estrutura de Governança',
    description: 'Composição e práticas do conselho de administração',
    fields: [
      {
        name: 'boardSize',
        label: 'Tamanho do Conselho',
        type: 'number',
        required: true,
        tooltip: 'Número total de membros do conselho de administração',
        validation: (value) => value < 3 ? 'Recomenda-se no mínimo 3 membros' : null,
      },
      {
        name: 'independentDirectors',
        label: 'Conselheiros Independentes',
        type: 'number',
        required: true,
        tooltip: 'Número de conselheiros sem vínculos com a gestão',
        validation: (value) => value < 1 ? 'Recomenda-se pelo menos 1 conselheiro independente' : null,
      },
      {
        name: 'womenOnBoard',
        label: 'Mulheres no Conselho',
        type: 'number',
        required: true,
        tooltip: 'Número de mulheres no conselho de administração',
      },
      {
        name: 'auditCommittee',
        label: 'Possui Comitê de Auditoria?',
        type: 'checkbox',
        required: false,
        tooltip: 'Comitê dedicado à supervisão de relatórios financeiros e controles internos',
      },
      {
        name: 'meetingFrequency',
        label: 'Frequência de Reuniões do Conselho',
        type: 'select',
        required: true,
        tooltip: 'Quantas vezes o conselho se reúne por ano',
        options: [
          { value: 'monthly', label: 'Mensal (12+ vezes/ano)' },
          { value: 'quarterly', label: 'Trimestral (4 vezes/ano)' },
          { value: 'biannual', label: 'Semestral (2 vezes/ano)' },
          { value: 'annual', label: 'Anual (1 vez/ano)' },
        ],
      },
    ],
  },
  {
    id: 3,
    title: 'Transparência e Divulgação',
    description: 'Práticas de comunicação e relatórios',
    fields: [
      {
        name: 'annualReport',
        label: 'Publica Relatório Anual?',
        type: 'checkbox',
        required: false,
        tooltip: 'Relatório anual com demonstrações financeiras auditadas',
      },
      {
        name: 'sustainabilityReport',
        label: 'Publica Relatório de Sustentabilidade?',
        type: 'checkbox',
        required: false,
        tooltip: 'Relatório ESG seguindo padrões como GRI ou SASB',
      },
      {
        name: 'website',
        label: 'Website Corporativo',
        type: 'text',
        required: false,
        tooltip: 'URL do website oficial da empresa',
      },
      {
        name: 'disclosureStandard',
        label: 'Padrão de Divulgação',
        type: 'select',
        required: true,
        tooltip: 'Padrão contábil utilizado nos relatórios financeiros',
        options: [
          { value: 'IFRS', label: 'IFRS (International Financial Reporting Standards)' },
          { value: 'GAAP', label: 'US GAAP' },
          { value: 'local', label: 'Padrão Local' },
          { value: 'none', label: 'Nenhum padrão formal' },
        ],
      },
    ],
  },
  {
    id: 4,
    title: 'Segurança e Compliance',
    description: 'Políticas de segurança e conformidade regulatória',
    fields: [
      {
        name: 'safetyPolicy',
        label: 'Possui Política de Segurança Formal?',
        type: 'checkbox',
        required: false,
        tooltip: 'Política documentada de saúde e segurança ocupacional',
      },
      {
        name: 'ltifr',
        label: 'LTIFR (Lost Time Injury Frequency Rate)',
        type: 'number',
        required: false,
        tooltip: 'Taxa de frequência de lesões com afastamento por milhão de horas trabalhadas',
      },
      {
        name: 'certifications',
        label: 'Certificações',
        type: 'textarea',
        required: false,
        tooltip: 'Liste certificações relevantes (ISO 45001, ISO 14001, etc.)',
      },
      {
        name: 'complianceOfficer',
        label: 'Possui Oficial de Compliance?',
        type: 'checkbox',
        required: false,
        tooltip: 'Profissional dedicado à conformidade regulatória',
      },
      {
        name: 'whistleblowerPolicy',
        label: 'Canal de Denúncias (Whistleblower)?',
        type: 'checkbox',
        required: false,
        tooltip: 'Canal confidencial para relatar irregularidades',
      },
    ],
  },
  {
    id: 5,
    title: 'Revisão e Confirmação',
    description: 'Revise todas as informações antes de gerar o relatório',
    fields: [],
  },
];

export default function GovernanceWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const currentStepData = GOVERNANCE_STEPS.find(s => s.id === currentStep)!;
  const progress = (currentStep / GOVERNANCE_STEPS.length) * 100;

  const validateField = (field: WizardField, value: any): string | null => {
    if (field.required && !value) {
      return `${field.label} é obrigatório`;
    }
    if (field.validation) {
      return field.validation(value);
    }
    return null;
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    currentStepData.fields.forEach(field => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const calculateScore = (): number => {
    let totalScore = 0;
    let maxScore = 100;

    // Board composition (25 points)
    const boardSize = formData.boardSize || 0;
    const independentDirectors = formData.independentDirectors || 0;
    const womenOnBoard = formData.womenOnBoard || 0;
    
    if (boardSize >= 5) totalScore += 8;
    if (independentDirectors / boardSize >= 0.3) totalScore += 10;
    if (womenOnBoard / boardSize >= 0.3) totalScore += 7;

    // Transparency (25 points)
    if (formData.annualReport) totalScore += 10;
    if (formData.sustainabilityReport) totalScore += 10;
    if (formData.disclosureStandard === 'IFRS') totalScore += 5;

    // Safety & Compliance (25 points)
    if (formData.safetyPolicy) totalScore += 8;
    if (formData.complianceOfficer) totalScore += 8;
    if (formData.whistleblowerPolicy) totalScore += 9;

    // Governance structure (25 points)
    if (formData.auditCommittee) totalScore += 10;
    if (formData.meetingFrequency === 'monthly' || formData.meetingFrequency === 'quarterly') totalScore += 10;
    if (formData.ltifr && formData.ltifr < 1.0) totalScore += 5;

    return Math.round((totalScore / maxScore) * 100);
  };

  const handleNext = async () => {
    if (currentStep < GOVERNANCE_STEPS.length) {
      if (!validateCurrentStep()) {
        toast.error('Por favor, corrija os erros antes de continuar');
        return;
      }

      if (currentStep === GOVERNANCE_STEPS.length - 1) {
        // Last step - calculate score
        setIsCalculating(true);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
        const calculatedScore = calculateScore();
        setScore(calculatedScore);
        setIsCalculating(false);
      }

      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/governance/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, score }),
      });

      if (response.ok) {
        toast.success('Avaliação de governança salva com sucesso!');
      } else {
        toast.error('Erro ao salvar avaliação');
      }
    } catch (error) {
      toast.error('Erro ao salvar avaliação');
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Regular';
    return 'Necessita Melhorias';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-300">
            Passo {currentStep} de {GOVERNANCE_STEPS.length}
          </span>
          <span className="text-sm text-gray-400">{Math.round(progress)}% completo</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-[#2f2c79] h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white/5 rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {currentStepData.title}
          </h2>
          <p className="text-gray-400">{currentStepData.description}</p>
        </div>

        {currentStep < GOVERNANCE_STEPS.length ? (
          <div className="space-y-6">
            {currentStepData.fields.map(field => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                  <button
                    type="button"
                    className="ml-2 text-blue-500 hover:text-blue-700"
                    title={field.tooltip}
                  >
                    <Info className="w-4 h-4 inline" />
                  </button>
                </label>

                {field.type === 'text' && (
                  <input
                    type="text"
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors[field.name] ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder={field.tooltip}
                  />
                )}

                {field.type === 'number' && (
                  <input
                    type="number"
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors[field.name] ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder={field.tooltip}
                  />
                )}

                {field.type === 'select' && (
                  <select
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors[field.name] ? 'border-red-500' : 'border-white/20'
                    }`}
                  >
                    <option value="">Selecione...</option>
                    {field.options?.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {field.type === 'textarea' && (
                  <textarea
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    rows={3}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors[field.name] ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder={field.tooltip}
                  />
                )}

                {field.type === 'checkbox' && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData[field.name] || false}
                      onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-white/20 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-400">{field.tooltip}</span>
                  </div>
                )}

                {errors[field.name] && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors[field.name]}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Review Step
          <div>
            {isCalculating ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-400">Calculando score de governança...</p>
              </div>
            ) : score !== null ? (
              <div>
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-8 text-center text-white mb-6">
                  <div className={`text-6xl font-bold mb-2`}>
                    {score}%
                  </div>
                  <p className="text-xl">{getScoreLabel(score)}</p>
                </div>

                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-semibold">Resumo da Avaliação</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#000020] p-4 rounded-lg">
                      <p className="text-sm text-gray-400">Empresa</p>
                      <p className="font-semibold">{formData.companyName}</p>
                    </div>
                    <div className="bg-[#000020] p-4 rounded-lg">
                      <p className="text-sm text-gray-400">País</p>
                      <p className="font-semibold">{formData.country}</p>
                    </div>
                    <div className="bg-[#000020] p-4 rounded-lg">
                      <p className="text-sm text-gray-400">Tamanho do Conselho</p>
                      <p className="font-semibold">{formData.boardSize} membros</p>
                    </div>
                    <div className="bg-[#000020] p-4 rounded-lg">
                      <p className="text-sm text-gray-400">Conselheiros Independentes</p>
                      <p className="font-semibold">
                        {formData.independentDirectors} ({Math.round((formData.independentDirectors / formData.boardSize) * 100)}%)
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Entenda este cálculo</h4>
                    <p className="text-sm text-blue-800">
                      O score de governança é calculado com base em 4 pilares principais:
                    </p>
                    <ul className="list-disc list-inside text-sm text-blue-800 mt-2 space-y-1">
                      <li>Composição do Conselho (25%): diversidade, independência e tamanho</li>
                      <li>Transparência (25%): relatórios anuais, ESG e padrões contábeis</li>
                      <li>Segurança & Compliance (25%): políticas, certificações e canais de denúncia</li>
                      <li>Estrutura de Governança (25%): comitês, frequência de reuniões e indicadores</li>
                    </ul>
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Salvar Avaliação
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      {currentStep < GOVERNANCE_STEPS.length && (
        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-white/20 rounded-lg font-medium text-gray-300 hover:bg-[#000020] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Anterior
          </button>

          <button
            onClick={handleNext}
            className="px-6 py-3 bg-[#2f2c79] text-white rounded-lg font-medium hover:bg-[#b96e48] flex items-center gap-2"
          >
            {currentStep === GOVERNANCE_STEPS.length - 1 ? 'Calcular Score' : 'Salvar e Continuar'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

