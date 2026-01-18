/**
 * Serviço de integração com API do Cloudflare
 * 
 * Este serviço automatiza a configuração de domínios personalizados:
 * 1. Cria zona DNS no Cloudflare
 * 2. Configura registros DNS (CNAME para o servidor)
 * 3. Adiciona rota do Worker para proxy reverso
 * 4. Verifica status de propagação DNS
 */

import { ENV } from "./_core/env";

// Configurações do Cloudflare (serão adicionadas como variáveis de ambiente)
const CLOUDFLARE_API_URL = "https://api.cloudflare.com/client/v4";

interface CloudflareConfig {
  apiToken: string;
  accountId: string;
  workerScriptName: string;
}

function getCloudflareConfig(): CloudflareConfig | null {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const workerScriptName = process.env.CLOUDFLARE_WORKER_SCRIPT_NAME || "viabroker-proxy";

  console.log(`[Cloudflare] Checking config - apiToken: ${apiToken ? 'SET' : 'NOT SET'}, accountId: ${accountId ? 'SET' : 'NOT SET'}, workerScriptName: ${workerScriptName}`);

  if (!apiToken || !accountId) {
    console.warn("[Cloudflare] Credenciais não configuradas. Automação de domínios desabilitada.");
    return null;
  }

  console.log(`[Cloudflare] Config loaded successfully`);
  return { apiToken, accountId, workerScriptName };
}

/**
 * Faz requisição autenticada para a API do Cloudflare
 */
async function cloudflareRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; result?: T; errors?: any[]; messages?: any[] }> {
  const config = getCloudflareConfig();
  if (!config) {
    throw new Error("Cloudflare não configurado");
  }

  const response = await fetch(`${CLOUDFLARE_API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${config.apiToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();
  return data as { success: boolean; result?: T; errors?: any[]; messages?: any[] };
}

/**
 * Verifica se as credenciais do Cloudflare estão configuradas
 */
export function isCloudflareConfigured(): boolean {
  return getCloudflareConfig() !== null;
}

/**
 * Verifica se a API do Cloudflare está funcionando
 * Usa o endpoint /zones que funciona com permissão Zone → Zone → Read
 */
export async function verifyCloudflareConnection(): Promise<{
  success: boolean;
  message: string;
  accountName?: string;
}> {
  try {
    const config = getCloudflareConfig();
    if (!config) {
      return { success: false, message: "Credenciais do Cloudflare não configuradas" };
    }

    // Usa o endpoint /zones que funciona com permissão Zone → Zone → Read
    // O token "Edit zone DNS" tem essa permissão
    const response = await cloudflareRequest<any[]>(
      `/zones?account.id=${config.accountId}&per_page=1`
    );

    if (response.success) {
      return {
        success: true,
        message: "Conexão com Cloudflare estabelecida",
        accountName: config.accountId,
      };
    }

    return {
      success: false,
      message: response.errors?.[0]?.message || "Erro ao conectar com Cloudflare",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Lista todas as zonas da conta
 */
export async function listZones(): Promise<{
  success: boolean;
  zones?: Array<{ id: string; name: string; status: string }>;
  error?: string;
}> {
  try {
    const response = await cloudflareRequest<Array<{ id: string; name: string; status: string }>>(
      "/zones"
    );

    if (response.success) {
      return { success: true, zones: response.result };
    }

    return { success: false, error: response.errors?.[0]?.message };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
  }
}

/**
 * Busca zona por nome de domínio
 */
export async function getZoneByDomain(domain: string): Promise<{
  success: boolean;
  zone?: { id: string; name: string; status: string; nameServers: string[] };
  error?: string;
}> {
  try {
    // Remove www se presente para buscar a zona raiz
    const rootDomain = domain.replace(/^www\./, "");
    
    const response = await cloudflareRequest<Array<{
      id: string;
      name: string;
      status: string;
      name_servers: string[];
    }>>(`/zones?name=${rootDomain}`);

    if (response.success && response.result && response.result.length > 0) {
      const zone = response.result[0];
      return {
        success: true,
        zone: {
          id: zone.id,
          name: zone.name,
          status: zone.status,
          nameServers: zone.name_servers,
        },
      };
    }

    return { success: false, error: "Zona não encontrada" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
  }
}

/**
 * Cria uma nova zona DNS no Cloudflare
 */
export async function createZone(domain: string): Promise<{
  success: boolean;
  zone?: { id: string; name: string; status: string; nameServers: string[] };
  error?: string;
}> {
  try {
    const config = getCloudflareConfig();
    if (!config) {
      return { success: false, error: "Cloudflare não configurado" };
    }

    // Remove www se presente
    const rootDomain = domain.replace(/^www\./, "");

    // Verifica se a zona já existe
    const existingZone = await getZoneByDomain(rootDomain);
    if (existingZone.success && existingZone.zone) {
      console.log(`[Cloudflare] Zona já existe para ${rootDomain}`);
      return existingZone;
    }

    // Cria nova zona
    const response = await cloudflareRequest<{
      id: string;
      name: string;
      status: string;
      name_servers: string[];
    }>("/zones", {
      method: "POST",
      body: JSON.stringify({
        name: rootDomain,
        account: { id: config.accountId },
        jump_start: true, // Tenta importar registros DNS existentes
      }),
    });

    if (response.success && response.result) {
      console.log(`[Cloudflare] Zona criada para ${rootDomain}: ${response.result.id}`);
      return {
        success: true,
        zone: {
          id: response.result.id,
          name: response.result.name,
          status: response.result.status,
          nameServers: response.result.name_servers,
        },
      };
    }

    return {
      success: false,
      error: response.errors?.[0]?.message || "Erro ao criar zona",
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
  }
}

/**
 * Configura registros DNS para apontar para o servidor
 */
export async function configureDNSRecords(
  zoneId: string,
  domain: string,
  targetHost: string = "viabroker.onrender.com"
): Promise<{
  success: boolean;
  records?: Array<{ id: string; name: string; type: string; content: string }>;
  error?: string;
}> {
  try {
    const rootDomain = domain.replace(/^www\./, "");
    const records: Array<{ id: string; name: string; type: string; content: string }> = [];

    // Configurar registro CNAME para www
    const wwwRecord = await cloudflareRequest<{
      id: string;
      name: string;
      type: string;
      content: string;
    }>(`/zones/${zoneId}/dns_records`, {
      method: "POST",
      body: JSON.stringify({
        type: "CNAME",
        name: "www",
        content: targetHost,
        proxied: true, // Usar proxy do Cloudflare (SSL + CDN)
        ttl: 1, // Auto
      }),
    });

    if (wwwRecord.success && wwwRecord.result) {
      records.push(wwwRecord.result);
      console.log(`[Cloudflare] Registro CNAME www criado para ${rootDomain}`);
    }

    // Configurar registro CNAME para raiz (@) usando CNAME flattening
    const rootRecord = await cloudflareRequest<{
      id: string;
      name: string;
      type: string;
      content: string;
    }>(`/zones/${zoneId}/dns_records`, {
      method: "POST",
      body: JSON.stringify({
        type: "CNAME",
        name: "@",
        content: targetHost,
        proxied: true,
        ttl: 1,
      }),
    });

    if (rootRecord.success && rootRecord.result) {
      records.push(rootRecord.result);
      console.log(`[Cloudflare] Registro CNAME @ criado para ${rootDomain}`);
    }

    if (records.length === 0) {
      return {
        success: false,
        error: "Não foi possível criar nenhum registro DNS",
      };
    }

    return { success: true, records };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
  }
}

/**
 * Adiciona rota do Worker para o domínio
 */
export async function addWorkerRoute(
  zoneId: string,
  domain: string
): Promise<{
  success: boolean;
  route?: { id: string; pattern: string };
  error?: string;
}> {
  try {
    const config = getCloudflareConfig();
    if (!config) {
      return { success: false, error: "Cloudflare não configurado" };
    }

    const rootDomain = domain.replace(/^www\./, "");

    // Criar rota para www.dominio.com/*
    const wwwRoute = await cloudflareRequest<{ id: string; pattern: string }>(
      `/zones/${zoneId}/workers/routes`,
      {
        method: "POST",
        body: JSON.stringify({
          pattern: `www.${rootDomain}/*`,
          script: config.workerScriptName,
        }),
      }
    );

    // Criar rota para dominio.com/*
    const rootRoute = await cloudflareRequest<{ id: string; pattern: string }>(
      `/zones/${zoneId}/workers/routes`,
      {
        method: "POST",
        body: JSON.stringify({
          pattern: `${rootDomain}/*`,
          script: config.workerScriptName,
        }),
      }
    );

    if (wwwRoute.success || rootRoute.success) {
      console.log(`[Cloudflare] Rotas do Worker criadas para ${rootDomain}`);
      return {
        success: true,
        route: wwwRoute.result || rootRoute.result,
      };
    }

    return {
      success: false,
      error: wwwRoute.errors?.[0]?.message || rootRoute.errors?.[0]?.message || "Erro ao criar rota",
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
  }
}

/**
 * Verifica status do domínio no Cloudflare
 */
export async function checkDomainStatus(domain: string): Promise<{
  success: boolean;
  status: "not_found" | "pending" | "active" | "error";
  message: string;
  nameServers?: string[];
  sslStatus?: string;
}> {
  try {
    const zone = await getZoneByDomain(domain);

    if (!zone.success || !zone.zone) {
      return {
        success: false,
        status: "not_found",
        message: "Domínio não encontrado no Cloudflare",
      };
    }

    // Verificar status SSL
    const sslResponse = await cloudflareRequest<{ status: string }>(
      `/zones/${zone.zone.id}/ssl/verification`
    );

    return {
      success: true,
      status: zone.zone.status === "active" ? "active" : "pending",
      message: zone.zone.status === "active"
        ? "Domínio ativo e funcionando"
        : "Aguardando ativação. Configure os nameservers no seu registrador.",
      nameServers: zone.zone.nameServers,
      sslStatus: sslResponse.result?.status,
    };
  } catch (error) {
    return {
      success: false,
      status: "error",
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Configura domínio completo (zona + DNS + Worker)
 * Esta é a função principal que automatiza todo o processo
 */
export async function setupCustomDomain(domain: string): Promise<{
  success: boolean;
  message: string;
  step: "zone" | "dns" | "worker" | "complete";
  nameServers?: string[];
  error?: string;
}> {
  try {
    console.log(`[Cloudflare] Iniciando configuração do domínio: ${domain}`);

    // 1. Criar ou obter zona
    const zoneResult = await createZone(domain);
    if (!zoneResult.success || !zoneResult.zone) {
      return {
        success: false,
        message: zoneResult.error || "Erro ao criar zona DNS",
        step: "zone",
        error: zoneResult.error,
      };
    }

    const zoneId = zoneResult.zone.id;
    const nameServers = zoneResult.zone.nameServers;

    // 2. Configurar registros DNS
    const dnsResult = await configureDNSRecords(zoneId, domain);
    if (!dnsResult.success) {
      // Não é erro crítico se os registros já existem
      console.warn(`[Cloudflare] Aviso ao configurar DNS: ${dnsResult.error}`);
    }

    // 3. Adicionar rota do Worker
    const workerResult = await addWorkerRoute(zoneId, domain);
    if (!workerResult.success) {
      // Não é erro crítico se a rota já existe
      console.warn(`[Cloudflare] Aviso ao configurar Worker: ${workerResult.error}`);
    }

    console.log(`[Cloudflare] Configuração completa para ${domain}`);

    return {
      success: true,
      message: `Domínio configurado com sucesso! Configure os nameservers no seu registrador: ${nameServers.join(", ")}`,
      step: "complete",
      nameServers,
    };
  } catch (error) {
    console.error(`[Cloudflare] Erro ao configurar domínio ${domain}:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      step: "zone",
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Remove configuração de domínio do Cloudflare
 */
export async function removeCustomDomain(domain: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const zone = await getZoneByDomain(domain);
    
    if (!zone.success || !zone.zone) {
      return { success: true, message: "Domínio não encontrado no Cloudflare" };
    }

    // Deletar zona (isso remove todos os registros e rotas)
    const response = await cloudflareRequest(`/zones/${zone.zone.id}`, {
      method: "DELETE",
    });

    if (response.success) {
      console.log(`[Cloudflare] Zona removida para ${domain}`);
      return { success: true, message: "Domínio removido com sucesso" };
    }

    return {
      success: false,
      message: response.errors?.[0]?.message || "Erro ao remover domínio",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}


/**
 * Verifica a propagação DNS do domínio
 * Retorna o status detalhado de cada etapa da configuração
 */
export async function checkDNSPropagation(domain: string): Promise<{
  success: boolean;
  status: "not_configured" | "configuring" | "propagating" | "active" | "error";
  steps: {
    zoneCreated: boolean;
    nameserversConfigured: boolean;
    dnsRecordsCreated: boolean;
    workerRouteActive: boolean;
    sslActive: boolean;
    domainReachable: boolean;
  };
  message: string;
  nameServers?: string[];
  estimatedTime?: string;
}> {
  try {
    const rootDomain = domain.replace(/^www\./, "");
    
    // Inicializar status das etapas
    const steps = {
      zoneCreated: false,
      nameserversConfigured: false,
      dnsRecordsCreated: false,
      workerRouteActive: false,
      sslActive: false,
      domainReachable: false,
    };

    // 1. Verificar se a zona existe
    const zone = await getZoneByDomain(domain);
    if (!zone.success || !zone.zone) {
      return {
        success: false,
        status: "not_configured",
        steps,
        message: "Domínio não configurado no Cloudflare. Clique em 'Configurar Domínio' para iniciar.",
      };
    }

    steps.zoneCreated = true;
    const zoneId = zone.zone.id;
    const nameServers = zone.zone.nameServers;

    // 2. Verificar status da zona (nameservers configurados)
    if (zone.zone.status === "active") {
      steps.nameserversConfigured = true;
    }

    // 3. Verificar registros DNS
    const dnsResponse = await cloudflareRequest<Array<{
      id: string;
      name: string;
      type: string;
      content: string;
    }>>(`/zones/${zoneId}/dns_records?type=CNAME`);

    if (dnsResponse.success && dnsResponse.result) {
      const hasWwwRecord = dnsResponse.result.some(r => 
        r.name === `www.${rootDomain}` || r.name === "www"
      );
      const hasRootRecord = dnsResponse.result.some(r => 
        r.name === rootDomain || r.name === "@"
      );
      steps.dnsRecordsCreated = hasWwwRecord || hasRootRecord;
    }

    // 4. Verificar rotas do Worker
    const routesResponse = await cloudflareRequest<Array<{
      id: string;
      pattern: string;
      script: string;
    }>>(`/zones/${zoneId}/workers/routes`);

    if (routesResponse.success && routesResponse.result) {
      steps.workerRouteActive = routesResponse.result.some(r => 
        r.pattern.includes(rootDomain)
      );
    }

    // 5. Verificar SSL
    const sslResponse = await cloudflareRequest<{
      status: string;
      certificate_status: string;
    }>(`/zones/${zoneId}/ssl/verification`);

    if (sslResponse.success && sslResponse.result) {
      steps.sslActive = sslResponse.result.status === "active" || 
                        sslResponse.result.certificate_status === "active";
    }

    // 6. Verificar se o domínio está acessível (fazer uma requisição HTTP)
    try {
      const testUrl = `https://www.${rootDomain}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(testUrl, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
      });
      
      clearTimeout(timeoutId);
      steps.domainReachable = response.ok || response.status < 500;
    } catch (e) {
      // Domínio não acessível ainda
      steps.domainReachable = false;
    }

    // Determinar status geral
    let status: "not_configured" | "configuring" | "propagating" | "active" | "error";
    let message: string;
    let estimatedTime: string | undefined;

    if (steps.domainReachable && steps.sslActive && steps.nameserversConfigured) {
      status = "active";
      message = "Domínio totalmente configurado e funcionando!";
    } else if (!steps.nameserversConfigured) {
      status = "configuring";
      message = "Aguardando configuração dos nameservers no registrador do domínio.";
      estimatedTime = "Pode levar até 48 horas após a configuração";
    } else if (!steps.sslActive || !steps.domainReachable) {
      status = "propagating";
      message = "DNS propagando. O domínio estará disponível em breve.";
      estimatedTime = "Geralmente entre 5 minutos e 24 horas";
    } else {
      status = "configuring";
      message = "Configuração em andamento...";
    }

    return {
      success: true,
      status,
      steps,
      message,
      nameServers,
      estimatedTime,
    };
  } catch (error) {
    return {
      success: false,
      status: "error",
      steps: {
        zoneCreated: false,
        nameserversConfigured: false,
        dnsRecordsCreated: false,
        workerRouteActive: false,
        sslActive: false,
        domainReachable: false,
      },
      message: error instanceof Error ? error.message : "Erro ao verificar propagação DNS",
    };
  }
}
