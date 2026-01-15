import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from './routers';
import * as db from './db';

describe('siteSettings.verifyDomain', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let companyId: number;
  let userId: number;

  beforeAll(async () => {
    // Criar empresa de teste
    const company = await db.createCompany({
      name: 'Imobiliária Teste Domain',
      slug: `test-domain-company-${Date.now()}`,
      email: `domain-${Date.now()}@test.com`,
      phone: '11999999999',
    });
    companyId = company.id;

    // Criar usuário de teste
    const user = await db.createUser({
      openId: `test-domain-user-${Date.now()}`,
      name: 'Test Domain User',
      email: `domain-${Date.now()}@test.com`,
      companyId,
      role: 'admin',
    });
    userId = user.id;

    // Criar caller autenticado
    caller = appRouter.createCaller({
      user: {
        id: userId,
        openId: `test-domain-user-${Date.now()}`,
        name: 'Test Domain User',
        email: `domain-${Date.now()}@test.com`,
        companyId,
        role: 'admin',
      },
      req: {} as any,
      res: {} as any,
    });
  });

  afterAll(async () => {
    // Limpar dados de teste
    // Nota: cleanup manual não é necessário para testes isolados
  });

  it('deve retornar status pending para domínio não configurado', async () => {
    const result = await caller.siteSettings.verifyDomain({
      domain: 'dominio-inexistente-teste-12345.com.br',
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe('pending');
    expect(result.message).toContain('não está apontando corretamente');
  });

  it('deve retornar success true para domínio válido', async () => {
    // Usar um domínio real que sabemos que funciona
    const result = await caller.siteSettings.verifyDomain({
      domain: 'google.com',
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('active');
    expect(result.message).toContain('apontando corretamente');
  });
});
