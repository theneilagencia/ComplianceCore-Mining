import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getSchemaByStandard, getAllStandards, type FieldDefinition } from '../schemas/standardSchemas';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DynamicReportFormProps {
  onSubmit: (data: Record<string, any>) => void;
  isLoading?: boolean;
}

export default function DynamicReportForm({ onSubmit, isLoading }: DynamicReportFormProps) {
  const [standard, setStandard] = useState<string>('NI_43_101');
  const [formData, setFormData] = useState<Record<string, any>>({});

  const schema = getSchemaByStandard(standard);
  const standards = getAllStandards();

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obrigatórios
    const requiredFields = schema.sections.flatMap((section) =>
      section.fields.filter((field) => field.required).map((field) => field.name)
    );

    const missingFields = requiredFields.filter((fieldName) => !formData[fieldName]);

    if (missingFields.length > 0) {
      alert(`Por favor, preencha todos os campos obrigatórios: ${missingFields.join(', ')}`);
      return;
    }

    onSubmit({
      standard,
      ...formData,
    });
  };

  const renderField = (field: FieldDefinition) => {
    const value = formData[field.name] || '';
    const gridClass = field.gridColumn === 'full' ? 'col-span-2' : '';

    return (
      <div key={field.name} className={gridClass}>
        <Label htmlFor={field.name} className="flex items-center gap-2">
          {field.label}
          {field.required && <span className="text-red-500">*</span>}
          {field.helpText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{field.helpText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </Label>

        {field.type === 'text' && (
          <Input
            id={field.name}
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="mt-2"
          />
        )}

        {field.type === 'number' && (
          <Input
            id={field.name}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="mt-2"
          />
        )}

        {field.type === 'textarea' && (
          <Textarea
            id={field.name}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="mt-2 min-h-[100px]"
          />
        )}

        {field.type === 'select' && field.options && (
          <Select
            value={value}
            onValueChange={(val) => handleFieldChange(field.name, val)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {field.helpText && (
          <p className="text-sm text-muted-foreground mt-1">{field.helpText}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Standard Selector */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="standard" className="text-lg font-semibold">
              Padrão Internacional
            </Label>
            <Select value={standard} onValueChange={setStandard}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {standards.map((std) => (
                  <SelectItem key={std.code} value={std.code}>
                    {std.name} ({std.description})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Standard Description */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>{schema.name}:</strong> {schema.description}
            </p>
          </div>
        </div>
      </Card>

      {/* Dynamic Sections */}
      {schema.sections.map((section, sectionIndex) => (
        <Card key={sectionIndex} className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{section.title}</h3>
              {section.description && (
                <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields.map(renderField)}
            </div>
          </div>
        </Card>
      ))}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={isLoading}
          className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isLoading ? 'Gerando...' : 'Iniciar Geração →'}
        </Button>
      </div>
    </form>
  );
}

