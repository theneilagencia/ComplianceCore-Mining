/**
 * Bridge Module Health Tests
 * 
 * Tests health check endpoint and component status validation
 */

import { describe, it, expect } from 'vitest';
import * as realAPIs from '../../server/modules/integrations/realAPIs';

describe('Bridge Module Health Tests', () => {
  it('should return APIs status', () => {
    const status = realAPIs.getAPIsStatus();

    expect(status).toBeDefined();
    expect(status).toHaveProperty('ibama');
    expect(status).toHaveProperty('copernicus');
    expect(status).toHaveProperty('lme');
    expect(status).toHaveProperty('comex');
  });

  it('should validate IBAMA component structure', () => {
    const status = realAPIs.getAPIsStatus();
    const ibama = status.ibama;

    expect(ibama).toHaveProperty('enabled');
    expect(ibama).toHaveProperty('mock');
    expect(typeof ibama.enabled).toBe('boolean');
    expect(typeof ibama.mock).toBe('boolean');
  });

  it('should validate Copernicus component structure', () => {
    const status = realAPIs.getAPIsStatus();
    const copernicus = status.copernicus;

    expect(copernicus).toHaveProperty('enabled');
    expect(copernicus).toHaveProperty('mock');
    expect(typeof copernicus.enabled).toBe('boolean');
    expect(typeof copernicus.mock).toBe('boolean');
  });

  it('should validate LME component structure', () => {
    const status = realAPIs.getAPIsStatus();
    const lme = status.lme;

    expect(lme).toHaveProperty('enabled');
    expect(lme).toHaveProperty('mock');
    expect(typeof lme.enabled).toBe('boolean');
    expect(typeof lme.mock).toBe('boolean');
  });

  it('should validate COMEX component structure', () => {
    const status = realAPIs.getAPIsStatus();
    const comex = status.comex;

    expect(comex).toHaveProperty('enabled');
    expect(comex).toHaveProperty('mock');
    expect(typeof comex.enabled).toBe('boolean');
    expect(typeof comex.mock).toBe('boolean');
  });

  it('should use mock data when API keys not configured', () => {
    const status = realAPIs.getAPIsStatus();

    // If enabled is false, mock should be true
    Object.values(status).forEach((component) => {
      if (!component.enabled) {
        expect(component.mock).toBe(true);
      }
    });
  });

  it('should handle configuration checks correctly', () => {
    const status = realAPIs.getAPIsStatus();

    // enabled and mock should be opposite values
    Object.values(status).forEach((component) => {
      expect(component.enabled).toBe(!component.mock);
    });
  });

  it('should return IBAMA licenses (mock or real)', async () => {
    const result = await realAPIs.getIBAMALicenses({
      projectName: 'Test Project',
      state: 'MG',
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty('licenses');
    expect(Array.isArray(result.licenses)).toBe(true);
    expect(result.licenses.length).toBeGreaterThan(0);
  });

  it('should return Copernicus data (mock or real)', async () => {
    const result = await realAPIs.getCopernicusData({
      latitude: -6.0626,
      longitude: -50.1558,
      startDate: '2024-01-01',
      endDate: '2025-01-01',
      dataType: 'ndvi',
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty('averageNDVI');
    expect(typeof result.averageNDVI).toBe('number');
  });

  it('should return LME prices (mock or real)', async () => {
    const result = await realAPIs.getLMEPrices(['copper', 'gold']);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('prices');
    expect(Array.isArray(result.prices)).toBe(true);
    expect(result.prices.length).toBeGreaterThan(0);
    
    result.prices.forEach((price: any) => {
      expect(price).toHaveProperty('metal');
      expect(price).toHaveProperty('price');
      expect(typeof price.price).toBe('number');
    });
  });

  it('should return COMEX prices (mock or real)', async () => {
    const result = await realAPIs.getCOMEXPrices(['iron_ore']);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('prices');
    expect(Array.isArray(result.prices)).toBe(true);
    expect(result.prices.length).toBeGreaterThan(0);
    
    result.prices.forEach((price: any) => {
      expect(price).toHaveProperty('commodity');
      expect(price).toHaveProperty('price');
      expect(typeof price.price).toBe('number');
    });
  });

  it('should handle IBAMA query with CNPJ', async () => {
    const result = await realAPIs.getIBAMALicenses({
      cnpj: '12.345.678/0001-90',
    });

    expect(result).toBeDefined();
    expect(result.licenses).toBeDefined();
    expect(Array.isArray(result.licenses)).toBe(true);
  });

  it('should validate license structure', async () => {
    const result = await realAPIs.getIBAMALicenses({
      projectName: 'Test',
    });

    const license = result.licenses[0];
    
    expect(license).toHaveProperty('id');
    expect(license).toHaveProperty('type');
    expect(license).toHaveProperty('status');
    expect(license).toHaveProperty('issueDate');
    expect(license).toHaveProperty('expiryDate');
    expect(license).toHaveProperty('projectName');
  });

  it('should validate Copernicus data structure', async () => {
    const result = await realAPIs.getCopernicusData({
      latitude: -6.0626,
      longitude: -50.1558,
      startDate: '2024-01-01',
      endDate: '2025-01-01',
      dataType: 'ndvi',
    });

    expect(result).toHaveProperty('ndviValues');
    expect(result).toHaveProperty('averageNDVI');
    expect(Array.isArray(result.ndviValues)).toBe(true);
    expect(typeof result.averageNDVI).toBe('number');
    
    // Validate NDVI range (-1 to 1)
    expect(result.averageNDVI).toBeGreaterThanOrEqual(-1);
    expect(result.averageNDVI).toBeLessThanOrEqual(1);
  });
});
