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
import UploadModalAtomic from "../components/UploadModalAtomic";
import { Badge } from "@/components/ui/badge";
import { ReportListSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Report, ReportStandard, STATUS_COLORS, STATUS_LABELS } from "../types";
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

 // Query para listar relatórios com retry logic
 const { data: reports, isLoading, error, refetch } = trpc.technicalReports.generate.list.useQuery(
 { limit: 10 },
 {
 retry: 3, // Retry até 3 vezes em caso de falha
 retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
 refetchInterval: false, // Desabilitar polling automático
 refetchOnWindowFocus: false, // Não refetch ao focar janela
 staleTime: 5 * 60 * 1000, // Considerar dados frescos por 5 minutos
 }
 );

 // Handle query errors with toast notification
 useEffect(() => {
 if (error) {
 console.error("[GenerateReport] Error loading reports:", error);
 toast.error("Erro ao carregar relatórios", {
 description: error.message || "Tente novamente mais tarde",
 action: {
 label: "Tentar Novamente",
 onClick: () => refetch(),
 },
 });
 }
 }, [error, refetch]);

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
		const toastId = toast.loading(`Preparando template ${format}...`);
		
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
			
			// Fazer download via API com timeout de 30 segundos
			const url = `/api/templates/${templateType}?format=${kind}&type=report`;
			
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 30000);
			
			let response: Response;
			try {
				response = await fetch(url, { signal: controller.signal });
			} catch (fetchError) {
				clearTimeout(timeoutId);
				if (fetchError instanceof Error && fetchError.name === 'AbortError') {
					throw new Error("Tempo limite excedido. O servidor está demorando muito para responder. Tente novamente.");
				}
				throw new Error("Erro de conexão. Verifique sua internet e tente novamente.");
			}
			
			clearTimeout(timeoutId);
			
			// Validar resposta
			if (!response.ok) {
				if (response.status === 404) {
					throw new Error(`Template ${format} não encontrado para o padrão ${standard}.`);
				} else if (response.status === 403) {
					throw new Error("Você não tem permissão para baixar este template.");
				} else if (response.status >= 500) {
					throw new Error("Erro no servidor. Tente novamente em alguns instantes.");
				}
				throw new Error(`Erro ao baixar template (${response.status})`);
			}
			
			// Validar Content-Type
			const contentType = response.headers.get("Content-Type");
			const expectedTypes: Record<string, string[]> = {
				xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/octet-stream"],
				csv: ["text/csv", "text/plain", "application/csv"],
				pdf: ["application/pdf"],
			};
			
			const validTypes = expectedTypes[kind] || [];
			if (contentType && !validTypes.some(type => contentType.includes(type))) {
				console.warn(`Content-Type inesperado: ${contentType} para formato ${kind}`);
			}
			
			// Extrair nome do arquivo do header Content-Disposition
			const contentDisposition = response.headers.get("Content-Disposition");
			let filename = `template_${templateType}_${standard}.${kind}`;
			
			if (contentDisposition) {
				const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
				if (matches && matches[1]) {
					filename = matches[1].replace(/['"]/g, '');
				}
			}
			
			// Verificar tamanho do arquivo para progress em arquivos grandes
			const contentLength = response.headers.get("Content-Length");
			const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
			
			// Para arquivos > 5MB, mostrar progresso
			if (totalSize > 5 * 1024 * 1024) {
				toast.loading(`Baixando... 0%`, { id: toastId });
				// Nota: Progress tracking real requer ReadableStream
				// Implementação simplificada aqui
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
			
			toast.success(`Template ${format} baixado!`, {
				id: toastId,
				description: `Arquivo: ${filename} (${(blob.size / 1024).toFixed(1)} KB)`
			});
		} catch (error) {
			console.error("[TemplateDownload] Error:", error);
			const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao baixar template";
			toast.error("Erro no download", {
				id: toastId,
				description: errorMessage,
				action: {
					label: "Tentar Novamente",
					onClick: () => handleDownloadTemplate(format),
				},
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
 <div>
 <h2 className="text-xl font-semibold mb-4">Relatórios Recentes</h2>
 
 {isLoading ? (
 <ReportListSkeleton count={5} />
 ) : error ? (
 <EmptyState
 variant="error"
 />
 ) : reports && reports.items && reports.items.length > 0 ? (
 <Card className="p-6">
 <div className="space-y-3">
 {reports.items.map((report) => (
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
 {report.standard} • {report.createdAt ? new Date(report.createdAt).toLocaleDateString('pt-BR') : 'Data não disponível'}
 </p>
 </div>
 </div>
 <Badge variant={report.status === 'audited' || report.status === 'certified' ? 'default' : 'secondary'}>
 {(report.status === 'audited' || report.status === 'certified') ? <CheckCircle className="h-3 w-3 mr-1" /> : null}
 {report.status}
 </Badge>
 </div>
 ))}
 </div>
 </Card>
 ) : (
 <EmptyState
 variant="no-reports"
 onCreateReport={() => {
 // Scroll to top to show form
 window.scrollTo({ top: 0, behavior: 'smooth' });
 }}
 onUploadReport={() => setShowUploadModal(true)}
 />
 )}
 </div>

	<UploadModalAtomic 
		isOpen={showUploadModal} 
		onClose={() => setShowUploadModal(false)}
		onSuccess={(result) => {
			if (import.meta.env.DEV) {
				console.log('[GenerateReport] Upload success! Navigating to review...');
				console.log('[GenerateReport] Report ID:', result.reportId);
			}
			navigate(`/reports/${result.reportId}/review`);
		}}
	/>
 </div>
 </DashboardLayout>
 );
}

