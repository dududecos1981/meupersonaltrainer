/**
 * Tipagens do Banco de Dados PostgreSQL - Sistema Personal Trainer Balbino
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
