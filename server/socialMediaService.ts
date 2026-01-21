import { getDb } from "./db";
import { socialConnections, socialPosts } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// Configurações do Facebook App
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || "";
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || "";
const FACEBOOK_REDIRECT_URI = process.env.VITE_APP_URL 
  ? `${process.env.VITE_APP_URL}/api/social/facebook/callback`
  : "http://localhost:3000/api/social/facebook/callback";

// Permissões necessárias para publicação
const FACEBOOK_PERMISSIONS = [
  "pages_manage_posts",
  "pages_read_engagement",
  "pages_manage_engagement",
  "pages_read_user_content",
  "instagram_basic",
  "instagram_content_publish",
  "business_management",
].join(",");

/**
 * Gera a URL de autorização do Facebook OAuth
 */
export function getFacebookAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID,
    redirect_uri: FACEBOOK_REDIRECT_URI,
    scope: FACEBOOK_PERMISSIONS,
    response_type: "code",
    state: state,
  });
  
  return `https://www.facebook.com/v24.0/dialog/oauth?${params.toString()}`;
}

/**
 * Troca o código de autorização por um access token
 */
export async function exchangeCodeForToken(code: string): Promise<{
  accessToken: string;
  expiresIn: number;
  userId: string;
} | null> {
  try {
    const params = new URLSearchParams({
      client_id: FACEBOOK_APP_ID,
      client_secret: FACEBOOK_APP_SECRET,
      redirect_uri: FACEBOOK_REDIRECT_URI,
      code: code,
    });

    const response = await fetch(
      `https://graph.facebook.com/v24.0/oauth/access_token?${params.toString()}`
    );

    if (!response.ok) {
      console.error("Erro ao trocar código por token:", await response.text());
      return null;
    }

    const data = await response.json();
    
    // Obter informações do usuário
    const userResponse = await fetch(
      `https://graph.facebook.com/v24.0/me?access_token=${data.access_token}`
    );
    const userData = await userResponse.json();

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in || 5184000, // 60 dias padrão
      userId: userData.id,
    };
  } catch (error) {
    console.error("Erro ao trocar código por token:", error);
    return null;
  }
}

/**
 * Obtém as páginas do Facebook que o usuário gerencia
 */
export async function getFacebookPages(accessToken: string): Promise<Array<{
  id: string;
  name: string;
  accessToken: string;
  category: string;
  instagramBusinessAccountId?: string;
}>> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v24.0/me/accounts?fields=id,name,access_token,category,instagram_business_account&access_token=${accessToken}`
    );

    if (!response.ok) {
      console.error("Erro ao buscar páginas:", await response.text());
      return [];
    }

    const data = await response.json();
    
    return (data.data || []).map((page: any) => ({
      id: page.id,
      name: page.name,
      accessToken: page.access_token,
      category: page.category,
      instagramBusinessAccountId: page.instagram_business_account?.id,
    }));
  } catch (error) {
    console.error("Erro ao buscar páginas:", error);
    return [];
  }
}

/**
 * Publica um post no Facebook
 */
export async function publishToFacebook(
  pageId: string,
  pageAccessToken: string,
  message: string,
  imageUrl?: string
): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
  try {
    let endpoint = `https://graph.facebook.com/v24.0/${pageId}/feed`;
    const body: any = {
      message: message,
      access_token: pageAccessToken,
    };

    // Se tiver imagem, usar endpoint de fotos
    if (imageUrl) {
      endpoint = `https://graph.facebook.com/v24.0/${pageId}/photos`;
      body.url = imageUrl;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        success: false,
        error: data.error?.message || "Erro ao publicar no Facebook",
      };
    }

    const postId = data.post_id || data.id;
    return {
      success: true,
      postId: postId,
      postUrl: `https://www.facebook.com/${postId}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Erro ao publicar no Facebook",
    };
  }
}

/**
 * Publica um post no Instagram
 */
export async function publishToInstagram(
  igUserId: string,
  accessToken: string,
  caption: string,
  imageUrl: string
): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
  try {
    // Passo 1: Criar container de mídia
    const containerResponse = await fetch(
      `https://graph.facebook.com/v24.0/${igUserId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: caption,
          access_token: accessToken,
        }),
      }
    );

    const containerData = await containerResponse.json();

    if (!containerResponse.ok || containerData.error) {
      return {
        success: false,
        error: containerData.error?.message || "Erro ao criar container de mídia",
      };
    }

    const containerId = containerData.id;

    // Aguardar processamento (pode levar alguns segundos)
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Passo 2: Publicar o container
    const publishResponse = await fetch(
      `https://graph.facebook.com/v24.0/${igUserId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      }
    );

    const publishData = await publishResponse.json();

    if (!publishResponse.ok || publishData.error) {
      return {
        success: false,
        error: publishData.error?.message || "Erro ao publicar no Instagram",
      };
    }

    return {
      success: true,
      postId: publishData.id,
      postUrl: `https://www.instagram.com/p/${publishData.id}/`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Erro ao publicar no Instagram",
    };
  }
}

/**
 * Salva uma conexão social no banco de dados
 */
export async function saveSocialConnection(
  companyId: number,
  platform: "facebook" | "instagram",
  data: {
    platformUserId: string;
    platformPageId: string;
    platformPageName: string;
    platformUsername?: string;
    accessToken: string;
    accessTokenExpires?: Date;
  }
) {
  const db = await getDb();
  // Verificar se já existe uma conexão para esta página
  const existing = await db
    .select()
    .from(socialConnections)
    .where(
      and(
        eq(socialConnections.companyId, companyId),
        eq(socialConnections.platform, platform),
        eq(socialConnections.platformPageId, data.platformPageId)
      )
    );

  if (existing.length > 0) {
    // Atualizar conexão existente
    await db
      .update(socialConnections)
      .set({
        accessToken: data.accessToken,
        accessTokenExpires: data.accessTokenExpires,
        isActive: true,
        lastError: null,
      })
      .where(eq(socialConnections.id, existing[0].id));
    
    return existing[0].id;
  }

  // Criar nova conexão
  const result = await db.insert(socialConnections).values({
    companyId,
    platform,
    platformUserId: data.platformUserId,
    platformPageId: data.platformPageId,
    platformPageName: data.platformPageName,
    platformUsername: data.platformUsername,
    accessToken: data.accessToken,
    accessTokenExpires: data.accessTokenExpires,
    isActive: true,
  });

  return result[0].insertId;
}

/**
 * Obtém as conexões sociais de uma empresa
 */
export async function getSocialConnections(companyId: number) {
  const db = await getDb();
  return db
    .select({
      id: socialConnections.id,
      platform: socialConnections.platform,
      platformPageId: socialConnections.platformPageId,
      platformPageName: socialConnections.platformPageName,
      platformUsername: socialConnections.platformUsername,
      isActive: socialConnections.isActive,
      lastUsedAt: socialConnections.lastUsedAt,
      lastError: socialConnections.lastError,
      createdAt: socialConnections.createdAt,
    })
    .from(socialConnections)
    .where(eq(socialConnections.companyId, companyId));
}

/**
 * Remove uma conexão social
 */
export async function removeSocialConnection(connectionId: number, companyId: number) {
  const db = await getDb();
  await db
    .delete(socialConnections)
    .where(
      and(
        eq(socialConnections.id, connectionId),
        eq(socialConnections.companyId, companyId)
      )
    );
}

/**
 * Salva um post no histórico
 */
export async function saveSocialPost(data: {
  companyId: number;
  connectionId: number;
  propertyId?: number;
  platform: "facebook" | "instagram";
  postType: "text" | "photo" | "video" | "carousel";
  content: string;
  mediaUrls?: string[];
  platformPostId?: string;
  platformPostUrl?: string;
  status: "draft" | "scheduled" | "published" | "failed";
  errorMessage?: string;
}) {
  const db = await getDb();
  const result = await db.insert(socialPosts).values(data);
  return result[0].insertId;
}

/**
 * Obtém o histórico de posts de uma empresa
 */
export async function getSocialPostHistory(companyId: number, limit = 50) {
  const db = await getDb();
  return db
    .select()
    .from(socialPosts)
    .where(eq(socialPosts.companyId, companyId))
    .orderBy(socialPosts.createdAt)
    .limit(limit);
}
