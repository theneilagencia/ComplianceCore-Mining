# Webhooks API Documentation

## Visão Geral

O sistema de Webhooks permite que você receba notificações em tempo real sobre eventos que ocorrem no ComplianceCore-Mining. Configure endpoints HTTP para receber payloads JSON quando eventos importantes acontecem.

## Arquitetura

```
Evento → Webhook Service → Queue → HTTP POST → Seu Endpoint
                              ↓
                         Retry Logic (3x)
                              ↓
                         Event Log
```

## Eventos Disponíveis

### Upload Events

- **`upload.started`**: Upload iniciado
- **`upload.completed`**: Upload concluído com sucesso
- **`upload.failed`**: Upload falhou
- **`upload.retry`**: Upload em retry

### Batch Events

- **`batch.started`**: Batch upload iniciado
- **`batch.completed`**: Batch concluído (todos os arquivos)
- **`batch.partial`**: Batch parcialmente concluído (alguns falharam)

### Processing Events

- **`processing.started`**: Processamento iniciado
- **`processing.completed`**: Processamento concluído
- **`processing.failed`**: Processamento falhou

### Export Events

- **`export.started`**: Exportação iniciada
- **`export.completed`**: Exportação concluída
- **`export.failed`**: Exportação falhou
- **`export.canceled`**: Exportação cancelada

### OCR Events

- **`ocr.started`**: OCR iniciado
- **`ocr.completed`**: OCR concluído
- **`ocr.failed`**: OCR falhou

### Template Events

- **`template.created`**: Template criado
- **`template.updated`**: Template atualizado
- **`template.deleted`**: Template removido

---

## Webhook Payload

### Estrutura Base

```typescript
{
  event: string;                    // Tipo do evento
  timestamp: string;                // ISO 8601 timestamp
  data: {                           // Dados específicos do evento
    // ...campos variáveis
  };
  userId?: string;                  // ID do usuário (se aplicável)
  metadata?: {                      // Metadados adicionais
    // ...campos opcionais
  };
}
```

### Headers HTTP

Cada requisição webhook inclui headers especiais:

```http
Content-Type: application/json
X-Webhook-Signature: <hmac_sha256_signature>
X-Webhook-Event: <event_type>
X-Webhook-Timestamp: <iso8601_timestamp>
X-Webhook-Attempt: <attempt_number>
```

---

## Exemplos de Payloads

### Upload Completed

```json
{
  "event": "upload.completed",
  "timestamp": "2024-11-01T14:30:00Z",
  "data": {
    "uploadId": "upload-123",
    "reportId": "report-456",
    "fileName": "gold-mine-report.pdf",
    "fileSize": 15728640,
    "processingTime": 12500
  },
  "userId": "user-789"
}
```

### Batch Completed

```json
{
  "event": "batch.completed",
  "timestamp": "2024-11-01T14:35:00Z",
  "data": {
    "batchId": "batch-abc",
    "totalFiles": 10,
    "successCount": 8,
    "failureCount": 2,
    "uploads": [
      {
        "uploadId": "upload-1",
        "reportId": "report-1",
        "fileName": "file1.pdf",
        "status": "completed"
      },
      {
        "uploadId": "upload-2",
        "fileName": "file2.pdf",
        "status": "failed",
        "error": "File too large"
      }
    ]
  },
  "userId": "user-789"
}
```

### Export Completed

```json
{
  "event": "export.completed",
  "timestamp": "2024-11-01T14:40:00Z",
  "data": {
    "exportId": "export-xyz",
    "reportId": "report-456",
    "format": "pdf",
    "fileUrl": "https://cdn.example.com/exports/report-456.pdf",
    "fileSize": 5242880,
    "expiresAt": "2024-11-02T14:40:00Z"
  },
  "userId": "user-789"
}
```

### OCR Completed

```json
{
  "event": "ocr.completed",
  "timestamp": "2024-11-01T14:45:00Z",
  "data": {
    "extractionId": "ocr-def",
    "uploadId": "upload-123",
    "totalPages": 50,
    "averageConfidence": 92.5,
    "detectedLanguages": ["pt", "en"],
    "detectedStandards": [
      {
        "standard": "JORC",
        "confidence": 95
      }
    ],
    "processingTime": 45000
  },
  "userId": "user-789"
}
```

### Processing Failed

```json
{
  "event": "processing.failed",
  "timestamp": "2024-11-01T14:50:00Z",
  "data": {
    "uploadId": "upload-999",
    "fileName": "corrupted-file.pdf",
    "error": {
      "code": "PARSING_FAILED",
      "message": "Unable to parse PDF content"
    }
  },
  "userId": "user-789"
}
```

---

## Configuração

### Registrar Webhook

#### Via tRPC (Frontend)

```typescript
import { trpc } from '@/lib/trpc';

const registerWebhook = trpc.webhooks.register.useMutation();

const handleRegister = async () => {
  await registerWebhook.mutateAsync({
    url: 'https://myapp.com/webhooks/compliance',
    events: [
      'upload.completed',
      'batch.completed',
      'export.completed',
    ],
    secret: 'my-secret-key',  // Para verificar assinaturas
    enabled: true,
    retryAttempts: 3,
    timeout: 30000,  // 30 segundos
  });
};
```

#### Via API REST

```bash
curl -X POST https://api.compliancecore.com/webhooks \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://myapp.com/webhooks/compliance",
    "events": ["upload.completed", "export.completed"],
    "secret": "my-secret-key",
    "enabled": true
  }'
```

---

## Verificação de Assinatura

Para garantir autenticidade, verifique a assinatura HMAC:

### Node.js

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const expectedSignature = hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Express endpoint
app.post('/webhooks/compliance', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body;
  
  if (!verifyWebhookSignature(payload, signature, 'my-secret-key')) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook
  console.log('Webhook received:', payload.event);
  res.json({ received: true });
});
```

### Python

```python
import hmac
import hashlib
import json

def verify_webhook_signature(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        json.dumps(payload).encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected)

# Flask endpoint
@app.route('/webhooks/compliance', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Webhook-Signature')
    payload = request.json
    
    if not verify_webhook_signature(payload, signature, 'my-secret-key'):
        return {'error': 'Invalid signature'}, 401
    
    # Process webhook
    print(f"Webhook received: {payload['event']}")
    return {'received': True}
```

---

## Retry Logic

### Comportamento

- **Tentativas**: 3 por padrão (configurável)
- **Backoff**: Exponencial (1s, 2s, 4s)
- **Timeout**: 30 segundos por tentativa
- **Códigos de Sucesso**: 200-299

### Condições de Retry

Retry automático ocorre em:
- Network errors
- Timeouts (> 30s)
- Server errors (500-599)

**Não ocorre retry em:**
- Client errors (400-499)
- Response status 200-299

---

## Gerenciamento

### Listar Webhooks

```typescript
const { data: webhooks } = trpc.webhooks.list.useQuery();

webhooks.forEach(webhook => {
  console.log(`${webhook.url}: ${webhook.enabled ? 'Enabled' : 'Disabled'}`);
});
```

### Atualizar Webhook

```typescript
const updateWebhook = trpc.webhooks.update.useMutation();

await updateWebhook.mutateAsync({
  webhookId: 'webhook-123',
  enabled: false,  // Desabilitar temporariamente
});
```

### Deletar Webhook

```typescript
const deleteWebhook = trpc.webhooks.delete.useMutation();

await deleteWebhook.mutateAsync({
  webhookId: 'webhook-123',
});
```

### Ver Histórico de Entregas

```typescript
const { data: history } = trpc.webhooks.getDeliveryHistory.useQuery({
  webhookId: 'webhook-123',
  limit: 50,
});

history.forEach(delivery => {
  console.log(
    `${delivery.event}: ${delivery.success ? 'SUCCESS' : 'FAILED'} ` +
    `(${delivery.responseTime}ms, ${delivery.attempts} attempts)`
  );
});
```

### Retry Manual

```typescript
const retryDelivery = trpc.webhooks.retryDelivery.useMutation();

await retryDelivery.mutateAsync({
  eventId: 'event-456',
});
```

### Estatísticas

```typescript
const { data: stats } = trpc.webhooks.getStats.useQuery({
  webhookId: 'webhook-123',
});

console.log({
  totalDeliveries: stats.totalDeliveries,
  successRate: (stats.successfulDeliveries / stats.totalDeliveries) * 100,
  avgResponseTime: stats.averageResponseTime,
});
```

---

## Endpoints do Servidor

### Implementação Recomendada

```typescript
// express-server.ts
import express from 'express';

const app = express();

app.post('/webhooks/compliance', express.json(), async (req, res) => {
  try {
    // 1. Verificar assinatura
    const signature = req.headers['x-webhook-signature'];
    if (!verifySignature(req.body, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 2. Processar evento
    const { event, data } = req.body;
    
    switch (event) {
      case 'upload.completed':
        await handleUploadCompleted(data);
        break;
      
      case 'export.completed':
        await handleExportCompleted(data);
        break;
      
      default:
        console.log('Unhandled event:', event);
    }

    // 3. Responder rapidamente (< 5s)
    res.json({ received: true });

    // 4. Processar assincronamente (se necessário)
    // Não bloquear a resposta HTTP

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

---

## Melhores Práticas

### 1. **Idempotência**

Processar o mesmo webhook múltiplas vezes deve ter o mesmo efeito:

```typescript
async function handleUploadCompleted(data) {
  // Verificar se já processou
  const existing = await db.getProcessedWebhook(data.uploadId);
  if (existing) {
    console.log('Already processed');
    return;
  }

  // Processar
  await processUpload(data);

  // Marcar como processado
  await db.markWebhookProcessed(data.uploadId);
}
```

### 2. **Resposta Rápida**

Responda em < 5 segundos:

```typescript
app.post('/webhooks', async (req, res) => {
  // Responder imediatamente
  res.json({ received: true });

  // Processar assincronamente
  setImmediate(async () => {
    await processWebhook(req.body);
  });
});
```

### 3. **Logging Detalhado**

```typescript
app.post('/webhooks', async (req, res) => {
  const startTime = Date.now();
  
  console.log('[Webhook] Received:', {
    event: req.body.event,
    timestamp: req.body.timestamp,
    attempt: req.headers['x-webhook-attempt'],
  });

  try {
    await processWebhook(req.body);
    
    console.log('[Webhook] Processed:', {
      event: req.body.event,
      duration: Date.now() - startTime,
      success: true,
    });
  } catch (error) {
    console.error('[Webhook] Failed:', {
      event: req.body.event,
      error: error.message,
    });
  }
  
  res.json({ received: true });
});
```

### 4. **Rate Limiting**

Proteja seu endpoint:

```typescript
import rateLimit from 'express-rate-limit';

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minuto
  max: 100,                  // 100 requests
});

app.post('/webhooks', webhookLimiter, async (req, res) => {
  // ...
});
```

### 5. **Queue para Processar**

Use filas para processamento assíncrono:

```typescript
import Bull from 'bull';

const webhookQueue = new Bull('webhooks');

app.post('/webhooks', async (req, res) => {
  // Adicionar à fila
  await webhookQueue.add(req.body);
  
  // Responder imediatamente
  res.json({ received: true });
});

// Worker
webhookQueue.process(async (job) => {
  await processWebhook(job.data);
});
```

---

## Testing

### Testar Webhook Localmente

Use ngrok para expor localhost:

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta 3000
ngrok http 3000

# URL gerada: https://abc123.ngrok.io
```

Configure webhook com URL ngrok:

```typescript
await registerWebhook.mutateAsync({
  url: 'https://abc123.ngrok.io/webhooks',
  events: ['upload.completed'],
});
```

### Simular Webhook

```typescript
import { triggerWebhook, WebhookEvent } from '@/hooks/useWebhooks';

// Disparar evento de teste
triggerWebhook(WebhookEvent.UPLOAD_COMPLETED, {
  uploadId: 'test-123',
  reportId: 'report-456',
  fileName: 'test.pdf',
});
```

---

## Troubleshooting

### Webhook não está sendo entregue

1. **Verificar endpoint**: Endpoint está acessível publicamente?
2. **Verificar timeout**: Responde em < 30s?
3. **Verificar assinatura**: Secret correto?
4. **Verificar logs**: Ver histórico de entregas

### Muitos erros 500

1. **Adicionar try/catch**: Não deixar erro crashar servidor
2. **Usar queue**: Processar assincronamente
3. **Responder rápido**: Não bloquear response

### Eventos duplicados

1. **Implementar idempotência**: Verificar se já processou
2. **Usar transaction**: Atomicidade no processamento

---

## Recursos Adicionais

- [Upload API](./UPLOAD_API.md)
- [Export API](./EXPORT_API.md)
- [NotificationCenter Component](../components/NOTIFICATION_CENTER.md)
- [useWebhooks Hook](../components/USE_WEBHOOKS.md)
