/**
 * Google Cloud Storage Integration - QIVO Mining
 * 
 * Sistema de storage usando Google Cloud Storage (GCS)
 * - Usa Application Default Credentials (ADC) - automático no Cloud Run
 * - Cria bucket automaticamente se não existir
 * - Gera URLs assinadas para download
 * - Estrutura de pastas: reports/generate/{tenantId}/uploads/{uploadId}/{fileName}
 */

import { Storage } from '@google-cloud/storage';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

// Nome do bucket pode ser fornecido via variável de ambiente ou derivado do serviço
// No Cloud Run, K_SERVICE contém o nome do serviço
const SERVICE_NAME = process.env.K_SERVICE || process.env.SERVICE_NAME || 'qivo-mining-dev';
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || `${SERVICE_NAME}-storage`;
const GCS_REGION = process.env.GCS_REGION || 'southamerica-east1';

// Inicializar cliente GCS (usa ADC automaticamente no Cloud Run)
let storage: Storage | null = null;
let bucketName: string = GCS_BUCKET_NAME;
let isInitialized = false;

// ============================================================================
// TIPOS
// ============================================================================

export interface StorageResult {
  key: string;
  url: string;
  provider: 'gcs';
}

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================

/**
 * Inicializa o cliente GCS e verifica/cria o bucket
 */
export async function initStorage(): Promise<void> {
  if (isInitialized) {
    return;
  }

  try {
    // Inicializar cliente GCS (usa ADC automaticamente)
    storage = new Storage();
    
    console.log('🔧 Initializing Google Cloud Storage...');
    console.log(`   Bucket: ${bucketName}`);
    console.log(`   Region: ${GCS_REGION}`);
    console.log(`   Service: ${SERVICE_NAME}`);

    // Verificar se bucket existe
    const bucket = storage.bucket(bucketName);
    const [exists] = await bucket.exists();

    if (!exists) {
      console.log(`📦 Bucket ${bucketName} não existe. Criando...`);
      
      // Criar bucket
      await storage.createBucket(bucketName, {
        location: GCS_REGION,
        storageClass: 'STANDARD',
        uniformBucketLevelAccess: true, // Melhor para segurança
      });
      
      console.log(`✅ Bucket ${bucketName} criado com sucesso`);
    } else {
      console.log(`✅ Bucket ${bucketName} já existe`);
    }

    isInitialized = true;
    console.log('✅ Google Cloud Storage inicializado com sucesso\n');
  } catch (error: any) {
    console.error('❌ Erro ao inicializar Google Cloud Storage:', error.message);
    
    // Se for erro de permissão, dar mensagem mais clara
    if (error.code === 403 || error.message.includes('permission')) {
      console.error('   Verifique se o Service Account do Cloud Run tem as permissões:');
      console.error('   - storage.objects.create');
      console.error('   - storage.objects.get');
      console.error('   - storage.buckets.get');
      console.error('   - storage.buckets.create');
    }
    
    throw error;
  }
}

/**
 * Verifica status do storage
 */
export function getStorageStatus() {
  return {
    gcs: {
      enabled: isInitialized,
      bucket: bucketName,
      region: GCS_REGION,
      service: SERVICE_NAME,
      initialized: isInitialized,
    },
  };
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, '');
}

function ensureStorageInitialized(): void {
  if (!storage || !isInitialized) {
    throw new Error('Storage não inicializado. Chame initStorage() primeiro.');
  }
}

// ============================================================================
// OPERAÇÕES DE STORAGE
// ============================================================================

/**
 * Upload de arquivo para GCS
 * 
 * @param relKey - Chave relativa do arquivo (ex: "reports/generate/{tenantId}/uploads/{uploadId}/{fileName}")
 * @param data - Dados do arquivo (Buffer, Uint8Array ou string)
 * @param contentType - Tipo MIME do arquivo (padrão: application/octet-stream)
 * @returns Resultado com key e URL assinada
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = 'application/octet-stream'
): Promise<StorageResult> {
  ensureStorageInitialized();

  const key = normalizeKey(relKey);
  const bucket = storage!.bucket(bucketName);
  const file = bucket.file(key);

  try {
    // Converter dados para Buffer se necessário
    const buffer = typeof data === 'string' 
      ? Buffer.from(data, 'utf-8')
      : Buffer.from(data);

    // Upload do arquivo
    await file.save(buffer, {
      metadata: {
        contentType,
      },
    });

    console.log(`✅ Uploaded to GCS: ${key} (${buffer.length} bytes)`);

    // Gerar URL assinada (válida por 1 hora)
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 3600 * 1000, // 1 hora
    });

    return {
      key,
      url: signedUrl,
      provider: 'gcs',
    };
  } catch (error: any) {
    console.error(`❌ Erro ao fazer upload para GCS (${key}):`, error.message);
    throw error;
  }
}

/**
 * Download de arquivo do GCS (retorna URL assinada)
 * 
 * @param relKey - Chave relativa do arquivo
 * @param expiresIn - Tempo de expiração da URL em segundos (padrão: 300 = 5 minutos)
 * @returns Resultado com key e URL assinada
 */
export async function storageGet(
  relKey: string,
  expiresIn = 300
): Promise<{ key: string; url: string }> {
  ensureStorageInitialized();

  const key = normalizeKey(relKey);
  const bucket = storage!.bucket(bucketName);
  const file = bucket.file(key);

  try {
    // Verificar se arquivo existe
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(`File not found: ${key}`);
    }

    // Gerar URL assinada
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresIn * 1000,
    });

    return {
      key,
      url: signedUrl,
    };
  } catch (error: any) {
    console.error(`❌ Erro ao obter URL do GCS (${key}):`, error.message);
    throw error;
  }
}

/**
 * Deletar arquivo do GCS
 * 
 * @param relKey - Chave relativa do arquivo
 */
export async function storageDelete(relKey: string): Promise<void> {
  ensureStorageInitialized();

  const key = normalizeKey(relKey);
  const bucket = storage!.bucket(bucketName);
  const file = bucket.file(key);

  try {
    await file.delete();
    console.log(`✅ Deleted from GCS: ${key}`);
  } catch (error: any) {
    // Ignorar erro se arquivo não existir
    if (error.code !== 404) {
      console.error(`❌ Erro ao deletar do GCS (${key}):`, error.message);
      throw error;
    }
  }
}

/**
 * Verificar se arquivo existe no GCS
 * 
 * @param relKey - Chave relativa do arquivo
 * @returns true se arquivo existe, false caso contrário
 */
export async function storageExists(relKey: string): Promise<boolean> {
  ensureStorageInitialized();

  const key = normalizeKey(relKey);
  const bucket = storage!.bucket(bucketName);
  const file = bucket.file(key);

  try {
    const [exists] = await file.exists();
    return exists;
  } catch (error: any) {
    console.error(`❌ Erro ao verificar existência no GCS (${key}):`, error.message);
    return false;
  }
}


