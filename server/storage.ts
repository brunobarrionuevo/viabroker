// Storage helpers with AWS S3 support
// Uses Forge API when available, falls back to direct AWS S3

import { ENV } from './_core/env';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

type StorageConfig = { baseUrl: string; apiKey: string };

// Verificar se Forge API está disponível
function getForgeConfig(): StorageConfig | null {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;

  if (!baseUrl || !apiKey) {
    return null;
  }

  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

// Verificar se AWS S3 está configurado
function getS3Config() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION || 'us-east-1';

  if (!accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }

  return { accessKeyId, secretAccessKey, bucket, region };
}

// Criar cliente S3
function createS3Client() {
  const config = getS3Config();
  if (!config) return null;

  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

// Upload direto para AWS S3
async function uploadToS3(
  key: string,
  data: Buffer | Uint8Array | string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const config = getS3Config();
  if (!config) {
    throw new Error('AWS S3 não configurado. Configure AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY e AWS_S3_BUCKET.');
  }

  const s3Client = createS3Client();
  if (!s3Client) {
    throw new Error('Não foi possível criar cliente S3.');
  }

  const buffer = typeof data === 'string' ? Buffer.from(data) : Buffer.from(data);

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  
  // Retornar URL pública do objeto
  const url = `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
  return { key, url };
}

// Obter URL de download do S3
async function getS3Url(key: string): Promise<string> {
  const config = getS3Config();
  if (!config) {
    throw new Error('AWS S3 não configurado.');
  }

  const s3Client = createS3Client();
  if (!s3Client) {
    throw new Error('Não foi possível criar cliente S3.');
  }

  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: key,
  });

  // Gerar URL assinada válida por 1 hora
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return url;
}

// Funções auxiliares para Forge API
function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(
  baseUrl: string,
  relKey: string,
  apiKey: string
): Promise<string> {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey),
  });
  return (await response.json()).url;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string
): FormData {
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

// Função principal de upload - tenta Forge API primeiro, depois S3
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  
  // Tentar Forge API primeiro (Manus hosting)
  const forgeConfig = getForgeConfig();
  if (forgeConfig) {
    console.log('[Storage] Using Forge API for upload');
    const { baseUrl, apiKey } = forgeConfig;
    const uploadUrl = buildUploadUrl(baseUrl, key);
    const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: buildAuthHeaders(apiKey),
      body: formData,
    });

    if (!response.ok) {
      const message = await response.text().catch(() => response.statusText);
      throw new Error(
        `Storage upload failed (${response.status} ${response.statusText}): ${message}`
      );
    }
    const url = (await response.json()).url;
    return { key, url };
  }

  // Fallback para AWS S3 direto
  const s3Config = getS3Config();
  if (s3Config) {
    console.log('[Storage] Using direct AWS S3 for upload');
    return uploadToS3(key, data, contentType);
  }

  // Nenhum storage configurado
  throw new Error(
    'Storage não configurado. Configure BUILT_IN_FORGE_API_URL/BUILT_IN_FORGE_API_KEY (Manus) ou AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY/AWS_S3_BUCKET (AWS S3).'
  );
}

// Função principal de download - tenta Forge API primeiro, depois S3
export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  
  // Tentar Forge API primeiro (Manus hosting)
  const forgeConfig = getForgeConfig();
  if (forgeConfig) {
    const { baseUrl, apiKey } = forgeConfig;
    return {
      key,
      url: await buildDownloadUrl(baseUrl, key, apiKey),
    };
  }

  // Fallback para AWS S3 direto
  const s3Config = getS3Config();
  if (s3Config) {
    return {
      key,
      url: await getS3Url(key),
    };
  }

  // Nenhum storage configurado
  throw new Error(
    'Storage não configurado. Configure as variáveis de ambiente necessárias.'
  );
}
