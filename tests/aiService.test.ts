import { describe, it, expect } from 'vitest';
import { cleanAndParseJSON, PersonalTrainerAIService } from '../src/services/aiService';
import { WorkoutGenerationInput, NutritionGenerationInput } from '../src/types/ai';

describe('aiService - cleanAndParseJSON', () => {
  it('should parse clean JSON correctly', () => {
    const raw = '{"titulo": "Treino A", "series": 4}';
    const parsed = cleanAndParseJSON<{ titulo: string; series: number }>(raw);
    expect(parsed).toEqual({ titulo: 'Treino A', series: 4 });
  });

  it('should remove ```json and ``` markdown code fences', () => {
    const raw = '```json\n{"meta_calorica": 2500, "proteina_g": 180}\n```';
    const parsed = cleanAndParseJSON<{ meta_calorica: number; proteina_g: number }>(raw);
    expect(parsed).toEqual({ meta_calorica: 2500, proteina_g: 180 });
  });

  it('should remove generic ``` markdown code fences', () => {
    const raw = '```\n{"status": "ok"}\n```';
    const parsed = cleanAndParseJSON<{ status: string }>(raw);
    expect(parsed).toEqual({ status: 'ok' });
  });

  it('should handle JSON with extra surrounding whitespace', () => {
    const raw = '   \n\t {"valido": true}  \n ';
    const parsed = cleanAndParseJSON<{ valido: boolean }>(raw);
    expect(parsed.valido).toBe(true);
  });

  it('should throw an error on invalid JSON', () => {
    const invalid = '{titulo: invalid_json}';
    expect(() => cleanAndParseJSON(invalid)).toThrow();
  });
});

describe('aiService - PersonalTrainerAIService (Mock Fallback Mode)', () => {
  const service = new PersonalTrainerAIService();

  it('should generate a workout plan using mock fallback when no API key is provided', async () => {
    const input: WorkoutGenerationInput = {
      nome_aluno: 'Carlos Silva',
      idade: 28,
      genero: 'Masculino',
      peso: 78.5,
      altura: 178,
      nivel_experiencia: 'INTERMEDIARIO',
      objetivo_principal: 'HIPERTROFIA',
      frequencia_semanal: 4,
      equipamentos_disponiveis: 'ACADEMIA_COMPLETA',
      lesoes_ou_dores: 'Leve desconforto no ombro'
    };

    const result = await service.generateWorkoutPlan(input);
    expect(result).toBeDefined();
    expect(result.titulo).toBeDefined();
    expect(result.frequencia_semanal).toBe(4);
    expect(Array.isArray(result.divisoes)).toBe(true);
    expect(result.divisoes.length).toBeGreaterThan(0);
    expect(result.divisoes[0].exercicios.length).toBeGreaterThan(0);
    expect(result.divisoes[0].exercicios[0].nome).toBeDefined();
  });

  it('should generate a nutrition plan using mock fallback when no API key is provided', async () => {
    const input: NutritionGenerationInput = {
      nome_aluno: 'Carlos Silva',
      objetivo: 'HIPERTROFIA',
      peso: 78.5,
      altura: 178,
      tmb: 1780,
      get: 2650,
      horario_treino: '06:30'
    };

    const result = await service.generateNutritionPlan(input);
    expect(result).toBeDefined();
    expect(result.meta_calorica).toBeGreaterThan(0);
    expect(result.macronutrientes).toBeDefined();
    expect(result.macronutrientes.proteina_g).toBeGreaterThan(0);
    expect(Array.isArray(result.refeicoes)).toBe(true);
    expect(result.refeicoes.length).toBeGreaterThan(0);
  });

  it('should apply adjustments using mock fallback when no API key is provided', async () => {
    const initialWorkout = {
      titulo: 'Treino A',
      objetivo: 'Hipertrofia',
      frequencia_semanal: 3,
      divisoes: []
    };

    const result = await service.applyAdjustment({
      json_atual: initialWorkout,
      instrucao_do_personal: 'Trocar supino por halteres'
    });

    expect(result).toBeDefined();
  });
});
