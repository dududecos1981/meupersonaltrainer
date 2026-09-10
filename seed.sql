-- ==============================================================================
-- SISTEMA PERSONAL TRAINER BALBINO
-- Dados de Exemplo / Seed para Demonstração e Testes
-- ==============================================================================

-- 1. Inserir Personal Balbino
INSERT INTO public.personais (id, nome, email, cref)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Personal Balbino', 'balbino@personaltrainer.com', '123456-G/SP')
ON CONFLICT (email) DO NOTHING;

-- 2. Inserir Aluno Exemplo
INSERT INTO public.pacientes (id, personal_id, nome, email, telefone, data_nascimento, sexo)
VALUES 
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Carlos Eduardo Silva', 'carlos.silva@email.com', '(11) 98765-4321', '1995-04-12', 'M')
ON CONFLICT (id) DO NOTHING;

-- 3. Inserir Biblioteca Básica de Exercícios
INSERT INTO public.exercicios (id, personal_id, nome, grupo_muscular, equipamento, instrucoes)
VALUES
    ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111111', 'Supino Reto com Barra', 'Peitoral', 'Barra e Banco Reto', 'Descer a barra até a linha dos mamilos mantendo escápulas aduzidas.'),
    ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111111', 'Crucifixo Inclinado com Halteres', 'Peitoral', 'Halteres e Banco Inclinado', 'Manter leve flexão nos cotovelos durante todo o movimento.'),
    ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111111', 'Tríceps Corda no Cross', 'Tríceps', 'Polia / Cabo', 'Abrir a corda no final da extensão com contração de pico de 1s.'),
    ('33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111111', 'Puxada Frontal Aberta', 'Dorsal', 'Polia Alta', 'Puxar em direção à fúrcula esternal mantendo o peito estufado.'),
    ('33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111111', 'Agachamento Livre', 'Quadríceps/Glúteos', 'Barra Olímpica', 'Pés na largura dos ombros, descer até 90 graus mantendo coluna neutra.')
ON CONFLICT (id) DO NOTHING;

-- 4. Inserir Ficha de Treino
INSERT INTO public.fichas_treino (id, personal_id, paciente_id, titulo, objetivo, data_inicio, data_validade, observacoes)
VALUES
    ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Periodização Hipertrofia A/B/C', 'Hipertrofia e Densidade Muscular', CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', 'Foco em progressão de cargas a cada 2 semanas.')
ON CONFLICT (id) DO NOTHING;

-- 5. Itens da Ficha de Treino (Treino A - Peito e Tríceps)
INSERT INTO public.itens_treino (ficha_id, exercicio_id, divisao, series, repeticoes, carga_sugerida, tempo_descanso, ordem, observacoes)
VALUES
    ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333301', 'Treino A', 4, '8-10', '30kg cada lado', '90s', 1, 'Cadência 3-0-1-0'),
    ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333302', 'Treino A', 3, '10-12', 'Halteres 16kg', '60s', 2, 'Alongamento máximo no ponto zero'),
    ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333303', 'Treino A', 4, '12-15', '25kg', '45s', 3, 'Drop-set na última série')
ON CONFLICT DO NOTHING;

-- 6. Inserir Avaliação Física
INSERT INTO public.avaliacoes_fisicas (paciente_id, personal_id, data_avaliacao, peso, altura, percentual_gordura, massa_magra_kg, dobras_cutaneas, perimetros, observacoes)
VALUES
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', CURRENT_DATE, 78.5, 178.0, 15.2, 66.5, 
    '{"tricipital": 12, "subescapular": 14, "suprailiaca": 16, "abdominal": 18}'::jsonb,
    '{"braco_direito": 37.5, "braco_esquerdo": 37.0, "torax": 102.0, "cintura": 82.0, "coxa_direita": 58.0}'::jsonb,
    'Aluno com boa postura e simetria muscular. Sem queixas articulares.');

-- 7. Inserir Plano Alimentar
INSERT INTO public.planos_alimentares (paciente_id, personal_id, titulo, calorias_totais, proteina_g, carboidrato_g, gordura_g, status, refeicoes)
VALUES
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Dieta Hipertrofia Limpa 2500kcal', 2500, 160, 310, 65, 'APROVADO',
    '[
        {
            "horario": "07:30",
            "nome": "Café da Manhã (Pré-Treino)",
            "itens": [
                { "alimento": "Ovo de galinha mexido", "quantidade": "3 unidades", "calorias": 210 },
                { "alimento": "Pão integral 100%", "quantidade": "2 fatias (50g)", "calorias": 125 },
                { "alimento": "Banana prata", "quantidade": "1 unidade média (80g)", "calorias": 70 },
                { "alimento": "Pasta de amendoim integral", "quantidade": "1 colher de sopa (15g)", "calorias": 90 }
            ]
        },
        {
            "horario": "12:30",
            "nome": "Almoço (Pós-Treino)",
            "itens": [
                { "alimento": "Peito de frango grelhado", "quantidade": "150g", "calorias": 240 },
                { "alimento": "Arroz branco cozido", "quantidade": "200g", "calorias": 260 },
                { "alimento": "Feijão carioca cozido", "quantidade": "1 concha (100g)", "calorias": 76 },
                { "alimento": "Azeite de oliva extravirgem", "quantidade": "1 fio (5ml)", "calorias": 44 },
                { "alimento": "Salada verde variada (rúcula, alface, tomate)", "quantidade": "À vontade", "calorias": 25 }
            ]
        },
        {
            "horario": "16:00",
            "nome": "Lanche da Tarde",
            "itens": [
                { "alimento": "Iogurte natural desnatado", "quantidade": "170g", "calorias": 85 },
                { "alimento": "Whey Protein Concentrado 80%", "quantidade": "30g (1 scoop)", "calorias": 120 },
                { "alimento": "Aveia em flocos finos", "quantidade": "30g", "calorias": 110 }
            ]
        },
        {
            "horario": "20:00",
            "nome": "Jantar",
            "itens": [
                { "alimento": "Patinho moído refogado", "quantidade": "150g", "calorias": 270 },
                { "alimento": "Batata doce assada", "quantidade": "180g", "calorias": 140 },
                { "alimento": "Brócolis e legumes cozidos no vapor", "quantidade": "150g", "calorias": 50 }
            ]
        }
    ]'::jsonb);
