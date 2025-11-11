import React from 'react';
import { FormField } from '../../../FormField';

interface Section3ResourcesProps {
  data: {
    databaseIntegrity: string;
    siteVisits: string;
    geologicalInterpretation: string;
    dimensions: string;
    estimationTechniques: string;
    moisture: string;
    cutOffParameters: string;
    miningFactors: string;
    metallurgicalFactors: string;
    environmentalFactors: string;
    bulkDensity: string;
    classification: string;
    tonnage: string;
    grade: string;
    audits: string;
    relativeAccuracy: string;
  };
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
}

export const Section3Resources: React.FC<Section3ResourcesProps> = ({
  data,
  onChange,
  errors = {}
}) => {
  return (
    <div className="space-y-6">
      <FormField
        label="Database Integrity"
        name="section3.databaseIntegrity"
        type="textarea"
        rows={3}
        value={data.databaseIntegrity}
        onChange={(value) => onChange('section3.databaseIntegrity', value)}
        error={errors['section3.databaseIntegrity']}
        required
        placeholder="Medidas tomadas para garantir a integridade dos dados. Procedimentos de validação..."
        tooltip="Measures taken to ensure that data has not been corrupted by, for example, transcription or keying errors"
      />

      <FormField
        label="Site Visits"
        name="section3.siteVisits"
        type="textarea"
        rows={2}
        value={data.siteVisits}
        onChange={(value) => onChange('section3.siteVisits', value)}
        error={errors['section3.siteVisits']}
        required
        placeholder="Comentários sobre visitas ao local pela Pessoa Competente e o resultado dessas visitas..."
        tooltip="Comment on any site visits undertaken by the Competent Person and the outcome of those visits"
      />

      <FormField
        label="Geological Interpretation"
        name="section3.geologicalInterpretation"
        type="textarea"
        rows={4}
        value={data.geologicalInterpretation}
        onChange={(value) => onChange('section3.geologicalInterpretation', value)}
        error={errors['section3.geologicalInterpretation']}
        required
        placeholder="Confiança na interpretação geológica do depósito mineral. Natureza dos dados usados e interpretações alternativas..."
        helpText="Descreva o uso de geologia, geofísica, geoquímica e controles de mineralização"
        tooltip="Confidence in (or conversely, the uncertainty of) the geological interpretation of the mineral deposit"
      />

      <FormField
        label="Dimensions"
        name="section3.dimensions"
        type="textarea"
        rows={2}
        value={data.dimensions}
        onChange={(value) => onChange('section3.dimensions', value)}
        error={errors['section3.dimensions']}
        required
        placeholder="Extensão e variabilidade do Recurso Mineral expressa como comprimento, largura, profundidade..."
        tooltip="The extent and variability of the Mineral Resource expressed as length (along strike or otherwise), plan width, and depth below surface"
      />

      <FormField
        label="Estimation and Modelling Techniques"
        name="section3.estimationTechniques"
        type="textarea"
        rows={5}
        value={data.estimationTechniques}
        onChange={(value) => onChange('section3.estimationTechniques', value)}
        error={errors['section3.estimationTechniques']}
        required
        placeholder="Natureza e adequação das técnicas de estimativa aplicadas. Método de estimativa (ex: Ordinary Kriging, Inverse Distance)..."
        helpText="Inclua parâmetros de busca, tamanho de blocos, domínios de estimativa, tratamento de outliers"
        tooltip="The nature and appropriateness of the estimation technique(s) applied and key assumptions, including treatment of extreme grade values"
      />

      <FormField
        label="Moisture"
        name="section3.moisture"
        type="textarea"
        rows={2}
        value={data.moisture}
        onChange={(value) => onChange('section3.moisture', value)}
        error={errors['section3.moisture']}
        required
        placeholder="Se as tonelagens são estimadas em base seca ou úmida. Método de determinação de umidade..."
        tooltip="Whether the tonnages are estimated on a dry basis or with natural moisture, and the method of determination of the moisture content"
      />

      <FormField
        label="Cut-off Parameters"
        name="section3.cutOffParameters"
        type="textarea"
        rows={3}
        value={data.cutOffParameters}
        onChange={(value) => onChange('section3.cutOffParameters', value)}
        error={errors['section3.cutOffParameters']}
        required
        placeholder="Base para o teor de corte adotado. Justificativa técnica e econômica..."
        helpText="Ex: 0.5% Cu para recursos de cobre, 0.3 g/t Au para ouro"
        tooltip="The basis of the adopted cut-off grade(s) or quality parameters applied"
      />

      <FormField
        label="Mining Factors or Assumptions"
        name="section3.miningFactors"
        type="textarea"
        rows={3}
        value={data.miningFactors}
        onChange={(value) => onChange('section3.miningFactors', value)}
        error={errors['section3.miningFactors']}
        placeholder="Suposições feitas sobre métodos de mineração, parâmetros de mineração (recuperação, diluição)..."
        tooltip="Assumptions made regarding possible mining methods, minimum mining dimensions and internal (or, if applicable, external) mining dilution"
      />

      <FormField
        label="Metallurgical Factors or Assumptions"
        name="section3.metallurgicalFactors"
        type="textarea"
        rows={3}
        value={data.metallurgicalFactors}
        onChange={(value) => onChange('section3.metallurgicalFactors', value)}
        error={errors['section3.metallurgicalFactors']}
        placeholder="Suposições metalúrgicas usadas. Testes de processamento, recuperação esperada..."
        tooltip="The metallurgical process proposed and the appropriateness of that process to the style of mineralisation"
      />

      <FormField
        label="Environmental Factors or Assumptions"
        name="section3.environmentalFactors"
        type="textarea"
        rows={2}
        value={data.environmentalFactors}
        onChange={(value) => onChange('section3.environmentalFactors', value)}
        error={errors['section3.environmentalFactors']}
        placeholder="Suposições sobre possíveis métodos de tratamento de resíduos e disposição..."
        tooltip="Assumptions made regarding possible waste and process residue disposal options"
      />

      <FormField
        label="Bulk Density"
        name="section3.bulkDensity"
        type="textarea"
        rows={3}
        value={data.bulkDensity}
        onChange={(value) => onChange('section3.bulkDensity', value)}
        error={errors['section3.bulkDensity']}
        required
        placeholder="Base para as determinações de densidade bulk. Método de medição, frequência de medições, valores típicos..."
        helpText="Ex: 2.7 t/m³ para minério, 2.5 t/m³ para estéril"
        tooltip="Whether assumed or determined. If assumed, the basis for the assumptions. If determined, the method used"
      />

      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Classification<span className="text-red-500 ml-1">*</span>
          </label>
          <select
            value={data.classification}
            onChange={(e) => onChange('section3.classification', e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-white/20 bg-white/5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            required
          >
            <option value="">Selecione...</option>
            <option value="Measured">Measured</option>
            <option value="Indicated">Indicated</option>
            <option value="Inferred">Inferred</option>
            <option value="Measured+Indicated">Measured + Indicated</option>
          </select>
          {errors['section3.classification'] && (
            <p className="text-sm text-red-600">{errors['section3.classification']}</p>
          )}
        </div>

        <FormField
          label="Tonnage (Mt)"
          name="section3.tonnage"
          type="number"
          value={data.tonnage}
          onChange={(value) => onChange('section3.tonnage', value)}
          error={errors['section3.tonnage']}
          required
          placeholder="Ex: 25.5"
          tooltip="Tonelagem total em milhões de toneladas"
        />

        <FormField
          label="Grade (%)"
          name="section3.grade"
          type="number"
          value={data.grade}
          onChange={(value) => onChange('section3.grade', value)}
          error={errors['section3.grade']}
          required
          placeholder="Ex: 1.25"
          tooltip="Teor médio do recurso mineral"
        />
      </div>

      <FormField
        label="Audits or Reviews"
        name="section3.audits"
        type="textarea"
        rows={2}
        value={data.audits}
        onChange={(value) => onChange('section3.audits', value)}
        error={errors['section3.audits']}
        placeholder="Resultados de quaisquer auditorias ou revisões da estimativa de Recursos Minerais..."
        tooltip="The results of any audits or reviews of Mineral Resource estimates"
      />

      <FormField
        label="Discussion of Relative Accuracy/Confidence"
        name="section3.relativeAccuracy"
        type="textarea"
        rows={3}
        value={data.relativeAccuracy}
        onChange={(value) => onChange('section3.relativeAccuracy', value)}
        error={errors['section3.relativeAccuracy']}
        required
        placeholder="Discussão da precisão relativa da estimativa. Fatores que podem afetar a precisão..."
        helpText="Inclua se foram feitas análises de sensibilidade ou estudos de reconciliação"
        tooltip="Where appropriate a statement of the relative accuracy and confidence level in the Mineral Resource estimate"
      />
    </div>
  );
};

