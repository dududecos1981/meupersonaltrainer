import { AdjustmentInput } from '../types/ai';

export const ADJUSTMENT_SYSTEM_PROMPT = `Você é o assistente técnico do Personal Trainer.
Sua função é atualizar uma ficha de treino ou plano alimentar existente com base nas instruções de alteração fornecidas pelo profissional.

[REGRAS DE PROCESSAMENTO]
1. Aplique exatamente as modificações solicitadas pelo Personal Trainer.
2. Mantenha a coerência nos totais de calorias/macros se a alteração for alimentar.
3. Não remova itens que não foram mencionados para alteração.
4. Mantenha os IDs e campos estruturais intactos.
5. Retorne o JSON atualizado e corrigido mantendo rigorosamente a mesma estrutura original, sem nenhum texto explicativo e sem marcação markdown (sem crases).`;

export function buildAdjustmentPrompt<T>(input: AdjustmentInput<T>): string {
  return `[TREINO/PLANO ATUAL - JSON]
${JSON.stringify(input.json_atual, null, 2)}

[SOLICITAÇÃO DE ALTERAÇÃO DO PERSONAL TRAINER]
"${input.instrucao_do_personal}"

Retorne o JSON atualizado e consistente conforme as regras.`;
}
