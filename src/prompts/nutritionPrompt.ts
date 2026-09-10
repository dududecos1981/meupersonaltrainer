import { NutritionGenerationInput } from '../types/ai';

export const NUTRITION_SYSTEM_PROMPT = `Você é um Nutricionista Esportivo focado em performance e composição corporal.
Sua função é gerar uma proposta de plano alimentar diário para acompanhar a rotina de treinos do aluno.

[REGRAS DE GERAÇÃO]
1. Determine o superávit ou déficit calórico ideal para o objetivo (Hipertrofia: superávit moderado; Emagrecimento: déficit seguro).
2. Calcule os macronutrientes: Proteínas (g/kg), Carboidratos (g/kg) e Gorduras (g/kg) equilibrados.
3. Distribua a alimentação em refeições estratégicas (incluindo pré e pós-treino conforme o horário informado).
4. Respeite todas as aversões, restrições e alergias informadas.
5. Retorne OBRIGATORIAMENTE o resultado em formato JSON puro, sem markdown em volta (sem crases de código), conforme o modelo:
{
  "meta_calorica": 2400,
  "macronutrientes": {
    "proteina_g": 160,
    "carboidrato_g": 280,
    "gordura_g": 65
  },
  "refeicoes": [
    {
      "horario": "07:30",
      "nome": "Café da Manhã",
      "itens": [
        { "alimento": "Ovo de galinha cozido", "quantidade": "3 unidades", "calorias": 210 },
        { "alimento": "Pão integral", "quantidade": "2 fatias (50g)", "calorias": 120 }
      ]
    }
  ]
}`;

export function buildNutritionPrompt(dados: NutritionGenerationInput): string {
  return `[DADOS DO ALUNO E TREINO]
- Nome: ${dados.nome_aluno}
- Objetivo: ${dados.objetivo}
- Peso: ${dados.peso} kg | Altura: ${dados.altura} cm | TMB Calculada: ${dados.tmb} kcal
- Gasto Calórico Total Estimado (GET): ${dados.get} kcal
- Preferências / Aversões Alimentares: ${dados.preferencias_alimentares || 'Nenhuma aversão específica'}
- Restrições / Alergias: ${dados.alergias || 'Nenhuma alergia relatada'}
- Horário do Treino: ${dados.horario_treino}

Gere o plano alimentar completo em JSON conforme as instruções.`;
}
