import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
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

describe("properties router", () => {
  describe("properties.list", () => {
    it("should return a list of properties for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.properties.list({});
      
      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter properties by type", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.properties.list({ type: "apartamento" });
      
      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter properties by purpose", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.properties.list({ purpose: "venda" });
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("properties.create", () => {
    it("should require authentication", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.properties.create({
          title: "Test Property",
          type: "apartamento",
          purpose: "venda",
        })
      ).rejects.toThrow();
    });
  });
});

describe("leads router", () => {
  describe("leads.list", () => {
    it("should return a list of leads for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.leads.list({});
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("leads.create", () => {
    it("should require authentication", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.leads.create({
          name: "Test Lead",
          source: "site",
        })
      ).rejects.toThrow();
    });
  });
});

describe("appointments router", () => {
  describe("appointments.list", () => {
    it("should return a list of appointments for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.appointments.list({});
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("appointments.create", () => {
    it("should require authentication", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.appointments.create({
          title: "Test Appointment",
          scheduledAt: new Date(),
          duration: 60,
        })
      ).rejects.toThrow();
    });
  });
});

describe("company router", () => {
  describe("company.get", () => {
    it("should return company data for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.company.get();
      
      // Should return company or null
      expect(result === null || typeof result === "object").toBe(true);
    });
  });
});

describe("siteSettings router", () => {
  describe("siteSettings.get", () => {
    it("should return site settings for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.siteSettings.get();
      
      // Should return settings or null
      expect(result === null || typeof result === "object").toBe(true);
    });
  });
});

describe("public properties router", () => {
  describe("properties.listPublic", () => {
    it("should return a list of public properties without authentication", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.properties.listPublic({});
      
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

describe("public leads router", () => {
  describe("leads.createPublic", () => {
    it("should allow creating a lead without authentication", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);

      // This route should be accessible without authentication
      const result = await caller.leads.createPublic({
        name: "Test Lead",
        email: "test@example.com",
        companyId: 1,
      });
      
      expect(result).toBeDefined();
      expect(result.name).toBe("Test Lead");
      expect(result.email).toBe("test@example.com");
    });
  });
});
