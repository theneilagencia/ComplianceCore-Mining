import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { 
  FileText, Shield, ArrowRightLeft, 
  Globe, BarChart3, CheckCircle2, Zap, Radar, Settings,
  Database, Satellite, TreePine, Building2, Check
} from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import PricingSection from "@/components/PricingSection";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  const handleSubscriptionCheckout = async (plan: string) => {
    setCheckoutLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/payment/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan, billingPeriod: 'monthly' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Checkout failed');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Subscription checkout error:', error);
      alert('Erro ao iniciar checkout. Tente novamente.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleOneTimeCheckout = async (reportType: string) => {
    const email = user?.email || emailInput;
    
    if (!email) {
      alert("Por favor, informe seu email para continuar");
      return;
    }

    setCheckoutLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/payment/one-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reportType, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao criar checkout');
      }

      // Redirecionar para Stripe Checkout
      window.location.href = data.url;
    } catch (error: any) {
      alert(error.message || 'Erro ao processar pagamento');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Redirecionar usuários autenticados para o dashboard
  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000020]">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f2c79]"
          role="status"
          aria-label="Carregando página"
        >
          <span className="sr-only">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000020] via-[#171a4a] to-[#2f2c79]">
      {/* Skip Navigation */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#2f2c79] focus:text-white focus:rounded-md focus:shadow-lg"
      >
        Pular para conteúdo principal
      </a>

      {/* Header */}
      <header role="banner" className="border-b border-white/10 bg-[#000020]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/assets/logo-Qivo.png" alt="Qivo Mining" className="h-8 w-auto" />
          </div>
          <nav role="navigation" aria-label="Navegação principal">
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="text-white hover:bg-white/5/10" asChild>
                <a href="#modules">Módulos</a>
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/5/10" asChild>
                <a href="#pricing">Planos</a>
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/5/10" asChild>
                <a href="#contact">Contato</a>
              </Button>
              <Button className="bg-[#2f2c79] hover:bg-[#b96e48] text-white" asChild>
                <a href={getLoginUrl()}>Entrar</a>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <main role="main" id="main-content">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-24">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2f2c79]/20 text-[#b96e48] rounded-full text-sm font-medium mb-4 border border-[#b96e48]/30">
              <Globe className="h-4 w-4" aria-hidden="true" />
              Governança Técnica, Regulatória e Ambiental
            </div>
            
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-white">
              A camada de inteligência da governança minerária
            </h1>
            
            <p className="text-lg text-gray-300 max-w-4xl mx-auto leading-snug">
              A QIVO é a primeira plataforma a unificar e automatizar relatórios técnicos de mineração segundo os padrões da família <strong className="text-white">CRIRSCO</strong> — JORC, NI 43-101, PERC, SAMREC e SEC S-K 1300 — e suas equivalências nacionais, como ANM, ANP, CPRM e IBAMA. Combinando inteligência regulatória, machine learning e padronização multinormativa, a QIVO transforma o processo de reporting técnico em um fluxo automático, auditável e 100% compatível com os requisitos internacionais de compliance, governança e ESG.
            </p>

            <div className="flex flex-wrap gap-4 justify-center pt-6">
              <Button size="lg" className="text-lg px-8 bg-[#2f2c79] hover:bg-[#b96e48] text-white shadow-lg" asChild>
                <a href="#modules">Explorar Plataforma</a>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 border-white/20 text-white hover:bg-white/5/10" asChild>
                <a href="#contact">Solicitar Demonstração</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Propósito */}
        <section className="bg-gradient-to-br from-[#171a4a] to-[#2f2c79] text-white py-20 border-y border-white/10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h2 className="text-4xl font-bold">
                Conformidade não é burocracia. É estratégia.
              </h2>
              <div className="text-lg text-gray-300 space-y-4 text-center">
                <p>
                  Simplificamos a governança minerária global, conectando dados, pessoas e padrões em uma só linguagem. Transformamos relatórios em inteligência, dados em confiança e conformidade em vantagem competitiva.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Como Funciona */}
        <section id="modules" className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">
                Quatro módulos integrados, um único ecossistema de governança
              </h2>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                O QIVO conecta normas, dados e auditorias em um fluxo contínuo — da detecção de mudanças regulatórias à entrega de relatórios certificados.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Radar Regulatório */}
              <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/5/10 transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#2f2c79] rounded-lg">
                    <Radar className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      Radar Regulatório Global
                    </h3>
                    <p className="text-gray-300">
                      Monitora e antecipa alterações normativas, geológicas e ambientais com atualizações contínuas.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Gerador de Relatórios */}
              <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/5/10 transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#8d4925] rounded-lg">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      Gerador de Relatórios Técnicos
                    </h3>
                    <p className="text-gray-300">
                      Produz relatórios multinormativos completos conforme CRIRSCO e equivalências nacionais.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Auditoria KRCI */}
              <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/5/10 transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#b96e48] rounded-lg">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      Auditoria e KRCI
                    </h3>
                    <p className="text-gray-300">
                      Checagens automáticas de conformidade com recomendações detalhadas.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Bridge Regulatória */}
              <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/5/10 transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#2f2c79] rounded-lg">
                    <ArrowRightLeft className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      Bridge Regulatória Global
                    </h3>
                    <p className="text-gray-300">
                      Traduz relatórios entre padrões internacionais e nacionais com precisão técnica.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Integrações Oficiais */}
        <section className="bg-white/5 py-20 border-y border-white/10">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-white mb-4">
                  Integrações Oficiais
                </h2>
                <p className="text-lg text-gray-300">
                  Conexões diretas com fontes oficiais de dados técnicos, geológicos e ambientais
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon: Database, name: "ANM – SIGMINE", area: "Fundiária", desc: "Rastreamento de processos minerários" },
                  { icon: Globe, name: "CPRM – GeoSGB", area: "Geológica", desc: "Unidades litológicas e ocorrências" },
                  { icon: Zap, name: "ANP – CKAN", area: "Energética", desc: "Monitoramento de blocos e resoluções" },
                  { icon: TreePine, name: "IBAMA – CKAN", area: "Ambiental", desc: "Licenças, condicionantes e validade" },
                  { icon: BarChart3, name: "USGS – MRDS/USMIN", area: "Benchmark técnico", desc: "Comparação de depósitos regionais" },
                  { icon: Satellite, name: "Copernicus / NASA", area: "Satelital", desc: "Detecção de alterações de solo" },
                ].map((integration, i) => (
                  <Card key={i} className="p-4 bg-white/5 border-white/10">
                    <div className="flex items-start gap-3">
                      <integration.icon className="h-6 w-6 text-[#b96e48] flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-white text-sm mb-1">{integration.name}</h4>
                        <p className="text-xs text-[#b96e48] mb-1">{integration.area}</p>
                        <p className="text-xs text-gray-400">{integration.desc}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Diferenciais */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                Diferenciais Estratégicos
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Conformidade viva", desc: "Atualização automática com normas e resoluções recentes" },
                { title: "Precisão verificável", desc: "Rastreabilidade completa de cada dado e versão" },
                { title: "Interoperabilidade global", desc: "Conversão entre padrões internacionais e nacionais" },
                { title: "Transparência ambiental", desc: "Integração com dados públicos e satelitais" },
                { title: "Escalabilidade operacional", desc: "Estrutura robusta e compatível com grandes volumes" },
              ].map((diff, i) => (
                <Card key={i} className="p-6 bg-white/5 border-white/10">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-white mb-2">{diff.title}</h4>
                      <p className="text-sm text-gray-300">{diff.desc}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Planos */}
        <PricingSection 
          checkoutLoading={checkoutLoading}
          handleSubscriptionCheckout={handleSubscriptionCheckout}
        />

        {/* Relatórios Avulsos */}
        <section className="bg-gradient-to-br from-[#171a4a] to-[#2f2c79] py-20 border-y border-white/10">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-white mb-4">
                  Relatórios Avulsos — On-Demand
                </h2>
              </div>

              {/* Relatórios Avulsos */}
              <div className="bg-white/5 rounded-lg p-8 border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Relatórios Avulsos — On-Demand
                </h3>
                <p className="text-gray-300 mb-4">
                  Gere relatórios técnicos individuais sob demanda — sem assinatura e com a mesma precisão dos planos profissionais. Todos seguem os padrões da família CRIRSCO (JORC, NI 43-101, PERC, SAMREC e SEC S-K 1300) e suas equivalências nacionais (ANM, ANP, CPRM, IBAMA). Cada relatório é criado pelo motor de IA do QIVO, com dados integrados e verificação automática de conformidade técnica.
                </p>
                {user && user.license && user.license.plan !== 'FREE' && (
                  <div className="bg-[#b96e48]/20 border border-[#b96e48] rounded-lg p-4 mb-6">
                    <p className="text-white font-semibold text-center">
                      🎉 Você tem <strong>10% de desconto</strong> em todos os relatórios avulsos como assinante {user.license.plan}!
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { 
                      name: "Relatório Simplificado", 
                      subtitle: "Diagnóstico rápido e padronizado da operação.",
                      desc: "Apresenta um sumário técnico estruturado com as principais informações do projeto — área, substância, localização e status fundiário — integradas automaticamente às bases da ANM (SIGMINE) e CPRM (GeoSGB).", 
                      requirements: "Estrutura mínima CRIRSCO + dados oficiais geológicos e fundiários.",
                      benefits: "Visão objetiva e de fácil compreensão, ideal para pequenas mineradoras, consultores e estudos preliminares.",
                      price: "$ 2.800", 
                      type: "simplificado" 
                    },
                    { 
                      name: "Relatório Técnico Completo", 
                      subtitle: "Documento técnico completo e pronto para revisão de um Qualified Person (QP).",
                      desc: "Gera automaticamente todas as 27 seções padronizadas CRIRSCO, incluindo contexto geológico, recursos minerais, métodos de exploração e conformidade ambiental. Integra dados da ANM, CPRM, IBAMA e USGS, garantindo coerência técnica e terminológica.", 
                      requirements: "Padrões JORC, NI 43-101 e ANM.",
                      benefits: "Economiza tempo, reduz erros humanos e garante consistência entre seções, tornando o relatório apto para revisão ou submissão formal.",
                      price: "$ 6.800", 
                      type: "tecnico_completo" 
                    },
                    { 
                      name: "Relatório Multinormativo", 
                      subtitle: "Relatório inteligente compatível com múltiplos padrões internacionais.",
                      desc: "Converte automaticamente relatórios entre JORC ↔ NI ↔ ANM, preservando terminologia e estrutura técnica através da Bridge Regulatória QIVO e da Ontologia CRIRSCO Expandida.", 
                      requirements: "Equivalências entre normas nacionais e globais; rastreabilidade de campos e metadados.",
                      benefits: "Ideal para empresas que atuam em várias jurisdições, reduzindo retrabalho e garantindo coerência técnica global.",
                      price: "$ 9.800", 
                      type: "multinormativo" 
                    },
                    { 
                      name: "Relatório Auditável", 
                      subtitle: "Verificação automatizada e rastreável da conformidade técnica.",
                      desc: "Executa mais de 100 checagens automáticas com base nas normas CRIRSCO, ANM e IBAMA, gerando pontuação KRCI (0 a 100) e um Resumo Executivo de Conformidade com recomendações de melhoria. Inclui controle de versão e assinatura digital verificável.", 
                      requirements: "Estrutura CRIRSCO completa + módulo KRCI + camada de rastreabilidade digital.",
                      benefits: "Evidências objetivas de conformidade técnica e ambiental, ideais para auditorias internas, relatórios corporativos e due diligence.",
                      price: "$ 12.000", 
                      type: "auditavel" 
                    },
                    { 
                      name: "Relatório ESG Integrado", 
                      subtitle: "Integra governança técnica, ambiental e social em um único documento.",
                      desc: "Combina dados da IBAMA (licenças e condicionantes), Copernicus/NASA (imagens satelitais NDVI) e parâmetros ESG internacionais (GRI, IFRS S2, TCFD).", 
                      requirements: "Indicadores ESG ambientais e sociais compatíveis com CRIRSCO e reguladores nacionais.",
                      benefits: "Demonstra transparência e compromisso ambiental, reforçando a credibilidade da empresa em auditorias, certificações e relatórios de sustentabilidade.",
                      price: "$ 12.800", 
                      type: "esg_integrado" 
                    },
                  ].map((report, i) => (
                    <Card key={i} className="p-4 bg-white/5 border-white/10">
                      <h4 className="font-bold text-white mb-1">{report.name}</h4>
                      <p className="text-xs text-gray-300 italic mb-2">{report.subtitle}</p>
                      <p className="text-sm text-gray-200 mb-2">{report.desc}</p>
                      <p className="text-xs text-gray-300 mb-1"><strong className="text-white">Requisitos:</strong> {report.requirements}</p>
                      <p className="text-xs text-gray-300 mb-3"><strong className="text-white">Benefícios:</strong> {report.benefits}</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-bold text-[#b96e48]">{report.price}</span>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full bg-[#2f2c79] hover:bg-[#b96e48]"
                        onClick={() => handleOneTimeCheckout(report.type)}
                        disabled={checkoutLoading}
                      >
                        {checkoutLoading ? "Processando..." : "Contratar"}
                      </Button>
                    </Card>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Segurança e Conformidade */}
        <section className="bg-gradient-to-br from-[#0f1135] to-[#171a4a] py-20 border-y border-white/10">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-white mb-4">
                  Segurança, Rastreabilidade e Conformidade Técnica
                </h2>
                <p className="text-lg text-gray-300 max-w-4xl mx-auto leading-relaxed">
                  A QIVO foi construída com os mais altos padrões de segurança, privacidade e auditabilidade, garantindo que cada dado, relatório e processo seja rastreado, verificado e protegido de ponta a ponta.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Segurança da Informação */}
                <Card className="p-6 bg-white/5 border-white/10">
                  <div className="flex items-start gap-4 mb-4">
                    <Shield className="h-8 w-8 text-[#b96e48] flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Segurança da Informação</h3>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        Toda comunicação entre cliente e servidor é criptografada via <strong className="text-white">TLS 1.3</strong>. Senhas são protegidas com <strong className="text-white">bcrypt</strong> e armazenadas de forma irreversível. Tokens de sessão são gerados com <strong className="text-white">JWT</strong> e expiram automaticamente após períodos de inatividade.
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2 ml-12">
                    <li className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-[#b96e48] flex-shrink-0 mt-0.5" />
                      <span>Criptografia TLS 1.3 end-to-end</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-[#b96e48] flex-shrink-0 mt-0.5" />
                      <span>Autenticação JWT com refresh token automático</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-[#b96e48] flex-shrink-0 mt-0.5" />
                      <span>Hashing bcrypt para senhas (salt rounds ≥ 10)</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-[#b96e48] flex-shrink-0 mt-0.5" />
                      <span>Gestão segura de secrets via Google Secret Manager</span>
                    </li>
                  </ul>
                </Card>

                {/* Rastreabilidade e Auditoria */}
                <Card className="p-6 bg-white/5 border-white/10">
                  <div className="flex items-start gap-4 mb-4">
                    <Database className="h-8 w-8 text-[#b96e48] flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Rastreabilidade e Auditoria</h3>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        Cada relatório gerado pela QIVO possui <strong className="text-white">controle de versão automático</strong>, permitindo rastrear quem criou, quando foi criado e quais dados foram utilizados. Todas as operações críticas são registradas em logs imutáveis no <strong className="text-white">Google Cloud Logging</strong>.
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2 ml-12">
                    <li className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-[#b96e48] flex-shrink-0 mt-0.5" />
                      <span>Versionamento automático de relatórios (Git-like)</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-[#b96e48] flex-shrink-0 mt-0.5" />
                      <span>Logs imutáveis no Google Cloud Logging</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-[#b96e48] flex-shrink-0 mt-0.5" />
                      <span>Metadados de origem (fonte, data, autor, QP responsável)</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-[#b96e48] flex-shrink-0 mt-0.5" />
                      <span>Assinatura digital verificada via hash SHA-256</span>
                    </li>
                  </ul>
                </Card>

                {/* Conformidade Técnica */}
                <Card className="p-6 bg-white/5 border-white/10">
                  <div className="flex items-start gap-4 mb-4">
                    <CheckCircle2 className="h-8 w-8 text-[#b96e48] flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Conformidade Técnica</h3>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        A QIVO verifica automaticamente a conformidade de cada relatório com mais de <strong className="text-white">130 regras técnicas</strong> baseadas nos padrões CRIRSCO, ANM, IBAMA e SEC. Cada verificação gera um <strong className="text-white">score KRCI</strong> (0-100) e um relatório de conformidade auditado.
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2 ml-12">
                    <li className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-[#b96e48] flex-shrink-0 mt-0.5" />
                      <span>Validação automática contra 130+ regras CRIRSCO</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-[#b96e48] flex-shrink-0 mt-0.5" />
                      <span>Score KRCI (Key Risk and Critical Information)</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-[#b96e48] flex-shrink-0 mt-0.5" />
                      <span>Relatório de conformidade com recomendações</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-[#b96e48] flex-shrink-0 mt-0.5" />
                      <span>Compatibilidade com JORC, NI 43-101, SEC S-K 1300</span>
                    </li>
                  </ul>
                </Card>

                {/* Privacidade e LGPD */}
                <Card className="p-6 bg-white/5 border-white/10">
                  <div className="flex items-start gap-4 mb-4">
                    <Shield className="h-8 w-8 text-[#b96e48] flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Privacidade e LGPD</h3>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        A QIVO está em conformidade com a <strong className="text-white">LGPD (Lei Geral de Proteção de Dados)</strong> e <strong className="text-white">GDPR</strong>. Dados pessoais são processados apenas com consentimento explícito, e usuários podem solicitar exclusão total de seus dados a qualquer momento.
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2 ml-12">
                    <li className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-[#b96e48] flex-shrink-0 mt-0.5" />
                      <span>Conformidade com LGPD e GDPR</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-[#b96e48] flex-shrink-0 mt-0.5" />
                      <span>Consentimento explícito para processamento de dados</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-[#b96e48] flex-shrink-0 mt-0.5" />
                      <span>Direito ao esquecimento (exclusão total de dados)</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-[#b96e48] flex-shrink-0 mt-0.5" />
                      <span>Política de privacidade transparente e acessível</span>
                    </li>
                  </ul>
                </Card>
              </div>

              {/* Infraestrutura */}
              <div className="bg-white/5 rounded-lg p-8 border border-white/10">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Infraestrutura Cloud de Nível Enterprise
                  </h3>
                  <p className="text-gray-300 max-w-3xl mx-auto">
                    A QIVO opera 100% na <strong className="text-white">Google Cloud Platform (GCP)</strong>, com arquitetura serverless, escalabilidade automática e disponibilidade de 99.9%. Todos os dados são armazenados em <strong className="text-white">Cloud SQL (PostgreSQL)</strong> com backups automáticos diários e replicação geográfica.
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-4">
                    <div className="text-3xl font-bold text-[#b96e48] mb-2">99.9%</div>
                    <div className="text-sm text-gray-300">Disponibilidade</div>
                  </div>
                  <div className="p-4">
                    <div className="text-3xl font-bold text-[#b96e48] mb-2">18+</div>
                    <div className="text-sm text-gray-300">APIs Integradas</div>
                  </div>
                  <div className="p-4">
                    <div className="text-3xl font-bold text-[#b96e48] mb-2">100%</div>
                    <div className="text-sm text-gray-300">Cloud GCP</div>
                  </div>
                  <div className="p-4">
                    <div className="text-3xl font-bold text-[#b96e48] mb-2">TLS 1.3</div>
                    <div className="text-sm text-gray-300">Criptografia</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contato */}
        <section id="contact" className="bg-gradient-to-br from-[#171a4a] to-[#2f2c79] py-20 border-y border-white/10">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-white mb-4">
                  Entre em contato
                </h2>
                <p className="text-lg text-gray-300">
                  Fale conosco para discutir suas necessidades e conhecer melhor o QIVO
                </p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-8 border border-white/10">
                <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const data = {
                    nome: formData.get('nome'),
                    email: formData.get('email'),
                    empresa: formData.get('empresa'),
                    mensagem: formData.get('mensagem')
                  };
                  
                  fetch(`${API_BASE_URL}/api/contact`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                  }).then(res => {
                    if (res.ok) {
                      alert('Mensagem enviada com sucesso!');
                      e.currentTarget.reset();
                    } else {
                      alert('Erro ao enviar mensagem. Tente novamente.');
                    }
                  }).catch(() => {
                    alert('Erro ao enviar mensagem. Tente novamente.');
                  });
                }}>
                  <div>
                    <label htmlFor="nome" className="block text-sm font-medium text-gray-300 mb-2">
                      Nome *
                    </label>
                    <input
                      type="text"
                      id="nome"
                      name="nome"
                      required
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2f2c79]"
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2f2c79]"
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="empresa" className="block text-sm font-medium text-gray-300 mb-2">
                      Empresa
                    </label>
                    <input
                      type="text"
                      id="empresa"
                      name="empresa"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2f2c79]"
                      placeholder="Nome da empresa"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="mensagem" className="block text-sm font-medium text-gray-300 mb-2">
                      Mensagem *
                    </label>
                    <textarea
                      id="mensagem"
                      name="mensagem"
                      required
                      rows={4}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2f2c79]"
                      placeholder="Descreva suas necessidades..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button 
                      type="submit"
                      size="lg"
                      className="w-full bg-[#2f2c79] hover:bg-[#b96e48] text-white"
                    >
                      Enviar Mensagem
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Da mineração de dados à mineração de confiança
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Cada relatório produzido com o QIVO é uma declaração de integridade técnica.
              <br />
              <strong className="text-[#b96e48]">QIVO — Compliance que se transforma em credibilidade.</strong>
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 bg-[#b96e48] hover:bg-[#8d4925] text-white shadow-lg">
                Solicitar Demonstração
              </Button>

            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#000020] border-t border-white/10 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <img src="/assets/logo-Qivo.png" alt="Qivo" className="h-8 w-auto" />
              </div>
              <p className="text-gray-400 mb-2">
                <strong className="text-white">QIVO — Regulatory Governance Infrastructure</strong>
              </p>
              <p className="text-sm text-gray-500">
                Tecnologia e transparência para a mineração global.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm">
              <a href="#" className="text-gray-400 hover:text-[#b96e48] transition-colors">Termos de Uso</a>
              <a href="#" className="text-gray-400 hover:text-[#b96e48] transition-colors">Política de Privacidade</a>
              <a href="#" className="text-gray-400 hover:text-[#b96e48] transition-colors">Documentação Técnica</a>
              <a href="#" className="text-gray-400 hover:text-[#b96e48] transition-colors">Contato</a>
            </div>
            <div className="text-center text-sm text-gray-500">
              © 2025 QIVO Systems. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

