import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { 
  sendVerificationEmail, 
  sendWelcomeEmail, 
  sendPasswordResetEmail 
} from "./email";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { sdk } from "./_core/sdk";

const JWT_SECRET = process.env.JWT_SECRET || "brokvia-secret-key-change-in-production";
const TRIAL_DAYS = 7;

// Gerar token aleatório
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Gerar OpenID único para usuários próprios
function generateOpenId(): string {
  return `brokvia_${crypto.randomBytes(16).toString("hex")}`;
}

// Calcular data de fim do trial
function calculateTrialEndDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + TRIAL_DAYS);
  return date;
}

// Gerar slug a partir do nome
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

export const authRouter = router({
  // Registro de novo usuário
  register: publicProcedure
    .input(z.object({
      name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
      email: z.string().email("Email inválido"),
      password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
      phone: z.string().optional(),
      companyName: z.string().min(2, "Nome da empresa/corretor deve ter pelo menos 2 caracteres"),
      personType: z.enum(["fisica", "juridica"]).default("fisica"),
      cpf: z.string().optional(),
      cnpj: z.string().optional(),
      creci: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Verificar se email já existe
      const existingUser = await db.getUserByEmail(input.email);
      if (existingUser) {
        throw new TRPCError({ 
          code: "CONFLICT", 
          message: "Este email já está cadastrado. Faça login ou use outro email." 
        });
      }

      // Hash da senha
      const passwordHash = await bcrypt.hash(input.password, 12);
      
      // Gerar tokens
      const openId = generateOpenId();
      const verificationToken = generateToken();
      const verificationExpires = new Date();
      verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 horas

      // Calcular trial
      const trialStartDate = new Date();
      const trialEndDate = calculateTrialEndDate();

      // Criar empresa primeiro
      const slug = generateSlug(input.companyName);
      let finalSlug = slug;
      let counter = 1;
      
      // Garantir slug único
      while (await db.getCompanyBySlug(finalSlug)) {
        finalSlug = `${slug}-${counter}`;
        counter++;
      }

      const company = await db.createCompany({
        name: input.companyName,
        slug: finalSlug,
        personType: input.personType,
        cpf: input.cpf,
        cnpj: input.cnpj,
        creci: input.creci,
        email: input.email,
        phone: input.phone,
        isActive: true,
      });

      // Criar usuário
      const user = await db.createUser({
        openId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        loginMethod: "email",
        role: "admin",
        companyId: company.id,
        passwordHash,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        trialStartDate,
        trialEndDate,
        isTrialExpired: false,
      });

      // Enviar email de verificação
      await sendVerificationEmail(input.email, input.name, verificationToken);

      return {
        success: true,
        message: "Conta criada com sucesso! Verifique seu email para ativar sua conta.",
        userId: user.id,
      };
    }),

  // Verificar email
  verifyEmail: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .mutation(async ({ input }) => {
      const user = await db.getUserByVerificationToken(input.token);
      
      if (!user) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Token inválido ou expirado. Solicite um novo link de verificação." 
        });
      }

      if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Token expirado. Solicite um novo link de verificação." 
        });
      }

      // Atualizar usuário como verificado
      await db.verifyUserEmail(user.id);

      // Enviar email de boas-vindas
      if (user.trialEndDate) {
        await sendWelcomeEmail(
          user.email || "",
          user.name || "Usuário",
          user.trialEndDate
        );
      }

      return {
        success: true,
        message: "Email verificado com sucesso! Você já pode fazer login.",
      };
    }),

  // Reenviar email de verificação
  resendVerification: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      const user = await db.getUserByEmail(input.email);
      
      if (!user) {
        // Não revelar se o email existe ou não
        return {
          success: true,
          message: "Se este email estiver cadastrado, você receberá um link de verificação.",
        };
      }

      if (user.emailVerified) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Este email já foi verificado. Faça login." 
        });
      }

      // Gerar novo token
      const verificationToken = generateToken();
      const verificationExpires = new Date();
      verificationExpires.setHours(verificationExpires.getHours() + 24);

      await db.updateUserVerificationToken(user.id, verificationToken, verificationExpires);

      // Enviar email
      await sendVerificationEmail(input.email, user.name || "Usuário", verificationToken);

      return {
        success: true,
        message: "Se este email estiver cadastrado, você receberá um link de verificação.",
      };
    }),

  // Login com email e senha
  login: publicProcedure
    .input(z.object({
      email: z.string().email("Email inválido"),
      password: z.string().min(1, "Senha é obrigatória"),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await db.getUserByEmail(input.email);
      
      if (!user || !user.passwordHash) {
        throw new TRPCError({ 
          code: "UNAUTHORIZED", 
          message: "Email ou senha incorretos" 
        });
      }

      const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
      
      if (!isValidPassword) {
        throw new TRPCError({ 
          code: "UNAUTHORIZED", 
          message: "Email ou senha incorretos" 
        });
      }

      if (!user.emailVerified) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "Email não verificado. Verifique sua caixa de entrada ou solicite um novo link." 
        });
      }

      // Verificar se a empresa está ativa
      if (user.companyId) {
        const company = await db.getCompanyById(user.companyId);
        if (company && !company.isActive) {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: "Sua conta foi desativada. Entre em contato com o suporte." 
          });
        }
      }

      // Atualizar último login
      await db.updateUserLastLogin(user.id);

      // Gerar token JWT
      const token = jwt.sign(
        { 
          userId: user.id, 
          openId: user.openId,
          email: user.email,
          companyId: user.companyId,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Criar cookie de sessão para integrar com o sistema de autenticação existente
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Verificar status do trial
      const now = new Date();
      const isTrialActive = user.trialEndDate && now < user.trialEndDate;
      const daysLeft = user.trialEndDate 
        ? Math.ceil((user.trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          avatarUrl: user.avatarUrl,
          trialEndDate: user.trialEndDate,
          isTrialActive,
          daysLeft: Math.max(0, daysLeft),
          isTrialExpired: user.isTrialExpired,
        },
      };
    }),

  // Login com Google
  googleLogin: publicProcedure
    .input(z.object({
      googleId: z.string(),
      email: z.string().email(),
      name: z.string(),
      avatarUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Verificar se já existe usuário com este Google ID
      let user = await db.getUserByGoogleId(input.googleId);
      
      if (!user) {
        // Verificar se existe usuário com este email
        user = await db.getUserByEmail(input.email);
        
        if (user) {
          // Vincular Google ID ao usuário existente
          await db.linkGoogleAccount(user.id, input.googleId, input.avatarUrl);
        } else {
          // Criar novo usuário e empresa
          const openId = generateOpenId();
          const trialStartDate = new Date();
          const trialEndDate = calculateTrialEndDate();
          
          // Gerar slug único
          const slug = generateSlug(input.name);
          let finalSlug = slug;
          let counter = 1;
          
          while (await db.getCompanyBySlug(finalSlug)) {
            finalSlug = `${slug}-${counter}`;
            counter++;
          }

          const company = await db.createCompany({
            name: input.name,
            slug: finalSlug,
            personType: "fisica",
            email: input.email,
            isActive: true,
          });

          user = await db.createUser({
            openId,
            name: input.name,
            email: input.email,
            loginMethod: "google",
            role: "admin",
            companyId: company.id,
            googleId: input.googleId,
            avatarUrl: input.avatarUrl,
            emailVerified: true, // Google já verifica o email
            trialStartDate,
            trialEndDate,
            isTrialExpired: false,
          });

          // Enviar email de boas-vindas
          await sendWelcomeEmail(input.email, input.name, trialEndDate);
        }
      }

      // Verificar se a empresa está ativa
      if (user.companyId) {
        const company = await db.getCompanyById(user.companyId);
        if (company && !company.isActive) {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: "Sua conta foi desativada. Entre em contato com o suporte." 
          });
        }
      }

      // Atualizar último login
      await db.updateUserLastLogin(user.id);

      // Gerar token JWT
      const token = jwt.sign(
        { 
          userId: user.id, 
          openId: user.openId,
          email: user.email,
          companyId: user.companyId,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Verificar status do trial
      const now = new Date();
      const isTrialActive = user.trialEndDate && now < user.trialEndDate;
      const daysLeft = user.trialEndDate 
        ? Math.ceil((user.trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          avatarUrl: user.avatarUrl,
          trialEndDate: user.trialEndDate,
          isTrialActive,
          daysLeft: Math.max(0, daysLeft),
          isTrialExpired: user.isTrialExpired,
        },
      };
    }),

  // Solicitar redefinição de senha
  forgotPassword: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      const user = await db.getUserByEmail(input.email);
      
      // Não revelar se o email existe
      if (!user) {
        return {
          success: true,
          message: "Se este email estiver cadastrado, você receberá instruções para redefinir sua senha.",
        };
      }

      // Gerar token de reset
      const resetToken = generateToken();
      const resetExpires = new Date();
      resetExpires.setHours(resetExpires.getHours() + 1); // 1 hora

      await db.updateUserPasswordResetToken(user.id, resetToken, resetExpires);

      // Enviar email
      await sendPasswordResetEmail(input.email, user.name || "Usuário", resetToken);

      return {
        success: true,
        message: "Se este email estiver cadastrado, você receberá instruções para redefinir sua senha.",
      };
    }),

  // Redefinir senha
  resetPassword: publicProcedure
    .input(z.object({
      token: z.string(),
      password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    }))
    .mutation(async ({ input }) => {
      const user = await db.getUserByPasswordResetToken(input.token);
      
      if (!user) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Token inválido ou expirado. Solicite um novo link." 
        });
      }

      if (user.passwordResetExpires && new Date() > user.passwordResetExpires) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Token expirado. Solicite um novo link." 
        });
      }

      // Hash da nova senha
      const passwordHash = await bcrypt.hash(input.password, 12);

      // Atualizar senha e limpar token
      await db.updateUserPassword(user.id, passwordHash);

      return {
        success: true,
        message: "Senha redefinida com sucesso! Você já pode fazer login.",
      };
    }),

  // Verificar token JWT
  verifyToken: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const decoded = jwt.verify(input.token, JWT_SECRET) as { 
          userId: number; 
          openId: string;
          email: string;
          companyId: number;
        };
        
        const user = await db.getUserById(decoded.userId);
        
        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não encontrado" });
        }

        // Verificar status do trial
        const now = new Date();
        const isTrialActive = user.trialEndDate && now < user.trialEndDate;
        const daysLeft = user.trialEndDate 
          ? Math.ceil((user.trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        return {
          valid: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
            avatarUrl: user.avatarUrl,
            trialEndDate: user.trialEndDate,
            isTrialActive,
            daysLeft: Math.max(0, daysLeft),
            isTrialExpired: user.isTrialExpired,
          },
        };
      } catch (error) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Token inválido ou expirado" });
      }
    }),

  // Obter status do trial
  getTrialStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const user = ctx.user;
      const now = new Date();
      
      const isTrialActive = user.trialEndDate && now < user.trialEndDate;
      const daysLeft = user.trialEndDate 
        ? Math.ceil((user.trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Verificar se tem assinatura ativa
      let hasActiveSubscription = false;
      if (user.companyId) {
        const subscription = await db.getSubscriptionByCompanyId(user.companyId);
        hasActiveSubscription = subscription?.status === "active";
      }

      return {
        trialStartDate: user.trialStartDate,
        trialEndDate: user.trialEndDate,
        isTrialActive,
        daysLeft: Math.max(0, daysLeft),
        isTrialExpired: user.isTrialExpired,
        hasActiveSubscription,
        needsSubscription: !isTrialActive && !hasActiveSubscription,
      };
    }),
});
