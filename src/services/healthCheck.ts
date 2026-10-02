/**
 * SISTEMA PERSONAL TRAINER & NUTRIÇÃO — SERVIÇO DE MONITORAMENTO & HEALTH CHECK
 * Executa diagnósticos de integridade, status dos serviços e controle de taxa (Rate Limiting).
 */

export interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'offline';
  timestamp: string;
  version: string;
  environment: string;
  services: {
    supabase: {
      connected: boolean;
      urlConfigured: boolean;
    };
    aiAgent: {
      configured: boolean;
      model: string;
    };
    storage: {
      accessible: boolean;
    };
  };
}

class HealthCheckService {
  private lastRequestTimestamps: Map<string, number> = new Map();

  /**
   * Executa auditoria completa de saúde do sistema
   */
  public async getSystemHealth(): Promise<SystemHealthStatus> {
    const supabaseUrl =
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('balbino_supabase_url') : '') ||
      '';

    const geminiKey =
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('balbino_gemini_key') : '') ||
      '';

    const model =
      (typeof localStorage !== 'undefined' ? localStorage.getItem('balbino_gemini_model') : '') || 'gemini-1.5-pro';

    let storageAccessible = false;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('__health_check__', '1');
        localStorage.removeItem('__health_check__');
        storageAccessible = true;
      } catch {
        storageAccessible = false;
      }
    }

    const isSupabaseReady = Boolean(supabaseUrl && !supabaseUrl.includes('xyzcompany'));
    const isAiReady = Boolean(geminiKey);

    return {
      status: isSupabaseReady && storageAccessible ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0-production',
      environment: (typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE) || 'production',
      services: {
        supabase: {
          connected: isSupabaseReady,
          urlConfigured: Boolean(supabaseUrl)
        },
        aiAgent: {
          configured: isAiReady,
          model
        },
        storage: {
          accessible: storageAccessible
        }
      }
    };
  }

  /**
   * Limitador de taxa (Rate Limiter) simples para evitar chamadas abusivas
   * @param key Identificador da ação (ex: 'generate-workout', 'auth-attempt')
   * @param minIntervalMs Intervalo mínimo entre requisições em milissegundos
   */
  public checkRateLimit(key: string, minIntervalMs: number = 2000): { allowed: boolean; waitMs?: number } {
    const now = Date.now();
    const last = this.lastRequestTimestamps.get(key) || 0;
    const diff = now - last;

    if (diff < minIntervalMs) {
      return { allowed: false, waitMs: minIntervalMs - diff };
    }

    this.lastRequestTimestamps.set(key, now);
    return { allowed: true };
  }
}

export const healthCheckService = new HealthCheckService();
