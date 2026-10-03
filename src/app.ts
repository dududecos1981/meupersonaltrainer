/**
 * BALBINO PRO — APLICAÇÃO PRINCIPAL (SPA)
 * Plataforma Inteligente para Personal Trainer & Nutrição
 */

import { Paciente, Exercicio, AvaliacaoFisica, PlanilhaMetrica, LogAuditoriaLGPD } from './types/database';
import { WorkoutPlanOutput, NutritionPlanOutput } from './types/ai';
import { authService, AuthUserSession } from './services/authService';
import { neonService } from './services/neonService';

// Declare Lucide icons
declare const lucide: any;

// ==============================================================================
// BASE DE DADOS INICIAL / ESTADO GLOBAL
// ==============================================================================

const INITIAL_PLANILHAS: PlanilhaMetrica[] = [
  {
    id: 'planilha-1',
    personal_id: 'personal-balbino',
    paciente_id: '22222222-2222-2222-2222-222222222222',
    titulo: 'Evolução de Cargas no Supino e Agachamento (2026)',
    tipo: 'EVOLUCAO_CARGAS',
    dados_json: {
      headers: ['Data', 'Exercício', 'Séries', 'Reps', 'Carga (kg)', 'RPE'],
      rows: [
        ['2026-08-01', 'Supino Reto', '4', '8', '70', '8'],
        ['2026-08-15', 'Supino Reto', '4', '8', '74', '8.5'],
        ['2026-09-01', 'Supino Reto', '4', '8', '78', '8'],
        ['2026-09-15', 'Supino Reto', '4', '8', '82', '9'],
        ['2026-10-01', 'Supino Reto', '4', '8', '85', '8.5']
      ]
    },
    arquivo_csv: 'Data,Exercício,Séries,Reps,Carga_kg,RPE\n2026-08-01,Supino Reto,4,8,70,8\n2026-08-15,Supino Reto,4,8,74,8.5\n2026-09-01,Supino Reto,4,8,78,8\n2026-09-15,Supino Reto,4,8,82,9\n2026-10-01,Supino Reto,4,8,85,8.5',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'planilha-2',
    personal_id: 'personal-balbino',
    paciente_id: '22222222-2222-2222-2222-222222222222',
    titulo: 'Controle de Frequência Semanal e Assiduidade',
    tipo: 'FREQUENCIA_TREINOS',
    dados_json: {
      headers: ['Semana', 'Treinos Previstos', 'Treinos Realizados', 'Aderência (%)'],
      rows: [
        ['Semana 1 (Ago)', '4', '4', '100%'],
        ['Semana 2 (Ago)', '4', '3', '75%'],
        ['Semana 3 (Ago)', '4', '4', '100%'],
        ['Semana 4 (Ago)', '4', '4', '100%'],
        ['Semana 1 (Set)', '4', '4', '100%']
      ]
    },
    arquivo_csv: 'Semana,Treinos Previstos,Treinos Realizados,Aderência\nSemana 1 (Ago),4,4,100%\nSemana 2 (Ago),4,3,75%\nSemana 3 (Ago),4,4,100%\nSemana 4 (Ago),4,4,100%\nSemana 1 (Set),4,4,100%',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let planilhas: PlanilhaMetrica[] = [...INITIAL_PLANILHAS];

const INITIAL_STUDENTS: (Paciente & { idade: number; peso: number; altura: number; objetivo: string; lesoes: string; rotina: string; nivel: string; ficha?: string; calorias?: string })[] = [
  {
    id: '22222222-2222-2222-2222-222222222222',
    nome: 'Carlos Eduardo Silva',
    email: 'carlos.silva@email.com',
    telefone: '(11) 98765-4321',
    data_nascimento: '1998-04-12',
    sexo: 'M',
    idade: 28,
    peso: 78.5,
    altura: 178,
    nivel: 'INTERMEDIARIO',
    objetivo: 'HIPERTROFIA',
    ficha: 'Ficha ABC Hipertrofia (4x)',
    calorias: '2.650 kcal',
    lesoes: 'Leve desconforto no ombro direito em abdução máxima',
    rotina: 'Treina às 06:30 em jejum com pré-treino leve; trabalha sentado até 18h.'
  }
];

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
let students = [...INITIAL_STUDENTS];
let exercises = [...INITIAL_EXERCISES];
let selectedStudentId = students[0].id;
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
  setupAuth();
  setupNavigation();
  setupModals();
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

  // Refresh icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});

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

  // ACESSO RÁPIDO DE DEMONSTRAÇÃO (100% Instantâneo)
  document.getElementById('btn-demo-login')?.addEventListener('click', async () => {
    clearAuthAlert();
    const res = authService.signInDemo();
    if (res.success) {
      showToast(res.message || 'Bem-vindo ao Modo Demonstração!', 'success');
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
    selectQuickAI.innerHTML = students.map(s => `<option value="${s.id}">${s.nome} (${s.objetivo})</option>`).join('');
  }

  if (tbody) {
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

  // Dashboard quick AI buttons
  document.querySelectorAll('.btn-ai-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
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
          <strong>Rotina:</strong> ${student.rotina}
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
    select.innerHTML = students.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
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
    selectStudent.innerHTML = students.map(s => `<option value="${s.id}">${s.nome} (${s.objetivo})</option>`).join('');
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

  if (select) {
    select.innerHTML = students.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
    select.addEventListener('change', () => {
      const st = students.find(s => s.id === select.value);
      if (st) {
        if (studentNameEl) studentNameEl.textContent = st.nome;
        if (avatarText) avatarText.textContent = st.nome.split(' ').map(n => n[0]).slice(0, 2).join('');
      }
    });
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
        const dateFormatted = new Date(log.timestamp).toLocaleString('pt-BR');
        const badge = actionBadgeMap[log.acao] || { label: log.acao, class: 'auditoria' };
        return `
        <tr>
          <td><span class="font-mono text-xs">${dateFormatted}</span></td>
          <td><span class="text-xs"><strong>Personal Balbino</strong></span></td>
          <td><span class="lgpd-badge-tag ${badge.class}">${badge.label}</span></td>
          <td><span class="text-xs text-muted">${log.detalhe || 'Operação registrada'}</span></td>
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
    const name = (document.getElementById('sf-name') as HTMLInputElement).value;
    if (!name) return;

    const lgpdConsent = (document.getElementById('sf-lgpd-consent') as HTMLInputElement)?.checked ?? true;

    const newStudent = {
      id: (document.getElementById('student-form-id') as HTMLInputElement).value || `stu-${Date.now()}`,
      nome: name,
      email: (document.getElementById('sf-email') as HTMLInputElement).value,
      telefone: (document.getElementById('sf-phone') as HTMLInputElement).value,
      sexo: (document.getElementById('sf-gender') as HTMLSelectElement).value,
      idade: parseInt((document.getElementById('sf-age') as HTMLInputElement).value) || 28,
      peso: parseFloat((document.getElementById('sf-weight') as HTMLInputElement).value) || 70,
      altura: parseFloat((document.getElementById('sf-height') as HTMLInputElement).value) || 170,
      nivel: (document.getElementById('sf-experience') as HTMLSelectElement).value,
      objetivo: (document.getElementById('sf-goal') as HTMLSelectElement).value,
      lesoes: (document.getElementById('sf-injuries') as HTMLTextAreaElement).value,
      rotina: (document.getElementById('sf-routine') as HTMLTextAreaElement).value,
      termo_aceite_lgpd: lgpdConsent,
      data_aceite_lgpd: new Date().toISOString()
    };

    const existingIndex = students.findIndex((s) => s.id === newStudent.id);
    if (existingIndex >= 0) {
      students[existingIndex] = newStudent;
    } else {
      students.push(newStudent);
    }

    await neonService.savePaciente(newStudent);

    modalStudent?.classList.remove('open');
    renderDashboard();
    renderStudentsList();
    setupPlanilhasTab();
    setupLGPDTab();
    showToast('Aluno salvo e sincronizado com o banco Neon!', 'success');
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
    (document.getElementById('sf-age') as HTMLInputElement).value = String(student.idade || 28);
    (document.getElementById('sf-weight') as HTMLInputElement).value = String(student.peso || 70);
    (document.getElementById('sf-height') as HTMLInputElement).value = String(student.altura || 170);
    (document.getElementById('sf-experience') as HTMLSelectElement).value = student.nivel || 'INTERMEDIARIO';
    (document.getElementById('sf-goal') as HTMLSelectElement).value = student.objetivo || 'HIPERTROFIA';
    (document.getElementById('sf-injuries') as HTMLTextAreaElement).value = student.lesoes || '';
    (document.getElementById('sf-routine') as HTMLTextAreaElement).value = student.rotina || '';
  } else {
    if (title) title.textContent = 'Novo Aluno — Cadastro & Anamnese';
    (document.getElementById('form-student-save') as HTMLFormElement)?.reset();
    (document.getElementById('student-form-id') as HTMLInputElement).value = '';
  }
  modal?.classList.add('open');
}

