import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";

// Schemas de validação
const propertyTypeEnum = z.enum(["casa", "apartamento", "terreno", "comercial", "rural", "cobertura", "flat", "kitnet", "sobrado", "galpao", "sala_comercial", "loja", "outro"]);
const purposeEnum = z.enum(["venda", "aluguel", "venda_aluguel"]);
const statusEnum = z.enum(["disponivel", "reservado", "vendido", "alugado", "inativo"]);
const leadSourceEnum = z.enum(["site", "whatsapp", "telefone", "indicacao", "portal", "facebook", "instagram", "google", "outro"]);
const leadStageEnum = z.enum(["novo", "contato_inicial", "qualificado", "visita_agendada", "proposta", "negociacao", "fechado_ganho", "fechado_perdido"]);
const interactionTypeEnum = z.enum(["ligacao", "whatsapp", "email", "visita", "reuniao", "proposta", "nota"]);
const appointmentStatusEnum = z.enum(["agendado", "confirmado", "realizado", "cancelado", "reagendado"]);

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Dashboard
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      const companyId = ctx.user.companyId;
      if (!companyId) {
        return { totalProperties: 0, totalLeads: 0, pendingAppointments: 0, newLeads: 0 };
      }
      return db.getDashboardStats(companyId);
    }),
  }),

  // Empresas
  company: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.companyId) return null;
      return db.getCompanyById(ctx.user.companyId);
    }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(2),
        slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
        personType: z.enum(["fisica", "juridica"]).default("juridica"),
        cpf: z.string().optional(),
        cnpj: z.string().optional(),
        creci: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        whatsapp: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().length(2).optional(),
        zipCode: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = await db.getCompanyBySlug(input.slug);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Este slug já está em uso" });
        }
        const company = await db.createCompany(input);
        // Associar o usuário à empresa criada
        if (company && company.id) {
          await db.updateUserCompany(ctx.user.id, company.id);
        }
        return company;
      }),
    
    update: protectedProcedure
      .input(z.object({
        name: z.string().min(2).optional(),
        personType: z.enum(["fisica", "juridica"]).optional(),
        cpf: z.string().optional(),
        cnpj: z.string().optional(),
        creci: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        whatsapp: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().length(2).optional(),
        zipCode: z.string().optional(),
        description: z.string().optional(),
        logoUrl: z.string().optional(),
        bannerUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
        }
        return db.updateCompany(ctx.user.companyId, input);
      }),
  }),

  // Imóveis
  properties: router({
    list: protectedProcedure
      .input(z.object({
        type: z.string().optional(),
        purpose: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ ctx, input }) => {
        const filters: db.PropertyFilters = {
          companyId: ctx.user.companyId || undefined,
          ...input
        };
        return db.getProperties(filters, input?.limit || 50, input?.offset || 0);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const property = await db.getPropertyById(input.id);
        if (!property || property.companyId !== ctx.user.companyId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Imóvel não encontrado" });
        }
        return property;
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(5),
        code: z.string().optional(),
        description: z.string().optional(),
        type: propertyTypeEnum,
        purpose: purposeEnum,
        salePrice: z.string().optional(),
        rentPrice: z.string().optional(),
        condoFee: z.string().optional(),
        iptuAnnual: z.string().optional(),
        address: z.string().optional(),
        number: z.string().optional(),
        complement: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string(),
        state: z.string().length(2),
        zipCode: z.string().optional(),
        totalArea: z.string().optional(),
        builtArea: z.string().optional(),
        bedrooms: z.number().min(0).default(0),
        suites: z.number().min(0).default(0),
        bathrooms: z.number().min(0).default(0),
        parkingSpaces: z.number().min(0).default(0),
        amenities: z.array(z.string()).optional(),
        status: statusEnum.default("disponivel"),
        isHighlight: z.boolean().default(false),
        isPublished: z.boolean().default(true),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
        }
        return db.createProperty({
          ...input,
          companyId: ctx.user.companyId,
          userId: ctx.user.id,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(5).optional(),
        code: z.string().optional(),
        description: z.string().optional(),
        type: propertyTypeEnum.optional(),
        purpose: purposeEnum.optional(),
        salePrice: z.string().optional(),
        rentPrice: z.string().optional(),
        condoFee: z.string().optional(),
        iptuAnnual: z.string().optional(),
        address: z.string().optional(),
        number: z.string().optional(),
        complement: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().length(2).optional(),
        zipCode: z.string().optional(),
        totalArea: z.string().optional(),
        builtArea: z.string().optional(),
        bedrooms: z.number().min(0).optional(),
        suites: z.number().min(0).optional(),
        bathrooms: z.number().min(0).optional(),
        parkingSpaces: z.number().min(0).optional(),
        amenities: z.array(z.string()).optional(),
        status: statusEnum.optional(),
        isHighlight: z.boolean().optional(),
        isPublished: z.boolean().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const property = await db.getPropertyById(id);
        if (!property || property.companyId !== ctx.user.companyId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Imóvel não encontrado" });
        }
        return db.updateProperty(id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const property = await db.getPropertyById(input.id);
        if (!property || property.companyId !== ctx.user.companyId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Imóvel não encontrado" });
        }
        return db.deleteProperty(input.id);
      }),
    
    getImages: protectedProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        return db.getPropertyImages(input.propertyId);
      }),
    
    addImage: protectedProcedure
      .input(z.object({
        propertyId: z.number(),
        url: z.string().url(),
        fileKey: z.string().optional(),
        caption: z.string().optional(),
        order: z.number().default(0),
        isMain: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property || property.companyId !== ctx.user.companyId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Imóvel não encontrado" });
        }
        return db.addPropertyImage(input);
      }),
    
    deleteImage: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return db.deletePropertyImage(input.id);
      }),
    
    listPublic: publicProcedure
      .input(z.object({
        type: z.string().optional(),
        purpose: z.string().optional(),
        city: z.string().optional(),
        search: z.string().optional(),
        isPublished: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ input }) => {
        const filters: db.PropertyFilters = {
          ...input,
          isPublished: true,
          status: "disponivel",
        };
        return db.getProperties(filters, input?.limit || 50, input?.offset || 0);
      }),

    getPublic: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const property = await db.getPropertyById(input.id);
        if (!property || !property.isPublished) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Imóvel não encontrado" });
        }
        return property;
      }),

    generateDescription: protectedProcedure
      .input(z.object({
        title: z.string(),
        type: z.string(),
        purpose: z.string(),
        city: z.string(),
        state: z.string(),
        neighborhood: z.string().optional(),
        bedrooms: z.number().optional(),
        suites: z.number().optional(),
        bathrooms: z.number().optional(),
        parkingSpaces: z.number().optional(),
        totalArea: z.string().optional(),
        builtArea: z.string().optional(),
        amenities: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const prompt = `Você é um especialista em marketing imobiliário. Crie uma descrição atraente e profissional para o seguinte imóvel:

Título: ${input.title}
Tipo: ${input.type}
Finalidade: ${input.purpose}
Localização: ${input.neighborhood ? `${input.neighborhood}, ` : ''}${input.city} - ${input.state}
${input.bedrooms ? `Quartos: ${input.bedrooms}` : ''}
${input.suites ? `Suítes: ${input.suites}` : ''}
${input.bathrooms ? `Banheiros: ${input.bathrooms}` : ''}
${input.parkingSpaces ? `Vagas: ${input.parkingSpaces}` : ''}
${input.totalArea ? `Área total: ${input.totalArea}m²` : ''}
${input.builtArea ? `Área construída: ${input.builtArea}m²` : ''}
${input.amenities?.length ? `Diferenciais: ${input.amenities.join(', ')}` : ''}

Escreva uma descrição de 2-3 parágrafos que destaque os pontos fortes do imóvel, seja persuasiva e profissional. Use linguagem que transmita exclusividade e qualidade. Não use emojis.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Você é um copywriter especializado em imóveis de alto padrão." },
            { role: "user", content: prompt }
          ]
        });
        return { description: response.choices[0]?.message?.content || "" };
      }),
  }),

  // Leads
  leads: router({
    createPublic: publicProcedure
      .input(z.object({
        name: z.string().min(2),
        email: z.string().email(),
        phone: z.string().optional(),
        message: z.string().optional(),
        source: z.string().default("site"),
        sourceDetail: z.string().optional(),
        propertyId: z.number().optional(),
        companyId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return db.createLead({
          name: input.name,
          email: input.email,
          phone: input.phone,
          message: input.message,
          source: "site",
          sourceDetail: input.sourceDetail,
          propertyId: input.propertyId,
          companyId: input.companyId,
          stage: "novo",
        });
      }),

    list: protectedProcedure
      .input(z.object({
        stage: z.string().optional(),
        source: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ ctx, input }) => {
        const filters: db.LeadFilters = {
          companyId: ctx.user.companyId || undefined,
          ...input
        };
        return db.getLeads(filters, input?.limit || 50, input?.offset || 0);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const lead = await db.getLeadById(input.id);
        if (!lead || lead.companyId !== ctx.user.companyId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Lead não encontrado" });
        }
        return lead;
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(2),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        whatsapp: z.string().optional(),
        source: leadSourceEnum.default("site"),
        sourceDetail: z.string().optional(),
        interestType: z.enum(["compra", "aluguel", "investimento", "outro"]).optional(),
        budget: z.string().optional(),
        message: z.string().optional(),
        propertyId: z.number().optional(),
        assignedUserId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
        }
        return db.createLead({
          ...input,
          companyId: ctx.user.companyId,
          assignedUserId: input.assignedUserId || ctx.user.id,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(2).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        whatsapp: z.string().optional(),
        stage: leadStageEnum.optional(),
        source: leadSourceEnum.optional(),
        sourceDetail: z.string().optional(),
        interestType: z.enum(["compra", "aluguel", "investimento", "outro"]).optional(),
        budget: z.string().optional(),
        message: z.string().optional(),
        notes: z.string().optional(),
        propertyId: z.number().optional(),
        assignedUserId: z.number().optional(),
        nextFollowUpAt: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const lead = await db.getLeadById(id);
        if (!lead || lead.companyId !== ctx.user.companyId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Lead não encontrado" });
        }
        return db.updateLead(id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const lead = await db.getLeadById(input.id);
        if (!lead || lead.companyId !== ctx.user.companyId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Lead não encontrado" });
        }
        return db.deleteLead(input.id);
      }),
    
    getInteractions: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        return db.getInteractions(input.leadId);
      }),
    
    addInteraction: protectedProcedure
      .input(z.object({
        leadId: z.number(),
        type: interactionTypeEnum,
        description: z.string().min(1),
        outcome: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const lead = await db.getLeadById(input.leadId);
        if (!lead || lead.companyId !== ctx.user.companyId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Lead não encontrado" });
        }
        return db.createInteraction({
          ...input,
          userId: ctx.user.id,
        });
      }),
  }),

  // Agendamentos
  appointments: router({
    list: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        propertyId: z.number().optional(),
        leadId: z.number().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ ctx, input }) => {
        const filters: db.AppointmentFilters = {
          companyId: ctx.user.companyId || undefined,
          ...input
        };
        return db.getAppointments(filters, input?.limit || 50, input?.offset || 0);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const appointment = await db.getAppointmentById(input.id);
        if (!appointment || appointment.companyId !== ctx.user.companyId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Agendamento não encontrado" });
        }
        return appointment;
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(2),
        description: z.string().optional(),
        scheduledAt: z.date(),
        duration: z.number().min(15).default(60),
        propertyId: z.number().optional(),
        leadId: z.number().optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
        }
        return db.createAppointment({
          ...input,
          companyId: ctx.user.companyId,
          userId: ctx.user.id,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(2).optional(),
        description: z.string().optional(),
        scheduledAt: z.date().optional(),
        duration: z.number().min(15).optional(),
        status: appointmentStatusEnum.optional(),
        propertyId: z.number().optional(),
        leadId: z.number().optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const appointment = await db.getAppointmentById(id);
        if (!appointment || appointment.companyId !== ctx.user.companyId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Agendamento não encontrado" });
        }
        return db.updateAppointment(id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const appointment = await db.getAppointmentById(input.id);
        if (!appointment || appointment.companyId !== ctx.user.companyId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Agendamento não encontrado" });
        }
        return db.deleteAppointment(input.id);
      }),
  }),

  // Planos
  plans: router({
    list: publicProcedure.query(async () => {
      return db.getAllPlans();
    }),
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getPlanById(input.id);
      }),
  }),

  // Configurações do Site
  siteSettings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.companyId) return null;
      return db.getSiteSettings(ctx.user.companyId);
    }),
    update: protectedProcedure
      .input(z.object({
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        fontFamily: z.string().optional(),
        siteTitle: z.string().optional(),
        siteDescription: z.string().optional(),
        googleAnalyticsId: z.string().optional(),
        facebookPixelId: z.string().optional(),
        facebookUrl: z.string().optional(),
        instagramUrl: z.string().optional(),
        linkedinUrl: z.string().optional(),
        youtubeUrl: z.string().optional(),
        whatsappDefaultMessage: z.string().optional(),
        customDomain: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
        }
        return db.upsertSiteSettings(ctx.user.companyId, input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
