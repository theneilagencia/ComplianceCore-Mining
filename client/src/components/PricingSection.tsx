import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

interface PricingSectionProps {
  checkoutLoading: boolean;
  handleSubscriptionCheckout: (plan: string) => Promise<void>;
}

export default function PricingSection({ checkoutLoading, handleSubscriptionCheckout }: PricingSectionProps) {
  return (
    <section id="pricing" className="bg-gradient-to-br from-[#171a4a] to-[#2f2c79] py-20 border-y border-white/10">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Título e Introdução */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Planos de Assinatura QIVO
            </h2>
            <p className="text-lg text-gray-300 max-w-4xl mx-auto leading-relaxed">
              A QIVO é a plataforma mais completa de compliance regulatório, auditoria técnica e governança para mineração do mundo, com integração a 18 APIs, 11 padrões internacionais e brasileiros, e inteligência preditiva alimentada por dados satelitais, normativos e operacionais.
            </p>
            <p className="text-lg text-gray-300 max-w-4xl mx-auto mt-4">
              Escolha o plano que melhor acompanha o momento e a necessidade de sua operação.
            </p>
          </div>

          {/* Cards dos Planos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {/* Plano Start */}
            <Card className="p-8 bg-white/5 border-white/10 hover:border-[#2f2c79] transition-all">
              <div className="mb-6">
                <h3 className="text-3xl font-bold text-white mb-2">Start</h3>
                <p className="text-[#b96e48] font-semibold text-lg mb-4">
                  "Sua operação em conformidade, de forma simples e inteligente"
                </p>
                <p className="text-gray-300 text-sm leading-relaxed">
                  O Start oferece o essencial para quem precisa garantir conformidade técnica com custo otimizado. Ideal para pequenas mineradoras, geólogos independentes e startups de mineração, combina automação, relatórios inteligentes e monitoramento local via Radar Regulatório.
                </p>
              </div>

              <div className="mb-6">
                <div className="text-5xl font-bold text-[#b96e48] mb-2">
                  US$ 2.500<span className="text-xl text-gray-400">/mês</span>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="text-white font-bold mb-4">Destaques</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">01 Relatório Técnico Mensal</strong> — baseado nos padrões ANM, CBRR e IBAMA, com exportação DOCX e PDF.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Radar Local Integrado</strong> (ANM, CPRM, IBAMA, ANP) — alertas automáticos de mudanças regulatórias locais.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Auditoria KRCI Light</strong> (30 regras) — verificação rápida de conformidade técnica, ESG e documental.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Biblioteca de Competent Persons (QP)</strong> — cadastro e atribuição automática de revisores qualificados.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Desconto de 10% em Relatórios Avulsos</strong> — acesso sob demanda a relatórios adicionais com custo reduzido.</span>
                  </li>
                </ul>
              </div>

              <p className="text-sm text-gray-400 italic mb-6">
                Perfeito para quem quer iniciar sua jornada de conformidade sem complexidade, com o poder da QIVO.
              </p>

              <Button 
                className="w-full bg-[#2f2c79] hover:bg-[#b96e48] text-white text-lg py-6"
                onClick={() => handleSubscriptionCheckout('START')}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? 'Processando...' : 'Começar Agora'}
              </Button>
            </Card>

            {/* Plano Pro */}
            <Card className="p-8 bg-white/10 border-[#b96e48] border-2 relative hover:shadow-2xl transition-all">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#b96e48] text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                POPULAR
              </div>
              
              <div className="mb-6 mt-2">
                <h3 className="text-3xl font-bold text-white mb-2">Pro</h3>
                <p className="text-[#b96e48] font-semibold text-lg mb-4">
                  "Visão global, relatórios multinormativos e total controle da conformidade."
                </p>
                <p className="text-gray-300 text-sm leading-relaxed">
                  O Plano Pro amplia a capacidade operacional para empresas em expansão, consultorias regionais e operações multinormativas, integrando dados locais e globais com recursos avançados de auditoria e personalização visual.
                </p>
              </div>

              <div className="mb-6">
                <div className="text-5xl font-bold text-[#b96e48] mb-2">
                  US$ 12.500<span className="text-xl text-gray-400">/mês</span>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="text-white font-bold mb-4">Destaques</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">05 Relatórios Multinormativos/Mês</strong> — compatíveis com JORC, NI 43-101, SAMREC, PERC, CBRR, ANM.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Radar Global</strong> (12 fontes) — monitoramento em tempo real de APIs nacionais e internacionais (USGS, Copernicus, World Bank, Global Forest Watch, Resource Watch).</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Conversão Multinormativa Automática</strong> — IA converte e harmoniza dados para múltiplos padrões técnicos.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Customização de Marca nos Relatórios</strong> — inserção de logotipo, paleta de cores e identidade visual corporativa.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Auditoria KRCI Full</strong> (70 regras) — avaliação técnica completa com relatórios comparativos e recomendações automáticas.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Análise de Custos e Quotas em Tempo Real</strong> — integração com módulo administrativo para acompanhar uso de APIs e custos operacionais.</span>
                  </li>
                </ul>
              </div>

              <p className="text-sm text-gray-400 italic mb-6">
                O equilíbrio ideal entre escala, flexibilidade e controle para operações em crescimento.
              </p>

              <Button 
                className="w-full bg-[#b96e48] hover:bg-[#8d4925] text-white text-lg py-6"
                onClick={() => handleSubscriptionCheckout('PRO')}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? 'Processando...' : 'Começar Agora'}
              </Button>
            </Card>

            {/* Plano Enterprise */}
            <Card className="p-8 bg-white/5 border-white/10 hover:border-[#2f2c79] transition-all">
              <div className="mb-6">
                <h3 className="text-3xl font-bold text-white mb-2">Enterprise</h3>
                <p className="text-[#b96e48] font-semibold text-lg mb-4">
                  "Compliance avançado com inteligência preditiva e domínio total da operação."
                </p>
                <p className="text-gray-300 text-sm leading-relaxed">
                  O Enterprise é o pacote mais completo da QIVO — desenhado para grandes mineradoras, fundos de investimento, auditores internacionais e órgãos reguladores. Integra dados técnicos, ambientais e satelitais em tempo real, permitindo governança completa e previsibilidade regulatória.
                </p>
              </div>

              <div className="mb-6">
                <div className="text-5xl font-bold text-[#b96e48] mb-2">
                  US$ 18.900<span className="text-xl text-gray-400">/mês</span>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="text-white font-bold mb-4">Destaques</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Relatórios Ilimitados</strong> — compatíveis com os 11 padrões internacionais e brasileiros (JORC, NI 43-101, SEC S-K 1300, CRIRSCO, ANM, IBAMA e mais).</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Auditoria KRCI Deep Scan</strong> (130 regras) — auditoria de alta precisão com classificação de severidade, score por categoria e plano de correção automatizado.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Gestão de Dados em Tempo Real</strong> — acompanhamento contínuo de indicadores ESG, títulos minerários e sensoriamento remoto via Copernicus e Sentinel Hub.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Customização Completa de Marca</strong> — relatórios e dashboards 100% personalizados com identidade corporativa completa.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Análises Preditivas com IA</strong> — correlação entre eventos normativos e dados operacionais para prever riscos e revisões futuras.</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-gray-300">
                    <Check className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Painel Financeiro Integrado (Stripe)</strong> — monitoramento de consumo e custos operacionais em tempo real por serviço e API.</span>
                  </li>
                </ul>
              </div>

              <p className="text-sm text-gray-400 italic mb-6">
                O padrão ouro da conformidade global: previsível, auditável e totalmente personalizável.
              </p>

              <Button 
                className="w-full bg-[#2f2c79] hover:bg-[#b96e48] text-white text-lg py-6"
                onClick={() => handleSubscriptionCheckout('ENTERPRISE')}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? 'Processando...' : 'Começar Agora'}
              </Button>
            </Card>
          </div>

          {/* Tabela Comparativa */}
          <div className="bg-white/5 rounded-lg p-8 border border-white/10 mb-12">
            <h3 className="text-3xl font-bold text-white mb-8 text-center">
              Comparativo Rápido
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-4 px-4 text-white font-bold">Recurso / Plano</th>
                    <th className="text-center py-4 px-4 text-white font-bold">Start</th>
                    <th className="text-center py-4 px-4 text-white font-bold bg-[#b96e48]/10">Pro</th>
                    <th className="text-center py-4 px-4 text-white font-bold">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-white/10">
                    <td className="py-4 px-4 font-semibold text-white">Relatórios / Mês</td>
                    <td className="py-4 px-4 text-center">1 relatório técnico mensal, com exportação em DOCX e PDF.</td>
                    <td className="py-4 px-4 text-center bg-[#b96e48]/5">5 relatórios multinormativos mensais, com controle de versão automático.</td>
                    <td className="py-4 px-4 text-center">Relatórios ilimitados, com versionamento e auditoria completa.</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-4 px-4 font-semibold text-white">Padrões Suportados</td>
                    <td className="py-4 px-4 text-center">3 (CBRR, ANM, IBAMA)</td>
                    <td className="py-4 px-4 text-center bg-[#b96e48]/5">6 (JORC, NI 43-101, SAMREC, PERC, ANM, CBRR)</td>
                    <td className="py-4 px-4 text-center">11 (JORC, NI 43-101, SAMREC, PERC, SEC S-K 1300, CRIRSCO, ANM, ANP, CPRM, CBRR, IBAMA)</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-4 px-4 font-semibold text-white">Auditoria KRCI</td>
                    <td className="py-4 px-4 text-center">Light (30 regras) — conformidade básica documental e regulatória.</td>
                    <td className="py-4 px-4 text-center bg-[#b96e48]/5">Full (70 regras) — auditoria técnica, ESG e documental com planos de correção automáticos.</td>
                    <td className="py-4 px-4 text-center">Deep (130 regras) — verificação completa, análise de severidade e recomendações preditivas.</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-4 px-4 font-semibold text-white">Radar Regulatório</td>
                    <td className="py-4 px-4 text-center">Local — monitoramento de resoluções da ANM, IBAMA e CPRM.</td>
                    <td className="py-4 px-4 text-center bg-[#b96e48]/5">Global — inclui ANM, IBAMA, CPRM, USGS e World Bank.</td>
                    <td className="py-4 px-4 text-center">Global + Satélite — inclui dados geoespaciais de Copernicus, NASA e USGS com correlação semântica automática.</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-4 px-4 font-semibold text-white">Customização de Marca</td>
                    <td className="py-4 px-4 text-center">Parcial — logotipo e capa nos relatórios técnicos.</td>
                    <td className="py-4 px-4 text-center bg-[#b96e48]/5">Completa (relatórios) — logotipo, cores corporativas e templates customizados.</td>
                    <td className="py-4 px-4 text-center">Total (relatórios e dashboards) — branding total, incluindo dashboards e relatórios interativos.</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-4 px-4 font-semibold text-white">IA e Preditividade</td>
                    <td className="py-4 px-4 text-center">Não aplicável — geração manual com revisão humana.</td>
                    <td className="py-4 px-4 text-center bg-[#b96e48]/5">Parcial — IA semântica para conversão multinormativa e pré-preenchimento automático.</td>
                    <td className="py-4 px-4 text-center">Completa — IA com análise preditiva, correlação entre eventos normativos e insights regulatórios automatizados.</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-semibold text-white">Painel Financeiro (Stripe)</td>
                    <td className="py-4 px-4 text-center">Básico — acompanhamento de consumo e cobranças recorrentes.</td>
                    <td className="py-4 px-4 text-center bg-[#b96e48]/5">Avançado — visualização de gastos por API e alertas de uso.</td>
                    <td className="py-4 px-4 text-center">Completo — monitoramento em tempo real de consumo, custo por serviço, e previsão de gastos operacionais.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
