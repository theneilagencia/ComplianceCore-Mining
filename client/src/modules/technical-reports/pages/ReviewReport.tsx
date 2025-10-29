import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { CheckCircle, AlertTriangle, ArrowRight, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";

export default function ReviewReport() {
 const params = useParams<{ reportId: string }>();
 const [, setLocation] = useLocation();
 const reportId = params.reportId || "";

 const [editedValues, setEditedValues] = useState<Record<string, any>>({});
 const [savedFields, setSavedFields] = useState<Set<string>>(new Set());

 const utils = trpc.useUtils();

 // Query para buscar campos que precisam de revisão
 const { data: reviewData, isLoading } = trpc.technicalReports.uploads.getReviewFields.useQuery(
 { reportId },
 { enabled: !!reportId }
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

 if (isLoading) {
 return (
 <DashboardLayout>
 <div className="flex items-center justify-center h-64">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
 </div>
 </DashboardLayout>
 );
 }

 if (!reviewData) {
 return (
 <DashboardLayout>
 <div className="text-center py-12">
 <p className="text-gray-400">Relatório não encontrado</p>
 </div>
 </DashboardLayout>
 );
 }

 const totalFields = reviewData.totalFields;
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
 </div>
 </DashboardLayout>
 );
}

