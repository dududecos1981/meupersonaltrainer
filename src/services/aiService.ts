import {
  WorkoutGenerationInput,
  WorkoutPlanOutput,
  NutritionGenerationInput,
  NutritionPlanOutput,
  AdjustmentInput,
} from '../types/ai';
import { WORKOUT_SYSTEM_PROMPT, buildWorkoutPrompt } from '../prompts/workoutPrompt';
import { NUTRITION_SYSTEM_PROMPT, buildNutritionPrompt } from '../prompts/nutritionPrompt';
import { ADJUSTMENT_SYSTEM_PROMPT, buildAdjustmentPrompt } from '../prompts/adjustmentPrompt';

export interface AIServiceConfig {
  apiKey?: string;
  model?: string;
  provider?: 'gemini' | 'openai' | 'custom';
}

/**
 * Utilitário para limpar markdown e extrair JSON válido de respostas de LLM
 */
export function cleanAndParseJSON<T>(rawText: string): T {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return JSON.parse(cleaned) as T;
}

/**
 * Serviço Unificado dos Agentes de IA do Sistema Personal Trainer Balbino
 */
export class PersonalTrainerAIService {
  private apiKey: string;
  private model: string;

  constructor(config?: AIServiceConfig) {
    const envKey =
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.GOOGLE_API_KEY) ||
      (typeof process !== 'undefined' ? (process.env?.GEMINI_API_KEY || process.env?.GOOGLE_API_KEY || process.env?.OPENAI_API_KEY) : '') ||
      '';
    const localKey = typeof localStorage !== 'undefined' ? (localStorage.getItem('balbino_gemini_key') || '') : '';
    
    this.apiKey = config?.apiKey || envKey || localKey || '';
    this.model = config?.model || (typeof localStorage !== 'undefined' ? (localStorage.getItem('balbino_gemini_model') || 'gemini-1.5-pro') : 'gemini-1.5-pro');
  }

  /**
   * Prompt 2: Gera Ficha de Treino Personalizada
   */
  async generateWorkoutPlan(input: WorkoutGenerationInput): Promise<WorkoutPlanOutput> {
    const prompt = buildWorkoutPrompt(input);
    const systemInstruction = WORKOUT_SYSTEM_PROMPT;

    // Chamada abstrata para o modelo (Gemini / OpenAI)
    const rawResponse = await this.callLLM(systemInstruction, prompt);
    return cleanAndParseJSON<WorkoutPlanOutput>(rawResponse);
  }

  /**
   * Prompt 3: Gera Plano Alimentar Esportivo
   */
  async generateNutritionPlan(input: NutritionGenerationInput): Promise<NutritionPlanOutput> {
    const prompt = buildNutritionPrompt(input);
    const systemInstruction = NUTRITION_SYSTEM_PROMPT;

    const rawResponse = await this.callLLM(systemInstruction, prompt);
    return cleanAndParseJSON<NutritionPlanOutput>(rawResponse);
  }

  /**
   * Prompt 4: Aplica Ajuste Fino / Edição em Linguagem Natural
   */
  async applyAdjustment<T extends WorkoutPlanOutput | NutritionPlanOutput>(
    input: AdjustmentInput<T>
  ): Promise<T> {
    const prompt = buildAdjustmentPrompt(input);
    const systemInstruction = ADJUSTMENT_SYSTEM_PROMPT;

    const rawResponse = await this.callLLM(systemInstruction, prompt);
    return cleanAndParseJSON<T>(rawResponse);
  }

  /**
   * Executa chamada HTTP padrão à API do Gemini
   */
  private async callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.apiKey) {
      console.warn('[PersonalTrainerAIService] Nenhuma API Key configurada. Retornando payload de simulação.');
      return this.getMockResponse(userPrompt);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro na API Gemini (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Nenhuma resposta gerada pelo modelo.');
    }

    return candidateText;
  }

  /**
   * Resposta simulada para testes locais sem credenciais
   */
  private getMockResponse(userPrompt: string): string {
    if (userPrompt.includes('[DADOS DO ALUNO E TREINO]')) {
      return JSON.stringify({
        meta_calorica: 2400,
        macronutrientes: { proteina_g: 160, carboidrato_g: 280, gordura_g: 65 },
        refeicoes: [
          {
            horario: "07:30",
            nome: "Café da Manhã",
            itens: [
              { alimento: "Ovo de galinha cozido", quantidade: "3 unidades", calorias: 210 },
              { alimento: "Pão integral", quantidade: "2 fatias (50g)", calorias: 120 }
            ]
          }
        ]
      });
    }

    return JSON.stringify({
      titulo: "Treino de Hipertrofia Personalizado",
      objetivo: "Ganho de massa muscular com preservação articular",
      frequencia_semanal: 4,
      divisoes: [
        {
          letra: "A",
          nome: "Peito e Tríceps",
          exercicios: [
            {
              nome: "Supino Reto com Barra",
              grupo_muscular: "Peitoral",
              series: 4,
              repeticoes: "8-10",
              tempo_descanso: "90s",
              observacao: "Focar na fase excêntrica de 3 segundos"
            }
          ]
        }
      ]
    });
  }
}
