import type { Request, Response, NextFunction } from "express";
import { getDb } from "../db";
import { siteSettings, companies } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Middleware para detectar e rotear domínios personalizados
 * 
 * Quando uma requisição chega com um hostname personalizado (ex: brunobarrionuevo.com.br),
 * este middleware:
 * 1. Verifica se o hostname é um domínio personalizado configurado
 * 2. Busca a empresa correspondente no banco de dados
 * 3. Redireciona internamente para /site/:slug
 * 
 * Isso permite que sites de corretores sejam acessados via domínio próprio
 * sem precisar da URL /site/:slug
 */

// Domínios que NÃO devem ser tratados como personalizados
const PLATFORM_DOMAINS = [
  'localhost',
  '127.0.0.1',
  '::1',
  'viabroker.com',
  'www.viabroker.com',
  'manus.computer',
  'manus.space',
];

// Cache de domínios para evitar consultas repetidas ao banco
const domainCache = new Map<string, { companySlug: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Verifica se o hostname é um domínio da plataforma
 */
function isPlatformDomain(hostname: string): boolean {
  // Verifica domínios exatos
  if (PLATFORM_DOMAINS.includes(hostname)) {
    return true;
  }
  
  // Verifica se termina com domínios da plataforma
  for (const domain of PLATFORM_DOMAINS) {
    if (hostname.endsWith(`.${domain}`)) {
      return true;
    }
  }
  
  // Verifica se é um IP
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(':')) {
    return true;
  }
  
  return false;
}

/**
 * Busca empresa por domínio personalizado (com cache)
 */
async function findCompanyByDomain(hostname: string): Promise<string | null> {
  // Verifica cache
  const cached = domainCache.get(hostname);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.companySlug;
  }
  
  try {
    const db = await getDb();
    if (!db) {
      console.error('[CustomDomain] Database not available');
      return null;
    }
    
    // Busca no banco de dados
    const result = await db
      .select({
        companySlug: siteSettings.companyId,
      })
      .from(siteSettings)
      .where(
        and(
          eq(siteSettings.customDomain, hostname),
          eq(siteSettings.domainVerified, true)
        )
      )
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    // Busca o slug da empresa
    const company = await db
      .select({ slug: companies.slug })
      .from(companies)
      .where(eq(companies.id, result[0].companySlug))
      .limit(1);
    
    if (company.length === 0) {
      return null;
    }
    
    const slug = company[0].slug;
    
    // Atualiza cache
    domainCache.set(hostname, {
      companySlug: slug,
      timestamp: Date.now(),
    });
    
    return slug;
  } catch (error) {
    console.error('[CustomDomain] Error finding company by domain:', error);
    return null;
  }
}

/**
 * Limpa cache de domínio específico
 */
export function clearDomainCache(hostname: string) {
  domainCache.delete(hostname);
}

/**
 * Limpa todo o cache de domínios
 */
export function clearAllDomainCache() {
  domainCache.clear();
}

/**
 * Middleware principal
 */
export async function customDomainMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const hostname = req.hostname;
    
    // Se é domínio da plataforma, continua normalmente
    if (isPlatformDomain(hostname)) {
      return next();
    }
    
    // Se já está acessando /site/:slug, não precisa redirecionar
    if (req.path.startsWith('/site/')) {
      return next();
    }
    
    // Se é uma rota de API, não redireciona
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    // Se é um arquivo estático (assets), não redireciona
    if (req.path.startsWith('/assets/') || 
        req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|map|json)$/)) {
      return next();
    }
    
    // Busca empresa por domínio personalizado
    const companySlug = await findCompanyByDomain(hostname);
    
    if (!companySlug) {
      // Domínio não encontrado ou não verificado
      console.log(`[CustomDomain] Domain not found or not verified: ${hostname}`);
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Domínio não configurado</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
              max-width: 600px;
            }
            h1 { font-size: 3rem; margin: 0 0 1rem; }
            p { font-size: 1.2rem; opacity: 0.9; line-height: 1.6; }
            .code { 
              background: rgba(255,255,255,0.1); 
              padding: 0.5rem 1rem; 
              border-radius: 0.5rem; 
              display: inline-block;
              margin-top: 1rem;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🌐 Domínio não configurado</h1>
            <p>
              O domínio <strong class="code">${hostname}</strong> não está configurado ou ainda não foi verificado.
            </p>
            <p>
              Se você é o proprietário deste domínio, acesse o painel de administração da Viabroker
              e verifique a configuração do seu domínio personalizado.
            </p>
          </div>
        </body>
        </html>
      `);
    }
    
    // Redireciona internamente para /site/:slug
    console.log(`[CustomDomain] Routing ${hostname} → /site/${companySlug}${req.path}`);
    req.url = `/site/${companySlug}${req.url}`;
    
    next();
  } catch (error) {
    console.error('[CustomDomain] Middleware error:', error);
    next();
  }
}
