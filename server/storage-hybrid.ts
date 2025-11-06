/**
 * Hybrid Storage System - QIVO Mining
 * 
 * Estratégia de storage em camadas:
 * 1. Render Persistent Disk (principal) - para arquivos locais
 * 2. Cloudinary (backup/CDN) - para URLs públicas gratuitas
 * 3. BUILT_IN_FORGE (alternativo) - para URLs públicas se disponível
 * 
 * Features:
 * - Salva arquivos localmente no Render Disk (se disponível)
 * - Faz upload para Cloudinary para gerar URL pública (gratuito)
 * - Fallback para BUILT_IN_FORGE se Cloudinary não configurado
 * - Fallback automático se Render Disk não estiver configurado
 */

import fs from 'fs/promises';
import path from 'path';
import { ENV } from './_core/env';
import {
  initCloudinary,
  isCloudinaryConfigured,
  cloudinaryUpload,
  cloudinaryGetUrl,
  getCloudinaryStatus,
} from './storage-cloudinary';
import { Storage } from '@google-cloud/storage';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const RENDER_DISK_PATH = process.env.RENDER_DISK_PATH || '/var/data/uploads';
const USE_RENDER_DISK = process.env.USE_RENDER_DISK === 'true';
const FORGE_API_URL = ENV.forgeApiUrl;
const FORGE_API_KEY = ENV.forgeApiKey;
const GCS_BUCKET = process.env.GCS_BUCKET || '';
const USE_GCS = !!GCS_BUCKET;

// Inicializar GCS se configurado
let gcsStorage: Storage | null = null;
if (USE_GCS) {
  try {
    gcsStorage = new Storage();
    console.log('✅ Google Cloud Storage initialized');
  } catch (error) {
    console.error('❌ Failed to initialize GCS:', error);
  }
}

// ============================================================================
// TIPOS
// ============================================================================

export interface StorageResult {
  key: string;
  url: string;
  localPath?: string;
  provider: 'render-disk' | 'cloudinary' | 'forge' | 'hybrid-cloudinary' | 'hybrid-forge' | 'gcs' | 'hybrid-gcs';
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, '');
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

function toFormData(
  data: Buffer | Uint8Array | string,
  contentType: string,
  fileName: string
): FormData {
  const blob =
    typeof data === 'string'
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append('file', blob, fileName || 'file');
  return form;
}

// ============================================================================
// RENDER DISK OPERATIONS
// ============================================================================

async function isRenderDiskAvailable(): Promise<boolean> {
  if (!USE_RENDER_DISK) return false;
  
  try {
    await fs.access(RENDER_DISK_PATH);
    return true;
  } catch {
    console.warn('⚠️ Render Disk not available at:', RENDER_DISK_PATH);
    return false;
  }
}

async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error('Error creating directory:', error);
    throw error;
  }
}

async function saveToRenderDisk(
  relKey: string,
  data: Buffer | Uint8Array | string
): Promise<string> {
  const normalizedKey = normalizeKey(relKey);
  const localPath = path.join(RENDER_DISK_PATH, normalizedKey);
  
  // Garantir que o diretório existe
  await ensureDirectory(path.dirname(localPath));
  
  // Salvar arquivo
  const buffer = typeof data === 'string' ? Buffer.from(data) : Buffer.from(data);
  await fs.writeFile(localPath, buffer);
  
  console.log('✅ Saved to Render Disk:', localPath);
  return localPath;
}

async function readFromRenderDisk(relKey: string): Promise<Buffer> {
  const normalizedKey = normalizeKey(relKey);
  const localPath = path.join(RENDER_DISK_PATH, normalizedKey);
  
  try {
    // Verificar se o arquivo existe primeiro
    try {
      await fs.access(localPath, fs.constants.R_OK);
    } catch (accessError: any) {
      throw new Error(`File not accessible or does not exist: ${localPath}. Error: ${accessError.message}`);
    }
    
    const buffer = await fs.readFile(localPath);
    console.log('✅ Read from Render Disk:', localPath, `(${buffer.length} bytes)`);
    return buffer;
  } catch (error: any) {
    console.error('❌ Error reading from Render Disk:', {
      path: localPath,
      error: error.message,
      code: error.code,
    });
    throw error;
  }
}

// ============================================================================
// GCS OPERATIONS
// ============================================================================

async function uploadToGCS(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType: string
): Promise<string> {
  if (!gcsStorage || !GCS_BUCKET) {
    throw new Error('GCS not configured: set GCS_BUCKET environment variable');
  }

  const key = normalizeKey(relKey);
  const bucket = gcsStorage.bucket(GCS_BUCKET);
  const file = bucket.file(key);

  const buffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data);

  await file.save(buffer, {
    contentType,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });

  // Tornar arquivo público
  await file.makePublic();

  const url = `https://storage.googleapis.com/${GCS_BUCKET}/${key}`;
  console.log('✅ Uploaded to GCS:', url);
  return url;
}

async function getGCSDownloadUrl(relKey: string): Promise<string> {
  if (!gcsStorage || !GCS_BUCKET) {
    throw new Error('GCS not configured');
  }

  const key = normalizeKey(relKey);
  return `https://storage.googleapis.com/${GCS_BUCKET}/${key}`;
}

// ============================================================================
// FORGE OPERATIONS (Fallback)
// ============================================================================

function isForgeAvailable(): boolean {
  return !!(FORGE_API_URL && FORGE_API_KEY);
}

async function uploadToForge(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType: string
): Promise<string> {
  if (!FORGE_API_URL || !FORGE_API_KEY) {
    throw new Error(
      'BUILT_IN_FORGE not configured: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY'
    );
  }

  const key = normalizeKey(relKey);
  const uploadUrl = new URL('v1/storage/upload', ensureTrailingSlash(FORGE_API_URL));
  uploadUrl.searchParams.set('path', key);
  
  const formData = toFormData(data, contentType, key.split('/').pop() ?? key);
  
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: buildAuthHeaders(FORGE_API_KEY),
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `FORGE upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  
  const result = await response.json();
  console.log('✅ Uploaded to FORGE:', result.url);
  return result.url;
}

async function getForgeDownloadUrl(relKey: string): Promise<string> {
  if (!FORGE_API_URL || !FORGE_API_KEY) {
    throw new Error('BUILT_IN_FORGE not configured');
  }

  const key = normalizeKey(relKey);
  const downloadApiUrl = new URL(
    'v1/storage/downloadUrl',
    ensureTrailingSlash(FORGE_API_URL)
  );
  downloadApiUrl.searchParams.set('path', key);
  
  const response = await fetch(downloadApiUrl, {
    method: 'GET',
    headers: buildAuthHeaders(FORGE_API_KEY),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get download URL: ${response.statusText}`);
  }
  
  const result = await response.json();
  return result.url;
}

// ============================================================================
// HYBRID STORAGE API
// ============================================================================

/**
 * Upload de arquivo com estratégia híbrida:
 * 1. Salva no Render Disk (se disponível)
 * 2. Faz upload para Cloudinary para gerar URL pública (preferencial)
 * 3. Fallback para FORGE se Cloudinary não disponível
 * 4. Fallback para apenas Render Disk se nenhum CDN disponível
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = 'application/octet-stream'
): Promise<StorageResult> {
  const renderDiskAvailable = await isRenderDiskAvailable();
  const cloudinaryAvailable = isCloudinaryConfigured();
  const forgeAvailable = isForgeAvailable();
  const gcsAvailable = USE_GCS && !!gcsStorage;

  if (!renderDiskAvailable && !cloudinaryAvailable && !forgeAvailable && !gcsAvailable) {
    throw new Error(
      'No storage backend available. Configure RENDER_DISK_PATH, CLOUDINARY, GCS_BUCKET, or BUILT_IN_FORGE credentials.'
    );
  }

  let localPath: string | undefined;
  let publicUrl: string;
  let provider: StorageResult['provider'];

  // Estratégia 1: GCS (Google Cloud Storage) - PRIORIDADE MÁXIMA
  if (gcsAvailable) {
    console.log('📦 Using GCS (Google Cloud Storage)');
    
    publicUrl = await uploadToGCS(relKey, data, contentType);
    provider = 'gcs';
  }
  // Estratégia 2: Híbrido (Render Disk + GCS)
  else if (renderDiskAvailable && gcsAvailable) {
    console.log('📦 Using HYBRID storage (Render Disk + GCS)');
    
    // Salvar localmente
    localPath = await saveToRenderDisk(relKey, data);
    
    // Upload para GCS para URL pública
    publicUrl = await uploadToGCS(relKey, data, contentType);
    
    provider = 'hybrid-gcs';
  }
  // Estratégia 3: Híbrido (Render Disk + Cloudinary) - RECOMENDADO
  else if (renderDiskAvailable && cloudinaryAvailable) {
    console.log('📦 Using HYBRID storage (Render Disk + Cloudinary)');
    
    // Salvar localmente
    localPath = await saveToRenderDisk(relKey, data);
    
    // Upload para Cloudinary para URL pública
    const cloudinaryResult = await cloudinaryUpload(relKey, data, contentType);
    publicUrl = cloudinaryResult.url;
    
    provider = 'hybrid-cloudinary';
  }
  // Estratégia 4: Híbrido (Render Disk + FORGE)
  else if (renderDiskAvailable && forgeAvailable) {
    console.log('📦 Using HYBRID storage (Render Disk + FORGE)');
    
    // Salvar localmente
    localPath = await saveToRenderDisk(relKey, data);
    
    // Upload para FORGE para URL pública
    publicUrl = await uploadToForge(relKey, data, contentType);
    
    provider = 'hybrid-forge';
  }
  // Estratégia 5: Apenas Cloudinary
  else if (cloudinaryAvailable) {
    console.log('📦 Using CLOUDINARY only');
    
    const cloudinaryResult = await cloudinaryUpload(relKey, data, contentType);
    publicUrl = cloudinaryResult.url;
    
    provider = 'cloudinary';
  }
  // Estratégia 6: Apenas FORGE
  else if (forgeAvailable) {
    console.log('📦 Using FORGE only');
    
    publicUrl = await uploadToForge(relKey, data, contentType);
    
    provider = 'forge';
  }
  // Estratégia 7: Apenas Render Disk (sem URL pública)
  else {
    console.log('📦 Using RENDER DISK only (no public URL)');
    
    localPath = await saveToRenderDisk(relKey, data);
    publicUrl = `/api/storage/download/${encodeURIComponent(relKey)}`;
    
    provider = 'render-disk';
  }

  return {
    key: normalizeKey(relKey),
    url: publicUrl,
    localPath,
    provider,
  };
}

/**
 * Download de arquivo com estratégia híbrida:
 * 1. Tenta ler do Render Disk primeiro (mais rápido)
 * 2. Fallback para Cloudinary se não encontrar localmente
 * 3. Fallback para FORGE se Cloudinary não disponível
 */
export async function storageGet(
  relKey: string,
  expiresIn = 300
): Promise<{ key: string; url: string; buffer?: Buffer }> {
  const key = normalizeKey(relKey);
  const renderDiskAvailable = await isRenderDiskAvailable();

  // Tentar ler do Render Disk primeiro
  if (renderDiskAvailable) {
    try {
      const buffer = await readFromRenderDisk(key);
      return {
        key,
        url: `/api/storage/download/${encodeURIComponent(key)}`,
        buffer,
      };
    } catch (error) {
      console.warn('⚠️ File not found in Render Disk, trying CDN...');
    }
  }

  // Fallback para GCS
  if (USE_GCS && gcsStorage) {
    try {
      const url = await getGCSDownloadUrl(key);
      return { key, url };
    } catch (error) {
      console.warn('⚠️ File not found in GCS, trying Cloudinary...');
    }
  }

  // Fallback para Cloudinary
  if (isCloudinaryConfigured()) {
    try {
      // Cloudinary public_id é o key sem extensão
      const publicId = key.replace(/\.[^/.]+$/, '');
      const url = await cloudinaryGetUrl(publicId);
      return { key, url };
    } catch (error) {
      console.warn('⚠️ File not found in Cloudinary, trying FORGE...');
    }
  }

  // Fallback para FORGE
  if (isForgeAvailable()) {
    const url = await getForgeDownloadUrl(key);
    return { key, url };
  }

  throw new Error(`File not found: ${key}`);
}

/**
 * Verifica status do storage
 */
export function getStorageStatus() {
  const cloudinaryStatus = getCloudinaryStatus();
  
  return {
    renderDisk: {
      enabled: USE_RENDER_DISK,
      path: RENDER_DISK_PATH,
      available: false, // Será verificado assincronamente
    },
    cloudinary: cloudinaryStatus,
    forge: {
      enabled: isForgeAvailable(),
      configured: !!(FORGE_API_URL && FORGE_API_KEY),
    },
  };
}

/**
 * Inicializa o storage (verifica disponibilidade)
 */
export async function initStorage() {
  const renderDiskAvailable = await isRenderDiskAvailable();
  const cloudinaryAvailable = initCloudinary();
  const forgeAvailable = isForgeAvailable();

  console.log('\n🗄️  Storage Configuration:');
  console.log('  Render Disk:', renderDiskAvailable ? '✅ Available' : '❌ Not available');
  console.log('  Cloudinary:', cloudinaryAvailable ? '✅ Available' : '❌ Not configured');
  console.log('  FORGE:', forgeAvailable ? '✅ Available' : '❌ Not configured');
  
  if (renderDiskAvailable && cloudinaryAvailable) {
    console.log('  Mode: 🔄 HYBRID (Render Disk + Cloudinary) ⭐ RECOMMENDED\n');
  } else if (renderDiskAvailable && forgeAvailable) {
    console.log('  Mode: 🔄 HYBRID (Render Disk + FORGE)\n');
  } else if (cloudinaryAvailable) {
    console.log('  Mode: ☁️  CLOUDINARY only\n');
  } else if (renderDiskAvailable) {
    console.log('  Mode: 💾 RENDER DISK only\n');
  } else if (forgeAvailable) {
    console.log('  Mode: ☁️  FORGE only\n');
  } else {
    console.warn('  ⚠️  WARNING: No storage backend configured!\n');
  }

  // Criar diretório do Render Disk se necessário
  if (renderDiskAvailable) {
    await ensureDirectory(RENDER_DISK_PATH);
  }
}

