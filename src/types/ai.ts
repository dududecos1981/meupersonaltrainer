/**
 * Tipagens para os Agentes de IA - Sistema Personal Trainer Balbino
 */

// ==============================================================================
// AGENTE 1: PRESCRIÇÃO DE TREINO
// ==============================================================================

export interface WorkoutGenerationInput {
  nome_aluno: string;
  idade: number;
  genero: string;
  peso: number;
  altura: number;
  nivel_experiencia: 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO' | string;
  objetivo_principal: 'HIPERTROFIA' | 'EMAGRECIMENTO' | 'CONDICIONAMENTO' | 'REABILITACAO' | string;
  frequencia_semanal: number;
  equipamentos_disponiveis: 'ACADEMIA_COMPLETA' | 'HALTERES' | 'PESO_CORPORAL' | string;
  lesoes_ou_dores: string;
}

export interface WorkoutExerciseOutput {
  nome: string;
  grupo_muscular: string;
  series: number;
  repeticoes: string;
  tempo_descanso: string;
  observacao?: string;
}

export interface WorkoutDivisionOutput {
  letra: string; // "A", "B", "C", etc.
  nome: string;  // Ex: "Peito e Tríceps", "Membros Inferiores"
  exercicios: WorkoutExerciseOutput[];
}

export interface WorkoutPlanOutput {
  titulo: string;
  objetivo: string;
  frequencia_semanal: number;
  divisoes: WorkoutDivisionOutput[];
}

// ==============================================================================
// AGENTE 2: PRESCRIÇÃO DE PLANO ALIMENTAR
// ==============================================================================

export interface NutritionGenerationInput {
  nome_aluno: string;
  objetivo: 'HIPERTROFIA' | 'EMAGRECIMENTO' | 'MANUTENCAO' | string;
  peso: number;
  altura: number;
  tmb: number; // Taxa Metabólica Basal
  get: number; // Gasto Energético Total
  preferencias_alimentares: string;
  alergias: string;
  horario_treino: string;
}

export interface NutritionMealItemOutput {
  alimento: string;
  quantidade: string;
  calorias: number;
}

export interface NutritionMealOutput {
  horario: string;
  nome: string;
  itens: NutritionMealItemOutput[];
}

export interface NutritionPlanOutput {
  meta_calorica: number;
  macronutrientes: {
    proteina_g: number;
    carboidrato_g: number;
    gordura_g: number;
  };
  refeicoes: NutritionMealOutput[];
}

// ==============================================================================
// AGENTE 3: AJUSTES FINOS E ALTERAÇÕES
// ==============================================================================

export interface AdjustmentInput<T = WorkoutPlanOutput | NutritionPlanOutput> {
  json_atual: T;
  instrucao_do_personal: string;
}
