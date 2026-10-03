/**
 * Tipagens do Banco de Dados PostgreSQL - Sistema Personal Trainer Balbino
 * Compatível com Neon Database Serverless & PostgreSQL 14+
 * Conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018)
 */

export interface Personal {
  id: string;
  nome: string;
  email: string;
  cref?: string | null;
  created_at?: string;
}

export interface Paciente {
  id: string;
  personal_id?: string | null;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  data_nascimento?: string | null;
  sexo?: 'M' | 'F' | 'OUTRO' | string | null;
  objetivo_principal?: string | null;
  termo_aceite_lgpd?: boolean | null;
  data_aceite_lgpd?: string | null;
  created_at?: string;
}

export interface Anamnese {
  id: string;
  paciente_id: string;
  personal_id: string;
  historico_cardiaco?: string | null;
  lesoes_cirurgias?: string | null;
  medicamentos?: string | null;
  fumante?: boolean | null;
  nivel_atividade_atual?: 'SEDENTARIO' | 'LEVE' | 'MODERADO' | 'INTENSO' | string | null;
  restricoes_medicas?: string | null;
  alergias_alimentares?: string | null;
  qualidade_sono_horas?: number | null;
  observacoes_saude?: string | null;
  created_at?: string;
}

export interface Exercicio {
  id: string;
  personal_id?: string | null;
  nome: string;
  grupo_muscular: string;
  equipamento?: string | null;
  instrucoes?: string | null;
  created_at?: string;
}

export interface FichaTreino {
  id: string;
  personal_id: string;
  paciente_id: string;
  titulo: string;
  objetivo?: string | null;
  data_inicio?: string | null;
  data_validade?: string | null;
  observacoes?: string | null;
  created_at?: string;
}

export interface ItemTreino {
  id: string;
  ficha_id: string;
  exercicio_id?: string | null;
  divisao: string; // Ex: "Treino A", "Treino B", "Push", "Pull"
  series?: number | null;
  repeticoes?: string | null;
  carga_sugerida?: string | null;
  tempo_descanso?: string | null;
  ordem?: number | null;
  observacoes?: string | null;
}

export interface DobrasCutaneas {
  tricipital?: number;
  subescapular?: number;
  suprailiaca?: number;
  abdominal?: number;
  axilar_media?: number;
  peitoral?: number;
  coxa?: number;
  panturrilha?: number;
  [key: string]: number | undefined;
}

export interface Perimetros {
  braco_relaxado_dir?: number;
  braco_contraido_dir?: number;
  braco_relaxado_esq?: number;
  braco_contraido_esq?: number;
  antebraco_dir?: number;
  antebraco_esq?: number;
  torax?: number;
  cintura?: number;
  abdomen?: number;
  quadril?: number;
  coxa_proximal_dir?: number;
  coxa_medial_dir?: number;
  coxa_distal_dir?: number;
  coxa_proximal_esq?: number;
  coxa_medial_esq?: number;
  coxa_distal_esq?: number;
  panturrilha_dir?: number;
  panturrilha_esq?: number;
  [key: string]: number | undefined;
}

export interface AvaliacaoFisica {
  id: string;
  paciente_id: string;
  personal_id: string;
  data_avaliacao: string;
  peso?: number | null;
  altura?: number | null;
  percentual_gordura?: number | null;
  massa_magra_kg?: number | null;
  dobras_cutaneas?: DobrasCutaneas | null;
  perimetros?: Perimetros | null;
  observacoes?: string | null;
  created_at?: string;
}

export interface ItemAlimento {
  alimento: string;
  quantidade: string;
  calorias: number;
  proteina_g?: number;
  carboidrato_g?: number;
  gordura_g?: number;
}

export interface Refeicao {
  horario: string;
  nome: string;
  itens: ItemAlimento[];
}

export interface PlanoAlimentar {
  id: string;
  personal_id: string;
  paciente_id: string;
  titulo: string;
  calorias_totais?: number | null;
  proteina_g?: number | null;
  carboidrato_g?: number | null;
  gordura_g?: number | null;
  refeicoes?: Refeicao[] | null;
  status?: 'RASCUNHO' | 'APROVADO' | 'ARQUIVADO' | null;
  created_at?: string;
}

/**
 * Gestão de Planilhas e Métricas na Nuvem (Neon DB)
 */
export interface PlanilhaMetrica {
  id: string;
  personal_id: string;
  paciente_id?: string | null;
  titulo: string;
  tipo: 'EVOLUCAO_CARGAS' | 'MEDIDAS_CORPORAIS' | 'FREQUENCIA_TREINOS' | 'DIARIO_ALIMENTAR' | 'FINANCEIRO_PLANILHA' | 'OUTRO';
  dados_json: Record<string, any>;
  arquivo_csv?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Registro de Consentimento LGPD (Art. 7º e 11 da Lei 13.709/2018 - Dados Sensíveis de Saúde)
 */
export interface ConsentimentoLGPD {
  id: string;
  paciente_id: string;
  personal_id: string;
  versao_termo: string;
  ip_registro?: string | null;
  data_aceite: string;
  status: 'ATIVO' | 'REVOGADO';
  finalidades: string[]; // ['PRESCRICAO_TREINO', 'AVALIACAO_FISICA', 'NUTRICAO_ESPORTIVA']
  created_at?: string;
}

/**
 * Log de Auditoria LGPD & Marco Civil da Internet (Art. 15 Lei 12.965/2014 & Art. 46 Lei 13.709/2018)
 */
export interface LogAuditoriaLGPD {
  id: string;
  personal_id: string;
  recurso: string; // Ex: 'paciente', 'avaliacao_fisica', 'anamnese'
  recurso_id?: string | null;
  acao: 'CONSULTA' | 'INSERCAO' | 'EDICAO' | 'EXCLUSAO_DIREITO_ESQUECIMENTO' | 'EXPORTACAO_PORTABILIDADE';
  detalhe?: string | null;
  ip?: string | null;
  timestamp: string;
}
