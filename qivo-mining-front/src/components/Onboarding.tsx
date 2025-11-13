import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Check, ArrowRight } from 'lucide-react';

interface OnboardingStep {
 id: string;
 title: string;
 description: string;
 target?: string;
}

const steps: OnboardingStep[] = [
 {
 id: 'welcome',
 title: 'Bem-vindo ao QIVO Mining! ',
 description: 'Vamos fazer um tour rápido de 2 minutos para você conhecer a plataforma e gerar seu primeiro relatório técnico.',
 },
 {
 id: 'generate',
 title: 'Gere Relatórios Conformes',
 description: 'Crie relatórios técnicos conformes aos padrões JORC, NI 43-101, CBRR (Brasil) e outros. Leva apenas 5-10 minutos.',
 target: '/reports/generate',
 },
 {
 id: 'audit',
 title: 'Audite Automaticamente',
 description: 'Execute auditoria KRCI com 22 regras automatizadas. Identifique riscos de conformidade antes de submeter.',
 target: '/reports/audit',
 },
 {
 id: 'export',
 title: 'Exporte em Múltiplos Formatos',
 description: 'Converta entre padrões e exporte em PDF, DOCX ou XLSX. Pronto para apresentar a reguladores e investidores.',
 target: '/reports/export',
 },
 {
 id: 'complete',
 title: 'Tudo Pronto! ',
 description: 'Agora você está pronto para transformar compliance em valor estratégico. Comece gerando seu primeiro relatório!',
 },
];

interface OnboardingProps {
 onComplete: () => void;
 onSkip: () => void;
}

export default function Onboarding({ onComplete, onSkip }: OnboardingProps) {
 const [currentStep, setCurrentStep] = useState(0);
 const [completed, setCompleted] = useState<string[]>([]);

 const step = steps[currentStep];
 const isLastStep = currentStep === steps.length - 1;

 const handleNext = () => {
 if (isLastStep) {
 onComplete();
 } else {
 setCurrentStep(currentStep + 1);
 }
 };

 const handleSkip = () => {
 onSkip();
 };

 return (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <div className="bg-white/5 rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative animate-in fade-in slide-in-from-bottom-4 duration-300">
 {/* Close Button */}
 <button
 onClick={handleSkip}
 className="absolute top-4 right-4 text-gray-400 hover:text-gray-400 transition-colors"
 >
 <X className="h-6 w-6" />
 </button>

 {/* Progress Bar */}
 <div className="mb-8">
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm font-medium text-gray-400">
 Passo {currentStep + 1} de {steps.length}
 </span>
 <span className="text-sm text-gray-500">
 {Math.round(((currentStep + 1) / steps.length) * 100)}%
 </span>
 </div>
 <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
 <div
 className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500 ease-out"
 style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
 />
 </div>
 </div>

 {/* Content */}
 <div className="mb-8">
 <h2 className="text-3xl font-bold mb-4 text-white">
 {step.title}
 </h2>
 <p className="text-lg text-gray-400 leading-relaxed">
 {step.description}
 </p>
 </div>

 {/* Checklist (only on welcome step) */}
 {step.id === 'welcome' && (
 <div className="mb-8 bg-blue-50 rounded-lg p-6">
 <h3 className="font-semibold mb-4 text-white">
 O que você vai aprender:
 </h3>
 <ul className="space-y-3">
 <li className="flex items-center gap-3 text-gray-300">
 <div className="h-6 w-6 rounded-full bg-[#2f2c79] flex items-center justify-center flex-shrink-0">
 <Check className="h-4 w-4 text-white" />
 </div>
 <span>Como gerar relatórios conformes em minutos</span>
 </li>
 <li className="flex items-center gap-3 text-gray-300">
 <div className="h-6 w-6 rounded-full bg-[#2f2c79] flex items-center justify-center flex-shrink-0">
 <Check className="h-4 w-4 text-white" />
 </div>
 <span>Como auditar automaticamente com KRCI</span>
 </li>
 <li className="flex items-center gap-3 text-gray-300">
 <div className="h-6 w-6 rounded-full bg-[#2f2c79] flex items-center justify-center flex-shrink-0">
 <Check className="h-4 w-4 text-white" />
 </div>
 <span>Como exportar e converter entre padrões</span>
 </li>
 </ul>
 </div>
 )}

 {/* Actions */}
 <div className="flex items-center justify-between">
 <Button
 variant="ghost"
 onClick={handleSkip}
 className="text-gray-400"
 >
 Pular Tour
 </Button>

 <div className="flex items-center gap-3">
 {currentStep > 0 && (
 <Button
 variant="outline"
 onClick={() => setCurrentStep(currentStep - 1)}
 >
 Voltar
 </Button>
 )}
 <Button
 onClick={handleNext}
 className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8"
 >
 {isLastStep ? 'Começar a Usar' : 'Próximo'}
 <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </div>
 </div>

 {/* Step Indicators */}
 <div className="flex items-center justify-center gap-2 mt-8">
 {steps.map((s, index) => (
 <button
 key={s.id}
 onClick={() => setCurrentStep(index)}
 className={`h-2 rounded-full transition-all ${
 index === currentStep
 ? 'w-8 bg-[#2f2c79]'
 : index < currentStep
 ? 'w-2 bg-blue-400'
 : 'w-2 bg-gray-300'
 }`}
 />
 ))}
 </div>
 </div>
 </div>
 );
}

