import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json, longtext } from "drizzle-orm/mysql-core";

// ==========================================
// USUÁRIOS E AUTENTICAÇÃO
// ==========================================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  companyId: int("companyId"),
  
  // Campos de autenticação própria
  passwordHash: varchar("passwordHash", { length: 255 }),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  emailVerificationToken: varchar("emailVerificationToken", { length: 100 }),
  emailVerificationExpires: timestamp("emailVerificationExpires"),
  passwordResetToken: varchar("passwordResetToken", { length: 100 }),
  passwordResetExpires: timestamp("passwordResetExpires"),
  googleId: varchar("googleId", { length: 100 }),
  avatarUrl: text("avatarUrl"),
  
  // Campos de trial
  trialStartDate: timestamp("trialStartDate"),
  trialEndDate: timestamp("trialEndDate"),
  isTrialExpired: boolean("isTrialExpired").default(false).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==========================================
// IMOBILIÁRIAS / EMPRESAS (Multi-tenant)
// ==========================================

export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  personType: mysqlEnum("personType", ["fisica", "juridica"]).default("juridica").notNull(),
  cpf: varchar("cpf", { length: 14 }),
  cnpj: varchar("cnpj", { length: 18 }),
  creci: varchar("creci", { length: 50 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 10 }),
  logoUrl: text("logoUrl"),
  bannerUrl: text("bannerUrl"),
  description: text("description"),
  planId: int("planId"),
  planExpiresAt: timestamp("planExpiresAt"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  partnerCode: varchar("partnerCode", { length: 20 }).unique(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

// ==========================================
// PLANOS DE ASSINATURA
// ==========================================

export const plans = mysqlTable("plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  maxProperties: int("maxProperties").notNull(),
  maxUsers: int("maxUsers").notNull(),
  maxPhotosPerProperty: int("maxPhotosPerProperty").default(20).notNull(),
  hasAI: boolean("hasAI").default(false).notNull(),
  aiCreditsPerDay: int("aiCreditsPerDay").default(0).notNull(),
  hasWhatsappIntegration: boolean("hasWhatsappIntegration").default(false).notNull(),
  hasPortalIntegration: boolean("hasPortalIntegration").default(false).notNull(),
  hasCustomDomain: boolean("hasCustomDomain").default(false).notNull(),
  isCourtesy: boolean("isCourtesy").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = typeof plans.$inferInsert;

// ==========================================
// IMÓVEIS
// ==========================================

export const properties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  userId: int("userId").notNull(),
  code: varchar("code", { length: 50 }),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 300 }),
  description: text("description"),
  type: mysqlEnum("type", ["casa", "apartamento", "terreno", "comercial", "rural", "cobertura", "flat", "kitnet", "sobrado", "galpao", "sala_comercial", "loja", "outro"]).notNull(),
  purpose: mysqlEnum("purpose", ["venda", "aluguel", "venda_aluguel"]).notNull(),
  salePrice: decimal("salePrice", { precision: 15, scale: 2 }),
  rentPrice: decimal("rentPrice", { precision: 15, scale: 2 }),
  condoFee: decimal("condoFee", { precision: 10, scale: 2 }),
  iptuAnnual: decimal("iptuAnnual", { precision: 10, scale: 2 }),
  address: varchar("address", { length: 255 }),
  number: varchar("number", { length: 20 }),
  complement: varchar("complement", { length: 100 }),
  neighborhood: varchar("neighborhood", { length: 100 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  zipCode: varchar("zipCode", { length: 10 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  totalArea: decimal("totalArea", { precision: 10, scale: 2 }),
  builtArea: decimal("builtArea", { precision: 10, scale: 2 }),
  bedrooms: int("bedrooms").default(0),
  suites: int("suites").default(0),
  bathrooms: int("bathrooms").default(0),
  parkingSpaces: int("parkingSpaces").default(0),
  amenities: json("amenities").$type<string[]>(),
  status: mysqlEnum("status", ["disponivel", "reservado", "vendido", "alugado", "inativo"]).default("disponivel").notNull(),
  isHighlight: boolean("isHighlight").default(false).notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
  metaTitle: varchar("metaTitle", { length: 70 }),
  metaDescription: varchar("metaDescription", { length: 160 }),
  videoUrl: text("videoUrl"),
  hideAddress: boolean("hideAddress").default(false).notNull(),
  
  // Detalhes do imóvel
  hasServiceArea: boolean("hasServiceArea").default(false).notNull(),
  hasBedroomCloset: boolean("hasBedroomCloset").default(false).notNull(),
  hasKitchenCabinets: boolean("hasKitchenCabinets").default(false).notNull(),
  isFurnished: boolean("isFurnished").default(false).notNull(),
  hasAirConditioning: boolean("hasAirConditioning").default(false).notNull(),
  hasBarbecue: boolean("hasBarbecue").default(false).notNull(),
  hasBalcony: boolean("hasBalcony").default(false).notNull(),
  hasGourmetBalcony: boolean("hasGourmetBalcony").default(false).notNull(),
  hasServiceRoom: boolean("hasServiceRoom").default(false).notNull(),
  
  // Detalhes do condomínio
  isGatedCommunity: boolean("isGatedCommunity").default(false).notNull(),
  hasElevator: boolean("hasElevator").default(false).notNull(),
  has24hSecurity: boolean("has24hSecurity").default(false).notNull(),
  hasLobby: boolean("hasLobby").default(false).notNull(),
  allowsPets: boolean("allowsPets").default(false).notNull(),
  hasGym: boolean("hasGym").default(false).notNull(),
  hasPool: boolean("hasPool").default(false).notNull(),
  hasPartyRoom: boolean("hasPartyRoom").default(false).notNull(),
  hasGourmetSpace: boolean("hasGourmetSpace").default(false).notNull(),
  hasSauna: boolean("hasSauna").default(false).notNull(),
  hasVisitorParking: boolean("hasVisitorParking").default(false).notNull(),
  hasLaundry: boolean("hasLaundry").default(false).notNull(),
  
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

// ==========================================
// FOTOS DOS IMÓVEIS
// ==========================================

export const propertyImages = mysqlTable("property_images", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  url: text("url"),
  fileKey: varchar("fileKey", { length: 255 }),
  imageData: longtext("imageData"), // Armazena imagem em Base64
  mimeType: varchar("mimeType", { length: 50 }), // Tipo da imagem (image/jpeg, image/png, etc)
  caption: varchar("caption", { length: 255 }),
  order: int("order").default(0).notNull(),
  isMain: boolean("isMain").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PropertyImage = typeof propertyImages.$inferSelect;
export type InsertPropertyImage = typeof propertyImages.$inferInsert;

// ==========================================
// LEADS / CLIENTES
// ==========================================

export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  assignedUserId: int("assignedUserId"),
  propertyId: int("propertyId"),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  source: mysqlEnum("source", ["site", "whatsapp", "telefone", "indicacao", "portal", "facebook", "instagram", "google", "outro"]).default("site").notNull(),
  sourceDetail: varchar("sourceDetail", { length: 255 }),
  interestType: mysqlEnum("interestType", ["compra", "aluguel", "investimento", "outro"]),
  budget: decimal("budget", { precision: 15, scale: 2 }),
  message: text("message"),
  stage: mysqlEnum("stage", ["novo", "contato_inicial", "qualificado", "visita_agendada", "proposta", "negociacao", "fechado_ganho", "fechado_perdido"]).default("novo").notNull(),
  preferredPropertyTypes: json("preferredPropertyTypes").$type<string[]>(),
  preferredNeighborhoods: json("preferredNeighborhoods").$type<string[]>(),
  minBedrooms: int("minBedrooms"),
  maxBedrooms: int("maxBedrooms"),
  notes: text("notes"),
  lastContactAt: timestamp("lastContactAt"),
  nextFollowUpAt: timestamp("nextFollowUpAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ==========================================
// INTERAÇÕES / HISTÓRICO DE CONTATOS
// ==========================================

export const interactions = mysqlTable("interactions", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["ligacao", "whatsapp", "email", "visita", "reuniao", "proposta", "nota"]).notNull(),
  description: text("description").notNull(),
  outcome: varchar("outcome", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Interaction = typeof interactions.$inferSelect;
export type InsertInteraction = typeof interactions.$inferInsert;

// ==========================================
// AGENDAMENTOS / VISITAS
// ==========================================

export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  propertyId: int("propertyId"),
  leadId: int("leadId"),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  scheduledAt: timestamp("scheduledAt").notNull(),
  duration: int("duration").default(60).notNull(),
  status: mysqlEnum("status", ["agendado", "confirmado", "realizado", "cancelado", "reagendado"]).default("agendado").notNull(),
  location: varchar("location", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

// ==========================================
// CONFIGURAÇÕES DO SITE
// ==========================================

export const siteSettings = mysqlTable("site_settings", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().unique(),
  
  // Cores do tema
  primaryColor: varchar("primaryColor", { length: 7 }).default("#0F52BA"),
  secondaryColor: varchar("secondaryColor", { length: 7 }).default("#50C878"),
  accentColor: varchar("accentColor", { length: 7 }).default("#FF6B35"),
  backgroundColor: varchar("backgroundColor", { length: 7 }).default("#FFFFFF"),
  textColor: varchar("textColor", { length: 7 }).default("#1F2937"),
  
  // Tipografia
  fontFamily: varchar("fontFamily", { length: 100 }).default("Inter"),
  
  // Imagens e branding
  logoUrl: text("logoUrl"),
  faviconUrl: text("faviconUrl"),
  heroImageUrl: text("heroImageUrl"),
  heroTitle: varchar("heroTitle", { length: 100 }),
  heroSubtitle: varchar("heroSubtitle", { length: 200 }),
  
  // SEO
  siteTitle: varchar("siteTitle", { length: 70 }),
  siteDescription: varchar("siteDescription", { length: 160 }),
  
  // Analytics
  googleAnalyticsId: varchar("googleAnalyticsId", { length: 50 }),
  facebookPixelId: varchar("facebookPixelId", { length: 50 }),
  
  // Redes sociais
  facebookUrl: varchar("facebookUrl", { length: 255 }),
  instagramUrl: varchar("instagramUrl", { length: 255 }),
  linkedinUrl: varchar("linkedinUrl", { length: 255 }),
  youtubeUrl: varchar("youtubeUrl", { length: 255 }),
  tiktokUrl: varchar("tiktokUrl", { length: 255 }),
  
  // WhatsApp
  whatsappDefaultMessage: text("whatsappDefaultMessage"),
  
  // Domínio
  customDomain: varchar("customDomain", { length: 255 }),
  domainVerified: boolean("domainVerified").default(false),
  
  // Layout e estilo
  showHeroSearch: boolean("showHeroSearch").default(true),
  showFeaturedProperties: boolean("showFeaturedProperties").default(true),
  showTestimonials: boolean("showTestimonials").default(false),
  showAboutSection: boolean("showAboutSection").default(true),
  aboutText: text("aboutText"),
  
  // Contato
  showContactForm: boolean("showContactForm").default(true),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 20 }),
  contactAddress: text("contactAddress"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = typeof siteSettings.$inferInsert;

// ==========================================
// ADMINISTRADORES MASTER
// ==========================================

export const masterAdmins = mysqlTable("master_admins", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  isActive: boolean("isActive").default(true).notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MasterAdmin = typeof masterAdmins.$inferSelect;
export type InsertMasterAdmin = typeof masterAdmins.$inferInsert;

// ==========================================
// ASSINATURAS
// ==========================================

export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  planId: int("planId").notNull(),
  status: mysqlEnum("status", ["active", "canceled", "past_due", "trialing", "paused", "expired"]).default("trialing").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 100 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 100 }),
  stripePriceId: varchar("stripePriceId", { length: 100 }),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false),
  canceledAt: timestamp("canceledAt"),
  trialStart: timestamp("trialStart"),
  trialEnd: timestamp("trialEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ==========================================
// HISTÓRICO DE PAGAMENTOS
// ==========================================

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  subscriptionId: int("subscriptionId"),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 100 }),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 100 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
  status: mysqlEnum("status", ["pending", "succeeded", "failed", "refunded", "canceled"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  description: varchar("description", { length: 255 }),
  invoiceUrl: text("invoiceUrl"),
  receiptUrl: text("receiptUrl"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ==========================================
// LOGS DE ATIVIDADES DO SISTEMA
// ==========================================

export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  actorType: mysqlEnum("actorType", ["master_admin", "user", "system"]).notNull(),
  actorId: int("actorId"),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }),
  entityId: int("entityId"),
  details: json("details").$type<Record<string, any>>(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;


// ==========================================
// PARCERIAS ENTRE CORRETORES
// ==========================================

export const partnerships = mysqlTable("partnerships", {
  id: int("id").autoincrement().primaryKey(),
  requesterId: int("requesterId").notNull(), // Corretor que solicita a parceria
  partnerId: int("partnerId").notNull(), // Corretor que recebe a solicitação
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "canceled"]).default("pending").notNull(),
  shareAllProperties: boolean("shareAllProperties").default(false).notNull(), // Se compartilha todos os imóveis automaticamente
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
  rejectedAt: timestamp("rejectedAt"),
});

export type Partnership = typeof partnerships.$inferSelect;
export type InsertPartnership = typeof partnerships.$inferInsert;

// ==========================================
// COMPARTILHAMENTO DE IMÓVEIS
// ==========================================

export const propertyShares = mysqlTable("propertyShares", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(), // Imóvel sendo compartilhado
  ownerCompanyId: int("ownerCompanyId").notNull(), // Empresa dona do imóvel
  partnerCompanyId: int("partnerCompanyId").notNull(), // Empresa parceira que recebe o compartilhamento
  partnershipId: int("partnershipId").notNull(), // Referência à parceria
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "revoked", "inactive"]).default("pending").notNull(),
  partnerPropertyCode: varchar("partnerPropertyCode", { length: 50 }), // Código único do imóvel para o parceiro
  isHighlight: boolean("isHighlight").default(false).notNull(), // Se o parceiro marcou como destaque
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
});

export type PropertyShare = typeof propertyShares.$inferSelect;
export type InsertPropertyShare = typeof propertyShares.$inferInsert;

