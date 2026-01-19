import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "./_core/trpc";
import * as db from "./db";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq, inArray } from "drizzle-orm";
import { companies, users, properties, propertyImages, leads, interactions, appointments, subscriptions, payments, siteSettings, activityLogs } from "../drizzle/schema";

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
      maxProperties: z.number().min(-1), // -1 = ilimitado
      maxUsers: z.number().min(-1), // -1 = ilimitado
      maxPhotosPerProperty: z.number().min(1).default(20),
      hasAI: z.boolean().default(false),
      aiCreditsPerDay: z.number().default(0),
      hasWhatsappIntegration: z.boolean().default(false),
      hasPortalIntegration: z.boolean().default(false),
      hasCustomDomain: z.boolean().default(false),
      isCourtesy: z.boolean().default(false),
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
      maxProperties: z.number().min(-1).optional(), // -1 = ilimitado
      maxUsers: z.number().min(-1).optional(), // -1 = ilimitado
      maxPhotosPerProperty: z.number().min(1).optional(),
      hasAI: z.boolean().optional(),
      aiCreditsPerDay: z.number().optional(),
      hasWhatsappIntegration: z.boolean().optional(),
      hasPortalIntegration: z.boolean().optional(),
      hasCustomDomain: z.boolean().optional(),
      isCourtesy: z.boolean().optional(),
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

  // Obter detalhes completos de um cliente
  getClientDetail: publicProcedure
    .input(z.object({
      token: z.string(),
      companyId: z.number(),
    }))
    .query(async ({ input }) => {
      await masterAuthMiddleware(input.token);
      
      // Buscar empresa
      const company = await db.getCompanyById(input.companyId);
      if (!company) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado" });
      }
      
      // Buscar usuários da empresa
      const users = await db.getUsersByCompanyId(input.companyId);
      
      // Buscar imóveis da empresa
      const properties = await db.getPropertiesByCompanyId(input.companyId);
      
      // Buscar leads da empresa
      const leads = await db.getLeadsByCompanyId(input.companyId);
      
      // Buscar assinatura
      const subscription = await db.getSubscriptionByCompanyId(input.companyId);
      
      return {
        company,
        users,
        properties,
        leads,
        subscription: subscription ? {
          ...subscription,
          planName: subscription.planId ? (await db.getPlanById(subscription.planId))?.name : null,
        } : null,
        stats: {
          totalProperties: properties.length,
          totalLeads: leads.length,
          totalUsers: users.length,
        },
      };
    }),

  // Alterar plano de um cliente
  changeClientPlan: publicProcedure
    .input(z.object({
      token: z.string(),
      companyId: z.number(),
      planId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const admin = await masterAuthMiddleware(input.token);
      
      // Verificar se a empresa existe
      const company = await db.getCompanyById(input.companyId);
      if (!company) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado" });
      }
      
      // Verificar se o plano existe
      const plan = await db.getPlanById(input.planId);
      if (!plan) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Plano não encontrado" });
      }
      
      // Buscar ou criar assinatura
      const subscription = await db.getSubscriptionByCompanyId(input.companyId);
      
      // Se é plano de cortesia, não define data de expiração
      const isCourtesy = (plan as any).isCourtesy;
      const periodEnd = isCourtesy 
        ? new Date('2037-12-31') // Data distante para planos de cortesia (limite do MySQL timestamp)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias para planos normais
      
      if (subscription) {
        // Atualizar assinatura existente
        await db.updateSubscription(subscription.id, {
          planId: input.planId,
          status: 'active',
          currentPeriodEnd: periodEnd,
        });
      } else {
        // Criar nova assinatura
        await db.createSubscription({
          companyId: input.companyId,
          planId: input.planId,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
        });
      }
      
        // Atualizar também o usuário principal para remover trial expirado
        const users = await db.getUsersByCompanyId(input.companyId);
        if (users.length > 0) {
          await db.updateUser(users[0].id, {
            trialEndDate: periodEnd,
          });
        }
      
      // Log de atividade
      await db.createActivityLog({
        actorType: "master_admin",
        actorId: admin.id,
        action: "change_plan",
        entityType: "company",
        entityId: input.companyId,
        details: { planId: input.planId, planName: plan.name, isCourtesy },
      });
      
      return { success: true };
    }),





  // Alterar plano de um usuário
  changeUserPlan: publicProcedure
    .input(z.object({
      token: z.string(),
      userId: z.number(),
      planId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const admin = await masterAuthMiddleware(input.token);
      
      // Buscar usuário
      const user = await db.getUserById(input.userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }
      
      // Se planId for fornecido, alterar o plano
      if (input.planId) {
        // Verificar se o plano existe
        const plan = await db.getPlanById(input.planId);
        if (!plan) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Plano não encontrado" });
        }
        
        // Buscar ou criar assinatura
        const subscription = user.companyId ? await db.getSubscriptionByCompanyId(user.companyId) : null;
        
        // Se é plano de cortesia, não define data de expiração
        const isCourtesy = (plan as any).isCourtesy;
        const periodEnd = isCourtesy 
          ? new Date('2037-12-31')
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
        if (subscription) {
          // Atualizar assinatura existente
          await db.updateSubscription(subscription.id, {
            planId: input.planId,
            status: 'active',
            currentPeriodEnd: periodEnd,
          });
        } else if (user.companyId) {
          await db.createSubscription({
            companyId: user.companyId,
            planId: input.planId,
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
          });
        }   
        await db.createActivityLog({
          actorType: "master_admin",
          actorId: admin.id,
          action: "change_plan",
          entityType: "user",
          entityId: input.userId,
          details: { planId: input.planId, planName: plan.name, isCourtesy },
        });
        
        return { success: true };
      } else {
        // Se planId não for fornecido, remover o plano (deixar desativado)
        const subscription = user.companyId ? await db.getSubscriptionByCompanyId(user.companyId) : null;
        if (subscription) {
          await db.updateSubscription(subscription.id, {
            status: 'canceled',
          });
        }
        
        // Log de atividade
        await db.createActivityLog({
          actorType: "master_admin",
          actorId: admin.id,
          action: "disable_plan",
          entityType: "user",
          entityId: input.userId,
          details: { email: user.email },
        });
        
        return { success: true };
      }
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

  // Alterar senha do admin master
  changePassword: publicProcedure
    .input(z.object({
      token: z.string(),
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ input }) => {
      const admin = await masterAuthMiddleware(input.token);
      
      // Verificar senha atual
      const isValidPassword = await bcrypt.compare(input.currentPassword, admin.passwordHash);
      if (!isValidPassword) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha atual incorreta" });
      }
      
      // Hash da nova senha
      const newPasswordHash = await bcrypt.hash(input.newPassword, 12);
      
      // Atualizar senha no banco
      await db.updateMasterAdmin(admin.id, { passwordHash: newPasswordHash });
      
      // Log de atividade
      await db.createActivityLog({
        actorType: "master_admin",
        actorId: admin.id,
        action: "change_password",
        details: { username: admin.username },
      });
      
      return { success: true, message: "Senha alterada com sucesso" };
    }),

  // Deletar empresa
  deleteCompany: publicProcedure
    .input(z.object({
      token: z.string(),
      companyId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const admin = await masterAuthMiddleware(input.token);
      
      // Buscar empresa
      const company = await db.getCompanyById(input.companyId);
      if (!company) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada" });
      }
      
      // Obter database connection
      const database = await db.getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao conectar ao banco de dados" });
      }
      
      // Excluir em cascata (inline para evitar problemas de cache)
      try {
        console.log(`[deleteCompany] Iniciando exclusão da empresa ${input.companyId}`);
        
        // 1. Buscar IDs dos imóveis da empresa
        const companyProperties = await database.select({ id: properties.id })
          .from(properties)
          .where(eq(properties.companyId, input.companyId));
        const propertyIds = companyProperties.map((p: { id: number }) => p.id);
        console.log(`[deleteCompany] Encontrados ${propertyIds.length} imóveis`);
        
        // 2. Excluir property_images
        if (propertyIds.length > 0) {
          const deletedImages = await database.delete(propertyImages)
            .where(inArray(propertyImages.propertyId, propertyIds));
          console.log(`[deleteCompany] Fotos de imóveis excluídas`);
        }
        
        // 3. Buscar IDs dos leads da empresa para excluir interactions
        const companyLeads = await database.select({ id: leads.id })
          .from(leads)
          .where(eq(leads.companyId, input.companyId));
        const leadIds = companyLeads.map((l: { id: number }) => l.id);
        console.log(`[deleteCompany] Encontrados ${leadIds.length} leads`);
        
        // 4. Excluir interactions (dependem de leads)
        if (leadIds.length > 0) {
          const deletedInteractions = await database.delete(interactions)
            .where(inArray(interactions.leadId, leadIds));
          console.log(`[deleteCompany] Interações excluídas`);
        }
        
        // 5. Excluir appointments
        const deletedAppointments = await database.delete(appointments)
          .where(eq(appointments.companyId, input.companyId));
        console.log(`[deleteCompany] Agendamentos excluídos`);
        
        // 6. Excluir leads
        const deletedLeads = await database.delete(leads)
          .where(eq(leads.companyId, input.companyId));
        console.log(`[deleteCompany] Leads excluídos`);
        
        // 7. Excluir properties
        const deletedProperties = await database.delete(properties)
          .where(eq(properties.companyId, input.companyId));
        console.log(`[deleteCompany] Imóveis excluídos`);
        
        // 8. Excluir users
        console.log(`[deleteCompany] Tentando excluir usuários da empresa ${input.companyId}`);
        const deletedUsers = await database.delete(users)
          .where(eq(users.companyId, input.companyId));
        console.log(`[deleteCompany] Usuários excluídos`);
        
        // 9. Excluir subscriptions
        const deletedSubscriptions = await database.delete(subscriptions)
          .where(eq(subscriptions.companyId, input.companyId));
        console.log(`[deleteCompany] Assinaturas excluídas`);
        
        // 10. Excluir payments
        const deletedPayments = await database.delete(payments)
          .where(eq(payments.companyId, input.companyId));
        console.log(`[deleteCompany] Pagamentos excluídos`);
        
        // 11. Excluir site_settings
        const deletedSettings = await database.delete(siteSettings)
          .where(eq(siteSettings.companyId, input.companyId));
        console.log(`[deleteCompany] Configurações excluídas`);
        
        // 12. Finalmente, excluir a empresa
        const deletedCompany = await database.delete(companies)
          .where(eq(companies.id, input.companyId));
        console.log(`[deleteCompany] Empresa excluída com sucesso`);
        
      } catch (error) {
        console.error(`[deleteCompany] Erro durante exclusão:`, error);
        throw error;
      }
      
      // Log de atividade (criar depois da exclusão para não ser excluído)
      await db.createActivityLog({
        actorType: "master_admin",
        actorId: admin.id,
        action: "delete_company",
        entityType: "company",
        entityId: input.companyId,
        details: { name: company.name, email: company.email },
      });
      
      return { success: true, message: "Empresa e todos os seus dados foram excluídos" };
    }),

  // Deletar usuario
  deleteUser: publicProcedure
    .input(z.object({
      token: z.string(),
      userId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const admin = await masterAuthMiddleware(input.token);
      
      // Buscar usuario
      const user = await db.getUserById(input.userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuario nao encontrado" });
      }
      
      // TODO: Implementar função deleteUser no db.ts
      // await db.deleteUser(input.userId);
      
      // Log de atividade
      await db.createActivityLog({
        actorType: "master_admin",
        actorId: admin.id,
        action: "delete_user",
        entityType: "user",
        entityId: input.userId,
        details: { email: user.email, companyId: user.companyId },
      });
      
      return { success: true, message: "Usuario e todos os seus dados foram deletados" };
    }),
});
