import React from 'react';
import { FormField } from '../../../FormField';

interface CompetentPersonProps {
  data: {
    name: string;
    affiliation: string;
    professionalRegistration: string;
    contactDetails?: string;
  };
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
  registrationLabel?: string;
  registrationPlaceholder?: string;
  registrationHelpText?: string;
}

export const CompetentPerson: React.FC<CompetentPersonProps> = ({
  data,
  onChange,
  errors = {},
  registrationLabel = 'Registro Profissional',
  registrationPlaceholder = 'Ex: FAusIMM (CP) #123456',
  registrationHelpText = 'Exemplo: FAusIMM, P.Geo, P.Eng, AIG, etc'
}) => {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <FormField
          label="Nome Completo"
          name="competentPerson.name"
          type="text"
          value={data.name}
          onChange={(e) => onChange('competentPerson.name', e.target.value)}
          error={errors['competentPerson.name']}
          required
          placeholder="Ex: Dr. John Smith"
          tooltip="Nome completo da Pessoa Competente responsável pelo relatório"
        />

        <FormField
          label="Afiliação"
          name="competentPerson.affiliation"
          type="text"
          value={data.affiliation}
          onChange={(e) => onChange('competentPerson.affiliation', e.target.value)}
          error={errors['competentPerson.affiliation']}
          required
          placeholder="Ex: SRK Consulting"
          tooltip="Empresa ou organização à qual a Pessoa Competente está vinculada"
        />
      </div>

      <FormField
        label={registrationLabel}
        name="competentPerson.professionalRegistration"
        type="text"
        value={data.professionalRegistration}
        onChange={(e) => onChange('competentPerson.professionalRegistration', e.target.value)}
        error={errors['competentPerson.professionalRegistration']}
        required
        placeholder={registrationPlaceholder}
        helpText={registrationHelpText}
        tooltip="Número de registro profissional da Pessoa Competente"
      />

      {data.contactDetails !== undefined && (
        <FormField
          label="Detalhes de Contato"
          name="competentPerson.contactDetails"
          type="text"
          value={data.contactDetails}
          onChange={(e) => onChange('competentPerson.contactDetails', e.target.value)}
          error={errors['competentPerson.contactDetails']}
          placeholder="Ex: john.smith@srk.com | +61 8 9288 2000"
          helpText="Email e/ou telefone de contato"
          tooltip="Informações de contato da Pessoa Competente"
        />
      )}
    </div>
  );
};

