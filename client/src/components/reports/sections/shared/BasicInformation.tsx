import React from 'react';
import { FormField } from '../../../FormField';

interface BasicInformationProps {
  data: {
    reportTitle: string;
    projectName: string;
    location: string;
    effectiveDate: string;
  };
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
}

export const BasicInformation: React.FC<BasicInformationProps> = ({
  data,
  onChange,
  errors = {}
}) => {
  return (
    <div className="space-y-6">
      <FormField
        label="Título do Relatório"
        name="reportTitle"
        type="text"
        value={data.reportTitle}
        onChange={(e) => onChange('reportTitle', e.target.value)}
        error={errors.reportTitle}
        required
        placeholder="Ex: Mineral Resource Estimate for Gedabek Gold-Copper Project"
        helpText="Use um título descritivo e profissional que reflita o conteúdo do relatório"
        tooltip="O título deve ser claro e indicar o tipo de relatório (Resource Estimate, Reserve Statement, etc)"
      />

      <div className="grid md:grid-cols-2 gap-6">
        <FormField
          label="Nome do Projeto"
          name="projectName"
          type="text"
          value={data.projectName}
          onChange={(e) => onChange('projectName', e.target.value)}
          error={errors.projectName}
          required
          placeholder="Ex: Gedabek Gold-Copper Project"
          tooltip="Nome oficial do projeto minerário"
        />

        <FormField
          label="Localização"
          name="location"
          type="text"
          value={data.location}
          onChange={(e) => onChange('location', e.target.value)}
          error={errors.location}
          required
          placeholder="Ex: Gadabay District, Azerbaijan"
          helpText="Inclua distrito, estado/província e país"
          tooltip="Localização geográfica completa do projeto"
        />
      </div>

      <FormField
        label="Data Efetiva"
        name="effectiveDate"
        type="date"
        value={data.effectiveDate}
        onChange={(e) => onChange('effectiveDate', e.target.value)}
        error={errors.effectiveDate}
        required
        helpText="Data de referência dos dados do relatório (formato: AAAA-MM-DD)"
        tooltip="Data em que os dados e informações do relatório são considerados válidos"
      />
    </div>
  );
};

