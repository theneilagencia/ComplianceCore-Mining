import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { 
  FileText, Shield, ArrowRightLeft, 
  TrendingUp, Globe, BarChart3,
  CheckCircle2, Zap, Radar, Settings
} from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

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
            <img src="/assets/logo-Qivo.png" alt="Qivo Mining" className="h-12 w-auto" />
          </div>
          <nav role="navigation" aria-label="Navegação principal">
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="text-white hover:bg-white/10" asChild>
                <a href="#features">Recursos</a>
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/10" asChild>
                <a href="#modules">Módulos</a>
              </Button>
              <Button className="bg-[#2f2c79] hover:bg-[#b96e48] text-white" asChild>
                <a href={getLoginUrl()}>Entrar</a>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main role="main" id="main-content">
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2f2c79]/20 text-[#b96e48] rounded-full text-sm font-medium mb-4 border border-[#b96e48]/30">
            <Zap className="h-4 w-4" aria-hidden="true" />
            Infraestrutura de Governança Minerária Digital
          </div>
          
          <h1 className="text-6xl font-extrabold tracking-tight leading-tight text-white">
            <strong>Transforme Compliance em</strong>
            <br />
            <span className="bg-gradient-to-r from-[#b96e48] to-[#8d4925] bg-clip-text text-transparent">
              <strong>Valor Estratégico</strong>
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            A Qivo Mining é a infraestrutura digital que conecta <strong className="text-white">dados técnicos</strong>, 
            <strong className="text-white"> inteligência regulatória</strong> e <strong className="text-white">governança</strong> — 
            transformando relatórios estáticos em ativos auditáveis e estratégicos.
          </p>

          <div className="flex flex-wrap gap-4 justify-center pt-6">
            <Button size="lg" className="text-lg px-8 bg-[#2f2c79] hover:bg-[#b96e48] text-white shadow-lg" asChild>
              <a href={getLoginUrl()}>Criar Conta Gratuita →</a>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 border-white/20 text-white hover:bg-white/10" asChild>
              <a href="#modules">Ver Módulos</a>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 pt-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#b96e48]" aria-hidden="true" />
              <span>Auditável em tempo real</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#b96e48]" aria-hidden="true" />
              <span>Conformidade preditiva</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#b96e48]" aria-hidden="true" />
              <span>Governança operacional</span>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="bg-gradient-to-br from-[#171a4a] to-[#2f2c79] text-white py-20 border-y border-white/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold">
              "Somos a infraestrutura digital de governança técnica e regulatória da nova mineração."
            </h2>
            <p className="text-lg text-gray-300">
              Uma plataforma full-stack que conecta dados técnicos de mineração à inteligência regulatória, 
              gerando valor auditável, mitigando riscos e habilitando conformidade estratégica.
            </p>
          </div>
        </div>
      </section>

      {/* 3 Transformações */}
      <section className="container mx-auto px-4 py-20" id="features">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-white">Três Pilares Fundamentais</h2>
            <p className="text-lg text-gray-300">
              A Qivo Mining promove mudanças estruturais na governança minerária moderna
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pilar 1 */}
            <Card className="p-8 hover:shadow-xl transition-all border-t-4 border-[#2f2c79] bg-white/5 backdrop-blur-sm text-white">
              <div className="h-14 w-14 rounded-xl bg-[#2f2c79]/20 flex items-center justify-center mb-6 border border-[#2f2c79]">
                <TrendingUp className="h-7 w-7 text-[#b96e48]" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Ativos Técnicos como Vetores de Valor</h3>
              <p className="text-gray-300 mb-4">
                Relatórios antes operacionais tornam-se:
              </p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                  <span>Auditáveis em tempo real</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                  <span>Valorizáveis para M&A, valuation e crédito</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                  <span>Referência sólida para estratégias de governança</span>
                </li>
              </ul>
            </Card>

            {/* Pilar 2 */}
            <Card className="p-8 hover:shadow-xl transition-all border-t-4 border-[#8d4925] bg-white/5 backdrop-blur-sm text-white">
              <div className="h-14 w-14 rounded-xl bg-[#8d4925]/20 flex items-center justify-center mb-6 border border-[#8d4925]">
                <Globe className="h-7 w-7 text-[#b96e48]" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Inteligência Regulatória Preditiva</h3>
              <p className="text-gray-300 mb-4">
                O "Waze da conformidade técnica":
              </p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                  <span>Antecipe mudanças em normas JORC, NI 43-101, SAMREC, CBRR</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                  <span>Mapeie e priorize riscos críticos por projeto</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                  <span>Automatize auditorias e due diligence</span>
                </li>
              </ul>
            </Card>

            {/* Pilar 3 */}
            <Card className="p-8 hover:shadow-xl transition-all border-t-4 border-[#b96e48] bg-white/5 backdrop-blur-sm text-white">
              <div className="h-14 w-14 rounded-xl bg-[#b96e48]/20 flex items-center justify-center mb-6 border border-[#b96e48]">
                <Shield className="h-7 w-7 text-[#b96e48]" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Governança como Infraestrutura Operacional</h3>
              <p className="text-gray-300 mb-4">
                Governança não é narrativa, é infraestrutura técnica:
              </p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                  <span>Auditoria automatizada com 100+ regras KRCI</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                  <span>Dashboards dinâmicos de conformidade</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#b96e48] flex-shrink-0 mt-0.5" />
                  <span>Gestão de assinaturas e billing automatizado</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Módulos */}
      <section className="bg-gradient-to-br from-[#171a4a] to-[#000020] py-20 border-y border-white/10" id="modules">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-white">Módulos Integrados</h2>
              <p className="text-lg text-gray-300">
                Plataforma completa para governança técnica e regulatória
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: FileText,
                  title: "AI Report Generator",
                  description: "Geração automatizada de relatórios conformes aos padrões JORC, NI 43-101, PERC, SAMREC e CBRR (Brasil)",
                  color: "#2f2c79",
                },
                {
                  icon: Shield,
                  title: "Auditoria & KRCI",
                  description: "100+ regras de auditoria automatizadas com modos Light, Full e Deep Scan para conformidade total",
                  color: "#8d4925",
                },
                {
                  icon: ArrowRightLeft,
                  title: "Bridge Regulatória",
                  description: "Conversão automática entre padrões internacionais (JORC ↔ NI 43-101 ↔ PERC ↔ SAMREC)",
                  color: "#b96e48",
                },
                {
                  icon: Radar,
                  title: "Regulatory Radar",
                  description: "Monitoramento preditivo de mudanças legislativas em 5 países com alertas automáticos",
                  color: "#2f2c79",
                },
                {
                  icon: Settings,
                  title: "Admin Core",
                  description: "Gestão completa de assinaturas, billing (Stripe), usuários e configurações multi-tenant",
                  color: "#8d4925",
                },
              ].map((module, idx) => (
                <Card key={idx} className="p-6 hover:shadow-lg transition-shadow bg-white/5 backdrop-blur-sm text-white border border-white/10">
                  <div 
                    className="h-12 w-12 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${module.color}20`, border: `1px solid ${module.color}` }}
                  >
                    <module.icon className="h-6 w-6" style={{ color: module.color }} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{module.title}</h3>
                  <p className="text-sm text-gray-300">{module.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Standards */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl font-bold text-white">Padrões Suportados</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "JORC 2012", country: "Austrália" },
              { name: "NI 43-101", country: "Canadá" },
              { name: "PERC", country: "Europa" },
              { name: "SAMREC", country: "África do Sul" },
              { name: "CRIRSCO", country: "Internacional" },
              { name: "CBRR", country: "Brasil 🇧🇷" },
            ].map((standard) => (
              <Card key={standard.name} className="p-4 text-center hover:shadow-md transition-shadow bg-white/5 backdrop-blur-sm text-white border border-white/10">
                <p className="font-bold text-lg">{standard.name}</p>
                <p className="text-xs text-gray-400">{standard.country}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <Card className="max-w-4xl mx-auto p-12 text-center bg-gradient-to-br from-[#2f2c79] via-[#8d4925] to-[#b96e48] text-white shadow-2xl border-0">
          <h2 className="text-4xl font-bold mb-4">
            A nova mineração começa aqui
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Dados auditáveis, conformidade estratégica e governança real. 
            Junte-se às empresas que transformam compliance em valor.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 bg-white text-[#2f2c79] hover:bg-gray-100" asChild>
              <a href={getLoginUrl()}>Criar Conta Gratuita</a>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent border-white text-white hover:bg-white/10" asChild>
              <a href="#modules">Ver Módulos</a>
            </Button>
          </div>
        </Card>
      </section>
      </main>

      {/* Footer */}
      <footer role="contentinfo" className="border-t border-white/10 bg-[#000020] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/assets/logo-Qivo.png" alt="Qivo Mining" className="h-8 w-auto" loading="lazy" decoding="async" />
              </div>
              <p className="text-sm text-gray-400">
                Infraestrutura de Governança Minerária Digital
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-white">Plataforma</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-[#b96e48]">Recursos</a></li>
                <li><a href="#modules" className="hover:text-[#b96e48]">Módulos</a></li>
                <li><a href={getLoginUrl()} className="hover:text-[#b96e48]">Entrar</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-white">Contato</h4>
              <p className="text-sm text-gray-400">
                vinicius.debijui@thenell.com.br
              </p>
            </div>
          </div>
          <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-white/10 text-center text-sm text-gray-400">
            <p>© 2025 Qivo Mining. Todos os direitos reservados.</p>
            <p className="mt-2">Infraestrutura de Governança Minerária Digital</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

