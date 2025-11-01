import { storagePut, storageGet } from "../../../storage-hybrid";

/**
 * Upload Service para Technical Reports
 * 
 * Gerencia upload de arquivos para S3 com organização por tenant
 */

export interface UploadFileParams {
  tenantId: string;
  userId: string;
  filename: string;
  data: Buffer | Uint8Array | string;
  contentType: string;
  category?: "reports" | "uploads" | "exports" | "logos";
}

export interface UploadResult {
  key: string;
  url: string;
  filename: string;
  size: number;
  uploadedAt: string;
}

/**
 * Faz upload de arquivo para S3
 */
export async function uploadFile(params: UploadFileParams): Promise<UploadResult> {
  const {
    tenantId,
    userId,
    filename,
    data,
    contentType,
    category = "uploads",
  } = params;

  // Gerar chave única no S3
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `tenants/${tenantId}/${category}/${timestamp}-${sanitizedFilename}`;

  // Upload para S3
  const result = await storagePut(key, data, contentType);

  // Calcular tamanho
  const size = typeof data === "string" 
    ? Buffer.byteLength(data, "utf8")
    : data.length;

  return {
    key: result.key,
    url: result.url,
    filename: sanitizedFilename,
    size,
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * Obtém URL de download de um arquivo
 */
export async function getFileUrl(key: string, expiresIn = 3600): Promise<string> {
  const result = await storageGet(key, expiresIn);
  return result.url;
}

/**
 * Gera URL pré-assinada para upload direto do cliente
 * (Placeholder - implementação real requer SDK AWS)
 */
export function generatePresignedUploadUrl(
  tenantId: string,
  filename: string,
  contentType: string
): { uploadUrl: string; key: string; expiresIn: number } {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `tenants/${tenantId}/uploads/${timestamp}-${sanitizedFilename}`;

  // TODO: Implementar geração real de URL pré-assinada com AWS SDK
  return {
    uploadUrl: `https://placeholder-s3-upload.com/${key}`,
    key,
    expiresIn: 3600,
  };
}

/**
 * Valida tipo de arquivo permitido
 */
export function validateFileType(
  filename: string,
  allowedExtensions: string[] = [".pdf", ".docx", ".xlsx", ".csv", ".txt"]
): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf("."));
  return allowedExtensions.includes(ext);
}

/**
 * Valida tamanho do arquivo
 */
export function validateFileSize(
  size: number,
  maxSizeMB: number = 50
): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return size <= maxBytes;
}

