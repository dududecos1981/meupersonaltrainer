import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '../src/services/authService';
import { neonService } from '../src/services/neonService';
import { AgendamentoAula } from '../src/types/database';

describe('Student Portal & Self-Registration Tests', () => {
  beforeEach(async () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    await authService.studentSignOut();
  });

  it('should successfully register a new student with complete mobile profile', async () => {
    const registrationData = {
      nome: 'Mariana Silva',
      email: 'mariana.silva@exemplo.com',
      senha: 'senhaSegura123',
      telefone: '11988887777',
      idade: 28,
      peso: 62.5,
      altura: 168,
      objetivo: 'HIPERTROFIA' as const,
      nivel: 'INTERMEDIARIO' as const,
      rotina: 'Treina 4x na semana após o trabalho',
      lesoes: 'Nenhuma restrição articular',
      consentimento_lgpd: true
    };

    const result = await authService.studentSignUp(registrationData);

    expect(result.success).toBe(true);
    expect(result.session).toBeDefined();
    expect(result.session?.student.nome).toBe('Mariana Silva');
    expect(result.session?.student.email).toBe('mariana.silva@exemplo.com');
    expect(result.session?.student.peso).toBe(62.5);
    expect(result.session?.student.altura).toBe(168);
  });

  it('should reject registration if LGPD consent is not provided', async () => {
    const result = await authService.studentSignUp({
      nome: 'Carlos Santos',
      email: 'carlos@teste.com',
      senha: 'password123',
      consentimento_lgpd: false
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('LGPD');
  });

  it('should authenticate pre-seeded or registered student and restore session', async () => {
    // Register student
    await authService.studentSignUp({
      nome: 'Arthur Aluno',
      email: 'arthur@aluno.com',
      senha: 'alunoArthur123',
      telefone: '11999998888',
      consentimento_lgpd: true
    });

    await authService.studentSignOut();
    expect(authService.getStudentSession()).toBeNull();

    // Login with correct credentials
    const loginRes = await authService.studentSignIn('arthur@aluno.com', 'alunoArthur123');
    expect(loginRes.success).toBe(true);
    expect(loginRes.session?.student.nome).toBe('Arthur Aluno');

    // Verify session getter
    const session = authService.getStudentSession();
    expect(session).not.toBeNull();
    expect(session?.email).toBe('arthur@aluno.com');
  });

  it('should reject student sign in with incorrect password', async () => {
    await authService.studentSignUp({
      nome: 'Eduardo Aluno',
      email: 'eduardo@aluno.com',
      senha: 'senhaCorreta123',
      consentimento_lgpd: true
    });

    const loginRes = await authService.studentSignIn('eduardo@aluno.com', 'senhaErrada');
    expect(loginRes.success).toBe(false);
    expect(loginRes.error).toContain('incorret');
  });

  it('should allow student to update profile details', async () => {
    await authService.studentSignUp({
      nome: 'Beatriz Costa',
      email: 'beatriz@teste.com',
      senha: 'password123',
      peso: 58,
      consentimento_lgpd: true
    });

    const updateRes = await authService.updateStudentProfile({
      peso: 56.5,
      objetivo: 'EMAGRECIMENTO',
      rotina: 'Treinos matinais em jejum'
    });

    expect(updateRes.success).toBe(true);
    expect(updateRes.student?.peso).toBe(56.5);
    expect(updateRes.student?.objetivo).toBe('EMAGRECIMENTO');
    expect(updateRes.student?.rotina).toBe('Treinos matinais em jejum');
  });
});

describe('Class Booking & Appointment Management Tests', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('should allow student to create and retrieve class booking requests', async () => {
    const newAgendamento: AgendamentoAula = {
      id: 'booking-test-1',
      personal_id: 'default-personal-id',
      paciente_id: 'student-test-1',
      nome_aluno: 'Eduardo Balbino Aluno',
      telefone_aluno: '11999990000',
      data_aula: '2026-10-15',
      horario: '08:00',
      tipo: 'PRESENCIAL',
      status: 'SOLICITADO',
      observacoes: 'Foco em treino de pernas e agachamento livre',
      created_at: new Date().toISOString()
    };

    const saved = await neonService.saveAgendamento(newAgendamento);
    expect(saved).toBeDefined();
    expect(saved?.id).toBe('booking-test-1');

    const agendamentos = await neonService.getAgendamentos('default-personal-id');
    expect(agendamentos.length).toBeGreaterThan(0);
    const found = agendamentos.find(a => a.id === 'booking-test-1');
    expect(found).toBeDefined();
    expect(found?.nome_aluno).toBe('Eduardo Balbino Aluno');
    expect(found?.status).toBe('SOLICITADO');
  });

  it('should allow personal trainer to update booking status to CONFIRMADO', async () => {
    const agendamento: AgendamentoAula = {
      id: 'booking-test-2',
      personal_id: 'personal-123',
      paciente_id: 'student-456',
      nome_aluno: 'Arthur Balbino Aluno',
      data_aula: '2026-10-16',
      horario: '10:00',
      tipo: 'ONLINE',
      status: 'SOLICITADO',
      created_at: new Date().toISOString()
    };

    await neonService.saveAgendamento(agendamento);
    const updated = await neonService.updateAgendamentoStatus('booking-test-2', 'CONFIRMADO');
    expect(updated).toBe(true);

    const list = await neonService.getAgendamentos('personal-123');
    const item = list.find(a => a.id === 'booking-test-2');
    expect(item?.status).toBe('CONFIRMADO');
  });

  it('should allow deletion of appointment', async () => {
    const agendamento: AgendamentoAula = {
      id: 'booking-to-delete',
      personal_id: 'personal-123',
      paciente_id: 'student-456',
      nome_aluno: 'Teste Delete',
      data_aula: '2026-10-17',
      horario: '14:00',
      tipo: 'PRESENCIAL',
      status: 'CANCELADO',
      created_at: new Date().toISOString()
    };

    await neonService.saveAgendamento(agendamento);
    const deleted = await neonService.deleteAgendamento('booking-to-delete');
    expect(deleted).toBe(true);

    const list = await neonService.getAgendamentos('personal-123');
    const item = list.find(a => a.id === 'booking-to-delete');
    expect(item).toBeUndefined();
  });
});
