import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import jwt from "jsonwebtoken";
import * as db from "../db";

const JWT_SECRET = process.env.JWT_SECRET || "viabroker-secret-key-change-in-production";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

interface JWTPayload {
  userId: number;
  openId: string;
  email: string;
  companyId: number | null;
  iat: number;
  exp: number;
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Tentar obter token do cookie ou header Authorization
    const token = opts.req.cookies?.[COOKIE_NAME] || 
                  opts.req.headers.authorization?.replace("Bearer ", "");

    if (token) {
      // Verificar e decodificar JWT
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      
      if (decoded.userId) {
        // Buscar usuário no banco de dados
        const dbUser = await db.getUserById(decoded.userId);
        if (dbUser) {
          user = dbUser;
        }
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    // Token inválido ou expirado - usuário permanece null
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
