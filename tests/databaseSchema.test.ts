import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Database Schema & RLS Integrity (schema.sql)', () => {
  const schemaPath = path.resolve(__dirname, '../schema.sql');
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

  it('should include extension for UUID generation', () => {
    expect(schemaContent).toContain('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    expect(schemaContent).toContain('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  });

  const expectedTables = [
    'public.personais',
    'public.pacientes',
    'public.exercicios',
    'public.fichas_treino',
    'public.itens_treino',
    'public.avaliacoes_fisicas',
    'public.planos_alimentares'
  ];

  expectedTables.forEach(tableName => {
    it(`should create table ${tableName}`, () => {
      expect(schemaContent).toContain(`CREATE TABLE IF NOT EXISTS ${tableName}`);
    });

    it(`should enable Row Level Security (RLS) on ${tableName}`, () => {
      expect(schemaContent).toContain(`ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`);
    });
  });

  it('should enforce ON DELETE CASCADE on relational tables', () => {
    expect(schemaContent).toContain('REFERENCES public.personais(id) ON DELETE CASCADE');
    expect(schemaContent).toContain('REFERENCES public.pacientes(id) ON DELETE CASCADE');
    expect(schemaContent).toContain('REFERENCES public.fichas_treino(id) ON DELETE CASCADE');
  });

  it('should include RLS isolation policies with current_app_user_id() or auth.uid()', () => {
    expect(schemaContent).toContain('current_app_user_id()');
    expect(schemaContent).toContain('CREATE POLICY "Personal pode ver seu proprio perfil"');
    expect(schemaContent).toContain('CREATE POLICY "Personal pode atualizar seu proprio perfil"');
    expect(schemaContent).toContain('CREATE POLICY "Personal pode criar seu perfil"');
    expect(schemaContent).toContain('CREATE POLICY "Isolamento de pacientes por personal"');
    expect(schemaContent).toContain('CREATE POLICY "Isolamento de exercicios por personal"');
    expect(schemaContent).toContain('CREATE POLICY "Isolamento de fichas de treino por personal"');
    expect(schemaContent).toContain('CREATE POLICY "Isolamento de itens de treino via ficha"');
    expect(schemaContent).toContain('CREATE POLICY "Isolamento de avaliacoes fisicas por personal"');
    expect(schemaContent).toContain('CREATE POLICY "Isolamento de planos alimentares por personal"');
  });

  it('should create performance indices for foreign keys', () => {
    expect(schemaContent).toContain('CREATE INDEX IF NOT EXISTS idx_pacientes_personal_id');
    expect(schemaContent).toContain('CREATE INDEX IF NOT EXISTS idx_exercicios_personal_id');
    expect(schemaContent).toContain('CREATE INDEX IF NOT EXISTS idx_exercicios_grupo_muscular');
    expect(schemaContent).toContain('CREATE INDEX IF NOT EXISTS idx_fichas_treino_personal');
    expect(schemaContent).toContain('CREATE INDEX IF NOT EXISTS idx_fichas_treino_paciente');
    expect(schemaContent).toContain('CREATE INDEX IF NOT EXISTS idx_itens_treino_ficha');
    expect(schemaContent).toContain('CREATE INDEX IF NOT EXISTS idx_avaliacoes_paciente');
    expect(schemaContent).toContain('CREATE INDEX IF NOT EXISTS idx_planos_alimentares_paciente');
  });

  it('should include auto-sync trigger with auth.users', () => {
    expect(schemaContent).toContain('CREATE OR REPLACE FUNCTION public.handle_new_personal_user()');
    expect(schemaContent).toContain('CREATE TRIGGER on_auth_user_created');
  });
});
