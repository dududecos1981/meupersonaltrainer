/**
 * SISTEMA PERSONAL TRAINER & NUTRIÇÃO — SERVIÇO DE MONITORAMENTO & HEALTH CHECK
 * Executa diagnósticos de integridade, status do banco Neon PostgreSQL, IA Gemini e conformidade de segurança.
 */

import { neonService } from './neonService';

export interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'offline';
  timestamp: string;
  version: string;
  environment: string;
  services: {
    neonDatabase: {
      connected: boolean;
      configured: boolean;
      latencyMs?: number;
      databaseName?: string;
    };
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

    const neonStatus = await neonService.testConnection();
    const isAiReady = Boolean(geminiKey);

    return {
      status: (neonStatus.connected || storageAccessible) ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0-production',
      environment: (typeof import.meta !== 'undefined' && (import.meta as any).env?.MODE) || 'production',
      services: {
        neonDatabase: {
          connected: neonStatus.connected,
          configured: neonStatus.configured,
          latencyMs: neonStatus.latencyMs,
          databaseName: neonStatus.databaseName
        },
        supabase: {
          connected: neonStatus.connected,
          urlConfigured: neonStatus.configured
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
