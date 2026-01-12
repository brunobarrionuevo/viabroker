import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

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
  url: text("url").notNull(),
  fileKey: varchar("fileKey", { length: 255 }),
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
  primaryColor: varchar("primaryColor", { length: 7 }).default("#0F52BA"),
  secondaryColor: varchar("secondaryColor", { length: 7 }).default("#50C878"),
  fontFamily: varchar("fontFamily", { length: 100 }).default("Inter"),
  siteTitle: varchar("siteTitle", { length: 70 }),
  siteDescription: varchar("siteDescription", { length: 160 }),
  googleAnalyticsId: varchar("googleAnalyticsId", { length: 50 }),
  facebookPixelId: varchar("facebookPixelId", { length: 50 }),
  facebookUrl: varchar("facebookUrl", { length: 255 }),
  instagramUrl: varchar("instagramUrl", { length: 255 }),
  linkedinUrl: varchar("linkedinUrl", { length: 255 }),
  youtubeUrl: varchar("youtubeUrl", { length: 255 }),
  whatsappDefaultMessage: text("whatsappDefaultMessage"),
  customDomain: varchar("customDomain", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = typeof siteSettings.$inferInsert;