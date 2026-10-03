import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '../src/services/authService';

describe('AuthService - Authentication & Session Management', () => {
  beforeEach(async () => {
    // Clear mock storage and reset to fallback mode
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    authService.saveSupabaseConfig('', '');
    await authService.signOut();
  });

  it('should initialize with default or fallback session', () => {
    const config = authService.getSupabaseConfig();
    expect(config).toBeDefined();
    expect(typeof config.url).toBe('string');
    expect(typeof config.key).toBe('string');
  });

  it('should save and retrieve custom Supabase configuration', () => {
    const customUrl = 'https://custom-project.supabase.co';
    const customKey = 'custom-anon-key-12345';

    authService.saveSupabaseConfig(customUrl, customKey);
    const updated = authService.getSupabaseConfig();

    expect(updated.url).toBe(customUrl);
    expect(updated.key).toBe(customKey);
    expect(updated.isCustom).toBe(true);

    // Reset back
    authService.saveSupabaseConfig('', '');
  });

  it('should reject sign up with missing CREF', async () => {
    const res = await authService.signUp({
      nome: 'Personal Teste',
      email: 'teste@email.com',
      cref: '',
      senha: 'password123'
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('CREF');
  });

  it('should reject sign up with short password', async () => {
    const res = await authService.signUp({
      nome: 'Personal Teste',
      email: 'teste@email.com',
      cref: '123456-G/SP',
      senha: '123'
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('mínimo 6 caracteres');
  });

  it('should successfully sign in with primary owner credentials (dududecos1981@gmail.com)', async () => {
    const res = await authService.signIn('dududecos1981@gmail.com', 'Edu150920@');
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data?.personal.email).toBe('dududecos1981@gmail.com');
    expect(res.data?.personal.nome).toContain('Eduardo');
    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.getCurrentPersonal()?.email).toBe('dududecos1981@gmail.com');
  });

  it('should reject sign in with wrong password for registered user', async () => {
    const res = await authService.signIn('dududecos1981@gmail.com', 'SenhaErrada123');
    expect(res.success).toBe(false);
    expect(res.error).toContain('E-mail ou senha incorretos');
  });

  it('should successfully sign in with standard credentials in fallback mode', async () => {
    const res = await authService.signIn('balbino@personaltrainer.com', 'senha123');
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data?.personal.nome).toContain('Balbino');
    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.getCurrentPersonal()).toBeDefined();
  });

  it('should allow profile updates for logged in personal', async () => {
    await authService.signIn('balbino@personaltrainer.com', 'senha123');
    const updateRes = await authService.updateProfile('Prof. Carlos Balbino Especialista', '654321-G/SP');
    
    expect(updateRes.success).toBe(true);
    const current = authService.getCurrentPersonal();
    expect(current?.nome).toBe('Prof. Carlos Balbino Especialista');
    expect(current?.cref).toBe('654321-G/SP');
  });

  it('should clear session on signOut', async () => {
    await authService.signIn('balbino@personaltrainer.com', 'senha123');
    expect(authService.isAuthenticated()).toBe(true);

    await authService.signOut();
    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.getCurrentSession()).toBeNull();
  });

  it('should trigger authStateChange listeners', async () => {
    let triggeredSession: any = undefined;
    const unsub = authService.onAuthStateChanged((s) => {
      triggeredSession = s;
    });

    await authService.signIn('balbino@personaltrainer.com', 'senha123');
    expect(triggeredSession).toBeDefined();
    expect(triggeredSession?.personal?.email).toBe('balbino@personaltrainer.com');

    await authService.signOut();
    expect(triggeredSession).toBeNull();

    unsub();
  });
});
