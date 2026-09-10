import { WorkoutGenerationInput } from '../types/ai';

export const WORKOUT_SYSTEM_PROMPT = `Você é um Especialista em Fisiologia do Exercício e Personal Trainer de Elite.
Sua tarefa é gerar um programa de treinamento físico personalizado para um aluno com base na sua anamnese e objetivos.

[REGRAS DE GERAÇÃO]
1. Monte a divisão de treino adequada (Ex: A/B, A/B/C, Push/Pull/Legs, Upper/Lower).
2. Para cada exercício, especifique número de séries, faixa de repetições, tempo de descanso recomendado e observações técnicas.
3. Respeite estritamente as lesões e limitações informadas (selecione substituições biomecanicamente seguras).
4. Retorne OBRIGATORIAMENTE o resultado no formato JSON puro, sem formatação markdown em torno (sem crases de código), seguindo rigorosamente este esquema:
{
  "titulo": "Nome do Treino",
  "objetivo": "Descrição resumida do foco",
  "frequencia_semanal": 4,
  "divisoes": [
    {
      "letra": "A",
      "nome": "Peito e Tríceps",
      "exercicios": [
        {
          "nome": "Supino Reto com Barra",
          "grupo_muscular": "Peitoral",
          "series": 4,
          "repeticoes": "8-10",
          "tempo_descanso": "90s",
          "observacao": "Focar na fase excêntrica de 3 segundos"
        }
      ]
    }
  ]
}`;

export function buildWorkoutPrompt(dados: WorkoutGenerationInput): string {
  return `[DADOS DO ALUNO]
- Nome: ${dados.nome_aluno}
- Idade: ${dados.idade} anos
- Gênero: ${dados.genero}
- Peso: ${dados.peso} kg | Altura: ${dados.altura} cm
- Nível de Experiência: ${dados.nivel_experiencia}
- Objetivo Principal: ${dados.objetivo_principal}
- Frequência Semanal: ${dados.frequencia_semanal} dias por semana
- Equipamentos Disponíveis: ${dados.equipamentos_disponiveis}
- Restrições/Lesões: ${dados.lesoes_ou_dores || 'Nenhuma restrição relatada'}

Gere o plano de treino completo em JSON conforme as instruções.`;
}
