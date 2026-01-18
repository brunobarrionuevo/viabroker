import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import { fetchAddressByCEP } from "./viaCep";
import { validateCPF, validateCNPJ, cleanCPF, cleanCNPJ } from "../shared/validators";
import { generateVivaRealXML, generateOLXXML, generateGenericXML } from "./xmlGenerator";
import { masterAdminRouter } from "./masterAdmin";
import { createCheckoutSession, createBillingPortalSession } from "./stripe";
import { authRouter } from "./auth";
import { sendPartnershipRequestEmail, sendPartnershipAcceptedEmail, sendPropertyShareEmail, sendPropertyShareAcceptedEmail } from "./email";

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
    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string().min(1, "Senha atual é obrigatória"),
        newPassword: z.string()
          .min(8, "A senha deve ter no mínimo 8 caracteres")
          .regex(/[A-Z]/, "A senha deve conter pelo menos 1 letra maiúscula")
          .regex(/[!@#$%^&*(),.?":{}|<>]/, "A senha deve conter pelo menos 1 caractere especial"),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;
        
        // Buscar usuário com hash da senha
        const user = await db.getUserById(userId);
        if (!user || !user.passwordHash) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Usuário não encontrado ou senha não configurada",
          });
        }

        // Verificar senha atual
        const bcrypt = await import("bcryptjs");
        const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Senha atual incorreta",
          });
        }

        // Hash da nova senha
        const newPasswordHash = await bcrypt.hash(input.newPassword, 12);
        
        // Atualizar senha
        await db.updateUserPassword(userId, newPasswordHash);
        
        return { success: true, message: "Senha alterada com sucesso" };
      }),
  }),

  // Utilitários públicos
  utils: router({
    searchCEP: publicProcedure
      .input(z.object({ cep: z.string() }))
      .query(async ({ input }) => {
        const address = await fetchAddressByCEP(input.cep);
        if (!address) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "CEP não encontrado",
          });
        }
        return address;
      }),
    
    validateDocument: publicProcedure
      .input(z.object({
        document: z.string(),
        type: z.enum(["cpf", "cnpj"]),
      }))
      .query(({ input }) => {
        if (input.type === "cpf") {
          return { valid: validateCPF(input.document) };
        }
        return { valid: validateCNPJ(input.document) };
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
        slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
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
        // Gerar slug a partir do nome se não foi fornecido
        const slug = input.slug || input.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .substring(0, 100);
        
        // Verificar se slug já existe
        const existing = await db.getCompanyBySlug(slug);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Este slug já está em uso" });
        }
        
        const company = await db.createCompany({ ...input, slug });
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
        origin: z.enum(['all', 'own', 'shared']).optional(), // Filtro de origem
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ ctx, input }) => {
        const companyId = ctx.user.companyId;
        if (!companyId) return [];
        
        let propertiesList: any[] = [];
        
        // Buscar imóveis próprios (se não for filtro "shared")
        if (input?.origin !== 'shared') {
          const filters: db.PropertyFilters = {
            companyId,
            type: input?.type,
            purpose: input?.purpose,
            city: input?.city,
            state: input?.state,
            status: input?.status,
            search: input?.search,
          };
          const ownProperties = await db.getProperties(filters, input?.limit || 50, input?.offset || 0);
          propertiesList = ownProperties.map(p => ({ ...p, isShared: false }));
        }
        
        // Buscar imóveis compartilhados (se não for filtro "own")
        if (input?.origin !== 'own') {
          const sharedProperties = await db.getSharedPropertiesForPartner(companyId);
          // Adicionar imóveis compartilhados à lista (evitando duplicatas)
          const existingIds = new Set(propertiesList.map(p => p.id));
          for (const shared of sharedProperties) {
            if (!existingIds.has(shared.id)) {
              propertiesList.push({
                ...shared,
                isShared: true,
              });
            }
          }
        }
        
        // Buscar imagens principais de todos os imóveis
        const propertyIds = propertiesList.map(p => p.id);
        const mainImages = await db.getPropertiesMainImages(propertyIds);
        
        // Adicionar a URL da imagem principal a cada imóvel
        return propertiesList.map(property => ({
          ...property,
          mainImageUrl: mainImages.get(property.id) || null,
        }));
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
        videoUrl: z.string().optional(),
        hideAddress: z.boolean().default(false),
        // Detalhes do imóvel
        hasServiceArea: z.boolean().default(false),
        hasBedroomCloset: z.boolean().default(false),
        hasKitchenCabinets: z.boolean().default(false),
        isFurnished: z.boolean().default(false),
        hasAirConditioning: z.boolean().default(false),
        hasBarbecue: z.boolean().default(false),
        hasBalcony: z.boolean().default(false),
        hasGourmetBalcony: z.boolean().default(false),
        hasServiceRoom: z.boolean().default(false),
        // Detalhes do condomínio
        isGatedCommunity: z.boolean().default(false),
        hasElevator: z.boolean().default(false),
        has24hSecurity: z.boolean().default(false),
        hasLobby: z.boolean().default(false),
        allowsPets: z.boolean().default(false),
        hasGym: z.boolean().default(false),
        hasPool: z.boolean().default(false),
        hasPartyRoom: z.boolean().default(false),
        hasGourmetSpace: z.boolean().default(false),
        hasSauna: z.boolean().default(false),
        hasVisitorParking: z.boolean().default(false),
        hasLaundry: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
        }
        
        // Gerar código de referência automático se não fornecido
        let autoCode = input.code;
        if (!autoCode || autoCode === "") {
          const propertyCount = await db.getPropertyCountByCompany(ctx.user.companyId);
          const companyPrefix = ctx.user.companyId.toString().padStart(3, '0');
          const propertyNumber = (propertyCount + 1).toString().padStart(4, '0');
          autoCode = `IMV${companyPrefix}${propertyNumber}`;
        }
        
        // Tratar valores vazios para evitar erros de banco de dados
        const cleanedInput = {
          ...input,
          salePrice: input.salePrice && input.salePrice !== "0" && input.salePrice !== "" ? input.salePrice : null,
          rentPrice: input.rentPrice && input.rentPrice !== "0" && input.rentPrice !== "" ? input.rentPrice : null,
          condoFee: input.condoFee && input.condoFee !== "0" && input.condoFee !== "" ? input.condoFee : null,
          iptuAnnual: input.iptuAnnual && input.iptuAnnual !== "0" && input.iptuAnnual !== "" ? input.iptuAnnual : null,
          totalArea: input.totalArea && input.totalArea !== "" ? input.totalArea : null,
          builtArea: input.builtArea && input.builtArea !== "" ? input.builtArea : null,
          code: autoCode,
          address: input.address && input.address !== "" ? input.address : null,
          number: input.number && input.number !== "" ? input.number : null,
          complement: input.complement && input.complement !== "" ? input.complement : null,
          neighborhood: input.neighborhood && input.neighborhood !== "" ? input.neighborhood : null,
          zipCode: input.zipCode && input.zipCode !== "" ? input.zipCode : null,
          metaTitle: input.metaTitle && input.metaTitle !== "" ? input.metaTitle : null,
          metaDescription: input.metaDescription && input.metaDescription !== "" ? input.metaDescription : null,
          videoUrl: input.videoUrl && input.videoUrl !== "" ? input.videoUrl : null,
          companyId: ctx.user.companyId,
          userId: ctx.user.id,
        };
        
        return db.createProperty(cleanedInput);
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
        videoUrl: z.string().optional(),
        hideAddress: z.boolean().optional(),
        // Detalhes do imóvel
        hasServiceArea: z.boolean().optional(),
        hasBedroomCloset: z.boolean().optional(),
        hasKitchenCabinets: z.boolean().optional(),
        isFurnished: z.boolean().optional(),
        hasAirConditioning: z.boolean().optional(),
        hasBarbecue: z.boolean().optional(),
        hasBalcony: z.boolean().optional(),
        hasGourmetBalcony: z.boolean().optional(),
        hasServiceRoom: z.boolean().optional(),
        // Detalhes do condomínio
        isGatedCommunity: z.boolean().optional(),
        hasElevator: z.boolean().optional(),
        has24hSecurity: z.boolean().optional(),
        hasLobby: z.boolean().optional(),
        allowsPets: z.boolean().optional(),
        hasGym: z.boolean().optional(),
        hasPool: z.boolean().optional(),
        hasPartyRoom: z.boolean().optional(),
        hasGourmetSpace: z.boolean().optional(),
        hasSauna: z.boolean().optional(),
        hasVisitorParking: z.boolean().optional(),
        hasLaundry: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const property = await db.getPropertyById(id);
        if (!property || property.companyId !== ctx.user.companyId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Imóvel não encontrado" });
        }
        // Limpar campos opcionais vazios
        const cleanedData: Record<string, any> = {};
        const optionalStringFields = ['code', 'complement', 'zipCode', 'videoUrl', 'metaTitle', 'metaDescription', 'builtArea', 'address', 'number', 'neighborhood'];
        const optionalDecimalFields = ['salePrice', 'rentPrice', 'condoFee', 'iptuAnnual', 'totalArea', 'builtArea'];
        
        for (const [key, value] of Object.entries(data)) {
          if (value === undefined) continue;
          
          // Campos de texto opcionais - converter string vazia para null
          if (typeof value === 'string' && value === '' && optionalStringFields.includes(key)) {
            cleanedData[key] = null;
          }
          // Campos decimais - converter string vazia para null
          else if (typeof value === 'string' && value === '' && optionalDecimalFields.includes(key)) {
            cleanedData[key] = null;
          }
          else {
            cleanedData[key] = value;
          }
        }
        return db.updateProperty(id, cleanedData);
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
    
    setMainImage: protectedProcedure
      .input(z.object({ propertyId: z.number(), imageId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property || property.companyId !== ctx.user.companyId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Imóvel não encontrado" });
        }
        return db.setMainPropertyImage(input.propertyId, input.imageId);
      }),
    
    updateImageOrder: protectedProcedure
      .input(z.object({ id: z.number(), order: z.number() }))
      .mutation(async ({ input }) => {
        return db.updatePropertyImageOrder(input.id, input.order);
      }),
    
    reorderImages: protectedProcedure
      .input(z.object({ 
        propertyId: z.number(),
        imageOrders: z.array(z.object({ 
          id: z.number(), 
          order: z.number() 
        })) 
      }))
      .mutation(async ({ ctx, input }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property || property.companyId !== ctx.user.companyId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Imóvel não encontrado" });
        }
        
        // Atualizar ordem de cada imagem
        for (const imageOrder of input.imageOrders) {
          await db.updatePropertyImageOrder(imageOrder.id, imageOrder.order);
        }
        
        return { success: true };
      }),
    
    countImages: protectedProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        return db.countPropertyImages(input.propertyId);
      }),
    
    listPublic: publicProcedure
      .input(z.object({
        companySlug: z.string().optional(),
        type: z.string().optional(),
        purpose: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        neighborhood: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        minBedrooms: z.number().optional(),
        maxBedrooms: z.number().optional(),
        minBathrooms: z.number().optional(),
        minArea: z.number().optional(),
        maxArea: z.number().optional(),
        parkingSpaces: z.number().optional(),
        isHighlight: z.boolean().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ input }) => {
        let companyId: number | undefined;
        
        // Se passou slug da empresa, buscar o ID
        if (input?.companySlug) {
          const company = await db.getCompanyBySlug(input.companySlug);
          if (!company) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada" });
          }
          companyId = company.id;
        }
        
        const filters: db.PropertyFilters = {
          companyId,
          type: input?.type,
          purpose: input?.purpose,
          city: input?.city,
          state: input?.state,
          neighborhood: input?.neighborhood,
          isPublished: true,
          isHighlight: input?.isHighlight,
          search: input?.search,
        };
        
        let propertiesList = await db.getProperties(filters, input?.limit || 50, input?.offset || 0);
        
        // Filtrar imóveis inativos (não devem aparecer no site público)
        propertiesList = propertiesList.filter(p => p.status !== 'inativo');
        
        // Filtros adicionais que não estão no banco
        if (input?.minPrice || input?.maxPrice) {
          propertiesList = propertiesList.filter(p => {
            const price = p.purpose === 'aluguel' 
              ? parseFloat(p.rentPrice || '0') 
              : parseFloat(p.salePrice || '0');
            if (input.minPrice && price < input.minPrice) return false;
            if (input.maxPrice && price > input.maxPrice) return false;
            return true;
          });
        }
        
        if (input?.minBedrooms !== undefined) {
          propertiesList = propertiesList.filter(p => (p.bedrooms || 0) >= (input.minBedrooms || 0));
        }
        
        if (input?.maxBedrooms !== undefined) {
          propertiesList = propertiesList.filter(p => (p.bedrooms || 0) <= (input.maxBedrooms || 99));
        }
        
        if (input?.minBathrooms !== undefined) {
          propertiesList = propertiesList.filter(p => (p.bathrooms || 0) >= (input.minBathrooms || 0));
        }
        
        if (input?.minArea !== undefined) {
          propertiesList = propertiesList.filter(p => parseFloat(p.totalArea || '0') >= (input.minArea || 0));
        }
        
        if (input?.maxArea !== undefined) {
          propertiesList = propertiesList.filter(p => parseFloat(p.totalArea || '0') <= (input.maxArea || 999999));
        }
        
        if (input?.parkingSpaces !== undefined) {
          propertiesList = propertiesList.filter(p => (p.parkingSpaces || 0) >= (input.parkingSpaces || 0));
        }
        
        // Se temos um companyId, buscar também imóveis compartilhados aceitos
        if (companyId) {
          const sharedProperties = await db.getSharedPropertiesForPartner(companyId);
          // Adicionar imóveis compartilhados à lista (evitando duplicatas)
          // Se estamos filtrando por isHighlight, só adicionar se o compartilhamento tiver isHighlight=true
          const existingIds = new Set(propertiesList.map(p => p.id));
          for (const shared of sharedProperties) {
            if (!existingIds.has(shared.id)) {
              // Se estamos buscando apenas destaques, verificar o isHighlight do compartilhamento
              if (input?.isHighlight === true && !shared.isHighlight) {
                continue; // Pular imóveis compartilhados que não estão em destaque
              }
              propertiesList.push(shared as any);
            }
          }
        }
        
        // Buscar imagens principais de todos os imóveis
        const propertyIds = propertiesList.map(p => p.id);
        const mainImages = await db.getPropertiesMainImages(propertyIds);
        
        // Adicionar a URL da imagem principal a cada imóvel
        return propertiesList.map(property => {
          const isShared = property.companyId !== companyId;
          return {
            ...property,
            mainImageUrl: mainImages.get(property.id) || null,
            isShared,
            // Campos de compartilhamento já vêm do getSharedPropertiesForPartner
            sharedFromCompanyName: (property as any).sharedFromCompanyName || null,
            sharedFromPartnerCode: (property as any).sharedFromPartnerCode || null,
            partnerPropertyCode: (property as any).partnerPropertyCode || null,
          };
        });
      }),

    getPublic: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const property = await db.getPropertyById(input.id);
        if (!property || !property.isPublished) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Imóvel não encontrado" });
        }
        // Buscar dados da empresa para contato
        const company = await db.getCompanyById(property.companyId);
        return {
          ...property,
          company: company ? {
            name: company.name,
            phone: company.phone,
            whatsapp: company.whatsapp,
            email: company.email,
            logoUrl: company.logoUrl,
          } : null,
        };
      }),
    
    getImagesPublic: publicProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        // Verificar se o imóvel existe e está publicado
        const property = await db.getPropertyById(input.propertyId);
        if (!property || !property.isPublished) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Imóvel não encontrado" });
        }
        return db.getPropertyImages(input.propertyId);
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
        companyId: z.number().optional(),
        companySlug: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        let companyId = input.companyId;
        
        // Se passou slug, buscar o ID da empresa
        if (!companyId && input.companySlug) {
          const company = await db.getCompanyBySlug(input.companySlug);
          if (!company) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada" });
          }
          companyId = company.id;
        }
        
        if (!companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "ID ou slug da empresa é obrigatório" });
        }
        
        return db.createLead({
          name: input.name,
          email: input.email,
          phone: input.phone,
          message: input.message,
          source: "site" as const,
          sourceDetail: input.sourceDetail,
          propertyId: input.propertyId,
          companyId: companyId,
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
    
    getPublic: publicProcedure
      .input(z.object({ companySlug: z.string() }))
      .query(async ({ input }) => {
        const company = await db.getCompanyBySlug(input.companySlug);
        if (!company) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada" });
        }
        const settings = await db.getSiteSettings(company.id);
        return {
          company: {
            id: company.id,
            name: company.name,
            slug: company.slug,
            phone: company.phone,
            whatsapp: company.whatsapp,
            email: company.email,
            address: company.address,
            city: company.city,
            state: company.state,
            creci: company.creci,
            description: company.description,
            logoUrl: company.logoUrl,
          },
          settings: settings || {
            primaryColor: "#0F52BA",
            secondaryColor: "#50C878",
            accentColor: "#FF6B35",
            backgroundColor: "#FFFFFF",
            textColor: "#1F2937",
            fontFamily: "Inter",
            showHeroSearch: true,
            showFeaturedProperties: true,
            showAboutSection: true,
            showContactForm: true,
            showTestimonials: false,
            logoUrl: null,
            faviconUrl: null,
            heroImageUrl: null,
            heroTitle: null,
            heroSubtitle: null,
            siteTitle: null,
            siteDescription: null,
            aboutText: null,
            contactEmail: null,
            contactPhone: null,
            contactAddress: null,
            whatsappDefaultMessage: null,
            customDomain: null,
            facebookUrl: null,
            instagramUrl: null,
            linkedinUrl: null,
            youtubeUrl: null,
            tiktokUrl: null,
          },
        };
      }),
    
    update: protectedProcedure
      .input(z.object({
        // Cores
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        accentColor: z.string().optional(),
        backgroundColor: z.string().optional(),
        textColor: z.string().optional(),
        // Tipografia
        fontFamily: z.string().optional(),
        // Imagens e branding
        logoUrl: z.string().optional(),
        faviconUrl: z.string().optional(),
        heroImageUrl: z.string().optional(),
        heroTitle: z.string().optional(),
        heroSubtitle: z.string().optional(),
        // SEO
        siteTitle: z.string().optional(),
        siteDescription: z.string().optional(),
        // Analytics
        googleAnalyticsId: z.string().optional(),
        facebookPixelId: z.string().optional(),
        // Redes sociais
        facebookUrl: z.string().optional(),
        instagramUrl: z.string().optional(),
        linkedinUrl: z.string().optional(),
        youtubeUrl: z.string().optional(),
        tiktokUrl: z.string().optional(),
        // WhatsApp
        whatsappDefaultMessage: z.string().optional(),
        // Domínio
        customDomain: z.string().optional(),
        // Layout
        showHeroSearch: z.boolean().optional(),
        showFeaturedProperties: z.boolean().optional(),
        showTestimonials: z.boolean().optional(),
        showAboutSection: z.boolean().optional(),
        aboutText: z.string().optional(),
        // Contato
        showContactForm: z.boolean().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        contactAddress: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
        }
        return db.upsertSiteSettings(ctx.user.companyId, input);
      }),
    
    verifyDomain: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
        }
        
        // Buscar configurações do site para obter o domínio personalizado
        const settings = await db.getSiteSettings(ctx.user.companyId);
        
        if (!settings?.customDomain) {
          return {
            success: false,
            message: 'Nenhum domínio personalizado configurado.',
            status: 'not_configured',
          };
        }
        
        const domain = settings.customDomain.toLowerCase().trim();
        
        try {
          // Verificar DNS usando API pública do Cloudflare
          const dnsResponse = await fetch(
            `https://cloudflare-dns.com/dns-query?name=${domain}&type=A`,
            {
              headers: { 'accept': 'application/dns-json' },
              signal: AbortSignal.timeout(10000),
            }
          );
          
          if (!dnsResponse.ok) {
            throw new Error('Falha ao consultar DNS');
          }
          
          const dnsData = await dnsResponse.json();
          
          // Verificar se há registros A
          const hasARecords = dnsData.Answer && dnsData.Answer.length > 0;
          
          if (hasARecords) {
            // Atualizar domainVerified no banco
            await db.upsertSiteSettings(ctx.user.companyId, {
              domainVerified: true,
            });
            
            // Limpar cache do middleware
            const { clearDomainCache } = await import('./_core/customDomainMiddleware');
            clearDomainCache(domain);
            
            return {
              success: true,
              message: 'Domínio verificado com sucesso! Seu site já está acessível pelo domínio personalizado.',
              status: 'verified',
              records: dnsData.Answer.map((r: any) => r.data),
            };
          }
          
          return {
            success: false,
            message: 'Domínio ainda não possui registros DNS configurados. Configure o registro A no seu provedor de domínio e aguarde a propagação (1-48 horas).',
            status: 'pending',
          };
        } catch (error) {
          return {
            success: false,
            message: 'Não foi possível verificar o domínio. Verifique sua conexão e tente novamente.',
            status: 'error',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
          };
        }
      }),
    
    removeDomain: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
        }
        
        // Buscar domínio atual
        const settings = await db.getSiteSettings(ctx.user.companyId);
        const oldDomain = settings?.customDomain;
        
        // Remover domínio do Cloudflare (se automação estiver habilitada)
        if (oldDomain) {
          try {
            const cloudflare = await import('./cloudflareService');
            if (cloudflare.isCloudflareConfigured()) {
              await cloudflare.removeCustomDomain(oldDomain);
            }
          } catch (error) {
            console.warn('[Domain] Erro ao remover do Cloudflare:', error);
          }
        }
        
        // Remover domínio do banco
        await db.upsertSiteSettings(ctx.user.companyId, {
          customDomain: null,
          domainVerified: false,
        });
        
        // Limpar cache
        if (oldDomain) {
          const { clearDomainCache } = await import('./_core/customDomainMiddleware');
          clearDomainCache(oldDomain);
        }
        
        return {
          success: true,
          message: 'Domínio personalizado removido com sucesso.',
        };
      }),
    
    // Verificar se automação Cloudflare está disponível
    checkCloudflareStatus: protectedProcedure
      .query(async () => {
        console.log('[Cloudflare] checkCloudflareStatus called');
        const cloudflare = await import('./cloudflareService');
        
        if (!cloudflare.isCloudflareConfigured()) {
          console.log('[Cloudflare] Not configured');
          return {
            configured: false,
            message: 'Automação de domínios não configurada. Configure as credenciais do Cloudflare.',
          };
        }
        
        console.log('[Cloudflare] Verifying connection...');
        const status = await cloudflare.verifyCloudflareConnection();
        console.log('[Cloudflare] Connection status:', JSON.stringify(status));
        
        return {
          configured: true,
          connected: status.success,
          message: status.message,
          accountName: status.accountName,
        };
      }),
    
    // Configurar domínio automaticamente via Cloudflare
    setupDomain: protectedProcedure
      .input(z.object({
        domain: z.string().min(3, "Domínio inválido"),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
        }
        
        const domain = input.domain.toLowerCase().trim();
        
        // Validar formato do domínio
        const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/;
        if (!domainRegex.test(domain.replace(/^www\./, ''))) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Formato de domínio inválido" });
        }
        
        const cloudflare = await import('./cloudflareService');
        
        // Verificar se Cloudflare está configurado
        if (!cloudflare.isCloudflareConfigured()) {
          // Salvar domínio no banco sem automação (modo manual)
          await db.upsertSiteSettings(ctx.user.companyId, {
            customDomain: domain,
            domainVerified: false,
          });
          
          return {
            success: true,
            automated: false,
            message: 'Domínio salvo. Configure manualmente no Cloudflare ou aguarde a configuração automática.',
            step: 'manual',
          };
        }
        
        // Configurar domínio automaticamente
        const result = await cloudflare.setupCustomDomain(domain);
        
        if (result.success) {
          // Salvar domínio no banco
          await db.upsertSiteSettings(ctx.user.companyId, {
            customDomain: domain,
            domainVerified: false, // Será verificado quando nameservers forem configurados
          });
          
          return {
            success: true,
            automated: true,
            message: result.message,
            step: result.step,
            nameServers: result.nameServers,
          };
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error || 'Erro ao configurar domínio',
        });
      }),
    
    // Verificar status do domínio no Cloudflare
    checkDomainCloudflare: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
        }
        
        const settings = await db.getSiteSettings(ctx.user.companyId);
        
        if (!settings?.customDomain) {
          return {
            success: false,
            status: 'not_configured',
            message: 'Nenhum domínio configurado',
          };
        }
        
        const cloudflare = await import('./cloudflareService');
        
        if (!cloudflare.isCloudflareConfigured()) {
          return {
            success: false,
            status: 'manual',
            message: 'Automação não configurada. Verifique manualmente.',
          };
        }
        
        const status = await cloudflare.checkDomainStatus(settings.customDomain);
        
        // Se domínio está ativo, marcar como verificado
        if (status.status === 'active') {
          await db.upsertSiteSettings(ctx.user.companyId, {
            domainVerified: true,
          });
          
          // Limpar cache
          const { clearDomainCache } = await import('./_core/customDomainMiddleware');
          clearDomainCache(settings.customDomain);
        }
        
        return {
          success: status.success,
          status: status.status,
          message: status.message,
          nameServers: status.nameServers,
          sslStatus: status.sslStatus,
        };
      }),
  }),

  // Geração de XML para portais imobiliários
  xml: router({
    vivareal: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
      }
      return generateVivaRealXML(ctx.user.companyId);
    }),
    olx: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
      }
      return generateOLXXML(ctx.user.companyId);
    }),
    generic: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
      }
      return generateGenericXML(ctx.user.companyId);
    }),
  }),

  // Administração Master
  masterAdmin: masterAdminRouter,
  
  // Autenticação própria
  customAuth: authRouter,

  // Stripe Checkout
  stripe: router({
    createCheckout: protectedProcedure
      .input(z.object({
        planId: z.string(),
        billingCycle: z.enum(["monthly", "yearly"]),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
        }
        const origin = ctx.req.headers.origin || "http://localhost:3000";
        const url = await createCheckoutSession(
          ctx.user.companyId,
          input.planId,
          input.billingCycle,
          ctx.user.email || "",
          ctx.user.name || "",
          origin
        );
        return { url };
      }),
    createBillingPortal: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user.companyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
      }
      const origin = ctx.req.headers.origin || "http://localhost:3000";
      const url = await createBillingPortalSession(ctx.user.companyId, origin);
      return { url };
    }),
  }),

  // Parcerias entre corretores
  partnerships: router({
    // Listar parcerias do corretor
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.companyId) return [];
      return db.getPartnershipsByCompany(ctx.user.companyId);
    }),

    // Listar parcerias pendentes (recebidas)
    pending: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.companyId) return [];
      return db.getPendingPartnerships(ctx.user.companyId);
    }),

    // Listar parcerias aceitas
    accepted: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.companyId) return [];
      return db.getAcceptedPartnerships(ctx.user.companyId);
    }),

    // Solicitar parceria
    request: protectedProcedure
      .input(z.object({
        partnerCode: z.string(),
        shareAllProperties: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
        }
        
        // Buscar empresa parceira pelo código de parceiro
        const partner = await db.getCompanyByPartnerCode(input.partnerCode);
        if (!partner) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Código de parceiro não encontrado" });
        }
        
        if (partner.id === ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode criar parceria consigo mesmo" });
        }
        
        // Verificar se já existe parceria
        const existing = await db.getExistingPartnership(ctx.user.companyId, partner.id);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Já existe uma parceria com este corretor" });
        }
        
        const partnership = await db.createPartnership({
          requesterId: ctx.user.companyId,
          partnerId: partner.id,
          shareAllProperties: input.shareAllProperties,
        });
        
        // Registrar log de atividade
        await db.createActivityLog({
          actorType: 'user',
          actorId: ctx.user.id,
          action: 'partnership_requested',
          entityType: 'partnership',
          entityId: partnership.id,
          details: {
            companyId: ctx.user.companyId,
            partnerCompanyId: partner.id,
            partnerName: partner.name,
            partnerCode: partner.partnerCode,
          },
        });
        
        // Enviar email de notificação para o parceiro
        const requester = await db.getCompanyById(ctx.user.companyId);
        const partnerUsers = await db.getUsersByCompanyId(partner.id);
        const partnerUser = partnerUsers[0];
        if (partnerUser?.email && requester) {
          sendPartnershipRequestEmail(
            partnerUser.email,
            partner.name,
            requester.name,
            requester.partnerCode || ''
          ).catch(err => console.error('[Email] Erro ao enviar notificação de parceria:', err));
        }
        
        return partnership;
      }),

    // Aceitar parceria
    accept: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
        }
        
        const partnership = await db.getPartnershipById(input.id);
        if (!partnership || partnership.partnerId !== ctx.user.companyId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Parceria não encontrada" });
        }
        
        if (partnership.status !== 'pending') {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Esta parceria já foi processada" });
        }
        
        await db.updatePartnership(input.id, {
          status: 'accepted',
          acceptedAt: new Date(),
        });
        
        // Registrar log de atividade
        await db.createActivityLog({
          actorType: 'user',
          actorId: ctx.user.id,
          action: 'partnership_accepted',
          entityType: 'partnership',
          entityId: partnership.id,
          details: {
            companyId: ctx.user.companyId,
            partnerCompanyId: partnership.requesterId,
          },
        });
        
        // Enviar email de notificação para quem solicitou
        const requester = await db.getCompanyById(partnership.requesterId);
        const partner = await db.getCompanyById(ctx.user.companyId);
        const requesterUsers = await db.getUsersByCompanyId(partnership.requesterId);
        const requesterUser = requesterUsers[0];
        if (requesterUser?.email && requester && partner) {
          sendPartnershipAcceptedEmail(
            requesterUser.email,
            requester.name,
            partner.name,
            partner.partnerCode || ''
          ).catch(err => console.error('[Email] Erro ao enviar notificação de aceite:', err));
        }
        
        return { success: true };
      }),

    // Rejeitar parceria
    reject: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
        }
        
        const partnership = await db.getPartnershipById(input.id);
        if (!partnership || partnership.partnerId !== ctx.user.companyId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Parceria não encontrada" });
        }
        
        await db.updatePartnership(input.id, {
          status: 'rejected',
          rejectedAt: new Date(),
        });
        
        return { success: true };
      }),

    // Cancelar parceria
    cancel: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
        }
        
        const partnership = await db.getPartnershipById(input.id);
        if (!partnership || (partnership.requesterId !== ctx.user.companyId && partnership.partnerId !== ctx.user.companyId)) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Parceria não encontrada" });
        }
        
        await db.updatePartnership(input.id, { status: 'canceled' });
        
        return { success: true };
      }),
  }),

  // Histórico de atividades de parcerias
  partnershipActivity: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.companyId) return [];
      return db.getPartnershipActivityLogs(ctx.user.companyId, 50);
    }),
  }),

  // Compartilhamento de imóveis
  propertyShares: router({
    // Listar compartilhamentos enviados (como dono)
    sentList: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.companyId) return [];
      return db.getPropertySharesByOwner(ctx.user.companyId);
    }),

    // Listar compartilhamentos recebidos (como parceiro)
    receivedList: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.companyId) return [];
      return db.getPropertySharesByPartner(ctx.user.companyId);
    }),

    // Listar compartilhamentos pendentes
    pending: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.companyId) return [];
      return db.getPendingPropertyShares(ctx.user.companyId);
    }),

    // Listar imóveis compartilhados aceitos (para exibir no site do parceiro)
    sharedProperties: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.companyId) return [];
      return db.getSharedPropertiesForPartner(ctx.user.companyId);
    }),

    // Compartilhar imóvel com parceiro
    share: protectedProcedure
      .input(z.object({
        propertyId: z.number(),
        partnerCompanyId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
        }
        
        // Verificar se o imóvel pertence ao usuário
        const property = await db.getPropertyById(input.propertyId);
        if (!property || property.companyId !== ctx.user.companyId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Imóvel não encontrado" });
        }
        
        // Verificar se existe parceria aceita
        const partnership = await db.getExistingPartnership(ctx.user.companyId, input.partnerCompanyId);
        if (!partnership || partnership.status !== 'accepted') {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Não existe parceria ativa com este corretor" });
        }
        
        // Verificar se já existe compartilhamento
        const existing = await db.getPropertyShareByPropertyAndPartner(input.propertyId, input.partnerCompanyId);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Este imóvel já foi compartilhado com este parceiro" });
        }
        
        const share = await db.createPropertyShare({
          propertyId: input.propertyId,
          ownerCompanyId: ctx.user.companyId,
          partnerCompanyId: input.partnerCompanyId,
          partnershipId: partnership.id,
        });
        
        // Registrar log de atividade
        await db.createActivityLog({
          actorType: 'user',
          actorId: ctx.user.id,
          action: 'property_shared',
          entityType: 'partnership',
          entityId: share.id,
          details: {
            companyId: ctx.user.companyId,
            partnerCompanyId: input.partnerCompanyId,
            propertyId: input.propertyId,
            propertyTitle: property.title,
            propertyCode: property.code,
          },
        });
        
        // Enviar email de notificação para o parceiro
        const owner = await db.getCompanyById(ctx.user.companyId);
        const partnerCompany = await db.getCompanyById(input.partnerCompanyId);
        const partnerUsers = await db.getUsersByCompanyId(input.partnerCompanyId);
        const partnerUser = partnerUsers[0];
        if (partnerUser?.email && owner && partnerCompany) {
          sendPropertyShareEmail(
            partnerUser.email,
            partnerCompany.name,
            owner.name,
            property.title,
            property.code || ''
          ).catch(err => console.error('[Email] Erro ao enviar notificação de compartilhamento:', err));
        }
        
        return share;
      }),

    // Aceitar compartilhamento
    accept: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
        }
        
        const share = await db.getPropertyShareById(input.id);
        if (!share || share.partnerCompanyId !== ctx.user.companyId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Compartilhamento não encontrado" });
        }
        
        if (share.status !== 'pending') {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Este compartilhamento já foi processado" });
        }
        
        // Gerar código único para o parceiro
        const partnerCode = await db.generatePartnerPropertyCode(ctx.user.companyId);
        
        await db.updatePropertyShare(input.id, {
          status: 'accepted',
          acceptedAt: new Date(),
          partnerPropertyCode: partnerCode,
        });
        
        // Registrar log de atividade
        const property = await db.getPropertyById(share.propertyId);
        await db.createActivityLog({
          actorType: 'user',
          actorId: ctx.user.id,
          action: 'property_share_accepted',
          entityType: 'partnership',
          entityId: share.id,
          details: {
            companyId: ctx.user.companyId,
            partnerCompanyId: share.ownerCompanyId,
            propertyId: share.propertyId,
            propertyTitle: property?.title,
            partnerPropertyCode: partnerCode,
          },
        });
        
        // Enviar email de notificação para o dono do imóvel
        const owner = await db.getCompanyById(share.ownerCompanyId);
        const partner = await db.getCompanyById(ctx.user.companyId);
        const ownerUsers = await db.getUsersByCompanyId(share.ownerCompanyId);
        const ownerUser = ownerUsers[0];
        if (ownerUser?.email && owner && partner && property) {
          sendPropertyShareAcceptedEmail(
            ownerUser.email,
            owner.name,
            partner.name,
            property.title
          ).catch(err => console.error('[Email] Erro ao enviar notificação de aceite de compartilhamento:', err));
        }
        
        return { success: true, partnerCode };
      }),

    // Rejeitar compartilhamento
    reject: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
        }
        
        const share = await db.getPropertyShareById(input.id);
        if (!share || share.partnerCompanyId !== ctx.user.companyId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Compartilhamento não encontrado" });
        }
        
        await db.updatePropertyShare(input.id, { status: 'rejected' });
        
        return { success: true };
      }),

    // Revogar compartilhamento (pelo dono)
    revoke: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
        }
        
        const share = await db.getPropertyShareById(input.id);
        if (!share || share.ownerCompanyId !== ctx.user.companyId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Compartilhamento não encontrado" });
        }
        
        await db.updatePropertyShare(input.id, { status: 'revoked' });
        
        return { success: true };
      }),

    // Toggle destaque de imóvel compartilhado (pelo parceiro)
    toggleHighlight: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
        }
        
        const newHighlight = await db.toggleShareHighlight(input.id, ctx.user.companyId);
        
        return { success: true, isHighlight: newHighlight };
      }),

    // Toggle status (ativar/inativar) de imóvel compartilhado (pelo parceiro)
    toggleStatus: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
        }
        
        const newStatus = await db.toggleShareStatus(input.id, ctx.user.companyId);
        
        // Registrar log de atividade
        await db.createActivityLog({
          actorType: 'user',
          actorId: ctx.user.id,
          action: newStatus === 'inactive' ? 'share_inactivated' : 'share_activated',
          entityType: 'property_share',
          entityId: input.id,
          details: { message: `Imóvel compartilhado ${newStatus === 'inactive' ? 'inativado' : 'ativado'}`, companyId: ctx.user.companyId },
        });
        
        return { success: true, status: newStatus };
      }),

    // Excluir compartilhamento de imóvel (pelo parceiro)
    deleteShare: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
        }
        
        // Buscar dados do compartilhamento antes de excluir para o log
        const share = await db.getPropertyShareById(input.id);
        if (!share || share.partnerCompanyId !== ctx.user.companyId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Compartilhamento não encontrado" });
        }
        
        await db.deletePropertyShare(input.id, ctx.user.companyId);
        
        // Registrar log de atividade
        await db.createActivityLog({
          actorType: 'user',
          actorId: ctx.user.id,
          action: 'share_deleted',
          entityType: 'property_share',
          entityId: input.id,
          details: { message: 'Compartilhamento de imóvel excluído', companyId: ctx.user.companyId },
        });
        
        return { success: true };
      }),

    // Listar imóveis recebidos (aceitos e inativos)
    listReceived: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user.companyId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário não possui empresa" });
        }
        
        return db.getReceivedPropertyShares(ctx.user.companyId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
