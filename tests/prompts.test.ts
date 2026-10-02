import { describe, it, expect } from 'vitest';
import { buildWorkoutPrompt, WORKOUT_SYSTEM_PROMPT } from '../src/prompts/workoutPrompt';
import { buildNutritionPrompt, NUTRITION_SYSTEM_PROMPT } from '../src/prompts/nutritionPrompt';
import { buildAdjustmentPrompt, ADJUSTMENT_SYSTEM_PROMPT } from '../src/prompts/adjustmentPrompt';
import { WorkoutGenerationInput, NutritionGenerationInput } from '../src/types/ai';

describe('Prompts - Workout Prompt', () => {
  it('should have a strict system prompt demanding pure JSON', () => {
    expect(WORKOUT_SYSTEM_PROMPT).toContain('Personal Trainer de Elite');
    expect(WORKOUT_SYSTEM_PROMPT).toContain('JSON puro');
    expect(WORKOUT_SYSTEM_PROMPT).toContain('"divisoes"');
    expect(WORKOUT_SYSTEM_PROMPT).toContain('"exercicios"');
  });

  it('should build prompt with all provided student anamnesis data', () => {
    const input: WorkoutGenerationInput = {
      nome_aluno: 'Mariana Souza',
      idade: 32,
      genero: 'Feminino',
      peso: 62.0,
      altura: 165,
      nivel_experiencia: 'AVANCADO',
      objetivo_principal: 'DEFINICAO',
      frequencia_semanal: 5,
      equipamentos_disponiveis: 'ACADEMIA_COMPLETA',
      lesoes_ou_dores: 'Condromalácia patelar grau 1'
    };

    const prompt = buildWorkoutPrompt(input);
    expect(prompt).toContain('Mariana Souza');
    expect(prompt).toContain('32 anos');
    expect(prompt).toContain('Feminino');
    expect(prompt).toContain('62 kg | Altura: 165 cm');
    expect(prompt).toContain('AVANCADO');
    expect(prompt).toContain('DEFINICAO');
    expect(prompt).toContain('5 dias por semana');
    expect(prompt).toContain('Condromalácia patelar grau 1');
  });

  it('should fallback gracefully when no injuries are specified', () => {
    const input: WorkoutGenerationInput = {
      nome_aluno: 'Pedro Santos',
      idade: 25,
      genero: 'Masculino',
      peso: 80,
      altura: 180,
      nivel_experiencia: 'INICIANTE',
      objetivo_principal: 'HIPERTROFIA',
      frequencia_semanal: 3,
      equipamentos_disponiveis: 'HALTERES_E_PESO_CORPORAL'
    };

    const prompt = buildWorkoutPrompt(input);
    expect(prompt).toContain('Nenhuma restrição relatada');
  });
});

describe('Prompts - Nutrition Prompt', () => {
  it('should have a detailed nutritional system prompt', () => {
    expect(NUTRITION_SYSTEM_PROMPT).toContain('Nutricionista Esportivo');
    expect(NUTRITION_SYSTEM_PROMPT).toContain('superávit ou déficit calórico');
    expect(NUTRITION_SYSTEM_PROMPT).toContain('macronutrientes');
    expect(NUTRITION_SYSTEM_PROMPT).toContain('"meta_calorica"');
    expect(NUTRITION_SYSTEM_PROMPT).toContain('"refeicoes"');
  });

  it('should build prompt with metabolism metrics and routine timing', () => {
    const input: NutritionGenerationInput = {
      nome_aluno: 'Carlos Silva',
      objetivo: 'HIPERTROFIA',
      peso: 78.5,
      altura: 178,
      tmb: 1760,
      get: 2600,
      horario_treino: '06:30',
      preferencias_alimentares: 'Gosta de ovos, aveia e frutas vermelhas',
      alergias: 'Intolerância a lactose severa'
    };

    const prompt = buildNutritionPrompt(input);
    expect(prompt).toContain('Carlos Silva');
    expect(prompt).toContain('TMB Calculada: 1760 kcal');
    expect(prompt).toContain('Gasto Calórico Total Estimado (GET): 2600 kcal');
    expect(prompt).toContain('06:30');
    expect(prompt).toContain('Gosta de ovos, aveia e frutas vermelhas');
    expect(prompt).toContain('Intolerância a lactose severa');
  });

  it('should handle optional preferences and allergies fallback', () => {
    const input: NutritionGenerationInput = {
      nome_aluno: 'Ana Paula',
      objetivo: 'EMAGRECIMENTO',
      peso: 65,
      altura: 160,
      tmb: 1400,
      get: 1900,
      horario_treino: '19:00'
    };

    const prompt = buildNutritionPrompt(input);
    expect(prompt).toContain('Nenhuma aversão específica');
    expect(prompt).toContain('Nenhuma alergia relatada');
  });
});

describe('Prompts - Adjustment Prompt', () => {
  it('should have an adjustment system prompt focused on JSON preservation', () => {
    expect(ADJUSTMENT_SYSTEM_PROMPT).toContain('assistente técnico do Personal Trainer');
    expect(ADJUSTMENT_SYSTEM_PROMPT).toContain('Aplique exatamente as modificações solicitadas');
    expect(ADJUSTMENT_SYSTEM_PROMPT).toContain('Não remova itens que não foram mencionados');
  });

  it('should format adjustment prompt embedding JSON and instructions', () => {
    const currentJson = {
      titulo: 'Treino A',
      exercicios: [{ nome: 'Supino', series: 3 }]
    };

    const prompt = buildAdjustmentPrompt({
      json_atual: currentJson,
      instrucao_do_personal: 'Adicionar 1 série no supino e trocar para halteres'
    });

    expect(prompt).toContain('"titulo": "Treino A"');
    expect(prompt).toContain('"nome": "Supino"');
    expect(prompt).toContain('Adicionar 1 série no supino e trocar para halteres');
  });
});
