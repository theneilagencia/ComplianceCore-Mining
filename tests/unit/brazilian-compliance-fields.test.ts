/**
 * Brazilian Compliance Fields Tests
 * Tests for brazilian-compliance-fields schema
 */

import { describe, it, expect } from 'vitest';
import {
  BRAZILIAN_COMPLIANCE_SECTION,
  BRAZILIAN_FIELD_NAMES,
  isBrazilianField,
  getBrazilianFieldsByCategory,
} from '../../../client/src/modules/technical-reports/schemas/brazilian-compliance-fields';

describe('Brazilian Compliance Fields', () => {
  describe('BRAZILIAN_COMPLIANCE_SECTION', () => {
    it('should have correct structure', () => {
      expect(BRAZILIAN_COMPLIANCE_SECTION).toHaveProperty('title');
      expect(BRAZILIAN_COMPLIANCE_SECTION).toHaveProperty('description');
      expect(BRAZILIAN_COMPLIANCE_SECTION).toHaveProperty('fields');
      expect(Array.isArray(BRAZILIAN_COMPLIANCE_SECTION.fields)).toBe(true);
    });

    it('should have at least 50 fields', () => {
      expect(BRAZILIAN_COMPLIANCE_SECTION.fields.length).toBeGreaterThanOrEqual(50);
    });

    it('should have fields from all categories', () => {
      const fieldNames = BRAZILIAN_COMPLIANCE_SECTION.fields.map(f => f.name);

      // ANM fields
      expect(fieldNames.some(n => n.startsWith('anm_'))).toBe(true);

      // IBAMA fields
      expect(fieldNames.some(n => n.startsWith('ibama_'))).toBe(true);

      // CPRM fields
      expect(fieldNames.some(n => n.startsWith('cprm_'))).toBe(true);

      // ANP fields
      expect(fieldNames.some(n => n.startsWith('anp_'))).toBe(true);

      // ANA fields
      expect(fieldNames.some(n => n.startsWith('ana_'))).toBe(true);

      // FUNAI fields
      expect(fieldNames.some(n => n.startsWith('funai_'))).toBe(true);

      // Quilombola fields
      expect(fieldNames.some(n => n.startsWith('quilombola_'))).toBe(true);

      // TAC fields
      expect(fieldNames.some(n => n.startsWith('tac_'))).toBe(true);

      // Dam fields
      expect(fieldNames.some(n => n.startsWith('dam_'))).toBe(true);

      // State fields
      expect(fieldNames.some(n => n.startsWith('state_'))).toBe(true);
    });
  });

  describe('ANM Fields', () => {
    const anmFields = BRAZILIAN_COMPLIANCE_SECTION.fields.filter(f => f.name.startsWith('anm_'));

    it('should have at least 8 ANM fields', () => {
      expect(anmFields.length).toBeGreaterThanOrEqual(8);
    });

    it('should have anm_processNumber field', () => {
      const field = anmFields.find(f => f.name === 'anm_processNumber');
      expect(field).toBeDefined();
      expect(field?.type).toBe('text');
      expect(field?.placeholder).toContain('48226.800153/2023');
    });

    it('should have anm_processPhase field with options', () => {
      const field = anmFields.find(f => f.name === 'anm_processPhase');
      expect(field).toBeDefined();
      expect(field?.type).toBe('select');
      expect(field?.options).toBeDefined();
      expect(field?.options?.length).toBeGreaterThan(0);

      const phases = field?.options?.map(o => o.value);
      expect(phases).toContain('CONCESSAO_LAVRA');
      expect(phases).toContain('AUTORIZACAO_PESQUISA');
    });

    it('should have anm_cfemPercentage with correct rates', () => {
      const field = anmFields.find(f => f.name === 'anm_cfemPercentage');
      expect(field).toBeDefined();
      expect(field?.options).toBeDefined();

      const rates = field?.options?.map(o => o.value);
      expect(rates).toContain('0.2'); // Ouro
      expect(rates).toContain('2.0'); // Ferro
      expect(rates).toContain('3.0'); // Bauxita
      expect(rates).toContain('4.0'); // Pedras preciosas
    });

    it('should have anm_paeStatus field', () => {
      const field = anmFields.find(f => f.name === 'anm_paeStatus');
      expect(field).toBeDefined();
      expect(field?.options).toBeDefined();

      const statuses = field?.options?.map(o => o.value);
      expect(statuses).toContain('APROVADO');
      expect(statuses).toContain('PROTOCOLADO');
    });
  });

  describe('IBAMA Fields', () => {
    const ibamaFields = BRAZILIAN_COMPLIANCE_SECTION.fields.filter(f => f.name.startsWith('ibama_'));

    it('should have at least 6 IBAMA fields', () => {
      expect(ibamaFields.length).toBeGreaterThanOrEqual(6);
    });

    it('should have license type field with LP/LI/LO/LA', () => {
      const field = ibamaFields.find(f => f.name === 'ibama_licenseType');
      expect(field).toBeDefined();

      const types = field?.options?.map(o => o.value);
      expect(types).toContain('LP');
      expect(types).toContain('LI');
      expect(types).toContain('LO');
      expect(types).toContain('LA');
    });

    it('should have environmental study field', () => {
      const field = ibamaFields.find(f => f.name === 'ibama_environmentalStudy');
      expect(field).toBeDefined();

      const studies = field?.options?.map(o => o.value);
      expect(studies).toContain('EIA_RIMA');
      expect(studies).toContain('PRAD');
    });
  });

  describe('CPRM Fields', () => {
    const cprmFields = BRAZILIAN_COMPLIANCE_SECTION.fields.filter(f => f.name.startsWith('cprm_'));

    it('should have at least 4 CPRM fields', () => {
      expect(cprmFields.length).toBeGreaterThanOrEqual(4);
    });

    it('should have hydrogeology field', () => {
      const field = cprmFields.find(f => f.name === 'cprm_hydrogeology');
      expect(field).toBeDefined();

      const types = field?.options?.map(o => o.value);
      expect(types).toContain('POROSO');
      expect(types).toContain('FRATURADO');
      expect(types).toContain('CARSTICO');
    });
  });

  describe('ANP Fields', () => {
    const anpFields = BRAZILIAN_COMPLIANCE_SECTION.fields.filter(f => f.name.startsWith('anp_'));

    it('should have at least 3 ANP fields', () => {
      expect(anpFields.length).toBeGreaterThanOrEqual(3);
    });

    it('should have basin field with Brazilian basins', () => {
      const field = anpFields.find(f => f.name === 'anp_basin');
      expect(field).toBeDefined();

      const basins = field?.options?.map(o => o.value);
      expect(basins).toContain('SANTOS');
      expect(basins).toContain('CAMPOS');
      expect(basins).toContain('RECONCAVO');
    });

    it('should have concession phase field', () => {
      const field = anpFields.find(f => f.name === 'anp_concessionPhase');
      expect(field).toBeDefined();

      const phases = field?.options?.map(o => o.value);
      expect(phases).toContain('EXPLORACAO');
      expect(phases).toContain('PRODUCAO');
    });
  });

  describe('Dam (Barragem) Fields', () => {
    const damFields = BRAZILIAN_COMPLIANCE_SECTION.fields.filter(f => f.name.startsWith('dam_'));

    it('should have at least 4 dam fields', () => {
      expect(damFields.length).toBeGreaterThanOrEqual(4);
    });

    it('should have risk category (CRI) field', () => {
      const field = damFields.find(f => f.name === 'dam_riskCategory');
      expect(field).toBeDefined();

      const categories = field?.options?.map(o => o.value);
      expect(categories).toContain('A'); // Baixo
      expect(categories).toContain('E'); // Extremo
    });

    it('should have damage category (DPA) field', () => {
      const field = damFields.find(f => f.name === 'dam_damageCategory');
      expect(field).toBeDefined();

      const categories = field?.options?.map(o => o.value);
      expect(categories).toContain('BAIXO');
      expect(categories).toContain('ALTO');
    });
  });

  describe('FUNAI Fields', () => {
    const funaiFields = BRAZILIAN_COMPLIANCE_SECTION.fields.filter(f => f.name.startsWith('funai_'));

    it('should have at least 3 FUNAI fields', () => {
      expect(funaiFields.length).toBeGreaterThanOrEqual(3);
    });

    it('should have indigenous land proximity field', () => {
      const field = funaiFields.find(f => f.name === 'funai_indigenousLandProximity');
      expect(field).toBeDefined();

      const proximities = field?.options?.map(o => o.value);
      expect(proximities).toContain('NENHUMA');
      expect(proximities).toContain('SOBREPOSTA');
    });

    it('should have consultation status field', () => {
      const field = funaiFields.find(f => f.name === 'funai_consultationStatus');
      expect(field).toBeDefined();
      expect(field?.helpText).toContain('Convenção 169 OIT');
    });
  });

  describe('Helper Functions', () => {
    describe('BRAZILIAN_FIELD_NAMES', () => {
      it('should be an array of strings', () => {
        expect(Array.isArray(BRAZILIAN_FIELD_NAMES)).toBe(true);
        expect(BRAZILIAN_FIELD_NAMES.length).toBeGreaterThan(0);
        expect(typeof BRAZILIAN_FIELD_NAMES[0]).toBe('string');
      });

      it('should contain all field names', () => {
        expect(BRAZILIAN_FIELD_NAMES).toContain('anm_processNumber');
        expect(BRAZILIAN_FIELD_NAMES).toContain('ibama_licenseNumber');
        expect(BRAZILIAN_FIELD_NAMES).toContain('cprm_geologicalProvince');
      });
    });

    describe('isBrazilianField', () => {
      it('should return true for Brazilian fields', () => {
        expect(isBrazilianField('anm_processNumber')).toBe(true);
        expect(isBrazilianField('ibama_licenseNumber')).toBe(true);
        expect(isBrazilianField('cprm_geologicalProvince')).toBe(true);
      });

      it('should return false for non-Brazilian fields', () => {
        expect(isBrazilianField('title')).toBe(false);
        expect(isBrazilianField('projectName')).toBe(false);
        expect(isBrazilianField('unknown_field')).toBe(false);
      });
    });

    describe('getBrazilianFieldsByCategory', () => {
      it('should return ANM fields', () => {
        const fields = getBrazilianFieldsByCategory('ANM');
        expect(fields.length).toBeGreaterThan(0);
        expect(fields.every(f => f.name.startsWith('anm_'))).toBe(true);
      });

      it('should return IBAMA fields', () => {
        const fields = getBrazilianFieldsByCategory('IBAMA');
        expect(fields.length).toBeGreaterThan(0);
        expect(fields.every(f => f.name.startsWith('ibama_'))).toBe(true);
      });

      it('should return CPRM fields', () => {
        const fields = getBrazilianFieldsByCategory('CPRM');
        expect(fields.length).toBeGreaterThan(0);
        expect(fields.every(f => f.name.startsWith('cprm_'))).toBe(true);
      });

      it('should return ANP fields', () => {
        const fields = getBrazilianFieldsByCategory('ANP');
        expect(fields.length).toBeGreaterThan(0);
        expect(fields.every(f => f.name.startsWith('anp_'))).toBe(true);
      });

      it('should return STATE fields', () => {
        const fields = getBrazilianFieldsByCategory('STATE');
        expect(fields.length).toBeGreaterThan(0);
        expect(fields.every(f => f.name.startsWith('state_'))).toBe(true);
      });
    });
  });

  describe('Field Validations', () => {
    it('all fields should have required properties', () => {
      BRAZILIAN_COMPLIANCE_SECTION.fields.forEach((field) => {
        expect(field).toHaveProperty('name');
        expect(field).toHaveProperty('label');
        expect(field).toHaveProperty('type');
        expect(field).toHaveProperty('required');
        expect(typeof field.name).toBe('string');
        expect(typeof field.label).toBe('string');
        expect(typeof field.required).toBe('boolean');
      });
    });

    it('select fields should have options', () => {
      BRAZILIAN_COMPLIANCE_SECTION.fields
        .filter(f => f.type === 'select')
        .forEach((field) => {
          expect(field.options).toBeDefined();
          expect(Array.isArray(field.options)).toBe(true);
          expect(field.options!.length).toBeGreaterThan(0);

          // Each option should have value and label
          field.options!.forEach((option) => {
            expect(option).toHaveProperty('value');
            expect(option).toHaveProperty('label');
          });
        });
    });

    it('all fields should have helpText', () => {
      BRAZILIAN_COMPLIANCE_SECTION.fields.forEach((field) => {
        expect(field.helpText).toBeDefined();
        expect(typeof field.helpText).toBe('string');
        expect(field.helpText!.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Legal References', () => {
    it('should reference Lei 13.540/2017 for CFEM', () => {
      const field = BRAZILIAN_COMPLIANCE_SECTION.fields.find(f => f.name === 'anm_cfemPercentage');
      expect(field?.helpText).toContain('Lei 13.540/2017');
    });

    it('should reference Lei 9.985/2000 for environmental compensation', () => {
      const field = BRAZILIAN_COMPLIANCE_SECTION.fields.find(f => f.name === 'ibama_compensationValue');
      expect(field?.helpText).toContain('Lei 9.985/2000');
    });

    it('should reference Lei 12.334/2010 for dams', () => {
      const field = BRAZILIAN_COMPLIANCE_SECTION.fields.find(f => f.name === 'dam_exists');
      expect(field?.helpText).toContain('Lei 12.334/2010');
    });

    it('should reference Portaria ANM for dam risk', () => {
      const field = BRAZILIAN_COMPLIANCE_SECTION.fields.find(f => f.name === 'dam_riskCategory');
      expect(field?.helpText).toContain('Portaria ANM');
    });

    it('should reference Convenção 169 OIT for FUNAI', () => {
      const field = BRAZILIAN_COMPLIANCE_SECTION.fields.find(f => f.name === 'funai_consultationStatus');
      expect(field?.helpText).toContain('Convenção 169 OIT');
    });
  });
});
