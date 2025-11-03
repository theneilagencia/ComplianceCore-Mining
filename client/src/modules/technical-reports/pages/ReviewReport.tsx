import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { CheckCircle, AlertTriangle, ArrowRight, Save, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";
import LazyPDFViewer from "@/components/PDFViewer.lazy";

export default function ReviewReport() {
 const params = useParams<{ reportId: string }>();
 const [, setLocation] = useLocation();
 const reportId = params.reportId || "";

 const [editedValues, setEditedValues] = useState<Record<string, any>>({});
 const [savedFields, setSavedFields] = useState<Set<string>>(new Set());
 const [showPDFViewer, setShowPDFViewer] = useState(false);

 const utils = trpc.useUtils();

 // Query para buscar o report e fazer polling se estiver em parsing
 const { data: reportStatus } = trpc.technicalReports.generate.get.useQuery(
 { reportId },
 {
 enabled: !!reportId,
 refetchInterval: 3000, // Sempre faz polling a cada 3s enquanto a página está aberta
 }
 );

 // Query para buscar campos que precisam de revisão
 // Só busca se o report existe E não está mais em parsing
 const { data: reviewData, isLoading } = trpc.technicalReports.uploads.getReviewFields.useQuery(
 { reportId },
 { 
 enabled: !!reportId && reportStatus?.status !== 'parsing',
 retry: 1, // Reduz tentativas em caso de erro
 }
 );

 // Mutation para aplicar revisão
 const applyReview = trpc.technicalReports.uploads.applyReview.useMutation({
 onSuccess: (data) => {
 toast.success("Campo atualizado!", {
 description: data.remainingFields > 0 
 ? `Ainda restam ${data.remainingFields} campos para revisar`
 : "Todos os campos foram revisados!",
 });

 // Invalidar query para atualizar lista
 utils.technicalReports.uploads.getReviewFields.invalidate({ reportId });
 utils.technicalReports.generate.list.invalidate();

 if (data.remainingFields === 0) {
 setTimeout(() => {
 toast.success(" Revisão concluída!", {
 description: "O relatório está pronto para auditoria",
 action: {
 label: "Ir para Auditoria",
 onClick: () => setLocation("/reports/audit"),
 },
 });
 }, 1000);
 }
 },
 onError: (error) => {
 toast.error("Erro ao salvar", {
 description: error.message,
 });
 },
 });

 const handleSaveField = async (path: string) => {
 const value = editedValues[path];
 
 if (value === undefined || value === "") {
 toast.error("Campo vazio", {
 description: "Preencha o campo antes de salvar",
 });
 return;
 }

 try {
 await applyReview.mutateAsync({
 reportId,
 updates: [{ path, value }],
 });

 setSavedFields((prev) => new Set(prev).add(path));
 
 // Remover do estado de edição após 1 segundo
 setTimeout(() => {
 setEditedValues((prev) => {
 const next = { ...prev };
 delete next[path];
 return next;
 });
 }, 1000);
 } catch (error) {
 // Error handled by mutation
 }
 };

 // Mostra loading apenas se estiver carregando o status do report inicial
 if (isLoading && !reportStatus) {
 return (
 <DashboardLayout>
 <div className="flex items-center justify-center h-64">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
 </div>
 </DashboardLayout>
 );
 }

 // Se o report não existe
 if (!reportStatus && !isLoading) {
 return (
 <DashboardLayout>
 <div className="text-center py-12">
 <p className="text-gray-400">Relatório não encontrado</p>
 </div>
 </DashboardLayout>
 );
 }

 // Se ainda está em parsing, mostra interface com banner (não bloqueia)
 // Se não está em parsing mas reviewData não existe, significa erro
 if (!reviewData && reportStatus?.status !== 'parsing' && !isLoading) {
 return (
 <DashboardLayout>
 <div className="text-center py-12">
 <p className="text-red-400">Erro ao carregar dados de revisão</p>
 <p className="text-gray-400 text-sm mt-2">O processamento do relatório pode ter falhado</p>
 </div>
 </DashboardLayout>
 );
 }

 const totalFields = reviewData?.totalFields || 0;
 const resolvedFields = savedFields.size;
 const progress = totalFields > 0 ? (resolvedFields / totalFields) * 100 : 0;

 return (
 <DashboardLayout>
 <div className="space-y-6">
 <div>
 <h1 className="text-3xl font-bold">Revisão Humana</h1>
 <p className="text-gray-400 mt-2">
 Valide os campos extraídos automaticamente para garantir precisão
 </p>
 </div>

 {/* Banner de parsing em progresso */}
 {reportStatus?.status === 'parsing' && (
 <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
 <div className="flex items-start gap-4">
 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 flex-shrink-0 mt-1"></div>
 <div>
 <h3 className="font-semibold text-blue-900 mb-2">
 Processamento em andamento...
 </h3>
 <p className="text-sm text-blue-800">
 O relatório está sendo analisado e os campos estão sendo extraídos.
 Esta página será atualizada automaticamente quando o processamento for concluído.
 </p>
 </div>
 </div>
 </Card>
 )}

 {/* Se ainda está em parsing, não mostra campos */}
 {reportStatus?.status === 'parsing' && (
 <Card className="p-12">
 <div className="flex flex-col items-center justify-center gap-4 text-center">
 <div className="animate-pulse text-6xl">⏳</div>
 <p className="text-lg text-gray-600">Aguardando conclusão do processamento...</p>
 <p className="text-sm text-gray-400">Os campos aparecerão aqui automaticamente</p>
 </div>
 </Card>
 )}

 {/* Só mostra o conteúdo se não estiver em parsing */}
 {reportStatus?.status !== 'parsing' && reviewData && (
 <>

 {/* Banner informativo */}
 <Card className="p-6 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
 <div className="flex items-start gap-4">
 <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
 <div>
 <h3 className="font-semibold text-orange-900 mb-2">
 Campos que precisam de validação humana
 </h3>
 <p className="text-sm text-orange-800">
 Encontramos campos que não puderam ser extraídos com alta confiança.
 Revise as seções abaixo para garantir precisão e conformidade com os padrões internacionais.
 </p>
 </div>
 </div>
 </Card>

 {/* Progress bar */}
 <Card className="p-6">
 <div className="flex items-center justify-between mb-4">
 <div>
 <p className="text-sm text-gray-400">Progresso da Revisão</p>
 <p className="text-2xl font-bold">
 {resolvedFields} / {totalFields}
 </p>
 </div>
 <Badge variant={progress === 100 ? "default" : "secondary"}>
 {progress.toFixed(0)}%
 </Badge>
 </div>
 <div className="bg-gray-200 rounded-full h-3">
 <div
 className="bg-[#2f2c79] h-3 rounded-full transition-all duration-500"
 style={{ width: `${progress}%` }}
 />
 </div>
 </Card>

 {/* Campos para revisão */}
 <div className="space-y-4">
 {reviewData.fieldsToReview.map((field, index) => {
 const isSaved = savedFields.has(field.path);
 const currentValue = editedValues[field.path] ?? "";

 return (
 <Card key={index} className={isSaved ? "border-green-500 bg-green-50" : ""}>
 <div className="p-6">
 <div className="flex items-start justify-between mb-4">
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-2">
 <Label className="text-base font-semibold">
 Campo {index + 1}
 </Label>
 {isSaved && (
 <Badge variant="default" className="bg-green-600">
 <CheckCircle className="h-3 w-3 mr-1" />
 Salvo
 </Badge>
 )}
 </div>
 <p className="text-sm text-gray-400 mb-1">
 <span className="font-mono text-xs bg-[#171a4a] px-2 py-1 rounded">
 {field.path}
 </span>
 </p>
 <p className="text-sm text-orange-600 flex items-center gap-1">
 <AlertTriangle className="h-4 w-4" />
 {field.hint}
 </p>
 </div>
 </div>

 {field.path.includes("contentText") || field.path.includes("content") ? (
 <Textarea
 value={currentValue}
 onChange={(e) =>
 setEditedValues((prev) => ({
 ...prev,
 [field.path]: e.target.value,
 }))
 }
 placeholder="Digite o conteúdo correto..."
 rows={4}
 disabled={isSaved}
 />
 ) : (
 <Input
 type={field.path.includes("tonnage") || field.path.includes("grade") ? "number" : "text"}
 value={currentValue}
 onChange={(e) =>
 setEditedValues((prev) => ({
 ...prev,
 [field.path]: field.path.includes("tonnage") || field.path.includes("grade") 
 ? parseFloat(e.target.value) 
 : e.target.value,
 }))
 }
 placeholder="Digite o valor correto..."
 disabled={isSaved}
 />
 )}

 <div className="flex justify-end mt-4">
 <Button
 onClick={() => handleSaveField(field.path)}
 disabled={isSaved || applyReview.isPending}
 size="sm"
 >
 {isSaved ? (
 <>
 <CheckCircle className="h-4 w-4 mr-2" />
 Salvo
 </>
 ) : (
 <>
 <Save className="h-4 w-4 mr-2" />
 Salvar
 </>
 )}
 </Button>
 </div>
 </div>
 </Card>
 );
 })}
 </div>

 {/* Ação final */}
 {progress === 100 && (
 <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <CheckCircle className="h-8 w-8 text-green-600" />
 <div>
 <h3 className="font-semibold text-green-900">
 Revisão Concluída!
 </h3>
 <p className="text-sm text-green-800">
 Todos os campos foram validados. O relatório está pronto para auditoria.
 </p>
 </div>
 </div>
 <Button onClick={() => setLocation("/reports/audit")}>
 Ir para Auditoria
 <ArrowRight className="h-4 w-4 ml-2" />
 </Button>
 </div>
 </Card>
 )}
 </>
 )}
 </div>
 </DashboardLayout>
 );
}


