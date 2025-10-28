import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, FileJson, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ExplainabilityData {
  reportId: string;
  reportTitle: string;
  reasoning: {
    steps: Array<{
      id: string;
      title: string;
      description: string;
      confidence: number;
      sources: string[];
    }>;
  };
  similarity: {
    comparisons: Array<{
      id: string;
      referenceReport: string;
      similarity: number;
      matchedSections: string[];
      differences: string[];
    }>;
  };
  integrity: {
    checks: Array<{
      id: string;
      check: string;
      status: "passed" | "failed" | "warning";
      details: string;
    }>;
    lossMap: {
      dataPoints: number;
      missingFields: string[];
      qualityScore: number;
    };
  };
}

// Mock data
const mockData: ExplainabilityData = {
  reportId: "rep_123",
  reportTitle: "Projeto Ouro Verde - JORC 2012",
  reasoning: {
    steps: [
      {
        id: "step1",
        title: "Análise de Contexto Geológico",
        description: "Identificação do tipo de depósito mineral baseado em características geológicas regionais e locais.",
        confidence: 0.92,
        sources: ["Geological Survey Database", "Historical Reports", "Satellite Imagery"],
      },
      {
        id: "step2",
        title: "Estimativa de Recursos",
        description: "Cálculo de tonelagem e teor utilizando método de krigagem ordinária com validação cruzada.",
        confidence: 0.88,
        sources: ["Drill Hole Database", "Assay Results", "Geostatistical Models"],
      },
      {
        id: "step3",
        title: "Classificação de Recursos",
        description: "Categorização em Medido, Indicado e Inferido conforme critérios de confiança e espaçamento de furos.",
        confidence: 0.85,
        sources: ["JORC Code 2012", "Drill Spacing Analysis", "Variogram Models"],
      },
      {
        id: "step4",
        title: "Validação de Pessoa Competente",
        description: "Verificação de qualificações e experiência da Pessoa Competente responsável pelo relatório.",
        confidence: 0.95,
        sources: ["CREA Registry", "Professional Background", "Previous Reports"],
      },
    ],
  },
  similarity: {
    comparisons: [
      {
        id: "comp1",
        referenceReport: "Projeto Serra Dourada - JORC 2012",
        similarity: 0.78,
        matchedSections: ["Geology", "Resource Estimate", "QA/QC"],
        differences: ["Mining Method", "Economic Assumptions"],
      },
      {
        id: "comp2",
        referenceReport: "Projeto Vale do Ouro - NI 43-101",
        similarity: 0.65,
        matchedSections: ["Sampling", "Drilling"],
        differences: ["Standard Format", "Competent Person Requirements"],
      },
      {
        id: "comp3",
        referenceReport: "Projeto Mina Rica - JORC 2012",
        similarity: 0.82,
        matchedSections: ["Geology", "Resource Estimate", "Competent Person"],
        differences: ["Commodity Type", "Deposit Model"],
      },
    ],
  },
  integrity: {
    checks: [
      {
        id: "check1",
        check: "Completude de Metadados",
        status: "passed",
        details: "Todos os campos obrigatórios de metadados estão presentes.",
      },
      {
        id: "check2",
        check: "Consistência de Dados Numéricos",
        status: "passed",
        details: "Valores de tonelagem, teor e cutoff grade são consistentes.",
      },
      {
        id: "check3",
        check: "Validação de Datas",
        status: "warning",
        details: "Data efetiva do relatório está próxima de 24 meses (limite recomendado).",
      },
      {
        id: "check4",
        check: "Referências Bibliográficas",
        status: "failed",
        details: "Seção de referências bibliográficas está ausente.",
      },
    ],
    lossMap: {
      dataPoints: 1247,
      missingFields: ["references", "glossary", "appendix_b"],
      qualityScore: 87,
    },
  },
};

export default function ExplainabilityView() {
  const [data] = useState<ExplainabilityData>(mockData);

  const handleExportJSON = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `explainability_${data.reportId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    // Mock PDF export
    alert("PDF export functionality will be implemented with PDF generation service");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Explainability & Loss Map</h1>
          <p className="text-muted-foreground mt-2">
            Análise detalhada do raciocínio, similaridade e integridade do relatório
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportJSON}>
            <FileJson className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
          <Button onClick={handleExportPDF}>
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{data.reportTitle}</CardTitle>
          <CardDescription>Report ID: {data.reportId}</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="reasoning" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reasoning">Raciocínio</TabsTrigger>
          <TabsTrigger value="similarity">Similaridade</TabsTrigger>
          <TabsTrigger value="integrity">Integridade</TabsTrigger>
        </TabsList>

        <TabsContent value="reasoning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Etapas de Raciocínio</CardTitle>
              <CardDescription>
                Processo passo a passo utilizado na geração e análise do relatório
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {data.reasoning.steps.map((step, index) => (
                <div key={step.id} className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold">{step.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                      </div>
                    </div>
                    <Badge variant={step.confidence >= 0.9 ? "default" : "secondary"}>
                      {(step.confidence * 100).toFixed(0)}% confiança
                    </Badge>
                  </div>
                  <div className="ml-11">
                    <Progress value={step.confidence * 100} className="h-2" />
                    <div className="flex flex-wrap gap-2 mt-3">
                      {step.sources.map((source, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {source}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {index < data.reasoning.steps.length - 1 && (
                    <div className="ml-4 h-6 w-0.5 bg-border" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="similarity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Similaridade</CardTitle>
              <CardDescription>
                Comparação com relatórios de referência similares
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {data.similarity.comparisons.map((comp) => (
                <div key={comp.id} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{comp.referenceReport}</h3>
                    <Badge variant={comp.similarity >= 0.75 ? "default" : "secondary"}>
                      {(comp.similarity * 100).toFixed(0)}% similar
                    </Badge>
                  </div>
                  <Progress value={comp.similarity * 100} className="h-2" />
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Seções Correspondentes:</p>
                      <div className="flex flex-wrap gap-2">
                        {comp.matchedSections.map((section, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {section}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Diferenças:</p>
                      <div className="flex flex-wrap gap-2">
                        {comp.differences.map((diff, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {diff}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verificações de Integridade</CardTitle>
              <CardDescription>
                Validações de completude e consistência dos dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.integrity.checks.map((check) => (
                <div key={check.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="mt-0.5">
                    {check.status === "passed" && (
                      <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                    {check.status === "warning" && (
                      <div className="h-5 w-5 rounded-full bg-yellow-500 flex items-center justify-center">
                        <span className="text-white text-xs">!</span>
                      </div>
                    )}
                    {check.status === "failed" && (
                      <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
                        <span className="text-white text-xs">✗</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{check.check}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{check.details}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loss Map (Mapa de Perdas)</CardTitle>
              <CardDescription>
                Análise de campos ausentes e qualidade dos dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Data Points</p>
                  <p className="text-2xl font-bold mt-1">{data.integrity.lossMap.dataPoints}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Missing Fields</p>
                  <p className="text-2xl font-bold mt-1">{data.integrity.lossMap.missingFields.length}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Quality Score</p>
                  <p className="text-2xl font-bold mt-1">{data.integrity.lossMap.qualityScore}%</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Campos Ausentes:</p>
                <div className="flex flex-wrap gap-2">
                  {data.integrity.lossMap.missingFields.map((field, idx) => (
                    <Badge key={idx} variant="destructive" className="text-xs">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Quality Score:</p>
                <Progress value={data.integrity.lossMap.qualityScore} className="h-3" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

