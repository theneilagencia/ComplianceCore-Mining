import React from 'react';
import { FormField } from '../../../FormField';

interface Section1SamplingProps {
  data: {
    samplingTechniques: string;
    drillingTechniques: string;
    drillSampleRecovery: string;
    logging: string;
    subSamplingTechniques: string;
    qualityOfAssayData: string;
    verificationOfSampling: string;
    locationOfDataPoints: string;
    dataSpacingAndDistribution: string;
    orientationOfData: string;
    sampleSecurity: string;
    auditsOrReviews: string;
  };
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
}

export const Section1Sampling: React.FC<Section1SamplingProps> = ({
  data,
  onChange,
  errors = {}
}) => {
  return (
    <div className="space-y-6">
      <FormField
        label="Sampling Techniques"
        name="section1.samplingTechniques"
        type="textarea"
        rows={4}
        value={data.samplingTechniques}
        onChange={(e) => onChange('section1.samplingTechniques', e.target.value)}
        error={errors['section1.samplingTechniques']}
        required
        placeholder="Descreva a natureza e qualidade da amostragem (ex: canais de corte, chips aleatórios, ferramentas especializadas)..."
        helpText="Inclua referência às medidas tomadas para garantir representatividade da amostra"
        tooltip="Nature and quality of sampling (eg cut channels, random chips, or specific specialised industry standard measurement tools)"
      />

      <FormField
        label="Drilling Techniques"
        name="section1.drillingTechniques"
        type="textarea"
        rows={3}
        value={data.drillingTechniques}
        onChange={(e) => onChange('section1.drillingTechniques', e.target.value)}
        error={errors['section1.drillingTechniques']}
        required
        placeholder="Tipo de perfuração (ex: core, RC, open-hole hammer, rotary air blast) e detalhes (diâmetro, profundidade, orientação)..."
        tooltip="Drill type (eg core, reverse circulation, open-hole hammer, rotary air blast, auger, Bangka, sonic, etc) and details"
      />

      <FormField
        label="Drill Sample Recovery"
        name="section1.drillSampleRecovery"
        type="textarea"
        rows={3}
        value={data.drillSampleRecovery}
        onChange={(e) => onChange('section1.drillSampleRecovery', e.target.value)}
        error={errors['section1.drillSampleRecovery']}
        required
        placeholder="Método de registro e avaliação da recuperação de amostras. Medidas para maximizar a recuperação..."
        helpText="Inclua se existe relação entre recuperação e teor"
        tooltip="Method of recording and assessing core and chip sample recoveries and results assessed"
      />

      <FormField
        label="Logging"
        name="section1.logging"
        type="textarea"
        rows={3}
        value={data.logging}
        onChange={(e) => onChange('section1.logging', e.target.value)}
        error={errors['section1.logging']}
        required
        placeholder="Descreva se as amostras foram registradas geologicamente e geotecnicamente com detalhe suficiente..."
        helpText="Indique se o registro é qualitativo ou quantitativo. Comprimento total registrado."
        tooltip="Whether core and chip samples have been geologically and geotechnically logged to a level of detail to support appropriate Mineral Resource estimation"
      />

      <FormField
        label="Sub-sampling Techniques and Sample Preparation"
        name="section1.subSamplingTechniques"
        type="textarea"
        rows={4}
        value={data.subSamplingTechniques}
        onChange={(e) => onChange('section1.subSamplingTechniques', e.target.value)}
        error={errors['section1.subSamplingTechniques']}
        required
        placeholder="Se core: cortado ou serrado, quarter/half core. Se non-core: riffled, tube sampled, rotary split. Procedimentos de controle de qualidade..."
        helpText="Descreva a natureza, qualidade e adequação da técnica de preparação de amostras"
        tooltip="If core, whether cut or sawn and whether quarter, half or all core taken. Quality control procedures adopted"
      />

      <FormField
        label="Quality of Assay Data and Laboratory Tests"
        name="section1.qualityOfAssayData"
        type="textarea"
        rows={4}
        value={data.qualityOfAssayData}
        onChange={(e) => onChange('section1.qualityOfAssayData', e.target.value)}
        error={errors['section1.qualityOfAssayData']}
        required
        placeholder="Natureza, qualidade e adequação dos procedimentos de ensaio e laboratório. Técnica parcial ou total..."
        helpText="Para ferramentas geofísicas, espectrômetros, XRF portátil, etc: parâmetros, marca, modelo, tempos de leitura, calibrações"
        tooltip="The nature, quality and appropriateness of the assaying and laboratory procedures used and whether the technique is considered partial or total"
      />

      <FormField
        label="Verification of Sampling and Assaying"
        name="section1.verificationOfSampling"
        type="textarea"
        rows={3}
        value={data.verificationOfSampling}
        onChange={(e) => onChange('section1.verificationOfSampling', e.target.value)}
        error={errors['section1.verificationOfSampling']}
        required
        placeholder="Verificação de resultados significativos por pessoa independente ou diferente. Uso de gêmeos. Procedimentos de validação de dados..."
        tooltip="The verification of significant intersections by either independent or alternative company personnel"
      />

      <FormField
        label="Location of Data Points"
        name="section1.locationOfDataPoints"
        type="textarea"
        rows={3}
        value={data.locationOfDataPoints}
        onChange={(e) => onChange('section1.locationOfDataPoints', e.target.value)}
        error={errors['section1.locationOfDataPoints']}
        required
        placeholder="Precisão e qualidade das pesquisas usadas para localizar furos de sondagem, trincheiras, pontos de amostragem. Sistema de coordenadas..."
        helpText="Especifique o datum, projeção e zona (ex: WGS84 UTM Zone 50S)"
        tooltip="Accuracy and quality of surveys used to locate drill holes (collar and down-hole surveys), trenches, mine workings and other locations"
      />

      <FormField
        label="Data Spacing and Distribution"
        name="section1.dataSpacingAndDistribution"
        type="textarea"
        rows={3}
        value={data.dataSpacingAndDistribution}
        onChange={(e) => onChange('section1.dataSpacingAndDistribution', e.target.value)}
        error={errors['section1.dataSpacingAndDistribution']}
        required
        placeholder="Espaçamento de dados para relatório de Resultados de Exploração. Se os dados são suficientes para estabelecer continuidade..."
        helpText="Indique se a amostragem foi feita por composição"
        tooltip="Data spacing for reporting of Exploration Results. Whether the data spacing and distribution is sufficient to establish the degree of geological and grade continuity"
      />

      <FormField
        label="Orientation of Data in Relation to Geological Structure"
        name="section1.orientationOfData"
        type="textarea"
        rows={3}
        value={data.orientationOfData}
        onChange={(e) => onChange('section1.orientationOfData', e.target.value)}
        error={errors['section1.orientationOfData']}
        required
        placeholder="Orientação da amostragem em relação à estrutura geológica. Se a orientação introduz viés de amostragem..."
        tooltip="Whether the orientation of sampling achieves unbiased sampling of possible structures and the extent to which this is known"
      />

      <FormField
        label="Sample Security"
        name="section1.sampleSecurity"
        type="textarea"
        rows={2}
        value={data.sampleSecurity}
        onChange={(e) => onChange('section1.sampleSecurity', e.target.value)}
        error={errors['section1.sampleSecurity']}
        required
        placeholder="Medidas tomadas para garantir a segurança e integridade das amostras..."
        tooltip="The measures taken to ensure sample security"
      />

      <FormField
        label="Audits or Reviews"
        name="section1.auditsOrReviews"
        type="textarea"
        rows={2}
        value={data.auditsOrReviews}
        onChange={(e) => onChange('section1.auditsOrReviews', e.target.value)}
        error={errors['section1.auditsOrReviews']}
        placeholder="Resultados de quaisquer auditorias ou revisões dos procedimentos de amostragem e ensaio..."
        tooltip="The results of any audits or reviews of sampling techniques and data"
      />
    </div>
  );
};

