import { describe, it, expect } from 'vitest';

/**
 * Funções utilitárias antropométricas espelhando as regras de negócio
 */
export function calculateIMC(weightKg: number, heightCm: number): { imc: number; classification: string } {
  const heightM = heightCm / 100;
  const imc = +(weightKg / (heightM * heightM)).toFixed(1);
  let classification = '';
  if (imc < 18.5) classification = 'Abaixo do peso';
  else if (imc < 25) classification = 'Peso Adequado';
  else if (imc < 30) classification = 'Sobrepeso';
  else classification = 'Obesidade';
  return { imc, classification };
}

export function calculateTMB_Mifflin(weightKg: number, heightCm: number, age: number, sex: 'M' | 'F'): number {
  // Mifflin-St Jeor:
  // Homens: 10 * peso + 6.25 * altura - 5 * idade + 5
  // Mulheres: 10 * peso + 6.25 * altura - 5 * idade - 161
  const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  return Math.round(sex === 'M' ? base + 5 : base - 161);
}

export function calculateGET(tmb: number, activityFactor: number): number {
  return Math.round(tmb * activityFactor);
}

export function calculateBodyComposition(weightKg: number, bfPercent: number): { fatKg: number; leanKg: number } {
  const fatKg = +(weightKg * (bfPercent / 100)).toFixed(1);
  const leanKg = +(weightKg - fatKg).toFixed(1);
  return { fatKg, leanKg };
}

describe('Antropometry & Metabolic Calculations', () => {
  describe('IMC Calculation', () => {
    it('should correctly calculate normal IMC', () => {
      const { imc, classification } = calculateIMC(70, 175);
      expect(imc).toBe(22.9);
      expect(classification).toBe('Peso Adequado');
    });

    it('should classify underweight correctly', () => {
      const { imc, classification } = calculateIMC(50, 175);
      expect(imc).toBe(16.3);
      expect(classification).toBe('Abaixo do peso');
    });

    it('should classify overweight correctly', () => {
      const { imc, classification } = calculateIMC(85, 175);
      expect(imc).toBe(27.8);
      expect(classification).toBe('Sobrepeso');
    });

    it('should classify obesity correctly', () => {
      const { imc, classification } = calculateIMC(110, 175);
      expect(imc).toBe(35.9);
      expect(classification).toBe('Obesidade');
    });
  });

  describe('TMB (Taxa Metabólica Basal) - Mifflin-St Jeor', () => {
    it('should calculate male TMB correctly', () => {
      // 10*80 + 6.25*180 - 5*28 + 5 = 800 + 1125 - 140 + 5 = 1790
      const tmb = calculateTMB_Mifflin(80, 180, 28, 'M');
      expect(tmb).toBe(1790);
    });

    it('should calculate female TMB correctly', () => {
      // 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25 -> 1320
      const tmb = calculateTMB_Mifflin(60, 165, 30, 'F');
      expect(tmb).toBe(1320);
    });
  });

  describe('GET (Gasto Energético Total)', () => {
    it('should calculate sedentary GET (factor 1.2)', () => {
      const get = calculateGET(1790, 1.2);
      expect(get).toBe(2148);
    });

    it('should calculate moderately active GET (factor 1.55)', () => {
      const get = calculateGET(1790, 1.55);
      expect(get).toBe(2775);
    });

    it('should calculate highly active GET (factor 1.725)', () => {
      const get = calculateGET(1790, 1.725);
      expect(get).toBe(3088);
    });
  });

  describe('Body Composition (Fat & Lean Mass)', () => {
    it('should calculate exact fat and lean mass in kg', () => {
      const comp = calculateBodyComposition(80, 15);
      expect(comp.fatKg).toBe(12.0);
      expect(comp.leanKg).toBe(68.0);
      expect(comp.fatKg + comp.leanKg).toBe(80.0);
    });

    it('should calculate low body fat composition', () => {
      const comp = calculateBodyComposition(75, 8.5);
      expect(comp.fatKg).toBe(6.4);
      expect(comp.leanKg).toBe(68.6);
    });
  });
});
