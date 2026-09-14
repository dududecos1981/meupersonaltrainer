/**
 * SERVIÇO DE AUTENTICAÇÃO — SUPABASE AUTH & GESTÃO DO PERSONAL TRAINER
 * Prompt 5: Autenticação, Registro, Sessão e Persistência na tabela 'personais'
 */

import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { Personal } from '../types/database';

// Chaves e URLs padrão (podem ser configuradas pelo usuário na interface ou via localStorage)
const STORAGE_SUPABASE_URL = 'balbino_supabase_url';
const STORAGE_SUPABASE_KEY = 'balbino_supabase_anon_key';
const STORAGE_LOCAL_SESSION = 'balbino_local_auth_session';
const STORAGE_LOCAL_USERS = 'balbino_local_registered_users';

// Configuração padrão pública (placeholder ou configurável no modal)
const DEFAULT_SUPABASE_URL = 'https://xyzcompany.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDAwfQ.placeholder';

export interface AuthUserSession {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      nome?: string;
      cref?: string;
    };
  };
  personal: Personal;
  token?: string;
}

export interface AuthResult {
  success: boolean;
  message?: string;
  data?: AuthUserSession | null;
  error?: string;
}

class AuthService {
  private client: SupabaseClient | null = null;
  private currentSession: AuthUserSession | null = null;
  private listeners: ((session: AuthUserSession | null) => void)[] = [];
  private recoveryListeners: ((email: string) => void)[] = [];
  private isConfiguredRealSupabase: boolean = false;
  private lastResetRequestTimestamp: number = 0;

  constructor() {
    this.initSupabaseClient();
    this.restoreSession();
  }

  public initSupabaseClient(): void {
    const envUrl = typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_URL : '';
    const envKey = typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY : '';

    const customUrl = localStorage.getItem(STORAGE_SUPABASE_URL) || envUrl;
    const customKey = localStorage.getItem(STORAGE_SUPABASE_KEY) || envKey;

    const supabaseUrl = customUrl || DEFAULT_SUPABASE_URL;
    const supabaseKey = customKey || DEFAULT_SUPABASE_KEY;

    this.isConfiguredRealSupabase = Boolean(
      customUrl && customKey && !customUrl.includes('xyzcompany') && !customKey.includes('placeholder')
    );

    try {
      this.client = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });

      // Escuta mudanças de estado nativas do Supabase
      if (this.isConfiguredRealSupabase && this.client) {
        this.client.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            await this.handleSupabaseUserLogin(session.user, session);
          } else if (event === 'SIGNED_OUT') {
            this.clearLocalSession();
          } else if (event === 'PASSWORD_RECOVERY') {
            const email = session?.user?.email || '';
            this.notifyRecoveryListeners(email);
          }
        });
      }
    } catch (e) {
      console.warn('Supabase client initialized in fallback mode:', e);
    }
  }

  /**
   * Retorna a configuração atual do Supabase
   */
  public getSupabaseConfig(): { url: string; key: string; isCustom: boolean } {
    const url = localStorage.getItem(STORAGE_SUPABASE_URL) || '';
    const key = localStorage.getItem(STORAGE_SUPABASE_KEY) || '';
    return {
      url,
      key,
      isCustom: this.isConfiguredRealSupabase
    };
  }

  /**
   * Atualiza as credenciais do Supabase no LocalStorage
   */
  public saveSupabaseConfig(url: string, key: string): void {
    if (url.trim() && key.trim()) {
      localStorage.setItem(STORAGE_SUPABASE_URL, url.trim());
      localStorage.setItem(STORAGE_SUPABASE_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_SUPABASE_URL);
      localStorage.removeItem(STORAGE_SUPABASE_KEY);
    }
    this.initSupabaseClient();
  }

  /**
   * Tenta restaurar a sessão ativa do LocalStorage
   */
  private restoreSession(): void {
    try {
      const saved = localStorage.getItem(STORAGE_LOCAL_SESSION);
      if (saved) {
        this.currentSession = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Erro ao restaurar sessão local:', e);
      this.currentSession = null;
    }
  }

  /**
   * Retorna a sessão ativa atual
   */
  public getCurrentSession(): AuthUserSession | null {
    return this.currentSession;
  }

  /**
   * Verifica se há um usuário autenticado
   */
  public isAuthenticated(): boolean {
    return this.currentSession !== null && Boolean(this.currentSession.personal?.id);
  }

  /**
   * Retorna os dados do Personal logado
   */
  public getCurrentPersonal(): Personal | null {
    return this.currentSession?.personal || null;
  }

  /**
   * Inscreve um ouvinte para alterações de autenticação
   */
  public onAuthStateChanged(callback: (session: AuthUserSession | null) => void): () => void {
    this.listeners.push(callback);
    // Dispara imediatamente com o estado atual
    callback(this.currentSession);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(cb => cb(this.currentSession));
  }

  /**
   * Inscreve um ouvinte para evento de recuperação de senha (link de reset clicado)
   */
  public onPasswordRecovery(callback: (email: string) => void): () => void {
    this.recoveryListeners.push(callback);
    return () => {
      this.recoveryListeners = this.recoveryListeners.filter(l => l !== callback);
    };
  }

  private notifyRecoveryListeners(email: string): void {
    this.recoveryListeners.forEach(cb => cb(email));
  }

  /**
   * CADASTRO DE NOVO PERSONAL TRAINER (SignUp)
   * 1. Cria usuário no Supabase Auth com user_metadata (nome, cref).
   * 2. Insere/sincroniza registro na tabela pública 'personais'.
   */
  public async signUp(params: {
    nome: string;
    email: string;
    cref: string;
    senha: string;
  }): Promise<AuthResult> {
    const { nome, email, cref, senha } = params;

    // Validações de segurança e UX
    if (!nome || !nome.trim()) {
      return { success: false, error: 'Por favor, informe seu Nome Completo.' };
    }
    if (!email || !email.includes('@') || !email.includes('.')) {
      return { success: false, error: 'Por favor, informe um endereço de e-mail válido.' };
    }
    if (!cref || !cref.trim()) {
      return { success: false, error: 'Por favor, informe seu registro profissional CREF.' };
    }
    if (!senha || senha.length < 6) {
      return { success: false, error: 'A senha deve conter no mínimo 6 caracteres.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanNome = nome.trim();
    const cleanCref = cref.trim().toUpperCase();

    // 1. Se estiver conectado a um projeto real Supabase
    if (this.isConfiguredRealSupabase && this.client) {
      try {
        const { data, error } = await this.client.auth.signUp({
          email: cleanEmail,
          password: senha,
          options: {
            data: {
              nome: cleanNome,
              cref: cleanCref
            }
          }
        });

        if (error) {
          return { success: false, error: this.formatErrorMessage(error.message) };
        }

        if (data.user) {
          const personalData: Personal = {
            id: data.user.id,
            nome: cleanNome,
            email: cleanEmail,
            cref: cleanCref,
            created_at: new Date().toISOString()
          };

          // Tenta persistir diretamente na tabela 'personais' (caso o trigger do banco não tenha sido criado)
          try {
            await this.client.from('personais').upsert({
              id: data.user.id,
              nome: cleanNome,
              email: cleanEmail,
              cref: cleanCref
            });
          } catch (insertErr) {
            console.warn('Nota: trigger ou RLS do Supabase gerenciando tabela personais.', insertErr);
          }

          const userSession: AuthUserSession = {
            user: {
              id: data.user.id,
              email: cleanEmail,
              user_metadata: { nome: cleanNome, cref: cleanCref }
            },
            personal: personalData,
            token: data.session?.access_token
          };

          this.saveLocalSession(userSession);
          return {
            success: true,
            message: 'Conta criada com sucesso! Redirecionando para o painel...',
            data: userSession
          };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Falha ao conectar com o Supabase Auth.' };
      }
    }

    // 2. Modo Local / Demonstração Inteligente (Garante funcionamento imediato e testes)
    const localUsers = this.getLocalUsers();
    if (localUsers.some(u => u.email === cleanEmail)) {
      return { success: false, error: 'Este e-mail já está cadastrado no sistema. Faça login.' };
    }

    const newUserId = this.generateUUID();
    const personalData: Personal = {
      id: newUserId,
      nome: cleanNome,
      email: cleanEmail,
      cref: cleanCref,
      created_at: new Date().toISOString()
    };

    localUsers.push({
      id: newUserId,
      nome: cleanNome,
      email: cleanEmail,
      cref: cleanCref,
      password: senha,
      created_at: personalData.created_at
    });
    this.saveLocalUsers(localUsers);

    const userSession: AuthUserSession = {
      user: {
        id: newUserId,
        email: cleanEmail,
        user_metadata: { nome: cleanNome, cref: cleanCref }
      },
      personal: personalData
    };

    this.saveLocalSession(userSession);

    return {
      success: true,
      message: 'Conta criada com sucesso! Bem-vindo ao Sistema Balbino Pro.',
      data: userSession
    };
  }

  /**
   * LOGIN DO PERSONAL TRAINER (SignIn)
   * Autentica com email e senha e recupera o perfil da tabela 'personais'
   */
  public async signIn(email: string, senha: string): Promise<AuthResult> {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Por favor, informe seu e-mail de acesso.' };
    }
    if (!senha) {
      return { success: false, error: 'Por favor, digite sua senha.' };
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Se estiver conectado ao Supabase real
    if (this.isConfiguredRealSupabase && this.client) {
      try {
        const { data, error } = await this.client.auth.signInWithPassword({
          email: cleanEmail,
          password: senha
        });

        if (error) {
          return { success: false, error: this.formatErrorMessage(error.message) };
        }

        if (data.user) {
          // Busca dados da tabela 'personais'
          let personalData: Personal = {
            id: data.user.id,
            nome: data.user.user_metadata?.nome || cleanEmail.split('@')[0],
            email: cleanEmail,
            cref: data.user.user_metadata?.cref || 'CREF Não Informado'
          };

          try {
            const { data: dbPersonal } = await this.client
              .from('personais')
              .select('*')
              .eq('id', data.user.id)
              .single();

            if (dbPersonal) {
              personalData = dbPersonal;
            }
          } catch (queryErr) {
            console.warn('Erro ao consultar tabela personais:', queryErr);
          }

          const userSession: AuthUserSession = {
            user: {
              id: data.user.id,
              email: cleanEmail,
              user_metadata: data.user.user_metadata
            },
            personal: personalData,
            token: data.session?.access_token
          };

          this.saveLocalSession(userSession);
          return {
            success: true,
            message: 'Login realizado com sucesso! Redirecionando...',
            data: userSession
          };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Erro ao conectar ao serviço de autenticação.' };
      }
    }

    // 2. Modo Local / Simulação de Demonstração
    const localUsers = this.getLocalUsers();
    
    // Usuário padrão do seed se a lista estiver vazia
    if (localUsers.length === 0) {
      localUsers.push({
        id: '11111111-1111-1111-1111-111111111111',
        nome: 'Eduardo Cunha Balbino',
        email: 'balbino@personaltrainer.com',
        cref: '123456-G/SP',
        password: 'senha123',
        created_at: new Date().toISOString()
      });
      this.saveLocalUsers(localUsers);
    }

    const matchedUser = localUsers.find(
      u => u.email.toLowerCase() === cleanEmail && u.password === senha
    );

    if (!matchedUser) {
      return {
        success: false,
        error: 'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.'
      };
    }

    const personalData: Personal = {
      id: matchedUser.id,
      nome: matchedUser.nome,
      email: matchedUser.email,
      cref: matchedUser.cref,
      created_at: matchedUser.created_at
    };

    const userSession: AuthUserSession = {
      user: {
        id: matchedUser.id,
        email: matchedUser.email,
        user_metadata: { nome: matchedUser.nome, cref: matchedUser.cref }
      },
      personal: personalData
    };

    this.saveLocalSession(userSession);
    return {
      success: true,
      message: 'Login realizado com sucesso! Bem-vindo de volta.',
      data: userSession
    };
  }

  /**
   * RECUPERAÇÃO DE SENHA (ForgotPassword - Envio de link seguro por e-mail com Anti-Spam e Rate Limiting)
   */
  public async resetPasswordForEmail(email: string): Promise<AuthResult> {
    if (!email || !email.includes('@') || !email.includes('.')) {
      return { success: false, error: 'Por favor, informe um endereço de e-mail válido.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const now = Date.now();

    // Rate limiting: proteção contra spam de solicitações (mínimo de 30 segundos entre pedidos)
    if (this.lastResetRequestTimestamp && now - this.lastResetRequestTimestamp < 30000) {
      const waitSec = Math.ceil((30000 - (now - this.lastResetRequestTimestamp)) / 1000);
      return {
        success: false,
        error: `Por favor, aguarde ${waitSec} segundos antes de solicitar um novo link de recuperação.`
      };
    }

    this.lastResetRequestTimestamp = now;

    // 1. Provedor Supabase Real
    if (this.isConfiguredRealSupabase && this.client) {
      try {
        const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : undefined;
        const { error } = await this.client.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo
        });

        if (error) {
          return { success: false, error: this.formatErrorMessage(error.message) };
        }

        return {
          success: true,
          message: 'Se o e-mail informado estiver cadastrado em nossa base segura, enviamos um link com as instruções para redefinição da sua senha.',
          data: { user: { id: '', email: cleanEmail }, personal: {} as any }
        };
      } catch (err: any) {
        return { success: false, error: err.message || 'Erro ao processar solicitação de recuperação de senha.' };
      }
    }

    // 2. Modo Local / Fallback Seguro
    const localUsers = this.getLocalUsers();
    if (localUsers.length === 0) {
      localUsers.push({
        id: '11111111-1111-1111-1111-111111111111',
        nome: 'Eduardo Cunha Balbino',
        email: 'balbino@personaltrainer.com',
        cref: '123456-G/SP',
        password: 'senha123',
        created_at: new Date().toISOString()
      });
      this.saveLocalUsers(localUsers);
    }

    return {
      success: true,
      message: 'Se o e-mail informado estiver cadastrado em nossa base segura, enviamos um link com as instruções para redefinição da sua senha.',
      data: { user: { id: '', email: cleanEmail }, personal: {} as any }
    };
  }

  /**
   * REDEFINIÇÃO DE SENHA (UpdatePassword - Gravação segura da nova senha)
   */
  public async updatePassword(newPassword: string, emailForLocalFallback?: string): Promise<AuthResult> {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'A nova senha deve conter no mínimo 6 caracteres.' };
    }

    // 1. Provedor Supabase Real
    if (this.isConfiguredRealSupabase && this.client) {
      try {
        const { data, error } = await this.client.auth.updateUser({
          password: newPassword
        });

        if (error) {
          return { success: false, error: this.formatErrorMessage(error.message) };
        }

        if (data.user) {
          return {
            success: true,
            message: 'Senha redefinida com sucesso! Você já pode acessar o sistema.'
          };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Erro ao redefinir a senha no Supabase.' };
      }
    }

    // 2. Modo Local / Fallback
    const localUsers = this.getLocalUsers();
    const targetEmail = (emailForLocalFallback || 'balbino@personaltrainer.com').toLowerCase();
    const userIndex = localUsers.findIndex(u => u.email.toLowerCase() === targetEmail);

    if (userIndex >= 0) {
      localUsers[userIndex].password = newPassword;
      this.saveLocalUsers(localUsers);
    } else {
      if (targetEmail === 'balbino@personaltrainer.com' || localUsers.length === 0) {
        localUsers.push({
          id: '11111111-1111-1111-1111-111111111111',
          nome: 'Eduardo Cunha Balbino',
          email: 'balbino@personaltrainer.com',
          cref: '123456-G/SP',
          password: newPassword,
          created_at: new Date().toISOString()
        });
        this.saveLocalUsers(localUsers);
      }
    }

    return {
      success: true,
      message: 'Nova senha salva com sucesso! Faça login com suas novas credenciais.'
    };
  }

  /**
   * LOGOUT DO PERSONAL TRAINER (SignOut)
   */
  public async signOut(): Promise<void> {
    if (this.isConfiguredRealSupabase && this.client) {
      try {
        await this.client.auth.signOut();
      } catch (e) {
        console.warn('Erro no signOut do Supabase:', e);
      }
    }
    this.clearLocalSession();
  }

  /**
   * Atualiza dados de perfil do Personal Trainer logado
   */
  public async updateProfile(nome: string, cref: string): Promise<AuthResult> {
    if (!this.currentSession) {
      return { success: false, error: 'Nenhum usuário conectado.' };
    }

    this.currentSession.personal.nome = nome.trim();
    this.currentSession.personal.cref = cref.trim().toUpperCase();
    if (this.currentSession.user.user_metadata) {
      this.currentSession.user.user_metadata.nome = nome.trim();
      this.currentSession.user.user_metadata.cref = cref.trim().toUpperCase();
    }

    if (this.isConfiguredRealSupabase && this.client) {
      try {
        await this.client.auth.updateUser({
          data: { nome: nome.trim(), cref: cref.trim().toUpperCase() }
        });
        await this.client
          .from('personais')
          .update({ nome: nome.trim(), cref: cref.trim().toUpperCase() })
          .eq('id', this.currentSession.personal.id);
      } catch (e) {
        console.warn('Erro ao atualizar perfil no Supabase:', e);
      }
    }

    this.saveLocalSession(this.currentSession);
    return { success: true, message: 'Perfil atualizado com sucesso!' };
  }

  private async handleSupabaseUserLogin(user: User, session: Session): Promise<void> {
    let personalData: Personal = {
      id: user.id,
      nome: user.user_metadata?.nome || user.email?.split('@')[0] || 'Personal Trainer',
      email: user.email || '',
      cref: user.user_metadata?.cref || 'CREF Não Informado'
    };

    if (this.client) {
      try {
        const { data } = await this.client.from('personais').select('*').eq('id', user.id).single();
        if (data) personalData = data;
      } catch (e) {
        console.warn('Erro ao carregar dados personais:', e);
      }
    }

    const authSession: AuthUserSession = {
      user: {
        id: user.id,
        email: user.email || '',
        user_metadata: user.user_metadata
      },
      personal: personalData,
      token: session.access_token
    };

    this.saveLocalSession(authSession);
  }

  private saveLocalSession(session: AuthUserSession): void {
    this.currentSession = session;
    localStorage.setItem(STORAGE_LOCAL_SESSION, JSON.stringify(session));
    this.notifyListeners();
  }

  private clearLocalSession(): void {
    this.currentSession = null;
    localStorage.removeItem(STORAGE_LOCAL_SESSION);
    this.notifyListeners();
  }

  private getLocalUsers(): any[] {
    try {
      const data = localStorage.getItem(STORAGE_LOCAL_USERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveLocalUsers(users: any[]): void {
    localStorage.setItem(STORAGE_LOCAL_USERS, JSON.stringify(users));
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private formatErrorMessage(msg: string): string {
    if (msg.includes('Invalid login credentials')) {
      return 'E-mail ou senha inválidos. Verifique os dados digitados.';
    }
    if (msg.includes('User already registered')) {
      return 'Este e-mail já está cadastrado no sistema. Faça login com suas credenciais.';
    }
    if (msg.includes('Password should be at least')) {
      return 'A senha deve ter no mínimo 6 caracteres.';
    }
    if (msg.includes('rate limit')) {
      return 'Muitas tentativas em sequência. Aguarde alguns instantes.';
    }
    return msg;
  }
}

export const authService = new AuthService();
