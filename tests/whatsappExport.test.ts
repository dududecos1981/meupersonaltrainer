import { describe, it, expect } from 'vitest';
import { WorkoutPlanOutput, NutritionPlanOutput } from '../src/types/ai';

export function formatWhatsAppMessage(workout: WorkoutPlanOutput, diet: NutritionPlanOutput): string {
  let text = `🏋️‍♂️ *SISTEMA PERSONAL TRAINER BALBINO PRO*\n`;
  text += `📋 *Prescrição Personalizada:* ${workout.titulo}\n`;
  text += `🎯 *Objetivo:* ${workout.objetivo}\n`;
  text += `⚡ *Frequência:* ${workout.frequencia_semanal}x por semana\n\n`;
  text += `═══════════════════════════\n`;
  text += `💪 *PROGRAMA DE TREINAMENTO*\n`;
  text += `═══════════════════════════\n`;

  workout.divisoes.forEach(d => {
    text += `\n📌 *TREINO ${d.letra} — ${d.nome.toUpperCase()}*\n`;
    d.exercicios.forEach((ex, idx) => {
      text += `${idx + 1}. *${ex.nome}*\n   └ ${ex.series} séries x ${ex.repeticoes} | Descanso: ${ex.tempo_descanso}\n`;
      if (ex.observacao) text += `   └ Obs: _${ex.observacao}_\n`;
    });
  });

  text += `\n═══════════════════════════\n`;
  text += `🥗 *PLANO ALIMENTAR DIÁRIO*\n`;
  text += `═══════════════════════════\n`;
  text += `🔥 *Meta Calórica:* ${diet.meta_calorica} kcal\n`;
  text += `🥩 Proteínas: ${diet.macronutrientes.proteina_g}g | 🍚 Carbos: ${diet.macronutrientes.carboidrato_g}g | 🥑 Gorduras: ${diet.macronutrientes.gordura_g}g\n\n`;

  diet.refeicoes.forEach(m => {
    text += `⏰ *${m.horario} — ${m.nome}*\n`;
    m.itens.forEach(it => {
      text += `  • ${it.quantidade} de ${it.alimento} (${it.calorias} kcal)\n`;
    });
    text += `\n`;
  });

  text += `_Gerado pelo Personal Trainer Balbino Pro com Co-Piloto de IA._`;
  return text;
}

describe('WhatsApp Formatter for Workout & Nutrition Export', () => {
  const sampleWorkout: WorkoutPlanOutput = {
    titulo: 'Periodização Hipertrofia A/B',
    objetivo: 'Ganho de massa muscular',
    frequencia_semanal: 4,
    divisoes: [
      {
        letra: 'A',
        nome: 'Peito e Tríceps',
        exercicios: [
          { nome: 'Supino Reto', series: 4, repeticoes: '8-10', tempo_descanso: '90s', observacao: 'Cadência controlada' },
          { nome: 'Tríceps Corda', series: 3, repeticoes: '12-15', tempo_descanso: '60s' }
        ]
      }
    ]
  };

  const sampleDiet: NutritionPlanOutput = {
    meta_calorica: 2500,
    macronutrientes: {
      proteina_g: 175,
      carboidrato_g: 290,
      gordura_g: 65
    },
    refeicoes: [
      {
        horario: '07:00',
        nome: 'Café da Manhã',
        itens: [
          { alimento: 'Ovo mexido', quantidade: '3 unidades', calorias: 210 },
          { alimento: 'Pão integral', quantidade: '2 fatias', calorias: 130 }
        ]
      }
    ]
  };

  it('should format message with header and emojis', () => {
    const output = formatWhatsAppMessage(sampleWorkout, sampleDiet);
    expect(output).toContain('🏋️‍♂️ *SISTEMA PERSONAL TRAINER BALBINO PRO*');
    expect(output).toContain('📋 *Prescrição Personalizada:* Periodização Hipertrofia A/B');
    expect(output).toContain('🎯 *Objetivo:* Ganho de massa muscular');
    expect(output).toContain('⚡ *Frequência:* 4x por semana');
  });

  it('should format exercises and divisions with numbers and observations', () => {
    const output = formatWhatsAppMessage(sampleWorkout, sampleDiet);
    expect(output).toContain('📌 *TREINO A — PEITO E TRÍCEPS*');
    expect(output).toContain('1. *Supino Reto*');
    expect(output).toContain('4 séries x 8-10 | Descanso: 90s');
    expect(output).toContain('Obs: _Cadência controlada_');
  });

  it('should format nutrition plan with macros and meals', () => {
    const output = formatWhatsAppMessage(sampleWorkout, sampleDiet);
    expect(output).toContain('🔥 *Meta Calórica:* 2500 kcal');
    expect(output).toContain('🥩 Proteínas: 175g | 🍚 Carbos: 290g | 🥑 Gorduras: 65g');
    expect(output).toContain('⏰ *07:00 — Café da Manhã*');
    expect(output).toContain('3 unidades de Ovo mexido (210 kcal)');
  });
});
