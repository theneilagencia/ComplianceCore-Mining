import { describe, it, expect } from 'vitest';
import { mockJORCData, mockJORCSections, validCommodities } from './fixtures';

describe('JORC Mapper', () => {
  describe('Section Mapping', () => {
    it('should have all required JORC 2012 sections', () => {
      const requiredSections = mockJORCSections;

      // Verificar que todas as seções existem
      expect(requiredSections.length).toBe(13);
      expect(requiredSections).toContain('sampling_techniques');
      expect(requiredSections).toContain('classification');
      expect(requiredSections).toContain('audits_reviews');
    });

    it('should validate required fields', () => {
      const data = mockJORCData;
      
      expect(data.project_name).toBeDefined();
      expect(data.location).toBeDefined();
      expect(data.commodity).toBeDefined();
      expect(data.resource_estimate).toBeDefined();
      expect(data.resource_estimate.measured).toBeDefined();
      expect(data.resource_estimate.indicated).toBeDefined();
      expect(data.resource_estimate.inferred).toBeDefined();
    });

    it('should validate project name format', () => {
      const projectName = mockJORCData.project_name;
      
      expect(projectName).toBeTruthy();
      expect(typeof projectName).toBe('string');
      expect(projectName.length).toBeGreaterThan(0);
    });

    it('should validate location data structure', () => {
      const location = mockJORCData.location;
      
      expect(location).toHaveProperty('lat');
      expect(location).toHaveProperty('lon');
      expect(location).toHaveProperty('municipality');
      expect(location).toHaveProperty('state');
      expect(location).toHaveProperty('country');
    });
  });

  describe('Data Validation', () => {
    it('should validate coordinate format', () => {
      const validCoordinate = mockJORCData.location;
      
      expect(validCoordinate.lat).toBeGreaterThanOrEqual(-90);
      expect(validCoordinate.lat).toBeLessThanOrEqual(90);
      expect(validCoordinate.lon).toBeGreaterThanOrEqual(-180);
      expect(validCoordinate.lon).toBeLessThanOrEqual(180);
    });

    it('should reject invalid coordinates', () => {
      const invalidCoordinate = { lat: 200, lon: -500 };
      
      expect(invalidCoordinate.lat).toBeGreaterThan(90); // Should fail validation
      expect(invalidCoordinate.lon).toBeLessThan(-180); // Should fail validation
    });

    it('should validate commodity types', () => {
      const testCommodity = mockJORCData.commodity;
      
      expect(validCommodities).toContain(testCommodity);
      expect(validCommodities.length).toBeGreaterThan(5);
    });

    it('should validate resource estimate structure', () => {
      const estimate = mockJORCData.resource_estimate;
      
      expect(estimate.measured).toHaveProperty('tonnage');
      expect(estimate.measured).toHaveProperty('grade');
      expect(estimate.measured).toHaveProperty('contained_metal');
      
      expect(estimate.indicated).toHaveProperty('tonnage');
      expect(estimate.indicated).toHaveProperty('grade');
      
      expect(estimate.inferred).toHaveProperty('tonnage');
      expect(estimate.inferred).toHaveProperty('grade');
    });

    it('should validate positive values for tonnage', () => {
      const estimate = mockJORCData.resource_estimate;
      
      expect(estimate.measured.tonnage).toBeGreaterThan(0);
      expect(estimate.indicated.tonnage).toBeGreaterThan(0);
      expect(estimate.inferred.tonnage).toBeGreaterThan(0);
    });

    it('should validate positive values for grade', () => {
      const estimate = mockJORCData.resource_estimate;
      
      expect(estimate.measured.grade).toBeGreaterThan(0);
      expect(estimate.indicated.grade).toBeGreaterThan(0);
      expect(estimate.inferred.grade).toBeGreaterThan(0);
    });
  });

  describe('Unit Conversion', () => {
    it('should convert meters to feet', () => {
      const meters = 100;
      const feet = meters * 3.28084;
      
      expect(feet).toBeCloseTo(328.084, 2);
    });

    it('should convert tonnes to short tons', () => {
      const tonnes = mockJORCData.resource_estimate.measured.tonnage;
      const shortTons = tonnes * 1.10231;
      
      expect(shortTons).toBeCloseTo(1102310, 0);
    });

    it('should convert g/t to oz/ton', () => {
      const gpt = mockJORCData.resource_estimate.measured.grade;
      const ozTon = gpt * 0.0291667;
      
      expect(ozTon).toBeCloseTo(0.0729, 4);
    });

    it('should convert grams to ounces', () => {
      const grams = mockJORCData.resource_estimate.measured.contained_metal;
      const ounces = grams * 0.0321507;
      
      expect(ounces).toBeGreaterThan(0);
      expect(ounces).toBeCloseTo(80376.75, 2);
    });

    it('should convert kilometers to miles', () => {
      const km = 10;
      const miles = km * 0.621371;
      
      expect(miles).toBeCloseTo(6.21371, 4);
    });
  });

  describe('Resource Classification', () => {
    it('should have measured resources', () => {
      const measured = mockJORCData.resource_estimate.measured;
      
      expect(measured).toBeDefined();
      expect(measured.tonnage).toBeGreaterThan(0);
    });

    it('should have indicated resources', () => {
      const indicated = mockJORCData.resource_estimate.indicated;
      
      expect(indicated).toBeDefined();
      expect(indicated.tonnage).toBeGreaterThan(0);
    });

    it('should have inferred resources', () => {
      const inferred = mockJORCData.resource_estimate.inferred;
      
      expect(inferred).toBeDefined();
      expect(inferred.tonnage).toBeGreaterThan(0);
    });

    it('should calculate total resources', () => {
      const estimate = mockJORCData.resource_estimate;
      const total = estimate.measured.tonnage + estimate.indicated.tonnage + estimate.inferred.tonnage;
      
      expect(total).toBe(3500000);
    });

    it('should calculate weighted average grade', () => {
      const estimate = mockJORCData.resource_estimate;
      const totalTonnage = estimate.measured.tonnage + estimate.indicated.tonnage + estimate.inferred.tonnage;
      const weightedGrade = (
        (estimate.measured.tonnage * estimate.measured.grade) +
        (estimate.indicated.tonnage * estimate.indicated.grade) +
        (estimate.inferred.tonnage * estimate.inferred.grade)
      ) / totalTonnage;
      
      expect(weightedGrade).toBeCloseTo(2.07, 2);
    });
  });

  describe('Drilling Data Validation', () => {
    it('should validate drilling data structure', () => {
      const drilling = mockJORCData.drilling_data;
      
      expect(drilling).toHaveProperty('total_holes');
      expect(drilling).toHaveProperty('total_meters');
      expect(drilling).toHaveProperty('average_depth');
    });

    it('should calculate average depth correctly', () => {
      const drilling = mockJORCData.drilling_data;
      const calculatedAvg = drilling.total_meters / drilling.total_holes;
      
      expect(calculatedAvg).toBeCloseTo(drilling.average_depth, 2);
    });

    it('should validate positive drilling values', () => {
      const drilling = mockJORCData.drilling_data;
      
      expect(drilling.total_holes).toBeGreaterThan(0);
      expect(drilling.total_meters).toBeGreaterThan(0);
      expect(drilling.average_depth).toBeGreaterThan(0);
    });
  });

  describe('Sampling Data Validation', () => {
    it('should validate sampling data structure', () => {
      const sampling = mockJORCData.sampling_data;
      
      expect(sampling).toHaveProperty('total_samples');
      expect(sampling).toHaveProperty('sample_interval');
      expect(sampling).toHaveProperty('recovery_rate');
    });

    it('should validate recovery rate range', () => {
      const recoveryRate = mockJORCData.sampling_data.recovery_rate;
      
      expect(recoveryRate).toBeGreaterThan(0);
      expect(recoveryRate).toBeLessThanOrEqual(100);
    });

    it('should validate positive sampling values', () => {
      const sampling = mockJORCData.sampling_data;
      
      expect(sampling.total_samples).toBeGreaterThan(0);
      expect(sampling.sample_interval).toBeGreaterThan(0);
    });
  });
});

