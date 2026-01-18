import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import * as db from "../db";

export const systemRouter = router({
  // Endpoint temporário para debug - REMOVER APÓS USO
  debugUsers: publicProcedure
    .input(z.object({ email: z.string().optional() }))
    .query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) return { error: "Database not available" };
      
      const { users } = await import("../../drizzle/schema");
      const { eq, or } = await import("drizzle-orm");
      
      let result;
      if (input.email) {
        result = await database.select({
          id: users.id,
          email: users.email,
          companyId: users.companyId,
          name: users.name
        }).from(users).where(or(eq(users.email, input.email), eq(users.id, 1)));
      } else {
        result = await database.select({
          id: users.id,
          email: users.email,
          companyId: users.companyId,
          name: users.name
        }).from(users).where(eq(users.id, 1));
      }
      
      return { users: result, timestamp: new Date().toISOString() };
    }),
    
  // Endpoint para deletar usuário com ID 1 se existir
  deleteUserById1: publicProcedure
    .mutation(async () => {
      const database = await db.getDb();
      if (!database) return { error: "Database not available" };
      
      const { users } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      // Verificar se existe usuário com ID 1
      const existing = await database.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, 1));
      
      if (existing.length === 0) {
        return { success: false, message: "Usuário com ID 1 não existe" };
      }
      
      // Deletar usuário com ID 1
      await database.delete(users).where(eq(users.id, 1));
      
      return { success: true, message: "Usuário com ID 1 deletado", deletedUser: existing[0] };
    }),

  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});
