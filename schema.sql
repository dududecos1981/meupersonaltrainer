-- ==============================================================================
-- SISTEMA PERSONAL TRAINER BALBINO
-- Script Completo de Criação do Banco de Dados PostgreSQL & Segurança (RLS)
-- 100% Compatível com Neon Database Serverless (Plano Gratuito), Supabase e PostgreSQL 14+
-- Conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018)
-- ==============================================================================

-- 1. Habilitar extensões necessárias para UUID e criptografia
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. CRIAÇÃO DAS TABELAS NÚCLEO
-- ==============================================================================

-- 2.1 Tabela de Personais Trainers (Profissionais)
CREATE TABLE IF NOT EXISTS public.personais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    cref TEXT,
    termo_lgpd_aceito BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.2 Tabela de Pacientes / Alunos
CREATE TABLE IF NOT EXISTS public.pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personal_id UUID REFERENCES public.personais(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    data_nascimento DATE,
    sexo TEXT,
    objetivo_principal TEXT,
    termo_aceite_lgpd BOOLEAN DEFAULT TRUE,
    data_aceite_lgpd TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.3 Tabela de Anamnese e Saúde (Dados Sensíveis - Art. 11 LGPD)
CREATE TABLE IF NOT EXISTS public.anamneses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    personal_id UUID NOT NULL REFERENCES public.personais(id) ON DELETE CASCADE,
    historico_cardiaco TEXT,
    lesoes_cirurgias TEXT,
    medicamentos TEXT,
    fumante BOOLEAN DEFAULT FALSE,
    nivel_atividade_atual TEXT DEFAULT 'MODERADO',
    restricoes_medicas TEXT,
    alergias_alimentares TEXT,
    qualidade_sono_horas NUMERIC(3,1),
    observacoes_saude TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.4 Tabela de Exercícios (Biblioteca de Exercícios)
CREATE TABLE IF NOT EXISTS public.exercicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personal_id UUID REFERENCES public.personais(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    grupo_muscular TEXT NOT NULL,
    equipamento TEXT,
    instrucoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.5 Tabela de Fichas de Treino
CREATE TABLE IF NOT EXISTS public.fichas_treino (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personal_id UUID NOT NULL REFERENCES public.personais(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    objetivo TEXT,
    data_inicio DATE,
    data_validade DATE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.6 Tabela de Itens de Treino
CREATE TABLE IF NOT EXISTS public.itens_treino (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ficha_id UUID NOT NULL REFERENCES public.fichas_treino(id) ON DELETE CASCADE,
    exercicio_id UUID REFERENCES public.exercicios(id) ON DELETE SET NULL,
    divisao TEXT NOT NULL, -- Ex: "Treino A", "Treino B", "Push", "Pull"
    series INTEGER DEFAULT 3,
    repeticoes TEXT,       -- Ex: "8-12", "Falha", "15"
    carga_sugerida TEXT,   -- Ex: "20kg", "Halter 14kg"
    tempo_descanso TEXT,   -- Ex: "60s", "90s", "2min"
    ordem INTEGER DEFAULT 1,
    observacoes TEXT
);

-- 2.7 Tabela de Avaliações Físicas & Antropometria (7 Dobras Jackson-Pollock & Perímetros)
CREATE TABLE IF NOT EXISTS public.avaliacoes_fisicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    personal_id UUID NOT NULL REFERENCES public.personais(id) ON DELETE CASCADE,
    data_avaliacao DATE NOT NULL DEFAULT CURRENT_DATE,
    peso NUMERIC(5,2),
    altura NUMERIC(5,2),
    percentual_gordura NUMERIC(4,2),
    massa_magra_kg NUMERIC(5,2),
    dobras_cutaneas JSONB DEFAULT '{}'::jsonb,
    perimetros JSONB DEFAULT '{}'::jsonb,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.8 Tabela de Planos Alimentares
CREATE TABLE IF NOT EXISTS public.planos_alimentares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personal_id UUID NOT NULL REFERENCES public.personais(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    calorias_totais NUMERIC(6,2),
    proteina_g NUMERIC(5,2),
    carboidrato_g NUMERIC(5,2),
    gordura_g NUMERIC(5,2),
    refeicoes JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'RASCUNHO' CHECK (status IN ('RASCUNHO', 'APROVADO', 'ARQUIVADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.9 Tabela de Planilhas e Métricas na Nuvem (Armazenamento de Planilhas e Séries Temporais)
CREATE TABLE IF NOT EXISTS public.planilhas_metricas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personal_id UUID NOT NULL REFERENCES public.personais(id) ON DELETE CASCADE,
    paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'EVOLUCAO_CARGAS',
    dados_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    arquivo_csv TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.10 Tabela de Consentimentos LGPD (Art. 7º e 11 da Lei 13.709/2018)
CREATE TABLE IF NOT EXISTS public.consentimentos_lgpd (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    personal_id UUID NOT NULL REFERENCES public.personais(id) ON DELETE CASCADE,
    versao_termo TEXT NOT NULL DEFAULT '1.0',
    ip_registro TEXT,
    data_aceite TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'REVOGADO')),
    finalidades JSONB DEFAULT '["PRESCRICAO_TREINO", "AVALIACAO_FISICA", "NUTRICAO_ESPORTIVA"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.11 Tabela de Logs de Auditoria LGPD & Marco Civil (Art. 15 Lei 12.965 / Art. 46 Lei 13.709)
CREATE TABLE IF NOT EXISTS public.logs_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personal_id UUID NOT NULL,
    recurso TEXT NOT NULL,
    recurso_id TEXT,
    acao TEXT NOT NULL,
    detalhe TEXT,
    ip TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.12 Tabela de Agendamentos e Solicitações de Aulas pelo Aluno
CREATE TABLE IF NOT EXISTS public.agendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personal_id UUID NOT NULL REFERENCES public.personais(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    aluno_nome TEXT NOT NULL,
    aluno_telefone TEXT,
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo_aula TEXT NOT NULL DEFAULT 'PRESENCIAL',
    status TEXT NOT NULL DEFAULT 'SOLICITADO',
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. ÍNDICES DE ALTA PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_pacientes_personal_id ON public.pacientes(personal_id);
CREATE INDEX IF NOT EXISTS idx_anamneses_paciente ON public.anamneses(paciente_id);
CREATE INDEX IF NOT EXISTS idx_anamneses_personal ON public.anamneses(personal_id);
CREATE INDEX IF NOT EXISTS idx_exercicios_personal_id ON public.exercicios(personal_id);
CREATE INDEX IF NOT EXISTS idx_exercicios_grupo_muscular ON public.exercicios(grupo_muscular);
CREATE INDEX IF NOT EXISTS idx_fichas_treino_personal ON public.fichas_treino(personal_id);
CREATE INDEX IF NOT EXISTS idx_fichas_treino_paciente ON public.fichas_treino(paciente_id);
CREATE INDEX IF NOT EXISTS idx_itens_treino_ficha ON public.itens_treino(ficha_id);
CREATE INDEX IF NOT EXISTS idx_itens_treino_exercicio ON public.itens_treino(exercicio_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_paciente ON public.avaliacoes_fisicas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_personal ON public.avaliacoes_fisicas(personal_id);
CREATE INDEX IF NOT EXISTS idx_planos_alimentares_paciente ON public.planos_alimentares(paciente_id);
CREATE INDEX IF NOT EXISTS idx_planos_alimentares_personal ON public.planos_alimentares(personal_id);
CREATE INDEX IF NOT EXISTS idx_planilhas_personal ON public.planilhas_metricas(personal_id);
CREATE INDEX IF NOT EXISTS idx_planilhas_paciente ON public.planilhas_metricas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_consentimentos_paciente ON public.consentimentos_lgpd(paciente_id);
CREATE INDEX IF NOT EXISTS idx_logs_auditoria_personal ON public.logs_auditoria(personal_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_personal ON public.agendamentos(personal_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_paciente ON public.agendamentos(paciente_id);

-- ==============================================================================
-- 4. SEGURANÇA: ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.personais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamneses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fichas_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_fisicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_alimentares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planilhas_metricas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consentimentos_lgpd ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para obter o ID do usuário autenticado atual
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS UUID AS $$
BEGIN
    IF (SELECT current_setting('request.jwt.claims', true)) IS NOT NULL THEN
        RETURN (current_setting('request.jwt.claim.sub', true))::UUID;
    END IF;
    IF (SELECT current_setting('app.current_user_id', true)) IS NOT NULL THEN
        RETURN (current_setting('app.current_user_id', true))::UUID;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Políticas de RLS
DROP POLICY IF EXISTS "Personal pode ver seu proprio perfil" ON public.personais;
CREATE POLICY "Personal pode ver seu proprio perfil"
    ON public.personais FOR SELECT
    USING (id = public.current_app_user_id() OR public.current_app_user_id() IS NULL);

DROP POLICY IF EXISTS "Personal pode atualizar seu proprio perfil" ON public.personais;
CREATE POLICY "Personal pode atualizar seu proprio perfil"
    ON public.personais FOR UPDATE
    USING (id = public.current_app_user_id() OR public.current_app_user_id() IS NULL);

DROP POLICY IF EXISTS "Personal pode criar seu perfil" ON public.personais;
CREATE POLICY "Personal pode criar seu perfil"
    ON public.personais FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Isolamento de pacientes por personal" ON public.pacientes;
CREATE POLICY "Isolamento de pacientes por personal"
    ON public.pacientes FOR ALL
    USING (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL)
    WITH CHECK (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL);

DROP POLICY IF EXISTS "Isolamento de anamneses por personal" ON public.anamneses;
CREATE POLICY "Isolamento de anamneses por personal"
    ON public.anamneses FOR ALL
    USING (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL)
    WITH CHECK (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL);

DROP POLICY IF EXISTS "Isolamento de exercicios por personal" ON public.exercicios;
CREATE POLICY "Isolamento de exercicios por personal"
    ON public.exercicios FOR ALL
    USING (personal_id = public.current_app_user_id() OR personal_id IS NULL OR public.current_app_user_id() IS NULL)
    WITH CHECK (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL);

DROP POLICY IF EXISTS "Isolamento de fichas de treino por personal" ON public.fichas_treino;
CREATE POLICY "Isolamento de fichas de treino por personal"
    ON public.fichas_treino FOR ALL
    USING (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL)
    WITH CHECK (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL);

DROP POLICY IF EXISTS "Isolamento de itens de treino via ficha" ON public.itens_treino;
CREATE POLICY "Isolamento de itens de treino via ficha"
    ON public.itens_treino FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.fichas_treino f
            WHERE f.id = itens_treino.ficha_id
            AND (f.personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.fichas_treino f
            WHERE f.id = itens_treino.ficha_id
            AND (f.personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL)
        )
    );

DROP POLICY IF EXISTS "Isolamento de avaliacoes fisicas por personal" ON public.avaliacoes_fisicas;
CREATE POLICY "Isolamento de avaliacoes fisicas por personal"
    ON public.avaliacoes_fisicas FOR ALL
    USING (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL)
    WITH CHECK (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL);

DROP POLICY IF EXISTS "Isolamento de planos alimentares por personal" ON public.planos_alimentares;
CREATE POLICY "Isolamento de planos alimentares por personal"
    ON public.planos_alimentares FOR ALL
    USING (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL)
    WITH CHECK (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL);

DROP POLICY IF EXISTS "Isolamento de planilhas por personal" ON public.planilhas_metricas;
CREATE POLICY "Isolamento de planilhas por personal"
    ON public.planilhas_metricas FOR ALL
    USING (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL)
    WITH CHECK (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL);

DROP POLICY IF EXISTS "Isolamento de consentimentos lgpd por personal" ON public.consentimentos_lgpd;
CREATE POLICY "Isolamento de consentimentos lgpd por personal"
    ON public.consentimentos_lgpd FOR ALL
    USING (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL)
    WITH CHECK (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL);

DROP POLICY IF EXISTS "Isolamento de logs auditoria por personal" ON public.logs_auditoria;
CREATE POLICY "Isolamento de logs auditoria por personal"
    ON public.logs_auditoria FOR ALL
    USING (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL)
    WITH CHECK (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL);

DROP POLICY IF EXISTS "Isolamento de agendamentos por personal e aluno" ON public.agendamentos;
CREATE POLICY "Isolamento de agendamentos por personal e aluno"
    ON public.agendamentos FOR ALL
    USING (personal_id = public.current_app_user_id() OR paciente_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL)
    WITH CHECK (personal_id = public.current_app_user_id() OR paciente_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL);

-- ==============================================================================
-- 5. SINCRONIZAÇÃO E TRIGGERS DE USUÁRIOS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_personal_user()
RETURNS TRIGGER AS $$
DECLARE
    v_nome TEXT;
    v_cref TEXT;
BEGIN
    v_nome := COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1));
    v_cref := NEW.raw_user_meta_data->>'cref';

    INSERT INTO public.personais (id, nome, email, cref, created_at)
    VALUES (
        NEW.id,
        v_nome,
        NEW.email,
        v_cref,
        COALESCE(NEW.created_at, timezone('utc'::text, now()))
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        nome = COALESCE(EXCLUDED.nome, public.personais.nome),
        cref = COALESCE(EXCLUDED.cref, public.personais.cref),
        email = EXCLUDED.email;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_personal_user();
    END IF;
END $$;
