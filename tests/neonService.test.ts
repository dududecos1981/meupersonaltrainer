import { describe, it, expect, beforeEach } from 'vitest';
import { neonService, STORAGE_NEON_URL } from '../src/services/neonService';

describe('NeonService - Neon PostgreSQL & LGPD Compliance', () => {
  beforeEach(() => {
    localStorage.clear();
    neonService.initConnection('');
  });

  it('should initialize in unconfigured mode by default', () => {
    const raw = neonService.getRawConnectionString();
    expect(raw).toBe('');
    const masked = neonService.getMaskedConnectionString();
    expect(masked).toBe('');
  });

  it('should save and mask connection string properly', () => {
    const conn = 'postgres://balbino_user:SuperSecretPassword123@ep-cool-cloud-123456.us-east-2.aws.neon.tech/neondb?sslmode=require';
    neonService.saveConnectionString(conn);

    expect(localStorage.getItem(STORAGE_NEON_URL)).toBe(conn);
    expect(neonService.getRawConnectionString()).toBe(conn);
    
    const masked = neonService.getMaskedConnectionString();
    expect(masked).toContain('••••••••');
    expect(masked).not.toContain('SuperSecretPassword123');
  });

  it('should fallback gracefully to local cache when Neon is offline', async () => {
    const paciente = await neonService.savePaciente({
      id: '',
      nome: 'Carlos Silva',
      email: 'carlos@teste.com',
      telefone: '(11) 98765-4321',
      sexo: 'M',
      objetivo_principal: 'Hipertrofia'
    });

    expect(paciente.id).toBeDefined();
    expect(paciente.id.length).toBeGreaterThan(10);
    expect(paciente.termo_aceite_lgpd).toBe(true);

    const list = await neonService.getPacientes('personal-123');
    expect(list.some(p => p.nome === 'Carlos Silva')).toBe(true);
  });

  it('should save and retrieve physical evaluations in local cache', async () => {
    const avaliacao = await neonService.saveAvaliacao({
      id: '',
      paciente_id: 'paciente-101',
      personal_id: 'personal-123',
      data_avaliacao: '2026-10-03',
      peso: 82.5,
      altura: 1.78,
      percentual_gordura: 14.2,
      dobras_cutaneas: {
        tricipital: 10,
        subescapular: 12,
        abdominal: 16
      }
    });

    expect(avaliacao.id).toBeDefined();
    const list = await neonService.getAvaliacoes('paciente-101');
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list[0].peso).toBe(82.5);
  });

  it('should save, retrieve and delete spreadsheets in local cache', async () => {
    const planilha = await neonService.savePlanilha({
      id: '',
      personal_id: 'personal-123',
      paciente_id: 'paciente-101',
      titulo: 'Evolução Cargas Supino 2026',
      tipo: 'EVOLUCAO_CARGAS',
      dados_json: {
        exercicio: 'Supino Reto',
        historico: [
          { data: '2026-09-01', carga: 70 },
          { data: '2026-10-01', carga: 80 }
        ]
      }
    });

    expect(planilha.id).toBeDefined();
    const list = await neonService.getPlanilhas('personal-123', 'paciente-101');
    expect(list.length).toBeGreaterThanOrEqual(1);

    const deleted = await neonService.deletePlanilha(planilha.id, 'personal-123');
    expect(deleted).toBe(true);

    const updatedList = await neonService.getPlanilhas('personal-123', 'paciente-101');
    expect(updatedList.some(p => p.id === planilha.id)).toBe(false);
  });

  it('should generate CSV correctly with Excel BOM', () => {
    const headers = ['Data', 'Peso (kg)', 'Gordura (%)'];
    const rows = [
      ['2026-01-15', 85, 16.5],
      ['2026-02-15', 83.2, 14.8]
    ];

    const csv = neonService.convertToCSV(headers, rows);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"Data","Peso (kg)","Gordura (%)"');
    expect(csv).toContain('"2026-01-15","85","16.5"');
  });

  it('should handle LGPD data portability export package', async () => {
    const paciente = await neonService.savePaciente({
      id: 'aluno-lgpd-001',
      nome: 'Juliana Lima',
      email: 'juliana@exemplo.com'
    });

    const exportData = await neonService.exportAllDataLGPD(paciente.id, 'personal-123');
    expect(exportData.paciente.nome).toBe('Juliana Lima');
    expect(exportData.dataExportacao).toBeDefined();
    expect(exportData.hashAuditoria).toBeDefined();
  });

  it('should support LGPD Right to be Forgotten (Exclusão do Titular)', async () => {
    const paciente = await neonService.savePaciente({
      id: 'aluno-esquecimento-002',
      nome: 'Marcos Souza',
      email: 'marcos@exemplo.com'
    });

    expect((await neonService.getPacientes('personal-123')).some(p => p.id === 'aluno-esquecimento-002')).toBe(true);

    await neonService.deletePacienteLGPD('aluno-esquecimento-002', 'personal-123', 'Exercício do direito LGPD');

    const remaining = await neonService.getPacientes('personal-123');
    expect(remaining.some(p => p.id === 'aluno-esquecimento-002')).toBe(false);
  });
});
