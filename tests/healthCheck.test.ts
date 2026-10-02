import { describe, it, expect, beforeEach } from 'vitest';
import { healthCheckService } from '../src/services/healthCheck';

describe('HealthCheckService - Rate Limiting & Diagnostics', () => {
  beforeEach(() => {
    // reset timers
    (healthCheckService as any).lastRequestTimestamps.clear();
  });

  it('should allow the first request for a given key', () => {
    const check = healthCheckService.checkRateLimit('test-action', 1000);
    expect(check.allowed).toBe(true);
    expect(check.waitMs).toBeUndefined();
  });

  it('should block rapid successive requests within minIntervalMs', () => {
    const first = healthCheckService.checkRateLimit('test-key', 2000);
    expect(first.allowed).toBe(true);

    const second = healthCheckService.checkRateLimit('test-key', 2000);
    expect(second.allowed).toBe(false);
    expect(second.waitMs).toBeGreaterThan(0);
    expect(second.waitMs).toBeLessThanOrEqual(2000);
  });

  it('should handle different keys independently', () => {
    const checkKey1 = healthCheckService.checkRateLimit('key-one', 5000);
    const checkKey2 = healthCheckService.checkRateLimit('key-two', 5000);

    expect(checkKey1.allowed).toBe(true);
    expect(checkKey2.allowed).toBe(true);
  });

  it('should return system health status object with required structure', async () => {
    const health = await healthCheckService.getSystemHealth();
    expect(health).toBeDefined();
    expect(['healthy', 'degraded', 'offline']).toContain(health.status);
    expect(health.timestamp).toBeDefined();
    expect(health.version).toBe('1.0.0-production');
    expect(health.services).toBeDefined();
    expect(health.services.supabase).toBeDefined();
    expect(health.services.aiAgent).toBeDefined();
    expect(health.services.storage).toBeDefined();
  });
});
