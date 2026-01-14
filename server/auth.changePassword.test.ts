import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import * as bcrypt from "bcryptjs";

describe("auth.changePassword", () => {
  let testUserId: number;
  let testCompanyId: number;
  const testPassword = "TestPassword123!";
  const newPassword = "NewPassword456!";

  beforeAll(async () => {
    // Criar empresa de teste
    const company = await db.createCompany({
      name: "Test Company Password",
      slug: `test-company-password-${Date.now()}`,
      personType: "juridica",
    });
    testCompanyId = company.id;

    // Criar usuário de teste com senha
    const passwordHash = await bcrypt.hash(testPassword, 12);
    const user = await db.createUser({
      openId: `test-password-${Date.now()}`,
      name: "Test User Password",
      email: `test-password-${Date.now()}@example.com`,
      companyId: testCompanyId,
      passwordHash,
      emailVerified: true,
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    // Nota: cleanup manual não é necessário para testes isolados
  });

  it("should change password with valid current password", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        openId: `test-password-${Date.now()}`,
        name: "Test User Password",
        email: `test-password-${Date.now()}@example.com`,
        companyId: testCompanyId,
        role: "user",
      },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.auth.changePassword({
      currentPassword: testPassword,
      newPassword: newPassword,
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe("Senha alterada com sucesso");

    // Verificar se a senha foi realmente alterada
    const user = await db.getUserById(testUserId);
    expect(user).toBeDefined();
    if (user && user.passwordHash) {
      const isNewPasswordValid = await bcrypt.compare(newPassword, user.passwordHash);
      expect(isNewPasswordValid).toBe(true);
    }
  });

  it("should reject change with incorrect current password", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        openId: `test-password-${Date.now()}`,
        name: "Test User Password",
        email: `test-password-${Date.now()}@example.com`,
        companyId: testCompanyId,
        role: "user",
      },
      req: {} as any,
      res: {} as any,
    });

    await expect(
      caller.auth.changePassword({
        currentPassword: "WrongPassword123!",
        newPassword: "NewPassword789!",
      })
    ).rejects.toThrow("Senha atual incorreta");
  });

  it("should reject password without uppercase letter", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        openId: `test-password-${Date.now()}`,
        name: "Test User Password",
        email: `test-password-${Date.now()}@example.com`,
        companyId: testCompanyId,
        role: "user",
      },
      req: {} as any,
      res: {} as any,
    });

    await expect(
      caller.auth.changePassword({
        currentPassword: newPassword,
        newPassword: "newpassword123!",
      })
    ).rejects.toThrow();
  });

  it("should reject password without special character", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        openId: `test-password-${Date.now()}`,
        name: "Test User Password",
        email: `test-password-${Date.now()}@example.com`,
        companyId: testCompanyId,
        role: "user",
      },
      req: {} as any,
      res: {} as any,
    });

    await expect(
      caller.auth.changePassword({
        currentPassword: newPassword,
        newPassword: "NewPassword123",
      })
    ).rejects.toThrow();
  });

  it("should reject password shorter than 8 characters", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId,
        openId: `test-password-${Date.now()}`,
        name: "Test User Password",
        email: `test-password-${Date.now()}@example.com`,
        companyId: testCompanyId,
        role: "user",
      },
      req: {} as any,
      res: {} as any,
    });

    await expect(
      caller.auth.changePassword({
        currentPassword: newPassword,
        newPassword: "Pass1!",
      })
    ).rejects.toThrow();
  });
});
