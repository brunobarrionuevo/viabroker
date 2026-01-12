import { Router } from "express";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { sdk } from "./_core/sdk";
import { sendWelcomeEmail } from "./email";
import crypto from "crypto";

const router = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const TRIAL_DAYS = 7;

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

// Rota para iniciar o fluxo de autenticação do Google
router.get("/api/auth/google", (req, res) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: "Google OAuth não configurado" });
  }

  // Usar VITE_APP_URL para produção ou construir dinamicamente para desenvolvimento
  const baseUrl = process.env.VITE_APP_URL || `${req.protocol}://${req.get("host")}`;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  const scope = encodeURIComponent("openid email profile");
  const state = crypto.randomBytes(16).toString("hex");
  
  // Salvar state na sessão para verificação posterior
  res.cookie("google_oauth_state", state, { 
    httpOnly: true, 
    secure: req.protocol === "https",
    maxAge: 10 * 60 * 1000 // 10 minutos
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&state=${state}` +
    `&access_type=offline` +
    `&prompt=consent`;

  res.redirect(authUrl);
});

// Callback do Google OAuth
router.get("/api/auth/google/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    const savedState = req.cookies?.google_oauth_state;

    // Verificar state para prevenir CSRF
    if (!state || state !== savedState) {
      return res.redirect("/login?error=invalid_state");
    }

    // Limpar cookie de state
    res.clearCookie("google_oauth_state");

    if (!code || typeof code !== "string") {
      return res.redirect("/login?error=no_code");
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.redirect("/login?error=oauth_not_configured");
    }

    // Usar VITE_APP_URL para produção ou construir dinamicamente para desenvolvimento
    const baseUrl = process.env.VITE_APP_URL || `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    // Trocar código por tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Erro ao trocar código por token:", await tokenResponse.text());
      return res.redirect("/login?error=token_exchange_failed");
    }

    const tokens = await tokenResponse.json();

    // Obter informações do usuário
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      return res.redirect("/login?error=user_info_failed");
    }

    const googleUser = await userInfoResponse.json();
    const { id: googleId, email, name, picture: avatarUrl } = googleUser;

    // Verificar se já existe usuário com este Google ID
    let user = await db.getUserByGoogleId(googleId);

    if (!user) {
      // Verificar se existe usuário com este email
      user = await db.getUserByEmail(email);

      if (user) {
        // Vincular Google ID ao usuário existente
        await db.linkGoogleAccount(user.id, googleId, avatarUrl);
      } else {
        // Criar novo usuário e empresa
        const openId = generateOpenId();
        const trialStartDate = new Date();
        const trialEndDate = calculateTrialEndDate();

        // Gerar slug único
        const slug = generateSlug(name);
        let finalSlug = slug;
        let counter = 1;

        while (await db.getCompanyBySlug(finalSlug)) {
          finalSlug = `${slug}-${counter}`;
          counter++;
        }

        const company = await db.createCompany({
          name: name,
          slug: finalSlug,
          personType: "fisica",
          isActive: true,
        });

        user = await db.createUser({
          openId,
          name,
          email,
          loginMethod: "google",
          role: "admin",
          companyId: company.id,
          googleId,
          avatarUrl,
          emailVerified: true, // Google já verifica o email
          trialStartDate,
          trialEndDate,
          isTrialExpired: false,
        });

        // Enviar email de boas-vindas
        try {
          await sendWelcomeEmail(email, name, trialEndDate);
        } catch (e) {
          console.error("Erro ao enviar email de boas-vindas:", e);
        }
      }
    }

    // Verificar se a empresa está ativa
    if (user.companyId) {
      const company = await db.getCompanyById(user.companyId);
      if (company && !company.isActive) {
        return res.redirect("/login?error=account_disabled");
      }
    }

    // Criar sessão usando o SDK do Manus
    const sessionToken = await sdk.createSessionToken(user.openId, {
      name: user.name || undefined,
    });

    // Definir cookie de sessão
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, {
      ...cookieOptions,
      maxAge: ONE_YEAR_MS,
    });

    // Verificar se precisa escolher plano
    if (user.isTrialExpired) {
      return res.redirect("/planos");
    }

    // Redirecionar para dashboard
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Erro no callback do Google OAuth:", error);
    res.redirect("/login?error=callback_failed");
  }
});

export default router;
