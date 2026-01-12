import { eq, and, desc, asc, like, or, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  companies, InsertCompany, Company,
  plans, InsertPlan, Plan,
  properties, InsertProperty, Property,
  propertyImages, InsertPropertyImage, PropertyImage,
  leads, InsertLead, Lead,
  interactions, InsertInteraction, Interaction,
  appointments, InsertAppointment, Appointment,
  siteSettings, InsertSiteSettings, SiteSettings
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "phone", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserCompany(userId: number, companyId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ companyId }).where(eq(users.id, userId));
}

// ==========================================
// EMPRESAS / IMOBILIÁRIAS
// ==========================================

export async function createCompany(data: InsertCompany): Promise<Company> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(companies).values(data);
  const inserted = await db.select().from(companies).where(eq(companies.id, Number(result[0].insertId))).limit(1);
  return inserted[0];
}

export async function getCompanyById(id: number): Promise<Company | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return result[0];
}

export async function getCompanyBySlug(slug: string): Promise<Company | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(companies).where(eq(companies.slug, slug)).limit(1);
  return result[0];
}

export async function updateCompany(id: number, data: Partial<InsertCompany>): Promise<Company | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(companies).set(data).where(eq(companies.id, id));
  return getCompanyById(id);
}

// ==========================================
// PLANOS
// ==========================================

export async function getAllPlans(): Promise<Plan[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(plans).where(eq(plans.isActive, true)).orderBy(asc(plans.price));
}

export async function getPlanById(id: number): Promise<Plan | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
  return result[0];
}

export async function createPlan(data: InsertPlan): Promise<Plan> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(plans).values(data);
  const inserted = await db.select().from(plans).where(eq(plans.id, Number(result[0].insertId))).limit(1);
  return inserted[0];
}

// ==========================================
// IMÓVEIS
// ==========================================

export interface PropertyFilters {
  companyId?: number;
  userId?: number;
  type?: string;
  purpose?: string;
  city?: string;
  state?: string;
  neighborhood?: string;
  status?: string;
  isPublished?: boolean;
  isHighlight?: boolean;
  search?: string;
}

export async function getProperties(filters: PropertyFilters, limit = 50, offset = 0): Promise<Property[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  
  if (filters.companyId) conditions.push(eq(properties.companyId, filters.companyId));
  if (filters.userId) conditions.push(eq(properties.userId, filters.userId));
  if (filters.type) conditions.push(eq(properties.type, filters.type as any));
  if (filters.purpose) conditions.push(eq(properties.purpose, filters.purpose as any));
  if (filters.city) conditions.push(eq(properties.city, filters.city));
  if (filters.state) conditions.push(eq(properties.state, filters.state));
  if (filters.neighborhood) conditions.push(like(properties.neighborhood, `%${filters.neighborhood}%`));
  if (filters.status) conditions.push(eq(properties.status, filters.status as any));
  if (filters.isPublished !== undefined) conditions.push(eq(properties.isPublished, filters.isPublished));
  if (filters.isHighlight !== undefined) conditions.push(eq(properties.isHighlight, filters.isHighlight));
  
  if (filters.search) {
    conditions.push(
      or(
        like(properties.title, `%${filters.search}%`),
        like(properties.code, `%${filters.search}%`),
        like(properties.address, `%${filters.search}%`)
      )
    );
  }

  const query = db.select().from(properties);
  
  if (conditions.length > 0) {
    return query.where(and(...conditions)).orderBy(desc(properties.createdAt)).limit(limit).offset(offset);
  }
  
  return query.orderBy(desc(properties.createdAt)).limit(limit).offset(offset);
}

export async function getPropertyById(id: number): Promise<Property | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
  return result[0];
}

export async function createProperty(data: InsertProperty): Promise<Property> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (!data.slug) {
    data.slug = generateSlug(data.title);
  }
  
  const result = await db.insert(properties).values(data);
  const inserted = await db.select().from(properties).where(eq(properties.id, Number(result[0].insertId))).limit(1);
  return inserted[0];
}

export async function updateProperty(id: number, data: Partial<InsertProperty>): Promise<Property | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(properties).set(data).where(eq(properties.id, id));
  return getPropertyById(id);
}

export async function deleteProperty(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.delete(propertyImages).where(eq(propertyImages.propertyId, id));
  await db.delete(properties).where(eq(properties.id, id));
  return true;
}

export async function countProperties(companyId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(properties)
    .where(eq(properties.companyId, companyId));
  return result[0]?.count || 0;
}

// ==========================================
// IMAGENS DOS IMÓVEIS
// ==========================================

export async function getPropertyImages(propertyId: number): Promise<PropertyImage[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(propertyImages)
    .where(eq(propertyImages.propertyId, propertyId))
    .orderBy(asc(propertyImages.order));
}

export async function addPropertyImage(data: InsertPropertyImage): Promise<PropertyImage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(propertyImages).values(data);
  const inserted = await db.select().from(propertyImages).where(eq(propertyImages.id, Number(result[0].insertId))).limit(1);
  return inserted[0];
}

export async function deletePropertyImage(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.delete(propertyImages).where(eq(propertyImages.id, id));
  return true;
}

export async function updatePropertyImageOrder(id: number, order: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.update(propertyImages).set({ order }).where(eq(propertyImages.id, id));
  return true;
}

export async function setMainPropertyImage(propertyId: number, imageId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  // Primeiro, remove o flag isMain de todas as imagens do imóvel
  await db.update(propertyImages).set({ isMain: false }).where(eq(propertyImages.propertyId, propertyId));
  // Depois, define a imagem selecionada como principal
  await db.update(propertyImages).set({ isMain: true }).where(eq(propertyImages.id, imageId));
  return true;
}

export async function getPropertyMainImage(propertyId: number): Promise<PropertyImage | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  // Primeiro tenta buscar a imagem marcada como principal
  const mainImage = await db.select().from(propertyImages)
    .where(and(eq(propertyImages.propertyId, propertyId), eq(propertyImages.isMain, true)))
    .limit(1);
  if (mainImage.length > 0) return mainImage[0];
  // Se não houver, retorna a primeira imagem pela ordem
  const firstImage = await db.select().from(propertyImages)
    .where(eq(propertyImages.propertyId, propertyId))
    .orderBy(asc(propertyImages.order))
    .limit(1);
  return firstImage[0];
}

export async function getPropertiesMainImages(propertyIds: number[]): Promise<Map<number, string>> {
  const db = await getDb();
  if (!db || propertyIds.length === 0) return new Map();
  
  const images = await db.select().from(propertyImages)
    .where(inArray(propertyImages.propertyId, propertyIds))
    .orderBy(asc(propertyImages.order));
  
  const result = new Map<number, string>();
  for (const img of images) {
    // Se ainda não tem imagem para esse imóvel, ou se essa é a principal
    if (!result.has(img.propertyId) || img.isMain) {
      result.set(img.propertyId, img.url);
    }
  }
  return result;
}

export async function countPropertyImages(propertyId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(propertyImages).where(eq(propertyImages.propertyId, propertyId));
  return result[0]?.count || 0;
}

// ==========================================
// LEADS
// ==========================================

export interface LeadFilters {
  companyId?: number;
  assignedUserId?: number;
  stage?: string;
  source?: string;
  search?: string;
}

export async function getLeads(filters: LeadFilters, limit = 50, offset = 0): Promise<Lead[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  
  if (filters.companyId) conditions.push(eq(leads.companyId, filters.companyId));
  if (filters.assignedUserId) conditions.push(eq(leads.assignedUserId, filters.assignedUserId));
  if (filters.stage) conditions.push(eq(leads.stage, filters.stage as any));
  if (filters.source) conditions.push(eq(leads.source, filters.source as any));
  
  if (filters.search) {
    conditions.push(
      or(
        like(leads.name, `%${filters.search}%`),
        like(leads.email, `%${filters.search}%`),
        like(leads.phone, `%${filters.search}%`)
      )
    );
  }

  const query = db.select().from(leads);
  
  if (conditions.length > 0) {
    return query.where(and(...conditions)).orderBy(desc(leads.createdAt)).limit(limit).offset(offset);
  }
  
  return query.orderBy(desc(leads.createdAt)).limit(limit).offset(offset);
}

export async function getLeadById(id: number): Promise<Lead | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result[0];
}

export async function createLead(data: InsertLead): Promise<Lead> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(leads).values(data);
  const inserted = await db.select().from(leads).where(eq(leads.id, Number(result[0].insertId))).limit(1);
  return inserted[0];
}

export async function updateLead(id: number, data: Partial<InsertLead>): Promise<Lead | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(leads).set(data).where(eq(leads.id, id));
  return getLeadById(id);
}

export async function deleteLead(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.delete(interactions).where(eq(interactions.leadId, id));
  await db.delete(leads).where(eq(leads.id, id));
  return true;
}

export async function countLeads(companyId: number, stage?: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const conditions = [eq(leads.companyId, companyId)];
  if (stage) conditions.push(eq(leads.stage, stage as any));
  
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(and(...conditions));
  return result[0]?.count || 0;
}

// ==========================================
// INTERAÇÕES
// ==========================================

export async function getInteractions(leadId: number): Promise<Interaction[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(interactions)
    .where(eq(interactions.leadId, leadId))
    .orderBy(desc(interactions.createdAt));
}

export async function createInteraction(data: InsertInteraction): Promise<Interaction> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(interactions).values(data);
  const inserted = await db.select().from(interactions).where(eq(interactions.id, Number(result[0].insertId))).limit(1);
  await db.update(leads).set({ lastContactAt: new Date() }).where(eq(leads.id, data.leadId));
  return inserted[0];
}

// ==========================================
// AGENDAMENTOS
// ==========================================

export interface AppointmentFilters {
  companyId?: number;
  userId?: number;
  propertyId?: number;
  leadId?: number;
  status?: string;
}

export async function getAppointments(filters: AppointmentFilters, limit = 50, offset = 0): Promise<Appointment[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  
  if (filters.companyId) conditions.push(eq(appointments.companyId, filters.companyId));
  if (filters.userId) conditions.push(eq(appointments.userId, filters.userId));
  if (filters.propertyId) conditions.push(eq(appointments.propertyId, filters.propertyId));
  if (filters.leadId) conditions.push(eq(appointments.leadId, filters.leadId));
  if (filters.status) conditions.push(eq(appointments.status, filters.status as any));

  const query = db.select().from(appointments);
  
  if (conditions.length > 0) {
    return query.where(and(...conditions)).orderBy(asc(appointments.scheduledAt)).limit(limit).offset(offset);
  }
  
  return query.orderBy(asc(appointments.scheduledAt)).limit(limit).offset(offset);
}

export async function getAppointmentById(id: number): Promise<Appointment | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  return result[0];
}

export async function createAppointment(data: InsertAppointment): Promise<Appointment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(appointments).values(data);
  const inserted = await db.select().from(appointments).where(eq(appointments.id, Number(result[0].insertId))).limit(1);
  return inserted[0];
}

export async function updateAppointment(id: number, data: Partial<InsertAppointment>): Promise<Appointment | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  await db.update(appointments).set(data).where(eq(appointments.id, id));
  return getAppointmentById(id);
}

export async function deleteAppointment(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.delete(appointments).where(eq(appointments.id, id));
  return true;
}

export async function countAppointments(companyId: number, status?: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const conditions = [eq(appointments.companyId, companyId)];
  if (status) conditions.push(eq(appointments.status, status as any));
  
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(appointments)
    .where(and(...conditions));
  return result[0]?.count || 0;
}

// ==========================================
// CONFIGURAÇÕES DO SITE
// ==========================================

export async function getSiteSettings(companyId: number): Promise<SiteSettings | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(siteSettings).where(eq(siteSettings.companyId, companyId)).limit(1);
  return result[0];
}

export async function upsertSiteSettings(companyId: number, data: Partial<InsertSiteSettings>): Promise<SiteSettings> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getSiteSettings(companyId);
  
  if (existing) {
    await db.update(siteSettings).set(data).where(eq(siteSettings.companyId, companyId));
  } else {
    await db.insert(siteSettings).values({ ...data, companyId });
  }
  
  return (await getSiteSettings(companyId))!;
}

// ==========================================
// DASHBOARD STATS
// ==========================================

export async function getDashboardStats(companyId: number) {
  const [propertiesCount, leadsCount, appointmentsCount, newLeadsCount] = await Promise.all([
    countProperties(companyId),
    countLeads(companyId),
    countAppointments(companyId, 'agendado'),
    countLeads(companyId, 'novo')
  ]);

  return {
    totalProperties: propertiesCount,
    totalLeads: leadsCount,
    pendingAppointments: appointmentsCount,
    newLeads: newLeadsCount
  };
}

// ==========================================
// HELPERS
// ==========================================

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 100);
}
