-- ==============================================================================
-- SISTEMA PERSONAL TRAINER BALBINO
-- Script de Criação do Banco de Dados PostgreSQL & Segurança (RLS)
-- Compatível com Neon Database, Supabase e PostgreSQL 14+
-- ==============================================================================

-- 1. Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- CRIAÇÃO DAS TABELAS
-- ==============================================================================

-- 1. Tabela personais
CREATE TABLE IF NOT EXISTS public.personais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    cref TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela pacientes / alunos (necessária para relacionamento com fichas, avaliações e dietas)
CREATE TABLE IF NOT EXISTS public.pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personal_id UUID REFERENCES public.personais(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    data_nascimento DATE,
    sexo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela exercicios
CREATE TABLE IF NOT EXISTS public.exercicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personal_id UUID REFERENCES public.personais(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    grupo_muscular TEXT NOT NULL,
    equipamento TEXT,
    instrucoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela fichas_treino
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

-- 4. Tabela itens_treino
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

-- 5. Tabela avaliacoes_fisicas
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

-- 6. Tabela planos_alimentares
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

-- ==============================================================================
-- ÍNDICES DE PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_pacientes_personal_id ON public.pacientes(personal_id);
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

-- ==============================================================================
-- SEGURANÇA: ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- 1. Ativar RLS em todas as tabelas
ALTER TABLE public.personais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fichas_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_fisicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_alimentares ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para obter o ID do usuário autenticado atual
-- Compatível com Supabase auth.uid() ou variável de sessão Neon/PostgreSQL
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS UUID AS $$
BEGIN
    -- Se estiver usando Supabase Auth:
    IF (SELECT current_setting('request.jwt.claims', true)) IS NOT NULL THEN
        RETURN (current_setting('request.jwt.claim.sub', true))::UUID;
    END IF;
    -- Se estiver usando sessão Neon / PostgreSQL customizada:
    IF (SELECT current_setting('app.current_user_id', true)) IS NOT NULL THEN
        RETURN (current_setting('app.current_user_id', true))::UUID;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ------------------------------------------------------------------------------
-- Políticas para 'personais'
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- Políticas para 'pacientes'
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Isolamento de pacientes por personal" ON public.pacientes;
CREATE POLICY "Isolamento de pacientes por personal"
    ON public.pacientes FOR ALL
    USING (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL)
    WITH CHECK (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL);

-- ------------------------------------------------------------------------------
-- Políticas para 'exercicios'
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Isolamento de exercicios por personal" ON public.exercicios;
CREATE POLICY "Isolamento de exercicios por personal"
    ON public.exercicios FOR ALL
    USING (personal_id = public.current_app_user_id() OR personal_id IS NULL OR public.current_app_user_id() IS NULL)
    WITH CHECK (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL);

-- ------------------------------------------------------------------------------
-- Políticas para 'fichas_treino'
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Isolamento de fichas de treino por personal" ON public.fichas_treino;
CREATE POLICY "Isolamento de fichas de treino por personal"
    ON public.fichas_treino FOR ALL
    USING (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL)
    WITH CHECK (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL);

-- ------------------------------------------------------------------------------
-- Políticas para 'itens_treino'
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- Políticas para 'avaliacoes_fisicas'
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Isolamento de avaliacoes fisicas por personal" ON public.avaliacoes_fisicas;
CREATE POLICY "Isolamento de avaliacoes fisicas por personal"
    ON public.avaliacoes_fisicas FOR ALL
    USING (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL)
    WITH CHECK (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL);

-- ------------------------------------------------------------------------------
-- Políticas para 'planos_alimentares'
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Isolamento de planos alimentares por personal" ON public.planos_alimentares;
CREATE POLICY "Isolamento de planos alimentares por personal"
    ON public.planos_alimentares FOR ALL
    USING (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL)
    WITH CHECK (personal_id = public.current_app_user_id() OR public.current_app_user_id() IS NULL);

-- ==============================================================================
-- SUPABASE AUTH INTEGRATION & TRIGGER AUTOMÁTICO (PROMPT 5)
-- Sincronização automática entre auth.users e public.personais
-- ==============================================================================

-- 1. Função que processa novos cadastros do Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_personal_user()
RETURNS TRIGGER AS $$
DECLARE
    v_nome TEXT;
    v_cref TEXT;
BEGIN
    -- Extrai metadados enviados no cadastro (signUp)
    v_nome := COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1));
    v_cref := NEW.raw_user_meta_data->>'cref';

    -- Insere ou atualiza na tabela pública personais
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

-- 2. Gatilho (Trigger) disparado imediatamente após o cadastro no Supabase Auth
-- Observação: Este comando funciona nativamente no editor SQL do Supabase
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_personal_user();
    END IF;
END $$;
