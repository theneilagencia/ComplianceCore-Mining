import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Globe, MapPin, Award } from 'lucide-react';

interface Standard {
  id: string;
  name: string;
  fullName: string;
  region: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const standards: Standard[] = [
  {
    id: 'jorc',
    name: 'JORC 2012',
    fullName: 'Australasian Code for Reporting of Exploration Results, Mineral Resources and Ore Reserves',
    region: 'Australasia',
    icon: <Globe className="w-8 h-8" />,
    description: 'Padrão australiano amplamente reconhecido. Base do CRIRSCO Template. Ideal para projetos na Austrália, Nova Zelândia e região.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'ni43101',
    name: 'NI 43-101',
    fullName: 'National Instrument 43-101 Standards of Disclosure for Mineral Projects',
    region: 'Canadá',
    icon: <MapPin className="w-8 h-8" />,
    description: 'Padrão canadense obrigatório para empresas listadas na TSX/TSXV. Requisitos extensos de divulgação técnica e econômica.',
    color: 'from-red-500 to-orange-500'
  },
  {
    id: 'perc',
    name: 'PERC',
    fullName: 'Pan-European Reserves & Resources Reporting Committee Standard',
    region: 'Europa',
    icon: <Award className="w-8 h-8" />,
    description: 'Padrão europeu com requisitos de conformidade com diretivas da UE. Foco em sustentabilidade e licença social.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'samrec',
    name: 'SAMREC',
    fullName: 'South African Mineral Resource Committee Code',
    region: 'África do Sul',
    icon: <FileText className="w-8 h-8" />,
    description: 'Padrão sul-africano baseado no JORC. Requisitos específicos para profissionais registrados no SACNASP.',
    color: 'from-green-500 to-teal-500'
  }
];

export const StandardSelector: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectStandard = (standardId: string) => {
    navigate(`/reports/create/${standardId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Criar Relatório Técnico
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Selecione o padrão regulatório internacional para o seu relatório técnico.
            Cada padrão possui requisitos específicos de divulgação e conformidade.
          </p>
        </div>

        {/* Standards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {standards.map((standard) => (
            <button
              key={standard.id}
              onClick={() => handleSelectStandard(standard.id)}
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-left border-2 border-transparent hover:border-slate-200 transform hover:-translate-y-1"
            >
              {/* Gradient Background */}
              <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${standard.color} rounded-t-2xl`} />
              
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br ${standard.color} text-white mb-4 group-hover:scale-110 transition-transform`}>
                {standard.icon}
              </div>

              {/* Content */}
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                  {standard.name}
                </h2>
                <p className="text-sm font-medium text-slate-500 mb-2">
                  {standard.region}
                </p>
                <p className="text-xs text-slate-600 italic mb-3">
                  {standard.fullName}
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {standard.description}
                </p>
              </div>

              {/* CTA */}
              <div className="flex items-center text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                Selecionar este padrão
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Info Footer */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Precisa de ajuda para escolher?
              </h3>
              <p className="text-sm text-blue-800">
                A escolha do padrão depende da localização do projeto e dos requisitos regulatórios do país.
                Se o projeto está na <strong>Austrália/NZ</strong>, use JORC. No <strong>Canadá</strong>, use NI 43-101.
                Na <strong>Europa</strong>, use PERC. Na <strong>África do Sul</strong>, use SAMREC.
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/reports')}
            className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            ← Voltar para Relatórios
          </button>
        </div>
      </div>
    </div>
  );
};

