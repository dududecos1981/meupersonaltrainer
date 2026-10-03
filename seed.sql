-- ==============================================================================
-- SISTEMA PERSONAL TRAINER BALBINO
-- Script de Demonstração / Seed Limpo para Neon PostgreSQL
-- ==============================================================================

-- 1. Inserir Personal Trainer Principal (Eduardo Cunha Balbino)
INSERT INTO public.personais (id, nome, email, cref)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Eduardo Cunha Balbino', 'dududecos1981@gmail.com', '123456-G/SP'),
    ('22222222-2222-2222-2222-222222222222', 'Personal Balbino', 'balbino@personaltrainer.com', '123456-G/SP')
ON CONFLICT (email) DO NOTHING;

-- 2. Inserir Biblioteca Básica de Exercícios Profissionais
INSERT INTO public.exercicios (id, personal_id, nome, grupo_muscular, equipamento, instrucoes)
VALUES
    ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111111', 'Supino Reto com Barra', 'Peitoral', 'Barra', 'Descer a barra até a linha dos mamilos mantendo escápulas aduzidas.'),
    ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111111', 'Crucifixo Inclinado com Halteres', 'Peitoral', 'Halter', 'Manter leve flexão nos cotovelos durante todo o movimento.'),
    ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111111', 'Tríceps Corda no Cross', 'Tríceps', 'Polia', 'Abrir a corda no final da extensão com contração de pico de 1s.'),
    ('33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111111', 'Puxada Frontal Aberta', 'Dorsal', 'Polia', 'Puxar em direção à fúrcula esternal mantendo o peito estufado.'),
    ('33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111111', 'Agachamento Livre', 'Quadríceps', 'Barra', 'Pés na largura dos ombros, descer até 90 graus mantendo coluna neutra.')
ON CONFLICT (id) DO NOTHING;
