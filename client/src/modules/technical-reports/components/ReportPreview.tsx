import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, FileText, Download, Edit } from 'lucide-react';
import { getSchemaByStandard, type StandardSchema } from '../schemas/standardSchemasExpanded';

interface ReportPreviewProps {
  formData: Record<string, any>;
  standard: string;
  onClose: () => void;
  onEdit: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function ReportPreview({
  formData,
  standard,
  onClose,
  onEdit,
  onConfirm,
  isLoading,
}: ReportPreviewProps) {
  const schema = getSchemaByStandard(standard);

  const renderFieldValue = (fieldName: string, value: any) => {
    if (!value || value === '') return <span className="text-gray-400 italic">Não preenchido</span>;
    
    if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Não';
    }
    
    if (typeof value === 'number') {
      return value.toLocaleString('pt-BR');
    }
    
    // For long text, truncate
    if (typeof value === 'string' && value.length > 200) {
      return (
        <div>
          <p className="whitespace-pre-wrap">{value.substring(0, 200)}...</p>
          <span className="text-sm text-blue-600 cursor-pointer hover:underline">Ver mais</span>
        </div>
      );
    }
    
    return <p className="whitespace-pre-wrap">{value}</p>;
  };

  const countFilledFields = () => {
    const allFields = schema.sections.flatMap((section) => section.fields);
    const filledFields = allFields.filter((field) => formData[field.name] && formData[field.name] !== '');
    return { filled: filledFields.length, total: allFields.length };
  };

  const { filled, total } = countFilledFields();
  const completionPercentage = Math.round((filled / total) * 100);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white/5 dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Preview do Relatório</h2>
                <p className="text-blue-100">Revise os dados antes de gerar o relatório</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/5/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Campos preenchidos</span>
              <span className="font-semibold">{filled} de {total} ({completionPercentage}%)</span>
            </div>
            <div className="w-full bg-white/5/20 rounded-full h-2">
              <div
                className="bg-white/5 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Standard Badge */}
          <div className="flex items-center gap-3">
            <Badge className="text-lg px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500">
              {schema.name}
            </Badge>
            <span className="text-sm text-gray-400 dark:text-gray-400">{schema.description}</span>
          </div>

          {/* Sections */}
          {schema.sections.map((section, sectionIndex) => {
            const sectionFields = section.fields.filter((field) => formData[field.name]);
            
            if (sectionFields.length === 0) return null;

            return (
              <Card key={sectionIndex} className="p-6">
                <div className="space-y-4">
                  <div className="border-b pb-3">
                    <h3 className="text-lg font-semibold text-white dark:text-gray-100">
                      {section.title}
                    </h3>
                    {section.description && (
                      <p className="text-sm text-gray-400 dark:text-gray-400 mt-1">
                        {section.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-4">
                    {section.fields.map((field) => {
                      const value = formData[field.name];
                      if (!value || value === '') return null;

                      return (
                        <div key={field.name} className="border-l-2 border-blue-500 pl-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-300 dark:text-gray-300">
                              {field.label}
                            </span>
                            {field.required && (
                              <Badge variant="outline" className="text-xs">Obrigatório</Badge>
                            )}
                          </div>
                          <div className="text-white dark:text-gray-100">
                            {renderFieldValue(field.name, value)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            );
          })}

          {/* Empty Fields Warning */}
          {filled < total && (
            <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <div className="text-yellow-600 dark:text-yellow-400">⚠️</div>
                <div>
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                    Campos não preenchidos
                  </h4>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {total - filled} campos não foram preenchidos. Você pode continuar, mas o relatório
                    pode ficar incompleto. Recomendamos preencher todos os campos obrigatórios.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-[#000020] dark:bg-gray-800">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={onEdit}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Editar Dados
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                onClick={onConfirm}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Confirmar e Gerar Relatório
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

