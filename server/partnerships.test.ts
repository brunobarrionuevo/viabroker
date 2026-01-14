import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(companyId?: number): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    companyId: companyId,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("partnerships router", () => {
  describe("partnerships.list", () => {
    it("should return an array for authenticated user with company", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.partnerships.list();
      
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty array for user without company", async () => {
      const ctx = createAuthContext(undefined);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.partnerships.list();
      
      expect(result).toEqual([]);
    });

    it("should require authentication", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.partnerships.list()).rejects.toThrow();
    });
  });

  describe("partnerships.pending", () => {
    it("should return pending partnerships for authenticated user", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.partnerships.pending();
      
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty array for user without company", async () => {
      const ctx = createAuthContext(undefined);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.partnerships.pending();
      
      expect(result).toEqual([]);
    });
  });

  describe("partnerships.accepted", () => {
    it("should return accepted partnerships for authenticated user", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.partnerships.accepted();
      
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty array for user without company", async () => {
      const ctx = createAuthContext(undefined);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.partnerships.accepted();
      
      expect(result).toEqual([]);
    });
  });

  describe("partnerships.request", () => {
    it("should require authentication", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.partnerships.request({
          partnerCode: "BRK123ABC",
          shareAllProperties: false,
        })
      ).rejects.toThrow();
    });

    it("should throw error for user without company", async () => {
      const ctx = createAuthContext(undefined);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.partnerships.request({
          partnerCode: "BRK123ABC",
          shareAllProperties: false,
        })
      ).rejects.toThrow("Usuário não possui empresa");
    });

    it("should throw error for invalid partner code", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.partnerships.request({
          partnerCode: "INVALID_CODE_123",
          shareAllProperties: false,
        })
      ).rejects.toThrow("Código de parceiro não encontrado");
    });
  });

  describe("partnerships.accept", () => {
    it("should require authentication", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.partnerships.accept({ id: 1 })
      ).rejects.toThrow();
    });

    it("should throw error for user without company", async () => {
      const ctx = createAuthContext(undefined);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.partnerships.accept({ id: 1 })
      ).rejects.toThrow("Usuário não possui empresa");
    });
  });

  describe("partnerships.reject", () => {
    it("should require authentication", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.partnerships.reject({ id: 1 })
      ).rejects.toThrow();
    });

    it("should throw error for user without company", async () => {
      const ctx = createAuthContext(undefined);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.partnerships.reject({ id: 1 })
      ).rejects.toThrow("Usuário não possui empresa");
    });
  });

  describe("partnerships.cancel", () => {
    it("should require authentication", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.partnerships.cancel({ id: 1 })
      ).rejects.toThrow();
    });

    it("should throw error for user without company", async () => {
      const ctx = createAuthContext(undefined);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.partnerships.cancel({ id: 1 })
      ).rejects.toThrow("Usuário não possui empresa");
    });
  });
});

describe("propertyShares router", () => {
  describe("propertyShares.sentList", () => {
    it("should return sent shares for authenticated user", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.propertyShares.sentList();
      
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty array for user without company", async () => {
      const ctx = createAuthContext(undefined);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.propertyShares.sentList();
      
      expect(result).toEqual([]);
    });

    it("should require authentication", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.propertyShares.sentList()).rejects.toThrow();
    });
  });

  describe("propertyShares.receivedList", () => {
    it("should return received shares for authenticated user", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.propertyShares.receivedList();
      
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty array for user without company", async () => {
      const ctx = createAuthContext(undefined);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.propertyShares.receivedList();
      
      expect(result).toEqual([]);
    });
  });

  describe("propertyShares.pending", () => {
    it("should return pending shares for authenticated user", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.propertyShares.pending();
      
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty array for user without company", async () => {
      const ctx = createAuthContext(undefined);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.propertyShares.pending();
      
      expect(result).toEqual([]);
    });
  });

  describe("propertyShares.sharedProperties", () => {
    it("should return shared properties for authenticated user", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.propertyShares.sharedProperties();
      
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty array for user without company", async () => {
      const ctx = createAuthContext(undefined);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.propertyShares.sharedProperties();
      
      expect(result).toEqual([]);
    });
  });

  describe("propertyShares.share", () => {
    it("should require authentication", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.propertyShares.share({
          propertyId: 1,
          partnerCompanyId: 2,
        })
      ).rejects.toThrow();
    });

    it("should throw error for user without company", async () => {
      const ctx = createAuthContext(undefined);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.propertyShares.share({
          propertyId: 1,
          partnerCompanyId: 2,
        })
      ).rejects.toThrow("Usuário não possui empresa");
    });
  });

  describe("propertyShares.accept", () => {
    it("should require authentication", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.propertyShares.accept({ id: 1 })
      ).rejects.toThrow();
    });

    it("should throw error for user without company", async () => {
      const ctx = createAuthContext(undefined);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.propertyShares.accept({ id: 1 })
      ).rejects.toThrow("Usuário não possui empresa");
    });
  });

  describe("propertyShares.reject", () => {
    it("should require authentication", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.propertyShares.reject({ id: 1 })
      ).rejects.toThrow();
    });

    it("should throw error for user without company", async () => {
      const ctx = createAuthContext(undefined);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.propertyShares.reject({ id: 1 })
      ).rejects.toThrow("Usuário não possui empresa");
    });
  });

  describe("propertyShares.revoke", () => {
    it("should require authentication", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.propertyShares.revoke({ id: 1 })
      ).rejects.toThrow();
    });

    it("should throw error for user without company", async () => {
      const ctx = createAuthContext(undefined);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.propertyShares.revoke({ id: 1 })
      ).rejects.toThrow("Usuário não possui empresa");
    });
  });
});
