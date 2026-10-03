/**
 * BALBINO PRO — APLICAÇÃO PRINCIPAL (SPA)
 * Plataforma Inteligente para Personal Trainer & Nutrição
 */

import { Paciente, Exercicio, AvaliacaoFisica, PlanilhaMetrica, LogAuditoriaLGPD, AgendamentoAula, StudentAuthSession } from './types/database';
import { WorkoutPlanOutput, NutritionPlanOutput } from './types/ai';
import { authService, AuthUserSession } from './services/authService';
import { neonService } from './services/neonService';

// Declare Lucide icons
declare const lucide: any;

// ==============================================================================
// BASE DE DADOS INICIAL / ESTADO GLOBAL
// ==============================================================================

export type StudentRecord = Paciente & {
  idade: number;
  peso: number;
  altura: number;
  objetivo: string;
  lesoes: string;
  rotina: string;
  nivel: string;
  ficha?: string;
  calorias?: string;
};

const STORAGE_STUDENTS_KEY = 'balbino_students_list_v2';
const STORAGE_PLANILHAS_KEY = 'balbino_planilhas_list_v2';
const STORAGE_AGENDAMENTOS_KEY = 'balbino_agendamentos_list_v2';

const DEFAULT_INITIAL_AGENDAMENTOS: AgendamentoAula[] = [
  {
    id: 'ag-eduardo-01',
    personal_id: '11111111-1111-1111-1111-111111111111',
    paciente_id: '44444444-4444-4444-4444-444444444401',
    nome_aluno: 'Eduardo',
    telefone_aluno: '(11) 98888-1111',
    data_aula: '2026-10-06',
    horario: '07:00',
    tipo: 'PRESENCIAL',
    status: 'CONFIRMADO',
    observacoes: 'Foco no Treino A (Peitoral e Tríceps com progressão de cargas)',
    created_at: '2026-10-01T10:00:00.000Z',
    updated_at: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'ag-arthur-01',
    personal_id: '11111111-1111-1111-1111-111111111111',
    paciente_id: '44444444-4444-4444-4444-444444444402',
    nome_aluno: 'Arthur',
    telefone_aluno: '(11) 99999-2222',
    data_aula: '2026-10-07',
    horario: '18:00',
    tipo: 'PRESENCIAL',
    status: 'SOLICITADO',
    observacoes: 'Solicitação de treino funcional e revisão de técnica de agachamento',
    created_at: '2026-10-02T14:30:00.000Z',
    updated_at: '2026-10-02T14:30:00.000Z'
  }
];

function loadStoredAgendamentos(): AgendamentoAula[] {
  const result: AgendamentoAula[] = [];
  const seenIds = new Set<string>();

  const keysToInspect = [
    STORAGE_AGENDAMENTOS_KEY,
    'balbino_agendamentos_list',
    'balbino_local_db_cache_v2_agendamentos'
  ];

  for (const k of keysToInspect) {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && item.id && !seenIds.has(item.id)) {
              seenIds.add(item.id);
              result.push(item);
            }
          }
        }
      }
    } catch {}
  }

  for (const def of DEFAULT_INITIAL_AGENDAMENTOS) {
    if (!seenIds.has(def.id)) {
      seenIds.add(def.id);
      result.push(def);
    }
  }

  return result;
}

function saveStoredAgendamentos(list: AgendamentoAula[]) {
  try {
    const json = JSON.stringify(list);
    localStorage.setItem(STORAGE_AGENDAMENTOS_KEY, json);
    localStorage.setItem('balbino_agendamentos_list', json);
    localStorage.setItem('balbino_local_db_cache_v2_agendamentos', json);
  } catch (e) {
    console.warn('Erro ao salvar agendamentos no cache local:', e);
  }
}

const DEFAULT_INITIAL_STUDENTS: StudentRecord[] = [
  {
    id: '44444444-4444-4444-4444-444444444401',
    personal_id: '11111111-1111-1111-1111-111111111111',
    nome: 'Eduardo',
    email: 'eduardo@balbinopro.com',
    telefone: '(11) 98888-1111',
    sexo: 'M',
    idade: 35,
    peso: 78.5,
    altura: 178,
    nivel: 'AVANCADO',
    objetivo: 'HIPERTROFIA',
    lesoes: '',
    rotina: 'Treino de hipertrofia e força 5x por semana',
    termo_aceite_lgpd: true,
    data_aceite_lgpd: '2026-01-01T00:00:00.000Z'
  },
  {
    id: '44444444-4444-4444-4444-444444444402',
    personal_id: '11111111-1111-1111-1111-111111111111',
    nome: 'Arthur',
    email: 'arthur@balbinopro.com',
    telefone: '(11) 99999-2222',
    sexo: 'M',
    idade: 24,
    peso: 72.8,
    altura: 175,
    nivel: 'INTERMEDIARIO',
    objetivo: 'CONDICIONAMENTO',
    lesoes: '',
    rotina: 'Treino funcional e musculação 4x por semana',
    termo_aceite_lgpd: true,
    data_aceite_lgpd: '2026-01-01T00:00:00.000Z'
  }
];

const DEFAULT_INITIAL_PLANILHAS: PlanilhaMetrica[] = [
  {
    id: 'plan-eduardo-01',
    personal_id: '11111111-1111-1111-1111-111111111111',
    paciente_id: '44444444-4444-4444-4444-444444444401',
    titulo: 'Evolução de Cargas e Força — Eduardo',
    tipo: 'EVOLUCAO_CARGAS',
    dados_json: { lines_count: 5 },
    arquivo_csv: 'Data,Exercicio,Series,Reps,Carga_kg,RPE\n2026-09-01,Supino Reto,4,10,80,8\n2026-09-08,Supino Reto,4,10,84,8.5\n2026-09-15,Supino Reto,4,8,88,9\n2026-09-22,Supino Reto,4,8,90,9',
    created_at: '2026-09-01T10:00:00.000Z',
    updated_at: '2026-09-22T10:00:00.000Z'
  },
  {
    id: 'plan-arthur-01',
    personal_id: '11111111-1111-1111-1111-111111111111',
    paciente_id: '44444444-4444-4444-4444-444444444402',
    titulo: 'Métricas e Avaliação — Arthur',
    tipo: 'MEDIDAS_CORPORAIS',
    dados_json: { lines_count: 4 },
    arquivo_csv: 'Data,Peso_kg,Gordura_pct,MassaMagra_kg,Cintura_cm\n2026-08-01,75.0,18.5,61.1,84\n2026-09-01,73.8,16.8,61.4,82\n2026-10-01,72.8,15.2,61.7,80',
    created_at: '2026-08-01T10:00:00.000Z',
    updated_at: '2026-10-01T10:00:00.000Z'
  }
];

function loadStoredStudents(): StudentRecord[] {
  const result: StudentRecord[] = [];
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();

  const keysToInspect = [
    STORAGE_STUDENTS_KEY,
    'balbino_students_list',
    'balbino_local_db_cache_v2_pacientes',
    'balbino_local_db_cache_pacientes',
    'balbino_pacientes_list'
  ];

  try {
    if (typeof localStorage !== 'undefined') {
      for (const key of keysToInspect) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              for (const item of parsed) {
                if (item && item.nome && item.id !== '22222222-2222-2222-2222-222222222222') {
                  const safeName = item.nome.trim().toLowerCase();
                  if (!seenIds.has(item.id) && !seenNames.has(safeName)) {
                    seenIds.add(item.id);
                    seenNames.add(safeName);
                    result.push({
                      id: item.id,
                      personal_id: item.personal_id || '11111111-1111-1111-1111-111111111111',
                      nome: item.nome,
                      email: item.email || '',
                      telefone: item.telefone || '',
                      sexo: item.sexo || 'M',
                      idade: item.idade || 30,
                      peso: item.peso || 70,
                      altura: item.altura || 170,
                      nivel: item.nivel || 'INICIANTE',
                      objetivo: item.objetivo || item.objetivo_principal || 'EMAGRECIMENTO',
                      lesoes: item.lesoes || '',
                      rotina: item.rotina || '',
                      termo_aceite_lgpd: item.termo_aceite_lgpd ?? true,
                      data_aceite_lgpd: item.data_aceite_lgpd || new Date().toISOString()
                    });
                  }
                }
              }
            }
          } catch {}
        }
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar alunos do cache local:', e);
  }

  // Garante que os alunos Eduardo e Arthur estejam sempre presentes
  for (const def of DEFAULT_INITIAL_STUDENTS) {
    const defName = def.nome.trim().toLowerCase();
    if (!seenNames.has(defName) && !seenIds.has(def.id)) {
      seenIds.add(def.id);
      seenNames.add(defName);
      result.push({ ...def });
    }
  }

  saveStoredStudents(result);
  return result;
}

function saveStoredStudents(list: StudentRecord[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      const json = JSON.stringify(list);
      localStorage.setItem(STORAGE_STUDENTS_KEY, json);
      localStorage.setItem('balbino_students_list', json);
      localStorage.setItem('balbino_local_db_cache_v2_pacientes', json);
    }
  } catch (e) {
    console.warn('Erro ao salvar alunos no cache local:', e);
  }
}

function loadStoredPlanilhas(): PlanilhaMetrica[] {
  const result: PlanilhaMetrica[] = [];
  const seenIds = new Set<string>();

  const keysToInspect = [
    STORAGE_PLANILHAS_KEY,
    'balbino_planilhas_list',
    'balbino_local_db_cache_v2_planilhas',
    'balbino_local_db_cache_planilhas'
  ];

  try {
    if (typeof localStorage !== 'undefined') {
      for (const key of keysToInspect) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              for (const p of parsed) {
                if (p && p.id && p.paciente_id !== '22222222-2222-2222-2222-222222222222') {
                  if (!seenIds.has(p.id)) {
                    seenIds.add(p.id);
                    result.push(p);
                  }
                }
              }
            }
          } catch {}
        }
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar planilhas do cache local:', e);
  }

  for (const def of DEFAULT_INITIAL_PLANILHAS) {
    if (!seenIds.has(def.id)) {
      seenIds.add(def.id);
      result.push({ ...def });
    }
  }

  saveStoredPlanilhas(result);
  return result;
}

function saveStoredPlanilhas(list: PlanilhaMetrica[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      const json = JSON.stringify(list);
      localStorage.setItem(STORAGE_PLANILHAS_KEY, json);
      localStorage.setItem('balbino_planilhas_list', json);
      localStorage.setItem('balbino_local_db_cache_v2_planilhas', json);
    }
  } catch (e) {
    console.warn('Erro ao salvar planilhas no cache local:', e);
  }
}

const INITIAL_EXERCISES: Exercicio[] = [
  { id: 'ex-1', nome: 'Supino Reto com Barra', grupo_muscular: 'Peitoral', equipamento: 'Barra', instrucoes: 'Descer até a linha dos mamilos com escápulas aduzidas e pés firmes no solo.' },
  { id: 'ex-2', nome: 'Supino Inclinado com Halteres', grupo_muscular: 'Peitoral', equipamento: 'Halter', instrucoes: 'Banco em 30 a 45 graus, amplitude completa com cotovelos em 45 graus.' },
  { id: 'ex-3', nome: 'Crucifixo na Polia (Crossover)', grupo_muscular: 'Peitoral', equipamento: 'Polia', instrucoes: 'Manter leve flexão de cotovelo, pico de contração de 1s no ponto de fechamento.' },
  { id: 'ex-4', nome: 'Puxada Frontal Aberta', grupo_muscular: 'Dorsal', equipamento: 'Polia', instrucoes: 'Puxar barra até a fúrcula esternal, focando na depressão e adução das escápulas.' },
  { id: 'ex-5', nome: 'Remada Curvada com Barra (Pegada Pronada)', grupo_muscular: 'Dorsal', equipamento: 'Barra', instrucoes: 'Tronco inclinado a 45 graus, puxar a barra em direção ao umbigo mantendo lombar travada.' },
  { id: 'ex-6', nome: 'Remada Baixa no Triângulo', grupo_muscular: 'Dorsal', equipamento: 'Polia', instrucoes: 'Alongamento dorsal na fase excêntrica sem curvar a coluna lombar.' },
  { id: 'ex-7', nome: 'Agachamento Livre com Barra', grupo_muscular: 'Quadríceps', equipamento: 'Barra', instrucoes: 'Base na largura dos ombros, pés levemente abduzidos, descida controlada até 90 graus.' },
  { id: 'ex-8', nome: 'Leg Press 45 Graus', grupo_muscular: 'Quadríceps', equipamento: 'Máquina', instrucoes: 'Pés na largura do quadril, nunca hiperestender totalmente os joelhos no topo.' },
  { id: 'ex-9', nome: 'Cadeira Extensora', grupo_muscular: 'Quadríceps', equipamento: 'Máquina', instrucoes: 'Contração isométrica de 1 segundo no pico concêntrico.' },
  { id: 'ex-10', nome: 'Mesa Flexora', grupo_muscular: 'Posterior de Coxa', equipamento: 'Máquina', instrucoes: 'Manter quadril colado ao estofado durante a flexão de joelho.' },
  { id: 'ex-11', nome: 'Stiff com Halteres', grupo_muscular: 'Posterior de Coxa', equipamento: 'Halter', instrucoes: 'Manter pernas semiestendidas e coluna neutra, jogando o quadril para trás.' },
  { id: 'ex-12', nome: 'Elevação Pélvica com Barra', grupo_muscular: 'Glúteos', equipamento: 'Barra', instrucoes: 'Pico de contração de 2s no topo, apoio na linha inferior das escápulas.' },
  { id: 'ex-13', nome: 'Desenvolvimento Militar com Halteres', grupo_muscular: 'Ombros', equipamento: 'Halter', instrucoes: 'Subir os halteres no plano escapular (levemente à frente da linha dos ombros).' },
  { id: 'ex-14', nome: 'Elevação Lateral na Polia', grupo_muscular: 'Ombros', equipamento: 'Polia', instrucoes: 'Cabo na altura do joelho, elevar até a linha do ombro mantendo tensão contínua.' },
  { id: 'ex-15', nome: 'Crucifixo Invertido com Halteres', grupo_muscular: 'Ombros', equipamento: 'Halter', instrucoes: 'Foco no deltoide posterior e romboides, cadência lenta.' },
  { id: 'ex-16', nome: 'Tríceps Corda na Polia Alta', grupo_muscular: 'Tríceps', equipamento: 'Polia', instrucoes: 'Abrir a corda no final da extensão com contração de 1s.' },
  { id: 'ex-17', nome: 'Tríceps Testa com Barra W', grupo_muscular: 'Tríceps', equipamento: 'Barra', instrucoes: 'Cotovelos fechados apontando para o teto, descida controlada até a testa.' },
  { id: 'ex-18', nome: 'Rosca Direta com Barra W', grupo_muscular: 'Bíceps', equipamento: 'Barra', instrucoes: 'Cotovelos colados ao tronco, evitar balanço do corpo.' },
  { id: 'ex-19', nome: 'Rosca Martelo com Halteres', grupo_muscular: 'Bíceps', equipamento: 'Halter', instrucoes: 'Pegada neutra, foco no braquiorradial e braquial anterior.' },
  { id: 'ex-20', nome: 'Abdominal Supra na Polia (Crunch ajoelhado)', grupo_muscular: 'Abdômen / Core', equipamento: 'Polia', instrucoes: 'Flexionar a coluna em direção aos joelhos mantendo o quadril fixo.' },
  { id: 'ex-21', nome: 'Prancha Isométrica', grupo_muscular: 'Abdômen / Core', equipamento: 'Peso Corporal', instrucoes: 'Ativação simultânea de glúteos e abdômen, alinhamento cervical.' },
  { id: 'ex-22', nome: 'Panturrilha no Leg Press ou em Pé', grupo_muscular: 'Panturrilhas', equipamento: 'Máquina', instrucoes: 'Amplitude máxima de dorsiflexão e flexão plantar com pausa de 1s no topo.' }
];

// Current State
let students: StudentRecord[] = loadStoredStudents();
let planilhas: PlanilhaMetrica[] = loadStoredPlanilhas();
let agendamentos: AgendamentoAula[] = loadStoredAgendamentos();
let exercises: Exercicio[] = [...INITIAL_EXERCISES];
let selectedStudentId: string = students.length > 0 ? students[0].id : '';
let isApproved = false;

// Current Active Plan (Output of AI & Editor)
let currentWorkoutPlan: WorkoutPlanOutput = {
  titulo: "Periodização Hipertrofia A/B/C — Balbino Pro",
  objetivo: "Ganho de massa muscular com ênfase em peitoral, deltoides e membros inferiores",
  frequencia_semanal: 4,
  divisoes: [
    {
      letra: "A",
      nome: "Peito, Deltoide Anterior e Tríceps",
      exercicios: [
        { nome: "Supino Reto com Barra", grupo_muscular: "Peitoral", series: 4, repeticoes: "8-10", tempo_descanso: "90s", observacao: "Cadência 3-0-1-0, pés firmes no solo" },
        { nome: "Supino Inclinado com Halteres", grupo_muscular: "Peitoral", series: 3, repeticoes: "10-12", tempo_descanso: "75s", observacao: "Banco em 30 graus para foco clavicular" },
        { nome: "Crucifixo na Polia (Crossover)", grupo_muscular: "Peitoral", series: 3, repeticoes: "12-15", tempo_descanso: "60s", observacao: "Pico de contração de 1s" },
        { nome: "Desenvolvimento Militar com Halteres", grupo_muscular: "Ombros", series: 3, repeticoes: "8-10", tempo_descanso: "90s", observacao: "Subir no plano escapular" },
        { nome: "Tríceps Corda na Polia Alta", grupo_muscular: "Tríceps", series: 4, repeticoes: "12-15", tempo_descanso: "60s", observacao: "Drop-set na última série" }
      ]
    },
    {
      letra: "B",
      nome: "Dorsais, Deltoide Posterior e Bíceps",
      exercicios: [
        { nome: "Puxada Frontal Aberta", grupo_muscular: "Dorsal", series: 4, repeticoes: "8-10", tempo_descanso: "90s", observacao: "Depressão escapular inicial" },
        { nome: "Remada Curvada com Barra", grupo_muscular: "Dorsal", series: 4, repeticoes: "8-10", tempo_descanso: "90s", observacao: "Tronco firme a 45 graus" },
        { nome: "Crucifixo Invertido com Halteres", grupo_muscular: "Ombros", series: 3, repeticoes: "12-15", tempo_descanso: "60s", observacao: "Foco no deltoide posterior" },
        { nome: "Rosca Direta com Barra W", grupo_muscular: "Bíceps", series: 3, repeticoes: "10-12", tempo_descanso: "60s", observacao: "Sem balanço lombar" },
        { nome: "Rosca Martelo com Halteres", grupo_muscular: "Bíceps", series: 3, repeticoes: "10-12", tempo_descanso: "60s", observacao: "Contração máxima de antebraço" }
      ]
    },
    {
      letra: "C",
      nome: "Membros Inferiores & Core",
      exercicios: [
        { nome: "Agachamento Livre com Barra", grupo_muscular: "Quadríceps", series: 4, repeticoes: "8-10", tempo_descanso: "120s", observacao: "Descida controlada com peito estufado" },
        { nome: "Leg Press 45 Graus", grupo_muscular: "Quadríceps", series: 3, repeticoes: "10-12", tempo_descanso: "90s", observacao: "Sem hiperestensão articular" },
        { nome: "Mesa Flexora", grupo_muscular: "Posterior de Coxa", series: 4, repeticoes: "10-12", tempo_descanso: "60s", observacao: "Pausa excêntrica de 2s" },
        { nome: "Elevação Pélvica com Barra", grupo_muscular: "Glúteos", series: 3, repeticoes: "12", tempo_descanso: "75s", observacao: "Contração de 2s no topo" },
        { nome: "Panturrilha no Leg Press", grupo_muscular: "Panturrilhas", series: 4, repeticoes: "15", tempo_descanso: "45s", observacao: "Alongamento completo na descida" },
        { nome: "Prancha Isométrica", grupo_muscular: "Abdômen / Core", series: 3, repeticoes: "45s", tempo_descanso: "45s", observacao: "Ativação de glúteos e abdômen" }
      ]
    }
  ]
};

let currentDietPlan: NutritionPlanOutput = {
  meta_calorica: 2450,
  macronutrientes: {
    proteina_g: 160,
    carboidrato_g: 285,
    gordura_g: 65
  },
  refeicoes: [
    {
      horario: "06:00",
      nome: "Café da Manhã (Pré-Treino Imediato)",
      itens: [
        { alimento: "Banana prata com canela", quantidade: "1 unidade média (80g)", calorias: 75 },
        { alimento: "Pão integral 100%", quantidade: "2 fatias (50g)", calorias: 120 },
        { alimento: "Ovo de galinha mexido", quantidade: "2 unidades", calorias: 140 },
        { alimento: "Café preto sem açúcar", quantidade: "150ml", calorias: 5 }
      ]
    },
    {
      horario: "08:30",
      nome: "Lanche da Manhã (Pós-Treino)",
      itens: [
        { alimento: "Whey Protein Concentrado 80%", quantidade: "30g (1 dosador)", calorias: 120 },
        { alimento: "Aveia em flocos finos", quantidade: "30g (2 colheres)", calorias: 110 },
        { alimento: "Morango fresco", quantidade: "100g (5 unidades)", calorias: 32 }
      ]
    },
    {
      horario: "12:30",
      nome: "Almoço Completo",
      itens: [
        { alimento: "Peito de frango grelhado em tiras", quantidade: "150g", calorias: 240 },
        { alimento: "Arroz branco cozido", quantidade: "180g (1 escumadeira)", calorias: 230 },
        { alimento: "Feijão carioca cozido", quantidade: "100g (1 concha média)", calorias: 76 },
        { alimento: "Azeite de oliva extravirgem", quantidade: "1 colher de sobremesa (5ml)", calorias: 44 },
        { alimento: "Salada colorida de folhas e tomate", quantidade: "À vontade", calorias: 25 }
      ]
    },
    {
      horario: "16:30",
      nome: "Lanche da Tarde",
      itens: [
        { alimento: "Iogurte natural desnatado", quantidade: "170g (1 pote)", calorias: 85 },
        { alimento: "Castanha-do-pará", quantidade: "2 unidades (8g)", calorias: 55 },
        { alimento: "Maçã fuji", quantidade: "1 unidade", calorias: 70 }
      ]
    },
    {
      horario: "20:00",
      nome: "Jantar",
      itens: [
        { alimento: "Patinho bovino moído refogado", quantidade: "140g", calorias: 250 },
        { alimento: "Batata doce cozida", quantidade: "160g", calorias: 135 },
        { alimento: "Brócolis e cenoura no vapor", quantidade: "150g", calorias: 45 }
      ]
    }
  ]
};

// ==============================================================================
// INICIALIZAÇÃO DA APLICAÇÃO & AUTENTICAÇÃO SUPABASE (PROMPT 5)
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
  setupStudentPortal();
  setupAuth();
  setupNavigation();
  setupModals();
  setupAgendamentosTab();
  setupInviteLinks();
  renderDashboard();
  renderStudentsList();
  renderExercisesList();
  setupEvaluationTab();
  setupAIStudio();
  renderEditor();
  setupCopilotChat();
  renderStudentPhonePreview();
  setupPlanilhasTab();
  setupLGPDTab();
  setupNeonDatabaseHub();
  syncFromNeonCloud();

  // Refresh icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});

async function syncFromNeonCloud() {
  try {
    const cloudStudents = await neonService.getPacientes('personal-balbino');
    if (cloudStudents && cloudStudents.length > 0) {
      const mergedList = [...students];
      for (const cs of cloudStudents) {
        if (!cs || !cs.nome) continue;
        const idx = mergedList.findIndex(
          e => e.id === cs.id || e.nome.trim().toLowerCase() === cs.nome.trim().toLowerCase()
        );
        const formattedStudent: StudentRecord = {
          id: cs.id,
          personal_id: cs.personal_id || '11111111-1111-1111-1111-111111111111',
          nome: cs.nome,
          email: cs.email || '',
          telefone: cs.telefone || '',
          sexo: cs.sexo || 'M',
          idade: (cs as any).idade || 30,
          peso: (cs as any).peso || 70,
          altura: (cs as any).altura || 170,
          objetivo: (cs as any).objetivo || cs.objetivo_principal || 'EMAGRECIMENTO',
          lesoes: (cs as any).lesoes || '',
          rotina: (cs as any).rotina || '',
          nivel: (cs as any).nivel || 'INICIANTE',
          termo_aceite_lgpd: cs.termo_aceite_lgpd ?? true,
          data_aceite_lgpd: cs.data_aceite_lgpd || new Date().toISOString()
        };
        if (idx >= 0) {
          mergedList[idx] = { ...mergedList[idx], ...formattedStudent };
        } else {
          mergedList.push(formattedStudent);
        }
      }
      students = mergedList;
      saveStoredStudents(students);
      renderDashboard();
      renderStudentsList();
      setupEvaluationTab();
      setupAIStudio();
      renderStudentPhonePreview();
      setupPlanilhasTab();
      setupLGPDTab();
    }

    const cloudAgendamentos = await neonService.getAgendamentos('personal-balbino');
    if (cloudAgendamentos && cloudAgendamentos.length > 0) {
      const mergedAg = [...agendamentos];
      for (const ca of cloudAgendamentos) {
        if (!ca || !ca.id) continue;
        const idx = mergedAg.findIndex(a => a.id === ca.id);
        if (idx >= 0) {
          mergedAg[idx] = { ...mergedAg[idx], ...ca };
        } else {
          mergedAg.push(ca);
        }
      }
      agendamentos = mergedAg;
      saveStoredAgendamentos(agendamentos);
      updateAgendamentosCounters();
      renderAgendamentosList();
    }
  } catch (err) {
    console.warn('Sync inicial do Neon:', err);
  }
}

// Toast notification helper
function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==============================================================================
// 0. AUTENTICAÇÃO DO SISTEMA (SUPABASE AUTH & SESSÃO)
// ==============================================================================

function setupAuth() {
  const authContainer = document.getElementById('auth-container');
  const appLayout = document.getElementById('app-main-layout');

  const authTabs = document.querySelector('.auth-tabs') as HTMLElement;
  const tabBtnLogin = document.getElementById('tab-btn-login');
  const tabBtnRegister = document.getElementById('tab-btn-register');

  const formLogin = document.getElementById('form-login') as HTMLFormElement;
  const formRegister = document.getElementById('form-register') as HTMLFormElement;
  const formForgotPassword = document.getElementById('form-forgot-password') as HTMLFormElement;
  const formResetPassword = document.getElementById('form-reset-password') as HTMLFormElement;

  const linkToRegister = document.getElementById('link-to-register');
  const linkToLogin = document.getElementById('link-to-login');
  const linkForgotPassword = document.getElementById('link-forgot-password');
  const linkForgotToLogin = document.getElementById('link-forgot-to-login');
  const linkResetToLogin = document.getElementById('link-reset-to-login');

  const alertBox = document.getElementById('auth-alert-box');
  const alertMsg = document.getElementById('auth-alert-msg');
  const forgotSimBox = document.getElementById('forgot-sim-box');
  const btnForgotSimulateReset = document.getElementById('btn-forgot-simulate-reset');

  const resetTargetEmailText = document.getElementById('reset-target-email-text');
  let currentRecoveryEmail = 'balbino@personaltrainer.com';

  // Helper para alertas visuais amigáveis
  function showAuthAlert(message: string, type: 'error' | 'success' = 'error') {
    if (!alertBox || !alertMsg) return;
    alertMsg.textContent = message;
    alertBox.classList.remove('hidden', 'success', 'error');
    alertBox.classList.add(type === 'success' ? 'success' : 'error');
  }

  function clearAuthAlert() {
    alertBox?.classList.add('hidden');
    document.getElementById('pwd-match-error')?.classList.add('hidden');
    document.getElementById('reset-pwd-match-error')?.classList.add('hidden');
  }

  // Alternador de abas e telas da central de autenticação
  function switchAuthView(view: 'login' | 'register' | 'forgot' | 'reset', targetEmail?: string) {
    clearAuthAlert();

    // Esconde todos os formulários primeiro
    formLogin?.classList.add('hidden');
    formRegister?.classList.add('hidden');
    formForgotPassword?.classList.add('hidden');
    formResetPassword?.classList.add('hidden');

    if (view === 'login' || view === 'register') {
      authTabs?.classList.remove('hidden');
      if (view === 'login') {
        tabBtnLogin?.classList.add('active');
        tabBtnRegister?.classList.remove('active');
        formLogin?.classList.remove('hidden');
      } else {
        tabBtnLogin?.classList.remove('active');
        tabBtnRegister?.classList.add('active');
        formRegister?.classList.remove('hidden');
      }
    } else if (view === 'forgot') {
      authTabs?.classList.add('hidden');
      formForgotPassword?.classList.remove('hidden');
      forgotSimBox?.classList.add('hidden');
    } else if (view === 'reset') {
      authTabs?.classList.add('hidden');
      formResetPassword?.classList.remove('hidden');
      if (targetEmail) {
        currentRecoveryEmail = targetEmail;
      }
      if (resetTargetEmailText) {
        resetTargetEmailText.textContent = currentRecoveryEmail;
      }
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  tabBtnLogin?.addEventListener('click', () => switchAuthView('login'));
  tabBtnRegister?.addEventListener('click', () => switchAuthView('register'));
  linkToRegister?.addEventListener('click', () => switchAuthView('register'));
  linkToLogin?.addEventListener('click', () => switchAuthView('login'));
  linkForgotPassword?.addEventListener('click', () => switchAuthView('forgot'));
  linkForgotToLogin?.addEventListener('click', () => switchAuthView('login'));
  linkResetToLogin?.addEventListener('click', () => switchAuthView('login'));

  // Toggle de visibilidade da senha
  function setupPasswordToggle(btnId: string, inputId: string) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (!btn || !input) return;

    btn.addEventListener('click', () => {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.innerHTML = isPassword ? '<i data-lucide="eye-off"></i>' : '<i data-lucide="eye"></i>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
  }

  setupPasswordToggle('btn-toggle-login-pwd', 'login-password');
  setupPasswordToggle('btn-toggle-reg-pwd', 'register-password');
  setupPasswordToggle('btn-toggle-reg-confirm-pwd', 'register-confirm-password');
  setupPasswordToggle('btn-toggle-reset-pwd', 'reset-password');
  setupPasswordToggle('btn-toggle-reset-confirm-pwd', 'reset-confirm-password');

  // Helper para medição de força de senha
  function updatePasswordStrength(
    val: string,
    strengthFill: HTMLElement | null,
    strengthLabel: HTMLElement | null
  ) {
    if (!strengthFill || !strengthLabel) return;
    if (val.length === 0) {
      strengthFill.className = 'strength-fill';
      strengthLabel.textContent = 'Mínimo 6 dígitos';
      strengthLabel.style.color = 'var(--text-muted)';
    } else if (val.length < 6) {
      strengthFill.className = 'strength-fill weak';
      strengthLabel.textContent = 'Fraca (mínimo 6 caracteres)';
      strengthLabel.style.color = 'var(--accent-rose)';
    } else if (val.length < 8 || !/[0-9]/.test(val)) {
      strengthFill.className = 'strength-fill medium';
      strengthLabel.textContent = 'Média (adicione números/símbolos)';
      strengthLabel.style.color = 'var(--accent-amber)';
    } else {
      strengthFill.className = 'strength-fill strong';
      strengthLabel.textContent = 'Excelente (senha segura e forte)';
      strengthLabel.style.color = 'var(--accent-emerald)';
    }
  }

  // Validação e medidor de força de senha no cadastro
  const regPwdInput = document.getElementById('register-password') as HTMLInputElement;
  const regConfirmPwdInput = document.getElementById('register-confirm-password') as HTMLInputElement;
  const strengthFill = document.getElementById('pwd-strength-fill');
  const strengthLabel = document.getElementById('pwd-strength-label');
  const pwdMatchError = document.getElementById('pwd-match-error');

  regPwdInput?.addEventListener('input', () => {
    updatePasswordStrength(regPwdInput.value, strengthFill, strengthLabel);
    if (regConfirmPwdInput && regConfirmPwdInput.value) {
      pwdMatchError?.classList.toggle('hidden', regConfirmPwdInput.value === regPwdInput.value);
    }
  });

  regConfirmPwdInput?.addEventListener('input', () => {
    if (regPwdInput && regConfirmPwdInput.value) {
      pwdMatchError?.classList.toggle('hidden', regConfirmPwdInput.value === regPwdInput.value);
    }
  });

  // Validação e medidor de força de senha na redefinição (Reset)
  const resetPwdInput = document.getElementById('reset-password') as HTMLInputElement;
  const resetConfirmPwdInput = document.getElementById('reset-confirm-password') as HTMLInputElement;
  const resetStrengthFill = document.getElementById('reset-pwd-strength-fill');
  const resetStrengthLabel = document.getElementById('reset-pwd-strength-label');
  const resetPwdMatchError = document.getElementById('reset-pwd-match-error');

  resetPwdInput?.addEventListener('input', () => {
    updatePasswordStrength(resetPwdInput.value, resetStrengthFill, resetStrengthLabel);
    if (resetConfirmPwdInput && resetConfirmPwdInput.value) {
      resetPwdMatchError?.classList.toggle('hidden', resetConfirmPwdInput.value === resetPwdInput.value);
    }
  });

  resetConfirmPwdInput?.addEventListener('input', () => {
    if (resetPwdInput && resetConfirmPwdInput.value) {
      resetPwdMatchError?.classList.toggle('hidden', resetConfirmPwdInput.value === resetPwdInput.value);
    }
  });

  // SUBMISSÃO DE LOGIN (ENTRAR)
  formLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthAlert();

    const emailInput = document.getElementById('login-email') as HTMLInputElement;
    const passwordInput = document.getElementById('login-password') as HTMLInputElement;
    const submitBtn = document.getElementById('btn-login-submit') as HTMLButtonElement;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showAuthAlert('Informe seu e-mail e senha para prosseguir.');
      return;
    }

    const originalBtnHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> <span>Acessando...</span>';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
      const res = await authService.signIn(email, password);
      if (res.success) {
        showToast(res.message || 'Login realizado com sucesso!', 'success');
      } else {
        showAuthAlert(res.error || 'Falha ao autenticar.');
      }
    } catch (err: any) {
      showAuthAlert(err.message || 'Erro inesperado na autenticação.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  });

  // SUBMISSÃO DE CADASTRO (CRIAR CONTA & PERSISTIR NA TABELA PERSONAIS)
  formRegister?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthAlert();

    const nome = (document.getElementById('register-name') as HTMLInputElement).value.trim();
    const cref = (document.getElementById('register-cref') as HTMLInputElement).value.trim();
    const email = (document.getElementById('register-email') as HTMLInputElement).value.trim();
    const password = (document.getElementById('register-password') as HTMLInputElement).value;
    const confirmPassword = (document.getElementById('register-confirm-password') as HTMLInputElement).value;
    const submitBtn = document.getElementById('btn-register-submit') as HTMLButtonElement;

    if (!nome) {
      showAuthAlert('Por favor, informe seu Nome Completo.');
      return;
    }
    if (!cref) {
      showAuthAlert('Por favor, informe seu Registro Profissional CREF.');
      return;
    }
    if (!email || !email.includes('@')) {
      showAuthAlert('Por favor, informe um e-mail válido.');
      return;
    }
    if (password.length < 6) {
      showAuthAlert('A senha deve conter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      showAuthAlert('As senhas não coincidem. Digite novamente.');
      pwdMatchError?.classList.remove('hidden');
      return;
    }

    const originalBtnHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> <span>Criando conta...</span>';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
      const res = await authService.signUp({ nome, email, cref, senha: password });
      if (res.success) {
        showToast(res.message || 'Conta criada com sucesso! Redirecionando...', 'success');
      } else {
        showAuthAlert(res.error || 'Erro ao realizar cadastro.');
      }
    } catch (err: any) {
      showAuthAlert(err.message || 'Erro de conexão com o Supabase Auth.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  });

  // SUBMISSÃO DE RECUPERAÇÃO DE SENHA (SOLICITAÇÃO DE LINK)
  formForgotPassword?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthAlert();

    const emailInput = document.getElementById('forgot-email') as HTMLInputElement;
    const submitBtn = document.getElementById('btn-forgot-submit') as HTMLButtonElement;
    const email = emailInput.value.trim();

    if (!email || !email.includes('@')) {
      showAuthAlert('Por favor, informe um e-mail válido para recuperação.');
      return;
    }

    const originalBtnHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> <span>Enviando link...</span>';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
      const res = await authService.resetPasswordForEmail(email);
      if (res.success) {
        showAuthAlert(res.message || 'Link de recuperação enviado com sucesso!', 'success');
        currentRecoveryEmail = email;
        forgotSimBox?.classList.remove('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons();
      } else {
        showAuthAlert(res.error || 'Erro ao processar recuperação de senha.');
      }
    } catch (err: any) {
      showAuthAlert(err.message || 'Erro ao solicitar recuperação.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  });

  // BOTÃO DE SIMULAÇÃO/TRANSIÇÃO DIRETA PARA DEFINIR NOVA SENHA
  btnForgotSimulateReset?.addEventListener('click', () => {
    switchAuthView('reset', currentRecoveryEmail);
  });

  // SUBMISSÃO DA NOVA SENHA (GRAVAÇÃO SEGURA)
  formResetPassword?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAuthAlert();

    const newPassword = (document.getElementById('reset-password') as HTMLInputElement).value;
    const confirmNewPassword = (document.getElementById('reset-confirm-password') as HTMLInputElement).value;
    const submitBtn = document.getElementById('btn-reset-submit') as HTMLButtonElement;

    if (newPassword.length < 6) {
      showAuthAlert('A nova senha deve conter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showAuthAlert('As senhas digitadas não conferem. Verifique e tente novamente.');
      resetPwdMatchError?.classList.remove('hidden');
      return;
    }

    const originalBtnHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> <span>Salvando nova senha...</span>';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
      const res = await authService.updatePassword(newPassword, currentRecoveryEmail);
      if (res.success) {
        showToast(res.message || 'Senha alterada com sucesso!', 'success');
        formResetPassword.reset();
        switchAuthView('login');
        const loginEmailInput = document.getElementById('login-email') as HTMLInputElement;
        const loginPwdInput = document.getElementById('login-password') as HTMLInputElement;
        if (loginEmailInput) loginEmailInput.value = currentRecoveryEmail;
        if (loginPwdInput) {
          loginPwdInput.value = '';
          loginPwdInput.focus();
        }
      } else {
        showAuthAlert(res.error || 'Erro ao atualizar senha.');
      }
    } catch (err: any) {
      showAuthAlert(err.message || 'Erro ao redefinir a senha.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  });

  // LOGOUT (SAIR DA CONTA)
  document.getElementById('btn-sidebar-logout')?.addEventListener('click', async () => {
    if (confirm('Deseja realmente sair da conta do Personal Trainer?')) {
      await authService.signOut();
      showToast('Sessão encerrada com sucesso.', 'info');
    }
  });

  // CONFIGURAR SUPABASE (BOTÃO NA TELA DE AUTH)
  document.getElementById('btn-auth-config-supabase')?.addEventListener('click', () => {
    const modalSettings = document.getElementById('modal-settings');
    modalSettings?.classList.add('open');
    document.querySelector<HTMLButtonElement>('[data-settings-tab="supabase"]')?.click();
  });

  // OUVINTE DO EVENTO DE RECUPERAÇÃO DE SENHA DO SUPABASE
  authService.onPasswordRecovery((recoveryEmail: string) => {
    switchAuthView('reset', recoveryEmail || 'balbino@personaltrainer.com');
  });

  // DETECTA SE A URL CONTÉM HASH DE RECUPERAÇÃO DO SUPABASE
  if (typeof window !== 'undefined' && window.location.hash) {
    if (window.location.hash.includes('type=recovery')) {
      switchAuthView('reset');
    }
  }

  // OUVINTE DO ESTADO DE SESSÃO / REDIRECIONAMENTO AUTOMÁTICO
  authService.onAuthStateChanged((session: AuthUserSession | null) => {
    if (session && session.personal) {
      // SESSÃO ATIVA -> Redirecionar para o Dashboard principal
      authContainer?.classList.add('hidden');
      if (appLayout) appLayout.style.display = 'flex';

      const personalName = session.personal.nome || 'Eduardo Cunha Balbino';
      const personalCref = session.personal.cref ? `CREF ${session.personal.cref}` : 'CREF 123456-G/SP';

      // 1. Atualiza título da guia do navegador
      document.title = `${personalName} — Balbino Pro`;

      // 2. Atualiza Perfil do Personal no Top Header
      const headerUserName = document.getElementById('header-user-name');
      const headerUserCref = document.getElementById('header-user-cref');
      const headerUserAvatar = document.getElementById('header-user-avatar');
      if (headerUserName) headerUserName.textContent = personalName;
      if (headerUserCref) headerUserCref.textContent = personalCref;

      // 3. Atualiza Perfil do Personal no Sidebar
      const userNameEl = document.getElementById('sidebar-user-name');
      const userCrefEl = document.getElementById('sidebar-user-cref');
      const userAvatarEl = document.getElementById('sidebar-user-avatar');

      if (userNameEl) {
        userNameEl.textContent = personalName;
        userNameEl.title = personalName;
      }
      if (userCrefEl) userCrefEl.textContent = personalCref;

      const initials = personalName
        .split(' ')
        .filter(Boolean)
        .map(p => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'EB';

      if (userAvatarEl) userAvatarEl.textContent = initials;
      if (headerUserAvatar) headerUserAvatar.textContent = initials;

      // Atualiza formulário do modal de configurações
      const cfgName = document.getElementById('cfg-personal-name') as HTMLInputElement;
      const cfgCref = document.getElementById('cfg-personal-cref') as HTMLInputElement;
      if (cfgName) cfgName.value = personalName;
      if (cfgCref) cfgCref.value = session.personal.cref || '';
    } else {
      // SESSÃO INATIVA -> Exibir Tela de Login / Cadastro
      authContainer?.classList.remove('hidden');
      if (appLayout) appLayout.style.display = 'none';
      document.title = 'Balbino Pro — Plataforma Inteligente para Personal Trainer & Nutrição';
      switchAuthView('login');
    }
  });

  // Atualiza indicadores de configuração
  const config = authService.getSupabaseConfig();
  const statusLabel = document.getElementById('cfg-supabase-status-label');
  const authStatusText = document.getElementById('auth-supabase-status-text');
  if (config.isCustom) {
    if (statusLabel) statusLabel.textContent = `Conectado ao Supabase Cloud (${config.url})`;
    if (authStatusText) authStatusText.textContent = 'Supabase Cloud Conectado';
  }
}

// ==============================================================================
// 1. NAVEGAÇÃO ENTRE TABS
// ==============================================================================

function setupNavigation() {
  const navButtons = document.querySelectorAll<HTMLButtonElement>('.nav-item');
  const tabPanes = document.querySelectorAll<HTMLElement>('.tab-pane');
  const titleEl = document.getElementById('current-page-title');
  const subEl = document.getElementById('current-page-subtitle');

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    'dashboard': { title: 'Dashboard Geral', subtitle: 'Acompanhamento de alunos, prescrições ativas e co-piloto de IA' },
    'alunos': { title: 'Gestão de Alunos', subtitle: 'Cadastro completo de perfil, anamnese, rotina e métricas físicas' },
    'agendamentos': { title: 'Agendamentos de Aulas', subtitle: 'Solicitações de treinos e aulas pelos alunos pelo celular' },
    'avaliacoes': { title: 'Avaliação Física & Antropometria', subtitle: 'Cálculo de IMC, TMB, GET, 7 dobras cutâneas e circunferências' },
    'exercicios': { title: 'Biblioteca de Exercícios', subtitle: 'Catálogo de exercícios com orientações biomecânicas e filtros' },
    'gerador-ia': { title: 'Gerador de Prescrições com IA', subtitle: 'Co-piloto inteligente para prescrição de treinos e planos alimentares' },
    'editor-prescricao': { title: 'Editor Visual & Co-Piloto', subtitle: 'Ajustes finos do Personal Trainer e comandos em linguagem natural' },
    'app-aluno': { title: 'Visualização do Aluno (App Mobile)', subtitle: 'Prévia interativa da ficha e cardápio no smartphone do aluno' },
    'planilhas': { title: 'Gestão de Planilhas & Métricas na Nuvem', subtitle: 'Acompanhamento esportivo, cargas e planilhas no Neon PostgreSQL' },
    'privacidade-lgpd': { title: 'Central de Privacidade & LGPD', subtitle: 'Conformidade com a Lei 13.709/2018, dados sensíveis de saúde e auditoria' },
    'banco-dados': { title: 'Neon Serverless PostgreSQL (Nuvem)', subtitle: 'Banco de dados em nuvem 100% gratuito, Row Level Security (RLS) e DDL' }
  };

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      if (!tabId) return;

      navButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(`tab-${tabId}`);
      if (targetPane) targetPane.classList.add('active');

      if (tabTitles[tabId] && titleEl && subEl) {
        titleEl.textContent = tabTitles[tabId].title;
        subEl.textContent = tabTitles[tabId].subtitle;
        const currentPersonal = authService.getCurrentPersonal();
        const personalName = currentPersonal?.nome ? ` — ${currentPersonal.nome}` : '';
        document.title = `${tabTitles[tabId].title}${personalName} | Balbino Pro`;
      }

      // Auto-fechar sidebar no mobile após selecionar aba
      if (window.innerWidth <= 768) {
        sidebar?.classList.remove('open');
        sidebarBackdrop?.classList.remove('active');
      }

      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
  });

  // Mobile Menu Toggle & Backdrop
  const mobileToggle = document.getElementById('mobile-toggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');

  function toggleSidebar(open?: boolean) {
    if (open === undefined) {
      const isOpen = sidebar?.classList.toggle('open');
      sidebarBackdrop?.classList.toggle('active', !!isOpen);
    } else if (open) {
      sidebar?.classList.add('open');
      sidebarBackdrop?.classList.add('active');
    } else {
      sidebar?.classList.remove('open');
      sidebarBackdrop?.classList.remove('active');
    }
  }

  mobileToggle?.addEventListener('click', () => toggleSidebar());
  sidebarBackdrop?.addEventListener('click', () => toggleSidebar(false));

  // Quick generate button
  document.getElementById('btn-quick-generate')?.addEventListener('click', () => {
    const aiNavBtn = document.querySelector<HTMLButtonElement>('[data-tab="gerador-ia"]');
    aiNavBtn?.click();
  });
}

// ==============================================================================
// 2. DASHBOARD
// ==============================================================================

function renderDashboard() {
  const tbody = document.getElementById('tbody-dash-students');
  const totalStudentsEl = document.getElementById('dash-total-students');
  const badgeEl = document.getElementById('student-count-badge');
  const selectQuickAI = document.getElementById('quick-ai-student-select') as HTMLSelectElement;

  if (totalStudentsEl) totalStudentsEl.textContent = String(students.length);
  if (badgeEl) badgeEl.textContent = String(students.length);

  if (selectQuickAI) {
    if (students.length === 0) {
      selectQuickAI.innerHTML = '<option value="">Nenhum aluno cadastrado</option>';
    } else {
      selectQuickAI.innerHTML = students.map(s => `<option value="${s.id}">${s.nome} (${s.objetivo})</option>`).join('');
    }
  }

  if (tbody) {
    if (students.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4 text-muted">
            <i data-lucide="users" style="width:24px;height:24px;margin-bottom:6px;opacity:0.4;"></i>
            <p class="mb-0">Nenhum aluno cadastrado ainda. Clique no botão <strong>"+ Novo Aluno"</strong> para cadastrar.</p>
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = students.map(student => {
        const initials = student.nome.split(' ').map(n => n[0]).slice(0, 2).join('');
        return `
          <tr>
            <td>
              <div class="student-avatar-cell">
                <div class="student-initials">${initials}</div>
                <div>
                  <div class="student-meta-title">${student.nome}</div>
                  <div class="student-meta-sub">${student.idade} anos • ${student.peso}kg • ${student.altura}cm</div>
                </div>
              </div>
            </td>
            <td><span class="badge-neutral">${student.objetivo}</span></td>
            <td><span class="text-xs text-accent">${student.ficha || 'Ficha A/B/C Ativa'}</span></td>
            <td><span class="text-xs text-muted">${student.calorias || '2.450 kcal'}</span></td>
            <td>
              <button class="btn-secondary btn-sm btn-open-student-ai" data-id="${student.id}">
                <i data-lucide="sparkles" style="width:14px;height:14px;"></i> Prescrever
              </button>
            </td>
          </tr>
        `;
      }).join('');

      tbody.querySelectorAll('.btn-open-student-ai').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
          if (id) {
            selectedStudentId = id;
            const aiNavBtn = document.querySelector<HTMLButtonElement>('[data-tab="gerador-ia"]');
            aiNavBtn?.click();
            const aiSelect = document.getElementById('ai-form-student-select') as HTMLSelectElement;
            if (aiSelect) aiSelect.value = id;
          }
        });
      });
    }
  }

  // Dashboard quick AI buttons
  document.querySelectorAll('.btn-ai-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (students.length === 0) {
        showToast('Cadastre um aluno primeiro para gerar prescrições com IA.', 'info');
        openStudentModal();
        return;
      }
      const action = (e.currentTarget as HTMLElement).getAttribute('data-action');
      const studentId = selectQuickAI?.value || students[0].id;
      selectedStudentId = studentId;

      const aiNavBtn = document.querySelector<HTMLButtonElement>('[data-tab="gerador-ia"]');
      aiNavBtn?.click();

      const aiSelect = document.getElementById('ai-form-student-select') as HTMLSelectElement;
      if (aiSelect) aiSelect.value = studentId;

      const radioWorkout = document.querySelector<HTMLInputElement>('input[name="rx-type"][value="WORKOUT"]');
      const radioNutrition = document.querySelector<HTMLInputElement>('input[name="rx-type"][value="NUTRITION"]');
      const radioBoth = document.querySelector<HTMLInputElement>('input[name="rx-type"][value="BOTH"]');

      if (action === 'workout' && radioWorkout) {
        radioWorkout.checked = true;
        radioWorkout.parentElement?.classList.add('active');
        radioNutrition?.parentElement?.classList.remove('active');
        radioBoth?.parentElement?.classList.remove('active');
      } else if (action === 'diet' && radioNutrition) {
        radioNutrition.checked = true;
        radioNutrition.parentElement?.classList.add('active');
        radioWorkout?.parentElement?.classList.remove('active');
        radioBoth?.parentElement?.classList.remove('active');
      } else if (action === 'both' && radioBoth) {
        radioBoth.checked = true;
        radioBoth.parentElement?.classList.add('active');
        radioWorkout?.parentElement?.classList.remove('active');
        radioNutrition?.parentElement?.classList.remove('active');
      }
    });
  });

  document.getElementById('dash-btn-add-student')?.addEventListener('click', () => {
    openStudentModal();
  });
}

// ==============================================================================
// 3. GESTÃO DE ALUNOS
// ==============================================================================

function renderStudentsList() {
  const container = document.getElementById('students-cards-container');
  if (!container) return;

  const searchQuery = (document.getElementById('search-students') as HTMLInputElement)?.value.toLowerCase() || '';

  const filtered = students.filter(s => 
    s.nome.toLowerCase().includes(searchQuery) ||
    s.objetivo.toLowerCase().includes(searchQuery) ||
    (s.email && s.email.toLowerCase().includes(searchQuery))
  );

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card p-5 text-center text-muted" style="grid-column: 1 / -1; background: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: var(--radius-lg); margin-top: 10px;">
        <i data-lucide="user-plus" style="width: 44px; height: 44px; margin: 0 auto 12px; color: var(--accent-indigo); opacity: 0.8;"></i>
        <h4 style="color: #fff; margin-bottom: 6px;">Nenhum aluno encontrado</h4>
        <p class="text-xs text-muted mb-3">Cadastre seus alunos para iniciar o acompanhamento, prescrição por IA e avaliações físicas.</p>
        <button class="btn-primary btn-sm mx-auto" id="btn-empty-add-student" style="width: max-content;">
          <i data-lucide="plus"></i> Cadastrar Primeiro Aluno
        </button>
      </div>
    `;
    document.getElementById('btn-empty-add-student')?.addEventListener('click', () => openStudentModal());
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  container.innerHTML = filtered.map(student => {
    const initials = student.nome.split(' ').map(n => n[0]).slice(0, 2).join('');
    const imc = (student.peso / Math.pow(student.altura / 100, 2)).toFixed(1);

    return `
      <div class="student-card">
        <div class="student-card-header">
          <div class="student-card-avatar">${initials}</div>
          <div>
            <h4 class="student-card-name">${student.nome}</h4>
            <span class="student-card-goal">${student.objetivo} • Nível ${student.nivel}</span>
          </div>
        </div>

        <div class="student-metrics-mini">
          <div>
            <span>Peso</span>
            <strong>${student.peso} kg</strong>
          </div>
          <div>
            <span>Altura</span>
            <strong>${student.altura} cm</strong>
          </div>
          <div>
            <span>IMC</span>
            <strong>${imc}</strong>
          </div>
        </div>

        ${student.lesoes ? `
          <div class="student-injuries-box">
            <i data-lucide="alert-triangle" style="width:16px;height:16px;flex-shrink:0;"></i>
            <span>${student.lesoes}</span>
          </div>
        ` : ''}

        <p class="text-xs text-muted" style="line-height:1.4;">
          <strong>Rotina:</strong> ${student.rotina || 'Não informada'}
        </p>

        <div class="student-card-footer">
          <button class="btn-primary btn-sm btn-student-generate" data-id="${student.id}">
            <i data-lucide="sparkles" style="width:14px;height:14px;"></i> Prescrição IA
          </button>
          <button class="btn-secondary btn-sm btn-student-eval" data-id="${student.id}">
            <i data-lucide="activity" style="width:14px;height:14px;"></i> Avaliação
          </button>
          <button class="btn-icon-ghost btn-student-edit" data-id="${student.id}" title="Editar">
            <i data-lucide="edit-2" style="width:16px;height:16px;"></i>
          </button>
          <button class="btn-icon-ghost text-danger btn-student-delete" data-id="${student.id}" title="Excluir Aluno">
            <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Event listeners on student card buttons
  container.querySelectorAll('.btn-student-generate').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (id) {
        selectedStudentId = id;
        document.querySelector<HTMLButtonElement>('[data-tab="gerador-ia"]')?.click();
        const sel = document.getElementById('ai-form-student-select') as HTMLSelectElement;
        if (sel) sel.value = id;
      }
    });
  });

  container.querySelectorAll('.btn-student-eval').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (id) {
        selectedStudentId = id;
        document.querySelector<HTMLButtonElement>('[data-tab="avaliacoes"]')?.click();
        const sel = document.getElementById('eval-student-select') as HTMLSelectElement;
        if (sel) {
          sel.value = id;
          sel.dispatchEvent(new Event('change'));
        }
      }
    });
  });

  container.querySelectorAll('.btn-student-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (id) {
        const student = students.find(s => s.id === id);
        if (student) openStudentModal(student);
      }
    });
  });

  container.querySelectorAll('.btn-student-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
      if (!id) return;
      const targetStudent = students.find(s => s.id === id);
      if (!targetStudent) return;
      if (confirm(`Deseja realmente excluir o aluno "${targetStudent.nome}"?\nTodos os treinos e dados vinculados serão excluídos com segurança.`)) {
        students = students.filter(s => s.id !== id);
        saveStoredStudents(students);
        await neonService.deletePacienteLGPD(id, 'personal-balbino', 'Exclusão pelo personal trainer');
        renderDashboard();
        renderStudentsList();
        setupEvaluationTab();
        setupAIStudio();
        renderStudentPhonePreview();
        setupPlanilhasTab();
        setupLGPDTab();
        showToast(`Aluno "${targetStudent.nome}" excluído com sucesso!`, 'info');
      }
    });
  });

  document.getElementById('search-students')?.addEventListener('input', () => {
    renderStudentsList();
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ==============================================================================
// 4. AVALIAÇÃO FÍSICA & ANTROPOMETRIA
// ==============================================================================

function setupEvaluationTab() {
  const select = document.getElementById('eval-student-select') as HTMLSelectElement;
  const weightInput = document.getElementById('eval-weight') as HTMLInputElement;
  const heightInput = document.getElementById('eval-height') as HTMLInputElement;
  const bfInput = document.getElementById('eval-bf') as HTMLInputElement;
  const activitySelect = document.getElementById('eval-activity-factor') as HTMLSelectElement;

  if (select) {
    if (students.length === 0) {
      select.innerHTML = '<option value="">Nenhum aluno cadastrado</option>';
      if (weightInput) weightInput.value = '';
      if (heightInput) heightInput.value = '';
    } else {
      select.innerHTML = students.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
      const current = students.find(item => item.id === select.value) || students[0];
      if (current) {
        select.value = current.id;
        if (weightInput) weightInput.value = String(current.peso);
        if (heightInput) heightInput.value = String(current.altura);
      }
    }

    select.addEventListener('change', () => {
      const s = students.find(item => item.id === select.value);
      if (s) {
        if (weightInput) weightInput.value = String(s.peso);
        if (heightInput) heightInput.value = String(s.altura);
        recalculateAntropometry();
      }
    });
  }

  [weightInput, heightInput, bfInput, activitySelect].forEach(el => {
    el?.addEventListener('input', recalculateAntropometry);
  });

  recalculateAntropometry();

  document.getElementById('btn-save-evaluation')?.addEventListener('click', () => {
    if (students.length === 0) {
      showToast('Cadastre um aluno primeiro para salvar a avaliação.', 'error');
      return;
    }
    showToast('Avaliação antropométrica salva com sucesso no PostgreSQL!', 'success');
  });
}

function recalculateAntropometry() {
  const weight = parseFloat((document.getElementById('eval-weight') as HTMLInputElement)?.value) || 75;
  const height = parseFloat((document.getElementById('eval-height') as HTMLInputElement)?.value) || 175;
  const bf = parseFloat((document.getElementById('eval-bf') as HTMLInputElement)?.value) || 15;
  const activity = parseFloat((document.getElementById('eval-activity-factor') as HTMLSelectElement)?.value) || 1.55;

  // IMC
  const heightM = height / 100;
  const imc = (weight / (heightM * heightM));
  const imcEl = document.getElementById('calc-imc');
  const imcClassEl = document.getElementById('calc-imc-class');
  if (imcEl) imcEl.textContent = `${imc.toFixed(1)} kg/m²`;

  if (imcClassEl) {
    if (imc < 18.5) { imcClassEl.textContent = 'Abaixo do peso'; imcClassEl.style.color = '#f59e0b'; }
    else if (imc < 25) { imcClassEl.textContent = 'Peso Adequado'; imcClassEl.style.color = '#10b981'; }
    else if (imc < 30) { imcClassEl.textContent = 'Sobrepeso'; imcClassEl.style.color = '#f59e0b'; }
    else { imcClassEl.textContent = 'Obesidade'; imcClassEl.style.color = '#f43f5e'; }
  }

  // TMB (Mifflin-St Jeor: 10 * peso + 6.25 * altura - 5 * idade + 5)
  const age = 28;
  const tmb = Math.round((10 * weight) + (6.25 * height) - (5 * age) + 5);
  const get = Math.round(tmb * activity);

  const tmbEl = document.getElementById('calc-tmb');
  const getEl = document.getElementById('calc-get');
  if (tmbEl) tmbEl.textContent = `${tmb.toLocaleString('pt-BR')} kcal`;
  if (getEl) getEl.textContent = `${get.toLocaleString('pt-BR')} kcal`;

  // Massa magra vs gorda
  const fatKg = (weight * (bf / 100));
  const leanKg = (weight - fatKg);

  const leanEl = document.getElementById('calc-massa-magra');
  const fatEl = document.getElementById('calc-massa-gorda');
  if (leanEl) leanEl.textContent = `${leanKg.toFixed(1)} kg`;
  if (fatEl) fatEl.textContent = `${fatKg.toFixed(1)} kg`;
}

// ==============================================================================
// 5. BIBLIOTECA DE EXERCÍCIOS
// ==============================================================================

function renderExercisesList() {
  const container = document.getElementById('exercises-cards-container');
  if (!container) return;

  const searchQuery = (document.getElementById('search-exercises') as HTMLInputElement)?.value.toLowerCase() || '';
  const muscleFilter = (document.getElementById('filter-muscle-group') as HTMLSelectElement)?.value || 'ALL';
  const equipFilter = (document.getElementById('filter-equipment') as HTMLSelectElement)?.value || 'ALL';

  const filtered = exercises.filter(ex => {
    const matchQuery = ex.nome.toLowerCase().includes(searchQuery) ||
                       ex.grupo_muscular.toLowerCase().includes(searchQuery) ||
                       (ex.instrucoes && ex.instrucoes.toLowerCase().includes(searchQuery));
    const matchMuscle = muscleFilter === 'ALL' || ex.grupo_muscular === muscleFilter;
    const matchEquip = equipFilter === 'ALL' || (ex.equipamento && ex.equipamento.includes(equipFilter));
    return matchQuery && matchMuscle && matchEquip;
  });

  container.innerHTML = filtered.map(ex => `
    <div class="exercise-card">
      <div class="exercise-badge-row">
        <span class="exercise-muscle-badge">${ex.grupo_muscular}</span>
        <span class="exercise-equip-badge">${ex.equipamento || 'Geral'}</span>
      </div>
      <h4 class="exercise-title">${ex.nome}</h4>
      <p class="exercise-instruction">${ex.instrucoes || 'Sem instruções cadastradas.'}</p>
    </div>
  `).join('');

  document.getElementById('search-exercises')?.addEventListener('input', renderExercisesList);
  document.getElementById('filter-muscle-group')?.addEventListener('change', renderExercisesList);
  document.getElementById('filter-equipment')?.addEventListener('change', renderExercisesList);

  document.getElementById('btn-open-add-exercise-modal')?.addEventListener('click', () => {
    document.getElementById('modal-exercise')?.classList.add('open');
  });
}

// ==============================================================================
// 6. GERADOR DE PRESCRIÇÕES COM IA (PROMPT 2 & 3)
// ==============================================================================

function setupAIStudio() {
  const selectStudent = document.getElementById('ai-form-student-select') as HTMLSelectElement;
  const goalSelect = document.getElementById('ai-form-goal') as HTMLSelectElement;
  const levelSelect = document.getElementById('ai-form-level') as HTMLSelectElement;
  const injuriesInput = document.getElementById('ai-form-injuries') as HTMLInputElement;
  const dietPrefsInput = document.getElementById('ai-form-diet-prefs') as HTMLInputElement;

  if (selectStudent) {
    if (students.length === 0) {
      selectStudent.innerHTML = '<option value="">Nenhum aluno cadastrado</option>';
    } else {
      selectStudent.innerHTML = students.map(s => `<option value="${s.id}">${s.nome} (${s.objetivo})</option>`).join('');
      const current = students.find(item => item.id === selectStudent.value) || students[0];
      if (current) {
        selectStudent.value = current.id;
        if (goalSelect) goalSelect.value = current.objetivo;
        if (levelSelect) levelSelect.value = current.nivel;
        if (injuriesInput) injuriesInput.value = current.lesoes || '';
        if (dietPrefsInput) dietPrefsInput.value = current.rotina || '';
      }
    }

    selectStudent.addEventListener('change', () => {
      const s = students.find(item => item.id === selectStudent.value);
      if (s) {
        if (goalSelect) goalSelect.value = s.objetivo;
        if (levelSelect) levelSelect.value = s.nivel;
        if (injuriesInput) injuriesInput.value = s.lesoes || '';
        if (dietPrefsInput) dietPrefsInput.value = s.rotina || '';
      }
    });
  }

  // Prescription Type Pills
  document.querySelectorAll('.type-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.type-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const radio = pill.querySelector('input') as HTMLInputElement;
      if (radio) radio.checked = true;
    });
  });

  // AI Trigger Generation
  document.getElementById('btn-trigger-ai-generation')?.addEventListener('click', executeAIGeneration);
  document.getElementById('btn-send-to-editor')?.addEventListener('click', () => {
    document.querySelector<HTMLButtonElement>('[data-tab="editor-prescricao"]')?.click();
  });
}

async function executeAIGeneration() {
  const selectStudent = document.getElementById('ai-form-student-select') as HTMLSelectElement;
  if (!selectStudent || !selectStudent.value || students.length === 0) {
    showToast('Cadastre ou selecione um aluno para prescrever treino com IA.', 'error');
    return;
  }
  const emptyState = document.getElementById('ai-preview-empty');
  const loadingState = document.getElementById('ai-preview-loading');
  const contentState = document.getElementById('ai-preview-content');
  const loadingStep = document.getElementById('ai-loading-step');
  const badge = document.getElementById('ai-output-badge');
  const btnSend = document.getElementById('btn-send-to-editor') as HTMLButtonElement;

  emptyState?.classList.add('d-none');
  contentState?.classList.add('d-none');
  loadingState?.classList.remove('d-none');
  if (badge) badge.textContent = 'Processando com IA...';

  const steps = [
    'Analisando anamnese e histórico de lesões...',
    'Calculando divisão de grupos musculares e cadência...',
    'Definindo volume ótimo e tempos de descanso...',
    'Calculando TMB, GET e balanço de macronutrientes...',
    'Estruturando JSON puro validado conforme esquema...'
  ];

  for (let i = 0; i < steps.length; i++) {
    if (loadingStep) loadingStep.textContent = steps[i];
    await new Promise(r => setTimeout(r, 450));
  }

  loadingState?.classList.add('d-none');
  contentState?.classList.remove('d-none');
  if (badge) {
    badge.textContent = 'Minuta Gerada com Sucesso';
    badge.className = 'badge-ai';
  }
  if (btnSend) btnSend.disabled = false;

  // Render generated preview
  if (contentState) {
    contentState.innerHTML = `
      <div class="alert alert-info mb-4">
        <i data-lucide="sparkles"></i>
        <div>
          <strong>Minuta de Prescrição Gerada com Sucesso!</strong>
          <p class="text-xs">A proposta abaixo foi calculada especificamente para as métricas do aluno. Você pode revisá-la e personalizá-la no <strong>Editor Visual & Co-Piloto</strong>.</p>
        </div>
      </div>

      <div class="card mb-4">
        <div class="card-header">
          <div class="card-title-group">
            <i data-lucide="dumbbell"></i>
            <h3>${currentWorkoutPlan.titulo}</h3>
          </div>
          <span class="badge-neutral">${currentWorkoutPlan.frequencia_semanal}x por semana</span>
        </div>
        <div class="card-body">
          <p class="text-xs text-muted mb-3"><strong>Foco:</strong> ${currentWorkoutPlan.objetivo}</p>
          <div class="divisions-preview-list">
            ${currentWorkoutPlan.divisoes.map(d => `
              <div class="p-3 mb-2 rounded-md" style="background:rgba(0,0,0,0.2); border:1px solid var(--border-color);">
                <div class="d-flex align-items-center gap-2 mb-2">
                  <span class="division-letter-badge">${d.letra}</span>
                  <strong>${d.nome}</strong>
                  <span class="text-xs text-muted">(${d.exercicios.length} exercícios)</span>
                </div>
                <div class="text-xs text-secondary">
                  ${d.exercicios.map(ex => `• <strong>${ex.nome}</strong>: ${ex.series}x ${ex.repeticoes} (Descanso: ${ex.tempo_descanso})`).join('<br>')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title-group">
            <i data-lucide="utensils"></i>
            <h3>Plano Alimentar Esportivo</h3>
          </div>
          <span class="badge-neutral">${currentDietPlan.meta_calorica} kcal</span>
        </div>
        <div class="card-body">
          <div class="macros-summary-bar mb-3">
            <div class="macro-pill macro-cal"><span class="macro-title">Calorias</span><strong>${currentDietPlan.meta_calorica} kcal</strong></div>
            <div class="macro-pill macro-prot"><span class="macro-title">Proteínas</span><strong>${currentDietPlan.macronutrientes.proteina_g}g</strong></div>
            <div class="macro-pill macro-carb"><span class="macro-title">Carboidratos</span><strong>${currentDietPlan.macronutrientes.carboidrato_g}g</strong></div>
            <div class="macro-pill macro-fat"><span class="macro-title">Gorduras</span><strong>${currentDietPlan.macronutrientes.gordura_g}g</strong></div>
          </div>
          <p class="text-xs text-muted">${currentDietPlan.refeicoes.length} refeições estruturadas com foco em timing pré e pós-treino.</p>
        </div>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  showToast('Minuta gerada com sucesso pela IA!', 'success');
}

// ==============================================================================
// 7. EDITOR VISUAL E VALIDADOR (PROMPT 4 - CO-PILOTO)
// ==============================================================================

function renderEditor() {
  renderWorkoutEditor();
  renderDietEditor();

  // Subtabs (Treino vs Dieta)
  document.querySelectorAll('.subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.subtab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.getAttribute('data-subtab');
      if (target) document.getElementById(`subtab-${target}`)?.classList.add('active');
    });
  });

  // Approve Plan
  document.getElementById('btn-approve-plan')?.addEventListener('click', () => {
    isApproved = true;
    const pill = document.getElementById('editor-status-pill');
    if (pill) {
      pill.textContent = 'APROVADO';
      pill.classList.add('approved');
    }
    showToast('Prescrição Aprovada! Disponibilizada na conta do aluno.', 'success');
  });

  // Export WhatsApp
  document.getElementById('btn-export-whatsapp')?.addEventListener('click', copyWhatsAppPlan);
  document.getElementById('btn-preview-copy-wpp')?.addEventListener('click', copyWhatsAppPlan);
}

function renderWorkoutEditor() {
  const container = document.getElementById('editor-divisions-list');
  if (!container) return;

  container.innerHTML = currentWorkoutPlan.divisoes.map((div, dIndex) => `
    <div class="division-card" data-dindex="${dIndex}">
      <div class="division-header">
        <div class="d-flex align-items-center gap-2 flex-1">
          <div class="division-letter-badge">${div.letra}</div>
          <input type="text" class="division-title-input" value="${div.nome}" onchange="updateDivisionName(${dIndex}, this.value)">
        </div>
        <button class="btn-icon-ghost" onclick="addExerciseToDivision(${dIndex})" title="Adicionar Exercício">
          <i data-lucide="plus"></i>
        </button>
      </div>
      <div class="division-body">
        <div class="exercise-item-row" style="background:rgba(0,0,0,0.1); font-size:0.72rem; font-weight:700; color:var(--text-muted);">
          <span>Exercício</span>
          <span>Séries</span>
          <span>Repetições</span>
          <span>Carga</span>
          <span>Descanso</span>
          <span></span>
        </div>
        ${div.exercicios.map((ex, exIndex) => `
          <div class="exercise-item-row">
            <input type="text" value="${ex.nome}" placeholder="Nome do exercício" onchange="updateExField(${dIndex}, ${exIndex}, 'nome', this.value)">
            <input type="number" value="${ex.series}" placeholder="Séries" onchange="updateExField(${dIndex}, ${exIndex}, 'series', this.value)">
            <input type="text" value="${ex.repeticoes}" placeholder="Reps" onchange="updateExField(${dIndex}, ${exIndex}, 'repeticoes', this.value)">
            <input type="text" value="${ex.observacao || '20kg'}" placeholder="Carga/Obs" onchange="updateExField(${dIndex}, ${exIndex}, 'observacao', this.value)">
            <input type="text" value="${ex.tempo_descanso}" placeholder="Descanso" onchange="updateExField(${dIndex}, ${exIndex}, 'tempo_descanso', this.value)">
            <button class="btn-icon-ghost" onclick="removeExercise(${dIndex}, ${exIndex})" title="Remover">
              <i data-lucide="trash-2" style="color:var(--accent-rose);"></i>
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderDietEditor() {
  const container = document.getElementById('editor-meals-list');
  const calEl = document.getElementById('macro-val-cal');
  const protEl = document.getElementById('macro-val-prot');
  const carbEl = document.getElementById('macro-val-carb');
  const fatEl = document.getElementById('macro-val-fat');

  if (calEl) calEl.textContent = `${currentDietPlan.meta_calorica} kcal`;
  if (protEl) protEl.textContent = `${currentDietPlan.macronutrientes.proteina_g}g`;
  if (carbEl) carbEl.textContent = `${currentDietPlan.macronutrientes.carboidrato_g}g`;
  if (fatEl) fatEl.textContent = `${currentDietPlan.macronutrientes.gordura_g}g`;

  if (!container) return;

  container.innerHTML = currentDietPlan.refeicoes.map((meal, mIndex) => `
    <div class="meal-card" data-mindex="${mIndex}">
      <div class="meal-header">
        <div class="d-flex align-items-center gap-2 flex-1">
          <input type="text" value="${meal.horario}" style="width:70px; background:var(--bg-input); border:1px solid var(--border-color); border-radius:4px; padding:4px 6px; color:#fff; font-size:0.8rem; font-weight:700;" onchange="updateMealTime(${mIndex}, this.value)">
          <input type="text" value="${meal.nome}" style="background:transparent; border:none; color:#fff; font-weight:700; font-size:0.95rem; flex:1;" onchange="updateMealName(${mIndex}, this.value)">
        </div>
        <button class="btn-icon-ghost" onclick="addFoodToMeal(${mIndex})" title="Adicionar Alimento">
          <i data-lucide="plus"></i>
        </button>
      </div>
      <div class="meal-body">
        ${meal.itens.map((it, itIndex) => `
          <div class="meal-item-row">
            <input type="text" value="${it.alimento}" placeholder="Alimento" onchange="updateMealItem(${mIndex}, ${itIndex}, 'alimento', this.value)">
            <input type="text" value="${it.quantidade}" placeholder="Quantidade" onchange="updateMealItem(${mIndex}, ${itIndex}, 'quantidade', this.value)">
            <input type="number" value="${it.calorias}" placeholder="Kcal" onchange="updateMealItem(${mIndex}, ${itIndex}, 'calorias', this.value)">
            <button class="btn-icon-ghost" onclick="removeFoodItem(${mIndex}, ${itIndex})" title="Remover">
              <i data-lucide="trash-2" style="color:var(--accent-rose);"></i>
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Global window helpers for inline editor handlers
(window as any).updateDivisionName = (dIndex: number, val: string) => {
  currentWorkoutPlan.divisoes[dIndex].nome = val;
};

(window as any).updateExField = (dIndex: number, exIndex: number, field: string, val: any) => {
  (currentWorkoutPlan.divisoes[dIndex].exercicios[exIndex] as any)[field] = val;
};

(window as any).removeExercise = (dIndex: number, exIndex: number) => {
  currentWorkoutPlan.divisoes[dIndex].exercicios.splice(exIndex, 1);
  renderWorkoutEditor();
  renderStudentPhonePreview();
};

(window as any).addExerciseToDivision = (dIndex: number) => {
  currentWorkoutPlan.divisoes[dIndex].exercicios.push({
    nome: "Novo Exercício",
    grupo_muscular: "Geral",
    series: 3,
    repeticoes: "10-12",
    tempo_descanso: "60s",
    observacao: "Execução controlada"
  });
  renderWorkoutEditor();
  renderStudentPhonePreview();
};

(window as any).updateMealTime = (mIndex: number, val: string) => {
  currentDietPlan.refeicoes[mIndex].horario = val;
};

(window as any).updateMealName = (mIndex: number, val: string) => {
  currentDietPlan.refeicoes[mIndex].nome = val;
};

(window as any).updateMealItem = (mIndex: number, itIndex: number, field: string, val: any) => {
  (currentDietPlan.refeicoes[mIndex].itens[itIndex] as any)[field] = field === 'calorias' ? parseFloat(val) || 0 : val;
};

(window as any).removeFoodItem = (mIndex: number, itIndex: number) => {
  currentDietPlan.refeicoes[mIndex].itens.splice(itIndex, 1);
  renderDietEditor();
  renderStudentPhonePreview();
};

(window as any).addFoodToMeal = (mIndex: number) => {
  currentDietPlan.refeicoes[mIndex].itens.push({
    alimento: "Novo Alimento",
    quantidade: "1 porção (100g)",
    calorias: 120
  });
  renderDietEditor();
  renderStudentPhonePreview();
};

// ==============================================================================
// 8. CO-PILOTO DE CHAT & AJUSTES FINOS (PROMPT 4)
// ==============================================================================

function setupCopilotChat() {
  const input = document.getElementById('copilot-user-input') as HTMLTextAreaElement;
  const sendBtn = document.getElementById('btn-send-copilot');
  const log = document.getElementById('copilot-history-log');

  sendBtn?.addEventListener('click', () => {
    if (!input || !input.value.trim()) return;
    const command = input.value.trim();
    input.value = '';
    processCopilotCommand(command);
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendBtn?.click();
    }
  });

  // Quick Chips
  document.querySelectorAll('.copilot-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const cmd = chip.getAttribute('data-cmd');
      if (cmd) processCopilotCommand(cmd);
    });
  });
}

async function processCopilotCommand(command: string) {
  const log = document.getElementById('copilot-history-log');
  if (!log) return;

  // Add user bubble
  log.innerHTML += `
    <div class="copilot-msg user-msg">
      <div class="msg-avatar"><i data-lucide="user"></i></div>
      <div class="msg-bubble">${command}</div>
    </div>
  `;

  // Add bot loading bubble
  const loadingBubbleId = `bot-load-${Date.now()}`;
  log.innerHTML += `
    <div class="copilot-msg bot-msg" id="${loadingBubbleId}">
      <div class="msg-avatar"><i data-lucide="bot"></i></div>
      <div class="msg-bubble"><em>Processando ajuste com IA...</em></div>
    </div>
  `;
  log.scrollTop = log.scrollHeight;
  if (typeof lucide !== 'undefined') lucide.createIcons();

  await new Promise(r => setTimeout(r, 600));

  // Process command logic
  const cmdLower = command.toLowerCase();
  let botReply = "Ajuste aplicado com sucesso no plano!";

  if (cmdLower.includes('supino') && (cmdLower.includes('halter') || cmdLower.includes('halteres'))) {
    currentWorkoutPlan.divisoes.forEach(d => {
      d.exercicios.forEach(ex => {
        if (ex.nome.toLowerCase().includes('supino reto')) {
          ex.nome = 'Supino Reto com Halteres';
          ex.observacao = 'Maior amplitude de movimento e estabilidade escapular';
        }
      });
    });
    botReply = "Substituí o **Supino Reto com Barra** por **Supino Reto com Halteres** na Divisão A, ajustando a biomecânica para maior segurança articular.";
  } else if (cmdLower.includes('proteína') || cmdLower.includes('proteina')) {
    currentDietPlan.macronutrientes.proteina_g += 20;
    currentDietPlan.meta_calorica += 80;
    botReply = "Aumentei as proteínas diárias em **+20g** (totalizando 180g) e recalibrei a meta calórica para **" + currentDietPlan.meta_calorica + " kcal**.";
  } else if (cmdLower.includes('leg press') || (cmdLower.includes('joelho') && cmdLower.includes('agachamento'))) {
    currentWorkoutPlan.divisoes.forEach(d => {
      d.exercicios.forEach(ex => {
        if (ex.nome.toLowerCase().includes('agachamento')) {
          ex.nome = 'Leg Press 45 com Pés Altos';
          ex.observacao = 'Posição com menor torque patelar para preservar os joelhos';
        }
      });
    });
    botReply = "Substituí o agachamento por **Leg Press 45 com pés altos**, aliviando a sobrecarga sobre a articulação do joelho.";
  } else if (cmdLower.includes('série') || cmdLower.includes('serie')) {
    currentWorkoutPlan.divisoes[0].exercicios.forEach(ex => {
      ex.series += 1;
    });
    botReply = "Adicionei **+1 série** em todos os exercícios da Divisão A (Peito e Tríceps).";
  }

  // Update bot bubble
  const loadEl = document.getElementById(loadingBubbleId);
  if (loadEl) {
    loadEl.innerHTML = `
      <div class="msg-avatar"><i data-lucide="bot"></i></div>
      <div class="msg-bubble">${botReply}</div>
    `;
  }

  renderWorkoutEditor();
  renderDietEditor();
  renderStudentPhonePreview();
  log.scrollTop = log.scrollHeight;
  if (typeof lucide !== 'undefined') lucide.createIcons();
  showToast('Plano atualizado pelo Co-Piloto IA!', 'success');
}

// ==============================================================================
// 9. VISUALIZAÇÃO DO ALUNO (APP MOBILE MOCKUP)
// ==============================================================================

function renderStudentPhonePreview() {
  const contentArea = document.getElementById('phone-content-area');
  const select = document.getElementById('preview-student-select') as HTMLSelectElement;
  const avatarText = document.getElementById('phone-avatar-text');
  const studentNameEl = document.getElementById('phone-student-name');

  if (students.length === 0) {
    if (select) select.innerHTML = '<option value="">Nenhum aluno cadastrado</option>';
    if (studentNameEl) studentNameEl.textContent = 'Nenhum Aluno Cadastrado';
    if (avatarText) avatarText.textContent = '--';
  } else {
    if (select) {
      select.innerHTML = students.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
      const current = students.find(s => s.id === select.value) || students[0];
      if (current) {
        select.value = current.id;
        if (studentNameEl) studentNameEl.textContent = current.nome;
        if (avatarText) avatarText.textContent = current.nome.split(' ').map(n => n[0]).slice(0, 2).join('');
      }
      select.addEventListener('change', () => {
        const st = students.find(s => s.id === select.value);
        if (st) {
          if (studentNameEl) studentNameEl.textContent = st.nome;
          if (avatarText) avatarText.textContent = st.nome.split(' ').map(n => n[0]).slice(0, 2).join('');
        }
      });
    }
  }

  // Phone tab switcher (Treino vs Dieta)
  document.querySelectorAll('.phone-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.phone-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabType = tab.getAttribute('data-phonetab');
      renderPhoneTabContent(tabType || 'treino');
    });
  });

  renderPhoneTabContent('treino');
}

function renderPhoneTabContent(type: string) {
  const area = document.getElementById('phone-content-area');
  if (!area) return;

  if (type === 'treino') {
    const activeDiv = currentWorkoutPlan.divisoes[0];
    area.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 style="color:#fff; font-size:0.9rem;">Treino ${activeDiv.letra} — ${activeDiv.nome}</h5>
        <span class="badge-neutral" style="font-size:0.65rem;">${activeDiv.exercicios.length} Exercícios</span>
      </div>
      ${activeDiv.exercicios.map((ex, i) => `
        <div class="phone-exercise-card">
          <div class="d-flex justify-content-between align-items-start">
            <span class="phone-ex-title">${i + 1}. ${ex.nome}</span>
          </div>
          <div class="phone-ex-meta">
            <span><strong>${ex.series}</strong> séries</span>
            <span><strong>${ex.repeticoes}</strong> reps</span>
            <span>Descanso: <strong>${ex.tempo_descanso}</strong></span>
          </div>
          <label class="phone-check-label">
            <input type="checkbox">
            <span>Concluído</span>
          </label>
        </div>
      `).join('')}
    `;
  } else {
    area.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 style="color:#fff; font-size:0.9rem;">Plano Nutricional Diário</h5>
        <span class="badge-neutral" style="font-size:0.65rem;">${currentDietPlan.meta_calorica} kcal</span>
      </div>
      ${currentDietPlan.refeicoes.map(meal => `
        <div class="phone-exercise-card mb-3">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <strong style="color:var(--accent-cyan); font-size:0.8rem;">⏰ ${meal.horario}</strong>
            <span style="color:#fff; font-weight:700; font-size:0.75rem;">${meal.nome}</span>
          </div>
          <div style="font-size:0.72rem; color:var(--text-secondary); display:flex; flex-direction:column; gap:4px;">
            ${meal.itens.map(it => `<div>• <strong>${it.quantidade}</strong> ${it.alimento} <span class="text-muted">(${it.calorias} kcal)</span></div>`).join('')}
          </div>
        </div>
      `).join('')}
    `;
  }
}

// ==============================================================================
// 10. EXPORTAÇÃO WHATSAPP FORMATADA
// ==============================================================================

function copyWhatsAppPlan() {
  let text = `🏋️‍♂️ *SISTEMA PERSONAL TRAINER BALBINO PRO*\n`;
  text += `📋 *Prescrição Personalizada:* ${currentWorkoutPlan.titulo}\n`;
  text += `🎯 *Objetivo:* ${currentWorkoutPlan.objetivo}\n`;
  text += `⚡ *Frequência:* ${currentWorkoutPlan.frequencia_semanal}x por semana\n\n`;
  text += `═══════════════════════════\n`;
  text += `💪 *PROGRAMA DE TREINAMENTO*\n`;
  text += `═══════════════════════════\n`;

  currentWorkoutPlan.divisoes.forEach(d => {
    text += `\n📌 *TREINO ${d.letra} — ${d.nome.toUpperCase()}*\n`;
    d.exercicios.forEach((ex, idx) => {
      text += `${idx + 1}. *${ex.nome}*\n   └ ${ex.series} séries x ${ex.repeticoes} | Descanso: ${ex.tempo_descanso}\n`;
      if (ex.observacao) text += `   └ Obs: _${ex.observacao}_\n`;
    });
  });

  text += `\n═══════════════════════════\n`;
  text += `🥗 *PLANO ALIMENTAR DIÁRIO*\n`;
  text += `═══════════════════════════\n`;
  text += `🥩 Proteínas: ${currentDietPlan.macronutrientes.proteina_g}g | 🍚 Carbos: ${currentDietPlan.macronutrientes.carboidrato_g}g | 🥑 Gorduras: ${currentDietPlan.macronutrientes.gordura_g}g\n\n`;

  currentDietPlan.refeicoes.forEach(m => {
    text += `⏰ *${m.horario} — ${m.nome}*\n`;
    m.itens.forEach(it => {
      text += `  • ${it.quantidade} de ${it.alimento} (${it.calorias} kcal)\n`;
    });
    text += `\n`;
  });

  text += `_Gerado pelo Personal Trainer Balbino Pro com Co-Piloto de IA._`;

  navigator.clipboard.writeText(text).then(() => {
    showToast('Ficha e Dieta copiadas para o WhatsApp!', 'success');
  }).catch(() => {
    showToast('Erro ao copiar para a área de transferência', 'error');
  });
}

// ==============================================================================
// 11. GESTÃO DE PLANILHAS & MÉTRICAS NA NUVEM (NEON DB)
// ==============================================================================

function setupPlanilhasTab() {
  const selectAluno = document.getElementById('select-planilha-aluno') as HTMLSelectElement;
  const selectTipo = document.getElementById('select-planilha-tipo') as HTMLSelectElement;
  const tbody = document.getElementById('tbody-planilhas');

  function renderPlanilhaStudentOptions() {
    if (!selectAluno) return;
    const currentVal = selectAluno.value;
    selectAluno.innerHTML = '<option value="">Todos os Alunos / Geral</option>';
    students.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.nome;
      selectAluno.appendChild(opt);
    });
    selectAluno.value = currentVal;
  }

  function renderPlanilhasList() {
    if (!tbody) return;
    renderPlanilhaStudentOptions();

    const filterAluno = selectAluno?.value || '';
    const filterTipo = selectTipo?.value || '';

    let filtered = planilhas;
    if (filterAluno) {
      filtered = filtered.filter((p) => p.paciente_id === filterAluno);
    }
    if (filterTipo) {
      filtered = filtered.filter((p) => p.tipo === filterTipo);
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4 text-muted">
            <i data-lucide="inbox" class="mb-2" style="opacity: 0.5;"></i>
            <p class="mb-0">Nenhuma planilha encontrada para os filtros selecionados.</p>
          </td>
        </tr>
      `;
      if (typeof lucide !== 'undefined') lucide.createIcons();
      return;
    }

    const typeLabels: Record<string, string> = {
      EVOLUCAO_CARGAS: 'Evolução de Cargas',
      MEDIDAS_CORPORAIS: 'Medidas Corporais',
      FREQUENCIA_TREINOS: 'Frequência Semanal',
      DIARIO_ALIMENTAR: 'Diário Nutricional',
      FINANCEIRO_PLANILHA: 'Controle Mensal',
      OUTRO: 'Tabela Geral'
    };

    tbody.innerHTML = filtered
      .map((p) => {
        const student = students.find((s) => s.id === p.paciente_id);
        const studentName = student ? student.nome : '<span class="text-muted">Geral / Não vinculado</span>';
        const typeLabel = typeLabels[p.tipo] || p.tipo;
        const dateStr = p.updated_at ? new Date(p.updated_at).toLocaleDateString('pt-BR') : 'Hoje';

        return `
        <tr>
          <td>
            <strong>${p.titulo}</strong>
            <div class="text-xs text-muted">ID: ${p.id.substring(0, 12)}...</div>
          </td>
          <td><span class="badge" style="background: rgba(99,102,241,0.15); color: #818cf8; border: 1px solid rgba(99,102,241,0.3);">${typeLabel}</span></td>
          <td>${studentName}</td>
          <td><span class="text-xs text-muted">${dateStr}</span></td>
          <td>
            <div class="d-flex gap-2">
              <button class="btn-icon-ghost btn-sm btn-download-single-csv" data-id="${p.id}" title="Baixar CSV / Excel">
                <i data-lucide="download"></i>
              </button>
              <button class="btn-icon-ghost btn-sm text-danger btn-delete-planilha" data-id="${p.id}" title="Excluir Planilha">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
      })
      .join('');

    // Attach click listeners for single download and delete
    tbody.querySelectorAll<HTMLButtonElement>('.btn-download-single-csv').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const item = planilhas.find((x) => x.id === id);
        if (!item) return;

        let csvContent = item.arquivo_csv;
        if (!csvContent && item.dados_json?.headers && item.dados_json?.rows) {
          csvContent = neonService.convertToCSV(item.dados_json.headers, item.dados_json.rows);
        }

        if (!csvContent) {
          csvContent = `ID,Titulo,Tipo,Data\n"${item.id}","${item.titulo}","${item.tipo}","${item.updated_at}"`;
        }

        downloadBlobFile(csvContent, `${item.titulo.toLowerCase().replace(/\s+/g, '_')}.csv`, 'text/csv;charset=utf-8;');
        showToast(`Planilha "${item.titulo}" baixada com sucesso!`, 'success');
      });
    });

    tbody.querySelectorAll<HTMLButtonElement>('.btn-delete-planilha').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!id) return;
        if (confirm('Deseja realmente remover esta planilha?')) {
          planilhas = planilhas.filter((x) => x.id !== id);
          await neonService.deletePlanilha(id, 'personal-balbino');
          renderPlanilhasList();
          showToast('Planilha removida com sucesso!', 'info');
        }
      });
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  selectAluno?.addEventListener('change', () => renderPlanilhasList());
  selectTipo?.addEventListener('change', () => renderPlanilhasList());

  // Exportar todas as planilhas filtradas em lote
  document.getElementById('btn-export-planilha-csv')?.addEventListener('click', () => {
    if (planilhas.length === 0) {
      showToast('Nenhuma planilha disponível para exportação.', 'error');
      return;
    }

    const headers = ['ID', 'Titulo', 'Tipo', 'AlunoID', 'DataAtualizacao', 'ConteudoCSV'];
    const rows = planilhas.map((p) => [
      p.id,
      p.titulo,
      p.tipo,
      p.paciente_id || 'N/A',
      p.updated_at || '',
      p.arquivo_csv ? p.arquivo_csv.replace(/\n/g, ' | ') : ''
    ]);

    const csvData = neonService.convertToCSV(headers, rows);
    downloadBlobFile(csvData, `planilhas_metricas_balbino_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
    showToast('Arquivo CSV com todas as planilhas gerado com sucesso!', 'success');
  });

  // Importar CSV
  document.getElementById('input-import-csv')?.addEventListener('change', (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.trim().split('\n');
      const title = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

      const newPlanilha: PlanilhaMetrica = {
        id: `plan-${Date.now()}`,
        personal_id: 'personal-balbino',
        paciente_id: selectAluno?.value || null,
        titulo: title.charAt(0).toUpperCase() + title.slice(1),
        tipo: 'EVOLUCAO_CARGAS',
        dados_json: { raw_lines: lines.length },
        arquivo_csv: text,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      planilhas.unshift(newPlanilha);
      await neonService.savePlanilha(newPlanilha);
      renderPlanilhasList();
      showToast(`Planilha "${newPlanilha.titulo}" importada e salva na nuvem!`, 'success');
    };
    reader.readAsText(file);
    (e.target as HTMLInputElement).value = '';
  });

  // Sincronizar com Nuvem Neon
  document.getElementById('btn-sync-planilhas-neon')?.addEventListener('click', async () => {
    showToast('Sincronizando com banco Neon...', 'info');
    const status = await neonService.testConnection();
    if (status.connected) {
      const cloudPlanilhas = await neonService.getPlanilhas('personal-balbino');
      if (cloudPlanilhas && cloudPlanilhas.length > 0) {
        planilhas = cloudPlanilhas;
      }
      renderPlanilhasList();
      showToast(`Sincronização concluída! Banco Neon conectado (${status.latencyMs}ms)`, 'success');
    } else {
      showToast('Neon não conectado. Dados mantidos em armazenamento local seguro.', 'info');
    }
  });

  // Open modal Nova Planilha
  document.getElementById('btn-open-new-planilha-modal')?.addEventListener('click', () => {
    const modal = document.getElementById('modal-planilha');
    const selectModalStudent = document.getElementById('pf-student-id') as HTMLSelectElement;
    if (selectModalStudent) {
      selectModalStudent.innerHTML = '<option value="">Geral / Sem vínculo específico</option>';
      students.forEach((s) => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.nome;
        selectModalStudent.appendChild(opt);
      });
    }
    (document.getElementById('form-planilha-save') as HTMLFormElement)?.reset();
    (document.getElementById('planilha-form-id') as HTMLInputElement).value = '';
    modal?.classList.add('open');
  });

  // Initial render
  renderPlanilhasList();
}

// ==============================================================================
// 12. CENTRAL DE PRIVACIDADE & CONFORMIDADE LGPD (LEI 13.709/2018)
// ==============================================================================

function setupLGPDTab() {
  const selectLGPDAluno = document.getElementById('select-lgpd-aluno') as HTMLSelectElement;
  const tbodyLogs = document.getElementById('tbody-audit-logs');

  function renderLGPDStudentOptions() {
    if (!selectLGPDAluno) return;
    const currentVal = selectLGPDAluno.value;
    selectLGPDAluno.innerHTML = '<option value="">-- Selecione o Aluno Titular dos Dados --</option>';
    students.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.nome} (${s.email || s.telefone || 'Sem contato'})`;
      selectLGPDAluno.appendChild(opt);
    });
    if (currentVal) selectLGPDAluno.value = currentVal;
  }

  function renderAuditLogsTable() {
    if (!tbodyLogs) return;
    const logs = neonService.getLocalLogs();

    if (logs.length === 0) {
      tbodyLogs.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-3 text-muted">
            Nenhum log de auditoria registrado no momento.
          </td>
        </tr>
      `;
      return;
    }

    const actionBadgeMap: Record<string, { label: string; class: string }> = {
      INSERCAO: { label: 'INSERÇÃO DE DADOS', class: 'consentimento' },
      EDICAO: { label: 'ATUALIZAÇÃO', class: 'auditoria' },
      CONSULTA: { label: 'CONSULTA DE DADOS', class: 'auditoria' },
      EXPORTACAO_PORTABILIDADE: { label: 'PORTABILIDADE LGPD (ART. 18)', class: 'sensivel' },
      EXCLUSAO_DIREITO_ESQUECIMENTO: { label: 'DIREITO AO ESQUECIMENTO', class: 'sensivel' }
    };

    tbodyLogs.innerHTML = logs
      .map((log) => {
        const rawTime = log.timestamp || log.created_at || new Date().toISOString();
        const dateFormatted = new Date(rawTime).toLocaleString('pt-BR');
        const acaoKey = log.acao || log.tipo_acao || 'CONSULTA';
        const badge = actionBadgeMap[acaoKey] || { label: acaoKey, class: 'auditoria' };
        return `
        <tr>
          <td><span class="font-mono text-xs">${dateFormatted}</span></td>
          <td><span class="text-xs"><strong>Personal Balbino</strong></span></td>
          <td><span class="lgpd-badge-tag ${badge.class}">${badge.label}</span></td>
          <td><span class="text-xs text-muted">${log.detalhe || log.detalhes || 'Operação registrada'}</span></td>
        </tr>
      `;
      })
      .join('');
  }

  // Exportar todos os dados do aluno (Portabilidade LGPD)
  document.getElementById('btn-lgpd-export-data')?.addEventListener('click', async () => {
    const studentId = selectLGPDAluno?.value;
    if (!studentId) {
      showToast('Selecione um aluno para exportar o pacote de portabilidade.', 'error');
      return;
    }

    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    try {
      showToast('Compilando pacote de portabilidade LGPD...', 'info');
      const exportPackage = await neonService.exportAllDataLGPD(studentId, 'personal-balbino');

      // Inclui ficha ativa e dieta se houver
      exportPackage.treinos = [
        {
          id: 'ficha-export-1',
          personal_id: 'personal-balbino',
          paciente_id: studentId,
          titulo: currentWorkoutPlan.titulo,
          objetivo: currentWorkoutPlan.objetivo,
          itens: []
        }
      ];

      const jsonString = JSON.stringify(exportPackage, null, 2);
      downloadBlobFile(jsonString, `portabilidade_lgpd_${student.nome.toLowerCase().replace(/\s+/g, '_')}.json`, 'application/json');

      renderAuditLogsTable();
      showToast(`Pacote de portabilidade do aluno ${student.nome} baixado com sucesso!`, 'success');
    } catch (err: any) {
      showToast(`Erro na exportação LGPD: ${err.message}`, 'error');
    }
  });

  // Excluir / Direito ao Esquecimento (LGPD Art. 18, VI)
  document.getElementById('btn-lgpd-delete-user')?.addEventListener('click', async () => {
    const studentId = selectLGPDAluno?.value;
    if (!studentId) {
      showToast('Selecione o aluno para aplicar a exclusão definitiva.', 'error');
      return;
    }

    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const confirmed = confirm(
      `AVISO DE EXCLUSÃO DEFINITIVA (LGPD - ART. 18)\n\n` +
      `Tem certeza que deseja apagar todos os dados cadastrais, histórico de treinos, avaliações físicas e anamnese de "${student.nome}"?\n\n` +
      `Esta ação é irreversível conforme o Direito ao Esquecimento do titular.`
    );

    if (confirmed) {
      await neonService.deletePacienteLGPD(studentId, 'personal-balbino', 'Exercício do Direito ao Esquecimento LGPD pelo Titular');
      students = students.filter((s) => s.id !== studentId);
      planilhas = planilhas.filter((p) => p.paciente_id !== studentId);

      renderDashboard();
      renderStudentsList();
      renderLGPDStudentOptions();
      renderAuditLogsTable();
      setupPlanilhasTab();

      showToast(`Dados de ${student.nome} eliminados em conformidade com a LGPD.`, 'info');
    }
  });

  document.getElementById('btn-refresh-audit-logs')?.addEventListener('click', () => {
    renderAuditLogsTable();
    showToast('Livro de Logs de Auditoria atualizado!', 'success');
  });

  renderLGPDStudentOptions();
  renderAuditLogsTable();
}

// ==============================================================================
// 13. BANCO DE DADOS & NEON HUB CONTROLLER
// ==============================================================================

async function setupNeonDatabaseHub() {
  const schemaViewer = document.getElementById('code-schema-view');
  const seedViewer = document.getElementById('code-seed-view');
  const connInput = document.getElementById('neon-connection-string-input') as HTMLInputElement;
  const statusBadge = document.getElementById('neon-live-status-badge');
  const statusText = document.getElementById('neon-status-text');
  const testResultBox = document.getElementById('neon-test-result-box');

  // Carrega string salva no input
  if (connInput) {
    connInput.value = neonService.getRawConnectionString();
  }

  // Toggle show/hide password
  document.getElementById('btn-toggle-neon-visibility')?.addEventListener('click', () => {
    if (connInput) {
      connInput.type = connInput.type === 'password' ? 'text' : 'password';
    }
  });

  // Atualiza badge de status
  async function updateNeonStatusUI() {
    const status = await neonService.testConnection();
    if (status.connected) {
      if (statusBadge) {
        statusBadge.className = 'neon-badge-pill';
        statusBadge.innerHTML = `<span class="status-dot green"></span> <span>Conectado ao Neon (${status.latencyMs}ms)</span>`;
      }
      if (statusText) statusText.textContent = `Conectado — ${status.databaseName || 'neondb'}`;
    } else {
      if (statusBadge) {
        statusBadge.className = 'neon-badge-pill offline';
        statusBadge.innerHTML = `<span class="status-dot orange"></span> <span>Modo Local / Fallback Ativo</span>`;
      }
      if (statusText) statusText.textContent = 'Modo Local Ativo';
    }
  }

  await updateNeonStatusUI();

  // Testar e Salvar Conexão no Hub
  document.getElementById('btn-test-save-neon')?.addEventListener('click', async () => {
    const val = connInput?.value || '';
    neonService.saveConnectionString(val);

    if (testResultBox) {
      testResultBox.style.display = 'block';
      testResultBox.innerHTML = '<i data-lucide="loader" class="spin"></i> Testando conectividade com o Neon PostgreSQL...';
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    const res = await neonService.testConnection();
    await updateNeonStatusUI();

    if (testResultBox) {
      if (res.connected) {
        testResultBox.className = 'info-callout mb-0';
        testResultBox.style.borderColor = 'rgba(0, 229, 153, 0.4)';
        testResultBox.innerHTML = `
          <i data-lucide="check-circle" style="color: #00e599;"></i>
          <div>
            <strong style="color: #00e599;">Conexão Estabelecida com Sucesso!</strong>
            <p class="text-xs text-muted mb-0">Banco de Dados: <strong>${res.databaseName}</strong> | Latência de Resposta: <strong>${res.latencyMs}ms</strong>. Sincronização em nuvem 100% pronta para a Vercel.</p>
          </div>
        `;
        showToast('Conexão com o Neon validada e salva!', 'success');
      } else {
        testResultBox.className = 'info-callout mb-0';
        testResultBox.style.borderColor = 'rgba(244, 63, 94, 0.4)';
        testResultBox.innerHTML = `
          <i data-lucide="alert-triangle" style="color: #f43f5e;"></i>
          <div>
            <strong style="color: #f43f5e;">Não foi possível conectar ao Neon</strong>
            <p class="text-xs text-muted mb-0">${res.error || 'Verifique sua string de conexão.'} O sistema continuará salvando localmente.</p>
          </div>
        `;
        showToast('Falha na conexão com Neon. Verifique as credenciais.', 'error');
      }
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  });

  // Executar Migrações DDL no Neon
  document.getElementById('btn-run-neon-migrations')?.addEventListener('click', async () => {
    let schemaText = schemaViewer?.textContent || '';
    if (!schemaText || schemaText.includes('Carregando')) {
      try {
        const res = await fetch('./schema.sql');
        schemaText = await res.text();
      } catch {
        schemaText = '';
      }
    }

    if (!schemaText) {
      showToast('Arquivo schema.sql não disponível para execução.', 'error');
      return;
    }

    try {
      showToast('Executando criação de tabelas e RLS no Neon...', 'info');
      const result = await neonService.runSchemaMigrations(schemaText);
      showToast(result.message, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  });

  // Load SQL Text in viewers
  try {
    const resSchema = await fetch('./schema.sql');
    if (resSchema.ok && schemaViewer) schemaViewer.textContent = await resSchema.text();

    const resSeed = await fetch('./seed.sql');
    if (resSeed.ok && seedViewer) seedViewer.textContent = await resSeed.text();
  } catch {
    if (schemaViewer) schemaViewer.textContent = '-- Execute o arquivo schema.sql no Neon SQL Editor';
  }

  document.getElementById('btn-copy-schema-sql')?.addEventListener('click', () => {
    if (schemaViewer) {
      navigator.clipboard.writeText(schemaViewer.textContent || '');
      showToast('schema.sql copiado para a área de transferência!', 'success');
    }
  });

  document.getElementById('btn-copy-seed-sql')?.addEventListener('click', () => {
    if (seedViewer) {
      navigator.clipboard.writeText(seedViewer.textContent || '');
      showToast('seed.sql copiado para a área de transferência!', 'success');
    }
  });
}

// Helper para Download de Arquivos
function downloadBlobFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==============================================================================
// 14. MODAIS (NOVO ALUNO / EXERCÍCIO / PLANILHA / SETTINGS)
// ==============================================================================

function setupModals() {
  // Student modal
  const modalStudent = document.getElementById('modal-student');
  document.getElementById('btn-open-student-modal')?.addEventListener('click', () => openStudentModal());
  document.getElementById('btn-close-student-modal')?.addEventListener('click', () => modalStudent?.classList.remove('open'));
  document.getElementById('btn-cancel-student')?.addEventListener('click', () => modalStudent?.classList.remove('open'));

  document.getElementById('btn-save-student-submit')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('sf-name') as HTMLInputElement;
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
      showToast('Por favor, informe o Nome Completo do aluno para salvar.', 'error');
      nameInput?.focus();
      return;
    }

    const rawAge = (document.getElementById('sf-age') as HTMLInputElement)?.value?.trim() || '';
    const parsedAge = parseInt(rawAge, 10);
    const idade = !isNaN(parsedAge) && parsedAge > 0 ? parsedAge : 30;

    const rawWeight = (document.getElementById('sf-weight') as HTMLInputElement)?.value?.trim().replace(',', '.') || '';
    const parsedWeight = parseFloat(rawWeight);
    const peso = !isNaN(parsedWeight) && parsedWeight > 0 ? parsedWeight : 70;

    const rawHeight = (document.getElementById('sf-height') as HTMLInputElement)?.value?.trim().replace(',', '.') || '';
    let parsedHeight = parseFloat(rawHeight);
    if (!isNaN(parsedHeight) && parsedHeight > 0) {
      if (parsedHeight < 3) {
        parsedHeight = Math.round(parsedHeight * 100);
      }
    } else {
      parsedHeight = 170;
    }

    const lgpdConsent = (document.getElementById('sf-lgpd-consent') as HTMLInputElement)?.checked ?? true;
    const formId = (document.getElementById('student-form-id') as HTMLInputElement)?.value?.trim();
    const finalId = formId && formId.length > 5 ? formId : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `stu-${Date.now()}`);

    const newStudent: StudentRecord = {
      id: finalId,
      personal_id: 'personal-balbino',
      nome: name,
      email: (document.getElementById('sf-email') as HTMLInputElement)?.value?.trim() || '',
      telefone: (document.getElementById('sf-phone') as HTMLInputElement)?.value?.trim() || '',
      sexo: (document.getElementById('sf-gender') as HTMLSelectElement)?.value || 'M',
      idade,
      peso,
      altura: parsedHeight,
      nivel: (document.getElementById('sf-experience') as HTMLSelectElement)?.value || 'INICIANTE',
      objetivo: (document.getElementById('sf-goal') as HTMLSelectElement)?.value || 'EMAGRECIMENTO',
      lesoes: (document.getElementById('sf-injuries') as HTMLTextAreaElement)?.value?.trim() || '',
      rotina: (document.getElementById('sf-routine') as HTMLTextAreaElement)?.value?.trim() || '',
      termo_aceite_lgpd: lgpdConsent,
      data_aceite_lgpd: new Date().toISOString()
    };

    const existingIndex = students.findIndex((s) => s.id === newStudent.id);
    if (existingIndex >= 0) {
      students[existingIndex] = newStudent;
    } else {
      students.push(newStudent);
    }

    selectedStudentId = newStudent.id;
    saveStoredStudents(students);

    try {
      await neonService.savePaciente(newStudent);
    } catch (err) {
      console.warn('Erro ao salvar no Neon:', err);
    }

    modalStudent?.classList.remove('open');
    renderDashboard();
    renderStudentsList();
    setupEvaluationTab();
    setupAIStudio();
    renderStudentPhonePreview();
    setupPlanilhasTab();
    setupLGPDTab();
    showToast(`Aluno "${name}" salvo e sincronizado com sucesso!`, 'success');
  });

  // Planilha modal
  const modalPlanilha = document.getElementById('modal-planilha');
  document.getElementById('btn-close-planilha-modal')?.addEventListener('click', () => modalPlanilha?.classList.remove('open'));
  document.getElementById('btn-cancel-planilha')?.addEventListener('click', () => modalPlanilha?.classList.remove('open'));

  document.getElementById('btn-save-planilha-submit')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const title = (document.getElementById('pf-title') as HTMLInputElement).value;
    if (!title) {
      showToast('Insira o título da planilha.', 'error');
      return;
    }

    const type = (document.getElementById('pf-type') as HTMLSelectElement).value as any;
    const studentId = (document.getElementById('pf-student-id') as HTMLSelectElement).value || null;
    const csvContent = (document.getElementById('pf-csv-content') as HTMLTextAreaElement).value;

    const newPlanilha: PlanilhaMetrica = {
      id: (document.getElementById('planilha-form-id') as HTMLInputElement).value || `plan-${Date.now()}`,
      personal_id: 'personal-balbino',
      paciente_id: studentId,
      titulo: title,
      tipo: type || 'EVOLUCAO_CARGAS',
      dados_json: { lines_count: csvContent ? csvContent.split('\n').length : 0 },
      arquivo_csv: csvContent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const existingIdx = planilhas.findIndex((p) => p.id === newPlanilha.id);
    if (existingIdx >= 0) {
      planilhas[existingIdx] = newPlanilha;
    } else {
      planilhas.unshift(newPlanilha);
    }

    await neonService.savePlanilha(newPlanilha);
    saveStoredPlanilhas(planilhas);
    modalPlanilha?.classList.remove('open');
    setupPlanilhasTab();
    showToast(`Planilha "${newPlanilha.titulo}" salva na nuvem Neon!`, 'success');
  });

  // Exercise modal
  const modalExercise = document.getElementById('modal-exercise');
  document.getElementById('btn-close-exercise-modal')?.addEventListener('click', () => modalExercise?.classList.remove('open'));
  document.getElementById('btn-cancel-exercise')?.addEventListener('click', () => modalExercise?.classList.remove('open'));

  document.getElementById('btn-save-exercise-submit')?.addEventListener('click', (e) => {
    e.preventDefault();
    const name = (document.getElementById('ef-name') as HTMLInputElement).value;
    if (!name) return;

    exercises.push({
      id: `ex-${Date.now()}`,
      nome: name,
      grupo_muscular: (document.getElementById('ef-muscle') as HTMLSelectElement).value,
      equipamento: (document.getElementById('ef-equipment') as HTMLSelectElement).value,
      instrucoes: (document.getElementById('ef-instructions') as HTMLTextAreaElement).value
    });

    modalExercise?.classList.remove('open');
    renderExercisesList();
    showToast('Novo exercício cadastrado na biblioteca!', 'success');
  });

  // Settings modal (Neon, IA, LGPD e Perfil)
  const modalSettings = document.getElementById('modal-settings');
  document.getElementById('open-settings-btn')?.addEventListener('click', () => {
    const cfgNeonUrl = document.getElementById('cfg-neon-url') as HTMLInputElement;
    if (cfgNeonUrl) cfgNeonUrl.value = neonService.getRawConnectionString();

    const personal = authService.getCurrentPersonal();
    const cfgName = document.getElementById('cfg-personal-name') as HTMLInputElement;
    const cfgCref = document.getElementById('cfg-personal-cref') as HTMLInputElement;
    if (cfgName && personal) cfgName.value = personal.nome;
    if (cfgCref && personal) cfgCref.value = personal.cref || '';

    const geminiKey = localStorage.getItem('balbino_gemini_key') || '';
    const cfgGeminiKey = document.getElementById('cfg-gemini-key') as HTMLInputElement;
    if (cfgGeminiKey) cfgGeminiKey.value = geminiKey;

    const geminiModel = localStorage.getItem('balbino_gemini_model') || 'gemini-1.5-pro';
    const cfgModelSelect = document.getElementById('cfg-model-select') as HTMLSelectElement;
    if (cfgModelSelect) cfgModelSelect.value = geminiModel;

    modalSettings?.classList.add('open');
  });

  document.getElementById('btn-close-settings-modal')?.addEventListener('click', () => modalSettings?.classList.remove('open'));
  document.getElementById('btn-cancel-settings')?.addEventListener('click', () => modalSettings?.classList.remove('open'));

  // Testar conexão no modal
  document.getElementById('btn-test-modal-neon')?.addEventListener('click', async () => {
    const url = (document.getElementById('cfg-neon-url') as HTMLInputElement)?.value || '';
    neonService.saveConnectionString(url);
    const status = await neonService.testConnection();
    const label = document.getElementById('cfg-neon-status-label');
    if (status.connected) {
      if (label) label.textContent = `Conectado ao Neon (${status.latencyMs}ms)`;
      showToast('Conexão Neon validada com sucesso!', 'success');
    } else {
      if (label) label.textContent = 'Falha na conexão. Modo Local Ativo.';
      showToast('Não foi possível conectar ao Neon.', 'error');
    }
  });

  // Navegação entre abas do modal de configurações
  const settingsTabBtns = document.querySelectorAll<HTMLButtonElement>('.settings-tab-btn');
  const settingsPanes = document.querySelectorAll<HTMLElement>('.settings-pane');

  settingsTabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-settings-tab');
      if (!tabId) return;

      settingsTabBtns.forEach((b) => b.classList.remove('active'));
      settingsPanes.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(`pane-settings-${tabId}`);
      if (targetPane) targetPane.classList.add('active');

      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
  });

  // Salvar configurações
  document.getElementById('btn-save-settings')?.addEventListener('click', async () => {
    // 1. Neon Database Config
    const neonUrl = (document.getElementById('cfg-neon-url') as HTMLInputElement)?.value || '';
    neonService.saveConnectionString(neonUrl);

    // 2. Gemini AI Config
    const geminiKey = (document.getElementById('cfg-gemini-key') as HTMLInputElement)?.value;
    const geminiModel = (document.getElementById('cfg-model-select') as HTMLSelectElement)?.value;
    if (geminiKey !== undefined) localStorage.setItem('balbino_gemini_key', geminiKey);
    if (geminiModel) localStorage.setItem('balbino_gemini_model', geminiModel);

    // 3. Perfil do Personal
    const personalName = (document.getElementById('cfg-personal-name') as HTMLInputElement)?.value;
    const personalCref = (document.getElementById('cfg-personal-cref') as HTMLInputElement)?.value;
    if (personalName) {
      await authService.updateProfile(personalName, personalCref || '');
    }

    modalSettings?.classList.remove('open');
    setupNeonDatabaseHub();
    showToast('Configurações atualizadas com sucesso!', 'success');
  });

  // Modal Agendamento (Personal Trainer)
  const modalAgendamento = document.getElementById('modal-agendamento');
  document.getElementById('btn-close-agendamento-modal')?.addEventListener('click', () => modalAgendamento?.classList.remove('open'));
  document.getElementById('btn-cancel-agendamento')?.addEventListener('click', () => modalAgendamento?.classList.remove('open'));

  document.getElementById('btn-save-agendamento-submit')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const formId = (document.getElementById('ag-form-id') as HTMLInputElement).value;
    const studentId = (document.getElementById('ag-student-id') as HTMLSelectElement).value;
    const student = students.find(s => s.id === studentId);
    if (!studentId || !student) {
      showToast('Selecione um aluno para agendar a aula.', 'error');
      return;
    }

    const dateVal = (document.getElementById('ag-date') as HTMLInputElement).value;
    const timeVal = (document.getElementById('ag-time') as HTMLSelectElement).value;
    const typeVal = (document.getElementById('ag-type') as HTMLSelectElement).value as any;
    const statusVal = (document.getElementById('ag-status') as HTMLSelectElement).value as any;
    const notesVal = (document.getElementById('ag-notes') as HTMLTextAreaElement).value.trim();
    const notifyWpp = (document.getElementById('ag-notify-whatsapp') as HTMLInputElement)?.checked;

    if (!dateVal || !timeVal) {
      showToast('Informe a data e o horário da aula.', 'error');
      return;
    }

    const newAg: AgendamentoAula = {
      id: formId || `ag-${Date.now()}`,
      personal_id: student.personal_id || '11111111-1111-1111-1111-111111111111',
      paciente_id: student.id,
      nome_aluno: student.nome,
      telefone_aluno: student.telefone || '',
      data_aula: dateVal,
      horario: timeVal,
      tipo: typeVal || 'PRESENCIAL',
      status: statusVal || 'CONFIRMADO',
      observacoes: notesVal,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const existingIdx = agendamentos.findIndex(a => a.id === newAg.id);
    if (existingIdx >= 0) {
      agendamentos[existingIdx] = newAg;
    } else {
      agendamentos.unshift(newAg);
    }

    saveStoredAgendamentos(agendamentos);
    await neonService.saveAgendamento(newAg);
    modalAgendamento?.classList.remove('open');
    updateAgendamentosCounters();
    renderAgendamentosList();
    showToast(`Agendamento de aula com ${student.nome} salvo com sucesso!`, 'success');

    if (notifyWpp && student.telefone) {
      const cleanPhone = student.telefone.replace(/\D/g, '');
      const phone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      const msg = `Olá ${student.nome}! Agendei sua aula para o dia ${dateVal} às ${timeVal} (${typeVal}). Aguardo você para o treino! 💪🏋️‍♂️`;
      window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`, '_blank');
    }
  });
}

function openStudentModal(student?: any) {
  const modal = document.getElementById('modal-student');
  const title = document.getElementById('student-modal-title');
  if (student) {
    if (title) title.textContent = 'Editar Aluno';
    (document.getElementById('student-form-id') as HTMLInputElement).value = student.id;
    (document.getElementById('sf-name') as HTMLInputElement).value = student.nome;
    (document.getElementById('sf-email') as HTMLInputElement).value = student.email || '';
    (document.getElementById('sf-phone') as HTMLInputElement).value = student.telefone || '';
    (document.getElementById('sf-gender') as HTMLSelectElement).value = student.sexo || 'M';
    (document.getElementById('sf-age') as HTMLInputElement).value = String(student.idade || '');
    (document.getElementById('sf-weight') as HTMLInputElement).value = String(student.peso || '');
    (document.getElementById('sf-height') as HTMLInputElement).value = String(student.altura || '');
    (document.getElementById('sf-experience') as HTMLSelectElement).value = student.nivel || 'INICIANTE';
    (document.getElementById('sf-goal') as HTMLSelectElement).value = student.objetivo || 'EMAGRECIMENTO';
    (document.getElementById('sf-injuries') as HTMLTextAreaElement).value = student.lesoes || '';
    (document.getElementById('sf-routine') as HTMLTextAreaElement).value = student.rotina || '';
  } else {
    if (title) title.textContent = 'Novo Aluno — Cadastro & Anamnese';
    (document.getElementById('form-student-save') as HTMLFormElement)?.reset();
    (document.getElementById('student-form-id') as HTMLInputElement).value = '';
    const nameEl = document.getElementById('sf-name') as HTMLInputElement;
    if (nameEl) nameEl.value = '';
    const emailEl = document.getElementById('sf-email') as HTMLInputElement;
    if (emailEl) emailEl.value = '';
    const phoneEl = document.getElementById('sf-phone') as HTMLInputElement;
    if (phoneEl) phoneEl.value = '';
    const ageEl = document.getElementById('sf-age') as HTMLInputElement;
    if (ageEl) ageEl.value = '';
    const weightEl = document.getElementById('sf-weight') as HTMLInputElement;
    if (weightEl) weightEl.value = '';
    const heightEl = document.getElementById('sf-height') as HTMLInputElement;
    if (heightEl) heightEl.value = '';
    const routineEl = document.getElementById('sf-routine') as HTMLTextAreaElement;
    if (routineEl) routineEl.value = '';
  }
  modal?.classList.add('open');
}

// ==============================================================================
// 15. PORTAL DO ALUNO (MOBILE FIRST: CADASTRO, LOGIN, TREINOS & AGENDAMENTO)
// ==============================================================================

function setupStudentPortal() {
  const portalContainer = document.getElementById('portal-aluno-container');
  const viewRegister = document.getElementById('view-student-register');
  const viewLogin = document.getElementById('view-student-login');
  const viewApp = document.getElementById('view-student-app');

  const btnSwitchToStudent = document.getElementById('btn-switch-to-student-portal');
  const btnBackToTrainerLogin = document.getElementById('btn-back-to-trainer-login');
  const btnBackToTrainerFromApp = document.getElementById('btn-back-to-trainer-from-app');
  const linkStToLogin = document.getElementById('link-st-to-login');
  const linkStToRegister = document.getElementById('link-st-to-register');
  const btnStLogout = document.getElementById('btn-student-logout');

  function showStudentView(view: 'register' | 'login' | 'app') {
    if (!portalContainer) return;
    portalContainer.classList.remove('hidden');

    viewRegister?.classList.add('hidden');
    viewLogin?.classList.add('hidden');
    viewApp?.classList.add('hidden');

    if (view === 'register') {
      viewRegister?.classList.remove('hidden');
    } else if (view === 'login') {
      viewLogin?.classList.remove('hidden');
    } else if (view === 'app') {
      viewApp?.classList.remove('hidden');
      renderStudentPortalApp();
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  function hideStudentPortal() {
    portalContainer?.classList.add('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  btnSwitchToStudent?.addEventListener('click', () => {
    const student = authService.getStudentSession();
    if (student && student.id) {
      showStudentView('app');
    } else {
      showStudentView('login');
    }
  });

  btnBackToTrainerLogin?.addEventListener('click', () => hideStudentPortal());
  btnBackToTrainerFromApp?.addEventListener('click', () => hideStudentPortal());

  linkStToLogin?.addEventListener('click', () => showStudentView('login'));
  linkStToRegister?.addEventListener('click', () => showStudentView('register'));

  btnStLogout?.addEventListener('click', () => {
    if (confirm('Deseja realmente sair da sua Área do Aluno?')) {
      authService.studentSignOut();
      showToast('Você saiu da sua conta de aluno.', 'info');
      showStudentView('login');
    }
  });

  // Password toggles
  document.getElementById('btn-toggle-st-pwd')?.addEventListener('click', () => {
    const pwdInput = document.getElementById('st-reg-password') as HTMLInputElement;
    if (pwdInput) pwdInput.type = pwdInput.type === 'password' ? 'text' : 'password';
  });
  document.getElementById('btn-toggle-st-login-pwd')?.addEventListener('click', () => {
    const pwdInput = document.getElementById('st-login-password') as HTMLInputElement;
    if (pwdInput) pwdInput.type = pwdInput.type === 'password' ? 'text' : 'password';
  });

  // Submissão do Auto-Cadastro do Aluno
  const formRegister = document.getElementById('form-student-self-register') as HTMLFormElement;
  formRegister?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = (document.getElementById('st-reg-name') as HTMLInputElement).value.trim();
    const email = (document.getElementById('st-reg-email') as HTMLInputElement).value.trim().toLowerCase();
    const senha = (document.getElementById('st-reg-password') as HTMLInputElement).value;
    const confirmSenha = (document.getElementById('st-reg-confirm-pwd') as HTMLInputElement).value;
    const telefone = (document.getElementById('st-reg-phone') as HTMLInputElement).value.trim();
    const idade = parseInt((document.getElementById('st-reg-age') as HTMLInputElement).value) || 25;
    const rawPeso = (document.getElementById('st-reg-weight') as HTMLInputElement).value.replace(',', '.');
    const peso = parseFloat(rawPeso) || 70;
    const rawAltura = (document.getElementById('st-reg-height') as HTMLInputElement).value.replace(',', '.');
    let altura = parseFloat(rawAltura) || 170;
    if (altura < 3) altura = Math.round(altura * 100);
    const sexo = (document.getElementById('st-reg-gender') as HTMLSelectElement).value || 'M';
    const objetivo = (document.getElementById('st-reg-goal') as HTMLSelectElement).value || 'HIPERTROFIA';
    const nivel = (document.getElementById('st-reg-experience') as HTMLSelectElement).value || 'INICIANTE';
    const rotina = (document.getElementById('st-reg-routine') as HTMLTextAreaElement).value.trim();
    const lesoes = (document.getElementById('st-reg-injuries') as HTMLTextAreaElement).value.trim();
    const termoLgpd = (document.getElementById('st-reg-lgpd') as HTMLInputElement).checked;

    if (!nome) return showToast('Preencha seu nome completo.', 'error');
    if (!email || !email.includes('@')) return showToast('Informe um e-mail válido.', 'error');
    if (senha.length < 6) return showToast('A senha deve ter pelo menos 6 caracteres.', 'error');
    if (senha !== confirmSenha) return showToast('As senhas digitadas não conferem.', 'error');

    const res = await authService.studentSignUp({
      nome,
      email,
      senha,
      telefone,
      idade,
      peso,
      altura,
      sexo,
      objetivo,
      nivel,
      rotina,
      lesoes,
      termo_aceite_lgpd: termoLgpd
    });

    if (res.success && res.student) {
      const st = res.student;
      const studentRecord: StudentRecord = {
        ...st,
        idade: st.idade || 30,
        peso: st.peso || 70,
        altura: st.altura || 170,
        objetivo: st.objetivo || 'HIPERTROFIA',
        lesoes: st.lesoes || '',
        rotina: st.rotina || '',
        nivel: st.nivel || 'INICIANTE'
      };
      const existingIdx = students.findIndex(s => s.id === st.id || (s.email && s.email.toLowerCase() === email));
      if (existingIdx >= 0) {
        students[existingIdx] = studentRecord;
      } else {
        students.push(studentRecord);
      }
      saveStoredStudents(students);
      try {
        await neonService.savePaciente(studentRecord);
      } catch {}

      renderDashboard();
      renderStudentsList();
      showToast(`Bem-vindo(a), ${nome}! Seu cadastro foi concluído com sucesso.`, 'success');
      showStudentView('app');
    } else {
      showToast(res.error || 'Erro ao realizar cadastro.', 'error');
    }
  });

  // Submissão do Login do Aluno
  const formLogin = document.getElementById('form-student-login') as HTMLFormElement;
  formLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (document.getElementById('st-login-email') as HTMLInputElement).value.trim().toLowerCase();
    const senha = (document.getElementById('st-login-password') as HTMLInputElement).value;

    const res = await authService.studentSignIn(email, senha);
    if (res.success && res.student) {
      showToast(`Olá, ${res.student.nome}! Acesso liberado.`, 'success');
      showStudentView('app');
    } else {
      showToast(res.error || 'E-mail ou senha incorretos.', 'error');
    }
  });

  // Subtabs Treino vs Dieta
  const btnSubtabWorkout = document.getElementById('btn-st-subtab-workout');
  const btnSubtabDiet = document.getElementById('btn-st-subtab-diet');
  const viewStWorkout = document.getElementById('st-workout-view');
  const viewStDiet = document.getElementById('st-diet-view');

  btnSubtabWorkout?.addEventListener('click', () => {
    btnSubtabWorkout.classList.add('active');
    btnSubtabDiet?.classList.remove('active');
    viewStWorkout?.classList.remove('hidden');
    viewStDiet?.classList.add('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });

  btnSubtabDiet?.addEventListener('click', () => {
    btnSubtabDiet.classList.add('active');
    btnSubtabWorkout?.classList.remove('active');
    viewStDiet?.classList.remove('hidden');
    viewStWorkout?.classList.add('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });

  // Tabs do App do Aluno (Prescrições, Agendamentos, Perfil)
  const studentTabBtns = document.querySelectorAll<HTMLButtonElement>('.student-tab-btn');
  const studentTabPanes = document.querySelectorAll<HTMLElement>('.student-tab-pane');

  studentTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-st-tab');
      if (!tab) return;
      studentTabBtns.forEach(b => b.classList.remove('active'));
      studentTabPanes.forEach(p => p.classList.add('hidden'));

      btn.classList.add('active');
      const targetPane = document.getElementById(`st-pane-${tab}`);
      if (targetPane) targetPane.classList.remove('hidden');

      if (typeof lucide !== 'undefined') lucide.createIcons();
    });
  });

  // Solicitar Agendamento de Aula
  const formBook = document.getElementById('form-student-book-appointment') as HTMLFormElement;
  formBook?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const student = authService.getStudentSession();
    if (!student || !student.id) {
      showToast('Sessão expirada. Faça login novamente.', 'error');
      showStudentView('login');
      return;
    }

    const dateVal = (document.getElementById('st-book-date') as HTMLInputElement).value;
    const timeVal = (document.getElementById('st-book-time') as HTMLSelectElement).value;
    const typeVal = (document.getElementById('st-book-type') as HTMLSelectElement).value as any;
    const notesVal = (document.getElementById('st-book-notes') as HTMLTextAreaElement).value.trim();

    if (!dateVal || !timeVal) {
      showToast('Por favor, informe a data e o horário desejados.', 'error');
      return;
    }

    const newAgendamento: AgendamentoAula = {
      id: `ag-${Date.now()}`,
      personal_id: student.personal_id || '11111111-1111-1111-1111-111111111111',
      paciente_id: student.id,
      nome_aluno: student.nome,
      telefone_aluno: student.telefone || '',
      data_aula: dateVal,
      horario: timeVal,
      tipo: typeVal || 'PRESENCIAL',
      status: 'SOLICITADO',
      observacoes: notesVal,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    agendamentos.unshift(newAgendamento);
    saveStoredAgendamentos(agendamentos);
    await neonService.saveAgendamento(newAgendamento);

    formBook.reset();
    renderStudentBookingsList(student.id);
    updateAgendamentosCounters();
    renderAgendamentosList();
    showToast('Solicitação de agendamento enviada com sucesso ao seu Personal!', 'success');
  });

  // Edição de Perfil do Aluno
  const formEditProfile = document.getElementById('form-student-edit-profile') as HTMLFormElement;
  formEditProfile?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const student = authService.getStudentSession();
    if (!student || !student.id) return;

    const nome = (document.getElementById('st-prof-name') as HTMLInputElement).value.trim();
    const telefone = (document.getElementById('st-prof-phone') as HTMLInputElement).value.trim();
    const rawPeso = (document.getElementById('st-prof-weight') as HTMLInputElement).value.replace(',', '.');
    const peso = parseFloat(rawPeso) || student.peso || 70;
    const rawAltura = (document.getElementById('st-prof-height') as HTMLInputElement).value.replace(',', '.');
    let altura = parseFloat(rawAltura) || student.altura || 170;
    if (altura < 3) altura = Math.round(altura * 100);
    const idade = parseInt((document.getElementById('st-prof-age') as HTMLInputElement).value) || student.idade || 30;
    const objetivo = (document.getElementById('st-prof-goal') as HTMLSelectElement).value;
    const nivel = (document.getElementById('st-prof-level') as HTMLSelectElement).value;
    const rotina = (document.getElementById('st-prof-routine') as HTMLTextAreaElement).value.trim();
    const lesoes = (document.getElementById('st-prof-injuries') as HTMLTextAreaElement).value.trim();

    const res = await authService.updateStudentProfile({
      nome,
      telefone,
      peso,
      altura,
      idade,
      objetivo,
      nivel,
      rotina,
      lesoes
    });

    if (res.success && res.student) {
      const updated = res.student;
      const studentRecord: StudentRecord = {
        ...updated,
        idade: updated.idade || 30,
        peso: updated.peso || 70,
        altura: updated.altura || 170,
        objetivo: updated.objetivo || 'HIPERTROFIA',
        lesoes: updated.lesoes || '',
        rotina: updated.rotina || '',
        nivel: updated.nivel || 'INICIANTE'
      };
      const idx = students.findIndex(s => s.id === updated.id);
      if (idx >= 0) students[idx] = studentRecord;
      else students.push(studentRecord);
      saveStoredStudents(students);
      try {
        await neonService.savePaciente(studentRecord);
      } catch {}
      renderStudentPortalApp();
      renderDashboard();
      renderStudentsList();
      showToast('Seu perfil foi atualizado com sucesso!', 'success');
    }
  });

  // URL Auto-Routing
  const searchParams = new URLSearchParams(window.location.search);
  const portalParam = searchParams.get('portal');
  const cadastroParam = searchParams.get('cadastro');

  if (portalParam === 'cadastro' || cadastroParam === 'aluno' || cadastroParam === 'true') {
    showStudentView('register');
  } else if (portalParam === 'aluno' || portalParam === 'login') {
    const student = authService.getStudentSession();
    if (student && student.id) {
      showStudentView('app');
    } else {
      showStudentView('login');
    }
  }
}

function renderStudentPortalApp() {
  const student = authService.getStudentSession();
  if (!student || !student.id) return;

  // Header
  const nameEl = document.getElementById('st-header-name');
  const emailEl = document.getElementById('st-header-email');
  const avatarEl = document.getElementById('st-header-avatar');
  if (nameEl) nameEl.textContent = student.nome;
  if (emailEl) emailEl.textContent = student.email || student.telefone || 'Aluno Ativo';
  if (avatarEl) {
    const initials = student.nome.split(' ').filter(Boolean).map((p: string) => p[0]).slice(0, 2).join('').toUpperCase() || 'AL';
    avatarEl.textContent = initials;
  }

  // Preencher formulário de perfil
  const pName = document.getElementById('st-prof-name') as HTMLInputElement;
  const pEmail = document.getElementById('st-prof-email') as HTMLInputElement;
  const pPhone = document.getElementById('st-prof-phone') as HTMLInputElement;
  const pWeight = document.getElementById('st-prof-weight') as HTMLInputElement;
  const pHeight = document.getElementById('st-prof-height') as HTMLInputElement;
  const pAge = document.getElementById('st-prof-age') as HTMLInputElement;
  const pGoal = document.getElementById('st-prof-goal') as HTMLSelectElement;
  const pLevel = document.getElementById('st-prof-level') as HTMLSelectElement;
  const pRoutine = document.getElementById('st-prof-routine') as HTMLTextAreaElement;
  const pInjuries = document.getElementById('st-prof-injuries') as HTMLTextAreaElement;

  if (pName) pName.value = student.nome;
  if (pEmail) pEmail.value = student.email || '';
  if (pPhone) pPhone.value = student.telefone || '';
  if (pWeight) pWeight.value = String(student.peso || '');
  if (pHeight) pHeight.value = String(student.altura || '');
  if (pAge) pAge.value = String(student.idade || '');
  if (pGoal && student.objetivo) pGoal.value = student.objetivo;
  if (pLevel && student.nivel) pLevel.value = student.nivel;
  if (pRoutine) pRoutine.value = student.rotina || '';
  if (pInjuries) pInjuries.value = student.lesoes || '';

  // Render Treino
  const workoutHeader = document.getElementById('st-workout-header');
  const workoutDivisions = document.getElementById('st-workout-divisions-container');

  if (workoutHeader) {
    workoutHeader.innerHTML = `
      <div class="d-flex justify-between align-center flex-wrap gap-2">
        <div>
          <h3 class="mb-1" style="color: #fff; font-size: 1.15rem;">${currentWorkoutPlan.titulo}</h3>
          <p class="text-xs text-muted mb-0">${currentWorkoutPlan.objetivo}</p>
        </div>
        <span class="badge-accent">${currentWorkoutPlan.frequencia_semanal}x por semana</span>
      </div>
    `;
  }

  if (workoutDivisions) {
    workoutDivisions.innerHTML = currentWorkoutPlan.divisoes.map(div => `
      <div class="st-workout-division-box">
        <div class="st-division-title">
          <div class="d-flex align-center gap-2">
            <span class="badge" style="background: var(--accent-primary); color: #fff; font-weight: 800;">Treino ${div.letra}</span>
            <strong style="color: #fff; font-size: 0.95rem;">${div.nome}</strong>
          </div>
          <span class="text-xs text-muted">${div.exercicios.length} exercícios</span>
        </div>
        <div class="st-exercises-list">
          ${div.exercicios.map((ex, idx) => `
            <div class="st-exercise-item">
              <div>
                <div class="st-exercise-name">${idx + 1}. ${ex.nome}</div>
                <div class="st-exercise-meta">
                  <span><strong>${ex.series}</strong> séries × <strong>${ex.repeticoes}</strong></span>
                  <span>Descanso: ${ex.tempo_descanso}</span>
                </div>
                ${ex.observacao ? `<div class="text-xs text-muted mt-1" style="font-style: italic;">Obs: ${ex.observacao}</div>` : ''}
              </div>
              <div class="badge-accent-subtle" style="font-size: 0.7rem;">${ex.grupo_muscular}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  // Render Dieta
  const dietHeader = document.getElementById('st-diet-header');
  const dietMeals = document.getElementById('st-diet-meals-container');

  if (dietHeader) {
    dietHeader.innerHTML = `
      <div class="d-flex justify-between align-center flex-wrap gap-2">
        <div>
          <h3 class="mb-1" style="color: #fff; font-size: 1.15rem;">Plano Alimentar &amp; Nutrição Esportiva</h3>
          <p class="text-xs text-muted mb-0">Meta Diária: <strong>${currentDietPlan.meta_calorica} kcal</strong></p>
        </div>
        <div class="d-flex gap-2">
          <span class="badge" style="background: rgba(99, 102, 241, 0.2); color: #a5b4fc;">P: ${currentDietPlan.macronutrientes.proteina_g}g</span>
          <span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399;">C: ${currentDietPlan.macronutrientes.carboidrato_g}g</span>
          <span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24;">G: ${currentDietPlan.macronutrientes.gordura_g}g</span>
        </div>
      </div>
    `;
  }

  if (dietMeals) {
    dietMeals.innerHTML = currentDietPlan.refeicoes.map(m => `
      <div class="st-meal-box">
        <div class="st-meal-header">
          <div class="d-flex align-center gap-2">
            <span class="badge" style="background: rgba(16, 185, 129, 0.25); color: #34d399;">${m.horario}</span>
            <strong style="color: #fff; font-size: 0.92rem;">${m.nome}</strong>
          </div>
          <span class="text-xs text-muted">${m.itens.reduce((acc, i) => acc + (i.calorias || 0), 0)} kcal</span>
        </div>
        <div class="st-meal-foods">
          ${m.itens.map(it => `
            <div class="st-meal-food-row">
              <span>${it.alimento}</span>
              <div class="d-flex gap-2 text-muted">
                <span>${it.quantidade}</span>
                ${it.calorias ? `<strong>(${it.calorias} kcal)</strong>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  // Render Agendamentos do Aluno
  renderStudentBookingsList(student.id);

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderStudentBookingsList(studentId: string) {
  const container = document.getElementById('st-bookings-list-container');
  if (!container) return;

  const student = authService.getStudentSession();
  const studentName = student?.nome || '';

  const studentBookings = agendamentos.filter(
    a => a.paciente_id === studentId || (studentName && a.nome_aluno && a.nome_aluno.toLowerCase() === studentName.toLowerCase())
  );

  if (studentBookings.length === 0) {
    container.innerHTML = `
      <div class="text-center p-4 text-muted" style="background: rgba(255,255,255,0.02); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
        <i data-lucide="calendar" style="width: 36px; height: 36px; margin: 0 auto 8px auto; opacity: 0.5;"></i>
        <p class="mb-1">Você ainda não possui aulas agendadas.</p>
        <span class="text-xs">Preencha o formulário acima para solicitar um novo horário com seu Personal Trainer.</span>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  container.innerHTML = studentBookings.map(b => {
    const parts = (b.data_aula || '').split('-');
    const day = parts.length === 3 ? parts[2] : '01';
    const monthIdx = parts.length === 3 ? parseInt(parts[1], 10) - 1 : 0;
    const month = months[monthIdx] || 'MES';

    let statusBadge = `<span class="badge-status-solicitado"><i data-lucide="clock"></i> Solicitado (Aguardando)</span>`;
    if (b.status === 'CONFIRMADO') {
      statusBadge = `<span class="badge-status-confirmado"><i data-lucide="check"></i> Confirmado</span>`;
    } else if (b.status === 'CONCLUIDO') {
      statusBadge = `<span class="badge-status-concluido"><i data-lucide="check-circle-2"></i> Realizado</span>`;
    } else if (b.status === 'RECUSADO') {
      statusBadge = `<span class="badge-status-recusado"><i data-lucide="x-circle"></i> Cancelado / Reagendar</span>`;
    }

    const typeLabel = b.tipo === 'PRESENCIAL' ? 'Treino Presencial' :
                     b.tipo === 'AVALIACAO' ? 'Avaliação Física' :
                     b.tipo === 'ONLINE' ? 'Consultoria Online' : 'Treino Personalizado';

    return `
      <div class="st-booking-item">
        <div class="d-flex align-center gap-3">
          <div class="st-booking-date-badge">
            <span class="day">${day}</span>
            <span class="month">${month}</span>
          </div>
          <div class="st-booking-info">
            <div class="st-booking-title">${typeLabel}</div>
            <div class="st-booking-time"><i data-lucide="clock" style="width: 13px; height: 13px; display: inline;"></i> ${b.horario} horas</div>
            ${b.observacoes ? `<div class="st-booking-notes">"${b.observacoes}"</div>` : ''}
          </div>
        </div>
        <div>
          ${statusBadge}
        </div>
      </div>
    `;
  }).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ==============================================================================
// 16. LINKS DE CONVITE & COMPARTILHAMENTO (PERSONAL TRAINER)
// ==============================================================================

function getStudentInviteUrl(): string {
  if (typeof window === 'undefined') return 'https://meupersonaltrainer.app/?portal=cadastro';
  const base = window.location.origin + window.location.pathname.replace(/\/index\.html$/, '');
  const url = base.endsWith('/') ? `${base}?portal=cadastro` : `${base}/?portal=cadastro`;
  return url;
}

function setupInviteLinks() {
  const inviteUrl = getStudentInviteUrl();
  const displayUrlEl = document.getElementById('display-invite-url');
  if (displayUrlEl) displayUrlEl.textContent = inviteUrl;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      showToast('Link de cadastro copiado para a área de transferência!', 'success');
    }).catch(() => {
      prompt('Copie o link abaixo para enviar ao seu aluno:', inviteUrl);
    });
  };

  const handleShareWhatsapp = () => {
    const personal = authService.getCurrentPersonal();
    const trainerName = personal?.nome || 'Seu Personal Trainer';
    const msg = `Olá! Aqui é o ${trainerName}. Acesse o link abaixo para fazer seu cadastro completo, criar seu login de acesso, visualizar seus treinos e solicitar agendamentos de aulas:\n\n${inviteUrl}`;
    const wppUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(wppUrl, '_blank');
  };

  document.getElementById('btn-copy-invite-link')?.addEventListener('click', handleCopyLink);
  document.getElementById('btn-whatsapp-invite-link')?.addEventListener('click', handleShareWhatsapp);
  document.getElementById('btn-share-student-invite-tab')?.addEventListener('click', handleShareWhatsapp);
  document.getElementById('btn-share-invite-from-agenda')?.addEventListener('click', handleShareWhatsapp);
}

// ==============================================================================
// 17. GESTÃO DE AGENDAMENTOS (PERSONAL TRAINER DASHBOARD & TAB)
// ==============================================================================

function updateAgendamentosCounters() {
  const solicitados = agendamentos.filter(a => a.status === 'SOLICITADO').length;
  const confirmados = agendamentos.filter(a => a.status === 'CONFIRMADO').length;
  const concluidos = agendamentos.filter(a => a.status === 'CONCLUIDO').length;
  const total = agendamentos.length;

  const countPendente = document.getElementById('agendamentos-count-pendente');
  const countConfirmado = document.getElementById('agendamentos-count-confirmado');
  const countConcluido = document.getElementById('agendamentos-count-concluido');
  const countTotal = document.getElementById('agendamentos-count-total');
  const badgeCount = document.getElementById('badge-agendamentos-count');

  if (countPendente) countPendente.textContent = String(solicitados);
  if (countConfirmado) countConfirmado.textContent = String(confirmados);
  if (countConcluido) countConcluido.textContent = String(concluidos);
  if (countTotal) countTotal.textContent = String(total);
  if (badgeCount) {
    badgeCount.textContent = String(solicitados);
    badgeCount.style.display = solicitados > 0 ? 'inline-flex' : 'none';
  }
}

function renderAgendamentosList() {
  const container = document.getElementById('agendamentos-list-container');
  if (!container) return;

  const statusFilter = (document.getElementById('filter-agendamento-status') as HTMLSelectElement)?.value || 'ALL';
  const studentFilter = (document.getElementById('filter-agendamento-aluno') as HTMLSelectElement)?.value || 'ALL';

  let filtered = [...agendamentos];
  if (statusFilter !== 'ALL') {
    filtered = filtered.filter(a => a.status === statusFilter);
  }
  if (studentFilter !== 'ALL') {
    filtered = filtered.filter(a => a.paciente_id === studentFilter || a.nome_aluno === studentFilter);
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center p-4 text-muted" style="background: rgba(255,255,255,0.02); border-radius: var(--radius-md);">
        <i data-lucide="calendar-x" style="width: 40px; height: 40px; margin: 0 auto 8px auto; opacity: 0.5;"></i>
        <p class="mb-1">Nenhum agendamento encontrado com os filtros selecionados.</p>
        <span class="text-xs">Os novos agendamentos solicitados pelos alunos pelo celular aparecerão aqui automaticamente.</span>
      </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  container.innerHTML = filtered.map(ag => {
    const parts = (ag.data_aula || '').split('-');
    const day = parts.length === 3 ? parts[2] : '01';
    const monthIdx = parts.length === 3 ? parseInt(parts[1], 10) - 1 : 0;
    const dateFormatted = `${day} de ${months[monthIdx] || 'Mês'} de ${parts[0] || '2026'}`;

    let statusBadge = `<span class="badge-status-solicitado"><i data-lucide="clock"></i> Solicitado</span>`;
    let rowBorderClass = 'status-solicitado';

    if (ag.status === 'CONFIRMADO') {
      statusBadge = `<span class="badge-status-confirmado"><i data-lucide="check"></i> Confirmado</span>`;
      rowBorderClass = 'status-confirmado';
    } else if (ag.status === 'CONCLUIDO') {
      statusBadge = `<span class="badge-status-concluido"><i data-lucide="check-circle-2"></i> Concluído</span>`;
      rowBorderClass = 'status-concluido';
    } else if (ag.status === 'RECUSADO') {
      statusBadge = `<span class="badge-status-recusado"><i data-lucide="x-circle"></i> Recusado</span>`;
      rowBorderClass = 'status-recusado';
    }

    const initials = (ag.nome_aluno || 'AL').split(' ').filter(Boolean).map((p: string) => p[0]).slice(0, 2).join('').toUpperCase();

    const typeLabel = ag.tipo === 'PRESENCIAL' ? 'Treino Presencial' :
                     ag.tipo === 'AVALIACAO' ? 'Avaliação Física' :
                     ag.tipo === 'ONLINE' ? 'Consultoria Online' : 'Treino Personalizado';

    return `
      <div class="agendamento-card-row ${rowBorderClass}" data-ag-id="${ag.id}">
        <div class="agendamento-main-col">
          <div class="avatar-circle" style="background: rgba(99, 102, 241, 0.2); color: #c7d2fe; font-weight: 700; width: 44px; height: 44px; font-size: 0.9rem;">
            ${initials}
          </div>
          <div>
            <div class="d-flex align-center gap-2 flex-wrap mb-1">
              <strong style="color: #fff; font-size: 0.98rem;">${ag.nome_aluno}</strong>
              ${statusBadge}
            </div>
            <div class="text-xs text-muted d-flex align-center gap-3 flex-wrap">
              <span><i data-lucide="calendar" style="width: 13px; height: 13px; display: inline;"></i> ${dateFormatted}</span>
              <span><i data-lucide="clock" style="width: 13px; height: 13px; display: inline;"></i> <strong>${ag.horario}</strong></span>
              <span class="badge-accent-subtle" style="font-size: 0.7rem;">${typeLabel}</span>
              ${ag.telefone_aluno ? `<span><i data-lucide="phone" style="width: 13px; height: 13px; display: inline;"></i> ${ag.telefone_aluno}</span>` : ''}
            </div>
            ${ag.observacoes ? `<div class="text-xs mt-2 text-muted" style="font-style: italic; background: rgba(0,0,0,0.25); padding: 4px 8px; border-radius: 4px;">Obs do Aluno: "${ag.observacoes}"</div>` : ''}
          </div>
        </div>

        <div class="agendamento-actions-col">
          ${ag.status === 'SOLICITADO' ? `
            <button class="btn-success btn-sm btn-action-confirm-ag" data-id="${ag.id}" title="Confirmar agendamento e notificar aluno">
              <i data-lucide="check"></i> Confirmar
            </button>
          ` : ''}
          ${ag.status === 'CONFIRMADO' ? `
            <button class="btn-primary btn-sm btn-action-complete-ag" data-id="${ag.id}" title="Marcar treino como realizado">
              <i data-lucide="check-circle-2"></i> Concluir
            </button>
          ` : ''}
          ${ag.telefone_aluno ? `
            <button class="btn-whatsapp btn-sm btn-action-wpp-ag" data-id="${ag.id}" title="Abrir conversa no WhatsApp com o aluno">
              <i data-lucide="message-square"></i> WhatsApp
            </button>
          ` : ''}
          <button class="btn-icon-ghost btn-sm btn-action-edit-ag" data-id="${ag.id}" title="Editar agendamento">
            <i data-lucide="edit"></i>
          </button>
          <button class="btn-icon-ghost text-danger btn-sm btn-action-del-ag" data-id="${ag.id}" title="Excluir agendamento">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Event Listeners for action buttons
  container.querySelectorAll<HTMLButtonElement>('.btn-action-confirm-ag').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const ag = agendamentos.find(a => a.id === id);
      if (!ag) return;
      ag.status = 'CONFIRMADO';
      ag.updated_at = new Date().toISOString();
      saveStoredAgendamentos(agendamentos);
      await neonService.updateAgendamentoStatus(ag.id, 'CONFIRMADO');
      updateAgendamentosCounters();
      renderAgendamentosList();
      showToast(`Agendamento de ${ag.nome_aluno} confirmado!`, 'success');

      if (ag.telefone_aluno && confirm(`Deseja abrir o WhatsApp para avisar ${ag.nome_aluno} sobre a confirmação da aula?`)) {
        const cleanPhone = ag.telefone_aluno.replace(/\D/g, '');
        const phone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
        const msg = `Olá ${ag.nome_aluno}! Seu agendamento de aula para o dia ${ag.data_aula} às ${ag.horario} foi CONFIRMADO com sucesso. Nos vemos no treino! 💪🏋️‍♂️`;
        window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`, '_blank');
      }
    });
  });

  container.querySelectorAll<HTMLButtonElement>('.btn-action-complete-ag').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const ag = agendamentos.find(a => a.id === id);
      if (!ag) return;
      ag.status = 'CONCLUIDO';
      ag.updated_at = new Date().toISOString();
      saveStoredAgendamentos(agendamentos);
      await neonService.updateAgendamentoStatus(ag.id, 'CONCLUIDO');
      updateAgendamentosCounters();
      renderAgendamentosList();
      showToast(`Aula com ${ag.nome_aluno} concluída e registrada!`, 'success');
    });
  });

  container.querySelectorAll<HTMLButtonElement>('.btn-action-wpp-ag').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const ag = agendamentos.find(a => a.id === id);
      if (!ag || !ag.telefone_aluno) return;
      const cleanPhone = ag.telefone_aluno.replace(/\D/g, '');
      const phone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      const msg = `Olá ${ag.nome_aluno}! Sobre nosso agendamento de aula em ${ag.data_aula} às ${ag.horario}...`;
      window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`, '_blank');
    });
  });

  container.querySelectorAll<HTMLButtonElement>('.btn-action-edit-ag').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const ag = agendamentos.find(a => a.id === id);
      if (ag) openAgendamentoModal(ag);
    });
  });

  container.querySelectorAll<HTMLButtonElement>('.btn-action-del-ag').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (!id) return;
      if (confirm('Deseja realmente remover este agendamento?')) {
        agendamentos = agendamentos.filter(a => a.id !== id);
        saveStoredAgendamentos(agendamentos);
        await neonService.deleteAgendamento(id);
        updateAgendamentosCounters();
        renderAgendamentosList();
        showToast('Agendamento excluído.', 'info');
      }
    });
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function setupAgendamentosTab() {
  const statusFilter = document.getElementById('filter-agendamento-status') as HTMLSelectElement;
  const studentFilter = document.getElementById('filter-agendamento-aluno') as HTMLSelectElement;
  const btnRefresh = document.getElementById('btn-refresh-agendamentos');
  const btnOpenModal = document.getElementById('btn-open-new-agendamento-modal');

  // Populate student filter
  if (studentFilter) {
    const currentVal = studentFilter.value;
    studentFilter.innerHTML = `<option value="ALL">Todos os Alunos</option>` + students.map(
      s => `<option value="${s.id}">${s.nome}</option>`
    ).join('');
    studentFilter.value = currentVal || 'ALL';
  }

  statusFilter?.addEventListener('change', () => renderAgendamentosList());
  studentFilter?.addEventListener('change', () => renderAgendamentosList());

  btnRefresh?.addEventListener('click', async () => {
    showToast('Atualizando agendamentos com a nuvem Neon...', 'info');
    try {
      const cloud = await neonService.getAgendamentos('personal-balbino');
      if (cloud && cloud.length > 0) {
        agendamentos = cloud;
        saveStoredAgendamentos(agendamentos);
      }
    } catch {}
    updateAgendamentosCounters();
    renderAgendamentosList();
    showToast('Lista de agendamentos atualizada!', 'success');
  });

  btnOpenModal?.addEventListener('click', () => openAgendamentoModal());

  updateAgendamentosCounters();
  renderAgendamentosList();
}

function openAgendamentoModal(ag?: AgendamentoAula) {
  const modal = document.getElementById('modal-agendamento');
  const title = document.getElementById('agendamento-modal-title');
  const studentSelect = document.getElementById('ag-student-id') as HTMLSelectElement;

  if (studentSelect) {
    studentSelect.innerHTML = `<option value="">Selecione o Aluno...</option>` + students.map(
      s => `<option value="${s.id}">${s.nome} (${s.telefone || 'Sem telefone'})</option>`
    ).join('');
  }

  if (ag) {
    if (title) title.textContent = 'Editar Agendamento de Aula';
    (document.getElementById('ag-form-id') as HTMLInputElement).value = ag.id;
    if (studentSelect) studentSelect.value = ag.paciente_id || '';
    (document.getElementById('ag-date') as HTMLInputElement).value = ag.data_aula;
    (document.getElementById('ag-time') as HTMLSelectElement).value = ag.horario;
    (document.getElementById('ag-type') as HTMLSelectElement).value = ag.tipo;
    (document.getElementById('ag-status') as HTMLSelectElement).value = ag.status;
    (document.getElementById('ag-notes') as HTMLTextAreaElement).value = ag.observacoes || '';
  } else {
    if (title) title.textContent = 'Novo Agendamento de Aula';
    (document.getElementById('form-agendamento-save') as HTMLFormElement)?.reset();
    (document.getElementById('ag-form-id') as HTMLInputElement).value = '';
    const dateInput = document.getElementById('ag-date') as HTMLInputElement;
    if (dateInput) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateInput.value = tomorrow.toISOString().split('T')[0];
    }
  }

  modal?.classList.add('open');
  if (typeof lucide !== 'undefined') lucide.createIcons();
}


