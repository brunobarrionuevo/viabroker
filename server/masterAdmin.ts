import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const MASTER_JWT_SECRET = process.env.JWT_SECRET || "master-secret-key-change-in-production";

// Middleware para verificar autenticação master
const masterAuthMiddleware = async (token: string) => {
  try {
    const decoded = jwt.verify(token, MASTER_JWT_SECRET) as { adminId: number; type: string };
    if (decoded.type !== "master_admin") {
      throw new Error("Invalid token type");
    }
    const admin = await db.getMasterAdminById(decoded.adminId);
    if (!admin || !admin.isActive) {
      throw new Error("Admin not found or inactive");
    }
    return admin;
  } catch (error) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Token inválido ou expirado" });
  }
};

export const masterAdminRouter = router({
  // Login do administrador master
  login: publicProcedure
    .input(z.object({
      username: z.string().min(1),
      password: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const admin = await db.getMasterAdminByUsername(input.username);
      
      if (!admin) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
      }
      
      const isValidPassword = await bcrypt.compare(input.password, admin.passwordHash);
      
      if (!isValidPassword) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
      }
      
      if (!admin.isActive) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Conta desativada" });
      }
      
      // Atualizar último login
      await db.updateMasterAdminLastLogin(admin.id);
      
      // Gerar token JWT
      const token = jwt.sign(
        { adminId: admin.id, type: "master_admin" },
        MASTER_JWT_SECRET,
        { expiresIn: "24h" }
      );
      
      // Log de atividade
      await db.createActivityLog({
        actorType: "master_admin",
        actorId: admin.id,
        action: "login",
        details: { username: admin.username },
      });
      
      return {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
          email: admin.email,
        },
      };
    }),

  // Verificar token
  verify: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const admin = await masterAuthMiddleware(input.token);
      return {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
      };
    }),

  // Dashboard stats
  getStats: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      await masterAuthMiddleware(input.token);
      return db.getMasterStats();
    }),

  // Listar todas as empresas/clientes
  listCompanies: publicProcedure
    .input(z.object({
      token: z.string(),
      isActive: z.boolean().optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      await masterAuthMiddleware(input.token);
      const companies = await db.getAllCompanies({
        isActive: input.isActive,
        search: input.search,
        limit: input.limit,
        offset: input.offset,
      });
      
      // Buscar assinaturas para cada empresa
      const companiesWithSubscriptions = await Promise.all(
        companies.map(async (company) => {
          const subscription = await db.getSubscriptionByCompanyId(company.id);
          return { ...company, subscription };
        })
      );
      
      return companiesWithSubscriptions;
    }),

  // Ativar/desativar empresa
  toggleCompanyStatus: publicProcedure
    .input(z.object({
      token: z.string(),
      companyId: z.number(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const admin = await masterAuthMiddleware(input.token);
      await db.toggleCompanyStatus(input.companyId, input.isActive);
      
      // Log de atividade
      await db.createActivityLog({
        actorType: "master_admin",
        actorId: admin.id,
        action: input.isActive ? "activate_company" : "deactivate_company",
        entityType: "company",
        entityId: input.companyId,
      });
      
      return { success: true };
    }),

  // Listar planos
  listPlans: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      await masterAuthMiddleware(input.token);
      return db.getAllPlans();
    }),

  // Criar plano
  createPlan: publicProcedure
    .input(z.object({
      token: z.string(),
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional(),
      price: z.string(),
      maxProperties: z.number().min(1),
      maxUsers: z.number().min(1),
      maxPhotosPerProperty: z.number().min(1).default(20),
      hasAI: z.boolean().default(false),
      aiCreditsPerDay: z.number().default(0),
      hasWhatsappIntegration: z.boolean().default(false),
      hasPortalIntegration: z.boolean().default(false),
      hasCustomDomain: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const admin = await masterAuthMiddleware(input.token);
      const { token, ...planData } = input;
      const plan = await db.createPlan(planData);
      
      // Log de atividade
      await db.createActivityLog({
        actorType: "master_admin",
        actorId: admin.id,
        action: "create_plan",
        entityType: "plan",
        entityId: plan.id,
        details: { name: plan.name },
      });
      
      return plan;
    }),

  // Atualizar plano
  updatePlan: publicProcedure
    .input(z.object({
      token: z.string(),
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      price: z.string().optional(),
      maxProperties: z.number().min(1).optional(),
      maxUsers: z.number().min(1).optional(),
      maxPhotosPerProperty: z.number().min(1).optional(),
      hasAI: z.boolean().optional(),
      aiCreditsPerDay: z.number().optional(),
      hasWhatsappIntegration: z.boolean().optional(),
      hasPortalIntegration: z.boolean().optional(),
      hasCustomDomain: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const admin = await masterAuthMiddleware(input.token);
      const { token, id, ...updateData } = input;
      await db.updatePlan(id, updateData);
      
      // Log de atividade
      await db.createActivityLog({
        actorType: "master_admin",
        actorId: admin.id,
        action: "update_plan",
        entityType: "plan",
        entityId: id,
      });
      
      return { success: true };
    }),

  // Listar assinaturas
  listSubscriptions: publicProcedure
    .input(z.object({
      token: z.string(),
      status: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      await masterAuthMiddleware(input.token);
      return db.getSubscriptions({
        status: input.status,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  // Listar pagamentos
  listPayments: publicProcedure
    .input(z.object({
      token: z.string(),
      companyId: z.number().optional(),
      status: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      await masterAuthMiddleware(input.token);
      return db.getPayments({
        companyId: input.companyId,
        status: input.status,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  // Listar logs de atividade
  listActivityLogs: publicProcedure
    .input(z.object({
      token: z.string(),
      actorType: z.string().optional(),
      entityType: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      await masterAuthMiddleware(input.token);
      return db.getActivityLogs({
        actorType: input.actorType,
        entityType: input.entityType,
        limit: input.limit,
        offset: input.offset,
      });
    }),

  // Criar administrador master inicial (só funciona se não existir nenhum)
  setupInitialAdmin: publicProcedure
    .input(z.object({
      username: z.string().min(3),
      password: z.string().min(8),
      name: z.string().min(2),
      email: z.string().email().optional(),
    }))
    .mutation(async ({ input }) => {
      // Verificar se já existe algum admin
      const existingAdmin = await db.getMasterAdminByUsername("admin");
      if (existingAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Já existe um administrador configurado" });
      }
      
      const passwordHash = await bcrypt.hash(input.password, 12);
      
      const admin = await db.createMasterAdmin({
        username: input.username,
        passwordHash,
        name: input.name,
        email: input.email,
      });
      
      return { success: true, message: "Administrador criado com sucesso" };
    }),
});
