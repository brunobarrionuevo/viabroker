import { Router } from "express";

const router = Router();

// Token de verificação do Webhook - pode ser qualquer string que você definir no Facebook
const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || "viabroker_webhook_verify_2024";

/**
 * Endpoint de verificação do Webhook do Facebook
 * O Facebook envia uma requisição GET para verificar se o endpoint é válido
 * 
 * Parâmetros que o Facebook envia:
 * - hub.mode: deve ser "subscribe"
 * - hub.verify_token: o token que você configurou no Facebook
 * - hub.challenge: string que deve ser retornada para confirmar
 */
router.get("/api/webhook/facebook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("[Facebook Webhook] Verification request received:", {
    mode,
    token: token ? "***" : undefined,
    challenge: challenge ? "present" : undefined,
  });

  // Verifica se o modo e o token estão corretos
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[Facebook Webhook] Verification successful!");
    // Retorna o challenge para confirmar a verificação
    res.status(200).send(challenge);
  } else {
    console.log("[Facebook Webhook] Verification failed - invalid token or mode");
    res.status(403).send("Forbidden");
  }
});

/**
 * Endpoint para receber eventos do Webhook do Facebook
 * O Facebook envia uma requisição POST quando há novos eventos
 */
router.post("/api/webhook/facebook", (req, res) => {
  const body = req.body;

  console.log("[Facebook Webhook] Event received:", JSON.stringify(body, null, 2));

  // Verifica se é um evento de página
  if (body.object === "page" || body.object === "instagram") {
    // Processa cada entrada
    body.entry?.forEach((entry: any) => {
      // Processa cada evento de mensagem ou mudança
      entry.messaging?.forEach((event: any) => {
        console.log("[Facebook Webhook] Messaging event:", event);
        // Aqui você pode processar mensagens recebidas, etc.
      });

      entry.changes?.forEach((change: any) => {
        console.log("[Facebook Webhook] Change event:", change);
        // Aqui você pode processar mudanças em posts, comentários, etc.
      });
    });

    // Retorna 200 OK para confirmar recebimento
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Retorna 404 para eventos não reconhecidos
    res.status(404).send("Not Found");
  }
});

/**
 * Endpoint de callback do OAuth do Facebook
 * Recebe o código de autorização após o usuário autorizar o app
 */
router.get("/api/oauth/facebook/callback", async (req, res) => {
  const { code, state, error, error_description } = req.query;

  console.log("[Facebook OAuth] Callback received:", {
    code: code ? "present" : undefined,
    state: state ? "present" : undefined,
    error,
    error_description,
  });

  // Se houve erro na autorização
  if (error) {
    console.error("[Facebook OAuth] Authorization error:", error, error_description);
    return res.redirect(`/dashboard/marketing?error=${encodeURIComponent(error_description as string || error as string)}`);
  }

  // Se não há código, algo deu errado
  if (!code || !state) {
    console.error("[Facebook OAuth] Missing code or state");
    return res.redirect("/dashboard/marketing?error=missing_params");
  }

  try {
    // Decodifica o state para obter informações do usuário
    const stateData = JSON.parse(Buffer.from(state as string, "base64").toString("utf-8"));
    const { companyId, platform } = stateData;

    console.log("[Facebook OAuth] State decoded:", { companyId, platform });

    // Importa o serviço de redes sociais
    const { exchangeCodeForToken, saveSocialConnection } = await import("./socialMediaService");

    // Troca o código por um token de acesso
    const tokenData = await exchangeCodeForToken(code as string);

    if (!tokenData || !tokenData.accessToken) {
      throw new Error("Failed to get access token");
    }

    // Salva a conexão no banco de dados
    await saveSocialConnection(
      companyId,
      platform || "facebook",
      {
        platformUserId: tokenData.userId,
        platformPageId: tokenData.userId, // Será atualizado quando selecionar a página
        platformPageName: "Conta conectada",
        accessToken: tokenData.accessToken,
        accessTokenExpires: tokenData.expiresIn 
          ? new Date(Date.now() + tokenData.expiresIn * 1000)
          : undefined,
      }
    );

    console.log("[Facebook OAuth] Connection saved successfully");

    // Redireciona para a página de marketing com sucesso
    res.redirect(`/dashboard/marketing?success=connected&platform=${platform || "facebook"}`);
  } catch (err) {
    console.error("[Facebook OAuth] Error processing callback:", err);
    res.redirect(`/dashboard/marketing?error=${encodeURIComponent("Erro ao conectar conta. Tente novamente.")}`);
  }
});

export const facebookWebhookRouter = router;
