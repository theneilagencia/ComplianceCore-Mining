import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { FileText, Upload as UploadIcon, Download, AlertCircle, CheckCircle } from "lucide-react";
import UploadModal from "../components/UploadModal";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import DynamicReportForm from "../components/DynamicReportForm";

export default function GenerateReport() {
 const [standard, setStandard] = useState<string>("JORC_2012");
 const [title, setTitle] = useState<string>("");
 const [projectName, setProjectName] = useState<string>("");
 const [locationInput, setLocationInput] = useState<string>("");
 const [commodity, setCommodity] = useState<string>("");
 const [resourceTonnes, setResourceTonnes] = useState<string>("");
 const [grade, setGrade] = useState<string>("");
 const [description, setDescription] = useState<string>("");
 const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
 const [, navigate] = useLocation();

 const utils = trpc.useUtils();
 
 // Mutation para criar relatório
 const createReport = trpc.technicalReports.generate.create.useMutation({
 onSuccess: (data) => {
 toast.success("Relatório criado com sucesso!", {
 description: `ID: ${data.reportId}`,
 });
 // Limpar formulário
 setTitle("");
 setProjectName("");
 setLocationInput("");
 setCommodity("");
 setResourceTonnes("");
 setGrade("");
 setDescription("");
 // Invalidar lista de relatórios
 utils.technicalReports.generate.list.invalidate();
 },
 onError: (error) => {
 toast.error("Erro ao criar relatório", {
 description: error.message,
 });
 },
 });

 // Query para listar relatórios (sem polling para evitar re-renders)
 const { data: reports, isLoading } = trpc.technicalReports.generate.list.useQuery(
 { limit: 10 },
 {
 refetchInterval: false, // Desabilitar polling automático
 refetchOnWindowFocus: false, // Não refetch ao focar janela
 staleTime: 5 * 60 * 1000, // Considerar dados frescos por 5 minutos
 }
 );

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 
 if (!title || title.length < 5) {
 toast.error("Título inválido", {
 description: "O título deve ter no mínimo 5 caracteres",
 });
 return;
 }

 createReport.mutate({
 standard: standard as any,
 title,
 projectName: projectName || undefined,
 location: locationInput || undefined,
 });
 };

	const handleDownloadTemplate = async (format: string) => {
		try {
			// Mapear formato para kind da API
			const kindMap: Record<string, string> = {
				"Excel": "xlsx",
				"CSV": "csv",
				"PDF": "pdf"
			};
			
			const kind = kindMap[format] || "xlsx";
			const standardMap: Record<string, string> = {
				"JORC_2012": "jorc",
				"NI_43_101": "ni43-101",
				"PERC": "precert",
				"SAMREC": "governance",
				"CRIRSCO": "valuation",
				"CBRR": "jorc"
			};
			
			const templateType = standardMap[standard] || "jorc";
			
			// Fazer download via API
			const url = `/api/templates/${templateType}?format=${kind}&type=report`;
			const response = await fetch(url);
			
			if (!response.ok) {
				throw new Error("Erro ao baixar template");
			}
			
			// Extrair nome do arquivo do header Content-Disposition
			const contentDisposition = response.headers.get("Content-Disposition");
			let filename = `template_${templateType}.${kind}`;
			
			if (contentDisposition) {
				const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
				if (matches && matches[1]) {
					filename = matches[1];
				}
			}
			
			// Criar blob e fazer download
			const blob = await response.blob();
			const downloadUrl = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = downloadUrl;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(downloadUrl);
			
			toast.success(`Template ${format} baixado com sucesso!`, {
				description: `Arquivo: ${filename}`
			});
		} catch (error) {
			console.error("Erro ao baixar template:", error);
			toast.error("Erro ao baixar template", {
				description: "Tente novamente ou entre em contato com o suporte"
			});
		}
	};

 return (
 <DashboardLayout>
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold">Gerar Relatório</h1>
 <p className="text-gray-400 mt-2">
 Crie relatórios técnicos estruturados conforme padrões internacionais
 </p>
 </div>
 </div>

 <Card className="p-6">
 <div className="flex items-center gap-4 mb-6">
 <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
 <FileText className="h-6 w-6 text-blue-600" />
 </div>
 <div className="flex-1">
 <h2 className="text-xl font-semibold">Novo Relatório</h2>
 <p className="text-sm text-gray-400">
 Selecione o padrão e preencha os dados
 </p>
 </div>
 <div className="bg-blue-50 px-4 py-2 rounded-lg">
 <p className="text-sm text-blue-700">
 ⏱ Tempo estimado: <strong>5-10 minutos</strong>
 </p>
 </div>
 </div>

 <Tabs defaultValue="manual" className="w-full">
 <TabsList className="grid w-full grid-cols-2 mb-6">
 <TabsTrigger value="manual">
 <FileText className="h-4 w-4 mr-2" />
 Preencher Manualmente
 </TabsTrigger>
 <TabsTrigger value="upload">
 <UploadIcon className="h-4 w-4 mr-2" />
 Upload de Arquivo
 </TabsTrigger>
 </TabsList>

				{/* Tab: Preencher Manualmente */}
				<TabsContent value="manual">
					<DynamicReportForm
						onSubmit={(data) => {
							if (!data.title || data.title.length < 5) {
								toast.error("Título inválido", {
									description: "O título deve ter no mínimo 5 caracteres",
								});
								return;
							}
							createReport.mutate({
								standard: data.standard as any,
								title: data.title,
								projectName: data.projectName || undefined,
								location: data.location || undefined,
							});
						}}
						isLoading={createReport.isPending}
					/>
					{/* OLD FORM - REMOVED
					<form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <Label htmlFor="standard">Padrão Internacional</Label>
 <Select value={standard} onValueChange={setStandard}>
 <SelectTrigger id="standard">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="JORC_2012">JORC 2012 (Austrália)</SelectItem>
 <SelectItem value="NI_43_101">NI 43-101 (Canadá)</SelectItem>
 <SelectItem value="PERC">PERC (Europa)</SelectItem>
 <SelectItem value="SAMREC">SAMREC (África do Sul)</SelectItem>
 <SelectItem value="CRIRSCO">CRIRSCO (Internacional)</SelectItem>
 <SelectItem value="CBRR">CBRR (Brasil )</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div>
 <Label htmlFor="title">Título do Relatório *</Label>
 <Input
 id="title"
 placeholder="Ex: Relatório Técnico - Projeto Carajás 2025"
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 required
 />
 <p className="text-xs text-gray-500 mt-1">
 Mínimo 5 caracteres. Seja específico para facilitar identificação.
 </p>
 </div>

 <div>
 <Label htmlFor="projectName">Nome do Projeto</Label>
 <Input
 id="projectName"
 placeholder="Ex: Projeto Carajás - Mina de Ferro"
 value={projectName}
 onChange={(e) => setProjectName(e.target.value)}
 />
 </div>

 <div>
 <Label htmlFor="location">Localização</Label>
 <Input
 id="location"
 placeholder="Ex: Pará, Brasil | Coordenadas: -6.0°, -50.0°"
 value={locationInput}
 onChange={(e) => setLocationInput(e.target.value)}
 />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div>
 <Label htmlFor="commodity">Commodity</Label>
 <Input
 id="commodity"
 placeholder="Ex: Ferro, Ouro, Cobre"
 value={commodity}
 onChange={(e) => setCommodity(e.target.value)}
 />
 </div>

 <div>
 <Label htmlFor="resource">Recurso (toneladas)</Label>
 <Input
 id="resource"
 type="number"
 placeholder="Ex: 1000000"
 value={resourceTonnes}
 onChange={(e) => setResourceTonnes(e.target.value)}
 />
 </div>

 <div>
 <Label htmlFor="grade">Teor Médio (%)</Label>
 <Input
 id="grade"
 type="number"
 step="0.01"
 placeholder="Ex: 2.5"
 value={grade}
 onChange={(e) => setGrade(e.target.value)}
 />
 </div>
 </div>

 <div>
 <Label htmlFor="description">Descrição do Projeto</Label>
 <Textarea
 id="description"
 placeholder="Descreva brevemente o projeto, objetivos e principais características..."
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 rows={4}
 />
 </div>

 <Button 
 type="submit" 
 className="w-full" 
 disabled={createReport.isPending}
 >
						{createReport.isPending ? "Gerando..." : "Iniciar Geração →"}
						</Button>
					</form>
					END OLD FORM */}

 <div className="mt-6 p-4 bg-blue-50 rounded-lg">
					<p className="text-sm text-blue-700">
						<strong>Dica:</strong> Você pode fazer upload de relatórios existentes (PDF, DOCX, XLSX, CSV, ZIP) ou preencher manualmente os dados.
					</p>
 </div>
 </TabsContent>

 {/* Tab: Upload de Arquivo */}
 <TabsContent value="upload">
 <div className="space-y-6">
 {/* Download Templates */}
 <div className="border-2 border-dashed border-white/20 rounded-lg p-6">
 <div className="text-center mb-4">
 <Download className="h-12 w-12 text-blue-600 mx-auto mb-3" />
 <h3 className="text-lg font-semibold mb-2">Download de Templates</h3>
 <p className="text-sm text-gray-400 mb-4">
 Baixe um template pré-formatado, preencha com seus dados e faça upload
 </p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
 <Button
 variant="outline"
 onClick={() => handleDownloadTemplate("Excel")}
 className="w-full"
 >
 <Download className="h-4 w-4 mr-2" />
 Template Excel (.xlsx)
 </Button>
 <Button
 variant="outline"
 onClick={() => handleDownloadTemplate("CSV")}
 className="w-full"
 >
 <Download className="h-4 w-4 mr-2" />
 Template CSV
 </Button>
 <Button
 variant="outline"
 onClick={() => handleDownloadTemplate("PDF")}
 className="w-full"
 >
 <Download className="h-4 w-4 mr-2" />
 Exemplo PDF
 </Button>
 </div>
 </div>

 {/* Upload Area */}
 <div className="border-2 border-dashed border-white/20 rounded-lg p-8">
 <div className="text-center">
					<UploadIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
					<h3 className="text-lg font-semibold mb-2">Upload de Relatório</h3>
					<p className="text-sm text-gray-400 mb-4">
						Faça upload de relatórios em PDF, DOCX, XLSX, CSV ou ZIP
					</p>
					<Button onClick={() => setShowUploadModal(true)}>
						<UploadIcon className="h-4 w-4 mr-2" />
						Selecionar Arquivo
					</Button>
					<p className="text-xs text-gray-500 mt-3">
						Formatos aceitos: PDF, DOCX, XLSX, CSV, ZIP (máx. 50MB)
					</p>
 </div>
 </div>

 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
 <div className="flex items-start gap-3">
 <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
 <div>
 <h4 className="font-semibold text-yellow-900 mb-1">Importante</h4>
					<p className="text-sm text-yellow-700">
						Certifique-se de que seu arquivo está no formato correto. 
						O sistema fará análise automática e pode solicitar revisão de campos incertos.
					</p>
 </div>
 </div>
 </div>
 </div>
 </TabsContent>
 </Tabs>
 </Card>

 {/* Relatórios Recentes */}
 <Card className="p-6">
 <h2 className="text-xl font-semibold mb-4">Relatórios Recentes</h2>
 
 {isLoading ? (
 <div className="text-center py-8">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
 </div>
 ) : reports && reports.length > 0 ? (
 <div className="space-y-3">
 {reports.map((report: any) => (
 <div
 key={report.id}
 className="flex items-center justify-between p-4 border rounded-lg hover:bg-[#000020] cursor-pointer"
 onClick={() => navigate(`/reports/${report.id}/review`)}
 >
 <div className="flex items-center gap-3">
 <FileText className="h-5 w-5 text-blue-600" />
 <div>
 <h3 className="font-medium">{report.title}</h3>
 <p className="text-sm text-gray-400">
 {report.standard} • {new Date(report.createdAt).toLocaleDateString('pt-BR')}
 </p>
 </div>
 </div>
 <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
 {report.status === 'completed' ? <CheckCircle className="h-3 w-3 mr-1" /> : null}
 {report.status}
 </Badge>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-8 text-gray-500">
 <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
 <p>Nenhum relatório encontrado</p>
 </div>
 )}
 </Card>
 </div>

	{showUploadModal && (
		<UploadModal open={showUploadModal} onClose={() => setShowUploadModal(false)} />
	)}
 </DashboardLayout>
 );
}

