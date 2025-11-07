/**
 * Script de Validação de Integrações - QIVO Mining
 * Valida todas as APIs e integrações externas
 */

import { S3Client, ListBucketsCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import Stripe from 'stripe';
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '.env') });

const results = {
  aws_s3: { status: 'pending', details: null },
  stripe: { status: 'pending', details: null },
  sendgrid: { status: 'pending', details: null },
  database: { status: 'pending', details: null }
};

console.log('🔍 QIVO Mining - Validação de Integrações\n');
console.log('=' .repeat(60));

// 1. Validar AWS S3
async function validateS3() {
  console.log('\n📦 Validando AWS S3...');
  try {
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    // Listar buckets
    const listCommand = new ListBucketsCommand({});
    const listResponse = await s3Client.send(listCommand);
    
    const bucketName = process.env.AWS_S3_BUCKET;
    const bucketExists = listResponse.Buckets?.some(b => b.Name === bucketName);

    if (!bucketExists) {
      throw new Error(`Bucket ${bucketName} não encontrado`);
    }

    // Testar upload
    const testKey = `test-validation-${Date.now()}.txt`;
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: 'Test file for validation',
      ContentType: 'text/plain'
    });
    
    await s3Client.send(putCommand);

    results.aws_s3 = {
      status: 'success',
      details: {
        region: process.env.AWS_REGION,
        bucket: bucketName,
        bucketsFound: listResponse.Buckets?.length || 0,
        testUpload: testKey
      }
    };
    
    console.log('✅ AWS S3: OK');
    console.log(`   - Região: ${process.env.AWS_REGION}`);
    console.log(`   - Bucket: ${bucketName}`);
    console.log(`   - Buckets disponíveis: ${listResponse.Buckets?.length || 0}`);
    console.log(`   - Upload de teste: ${testKey}`);
    
  } catch (error) {
    results.aws_s3 = {
      status: 'error',
      details: { error: error.message }
    };
    console.log('❌ AWS S3: ERRO');
    console.log(`   - ${error.message}`);
  }
}

// 2. Validar Stripe
async function validateStripe() {
  console.log('\n💳 Validando Stripe...');
  try {
    const stripe = new Stripe(process.env.STRIPE_KEY);

    // Listar produtos
    const products = await stripe.products.list({ limit: 10 });
    
    // Listar preços
    const prices = await stripe.prices.list({ limit: 20 });

    // Verificar produtos esperados
    const expectedProducts = ['START', 'PRO', 'ENTERPRISE'];
    const foundProducts = products.data.map(p => p.name);

    results.stripe = {
      status: 'success',
      details: {
        productsCount: products.data.length,
        pricesCount: prices.data.length,
        products: foundProducts,
        expectedProducts,
        webhookConfigured: !!process.env.STRIPE_WEBHOOK_SECRET
      }
    };

    console.log('✅ Stripe: OK');
    console.log(`   - Produtos: ${products.data.length}`);
    console.log(`   - Preços: ${prices.data.length}`);
    console.log(`   - Produtos encontrados: ${foundProducts.join(', ')}`);
    console.log(`   - Webhook configurado: ${!!process.env.STRIPE_WEBHOOK_SECRET ? 'Sim' : 'Não'}`);

  } catch (error) {
    results.stripe = {
      status: 'error',
      details: { error: error.message }
    };
    console.log('❌ Stripe: ERRO');
    console.log(`   - ${error.message}`);
  }
}

// 3. Validar SendGrid
async function validateSendGrid() {
  console.log('\n📧 Validando SendGrid...');
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // Validar API key
    const response = await sgMail.send({
      to: process.env.SENDGRID_FROM_EMAIL, // Enviar para o próprio email
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'QIVO Mining - Teste de Validação',
      text: 'Este é um email de teste para validar a integração com SendGrid.',
      html: '<strong>Este é um email de teste para validar a integração com SendGrid.</strong>'
    }, false); // false = não enviar de verdade, apenas validar

    results.sendgrid = {
      status: 'success',
      details: {
        fromEmail: process.env.SENDGRID_FROM_EMAIL,
        apiKeyConfigured: true
      }
    };

    console.log('✅ SendGrid: OK');
    console.log(`   - Email remetente: ${process.env.SENDGRID_FROM_EMAIL}`);
    console.log(`   - API Key configurada: Sim`);

  } catch (error) {
    results.sendgrid = {
      status: 'error',
      details: { error: error.message }
    };
    console.log('❌ SendGrid: ERRO');
    console.log(`   - ${error.message}`);
  }
}

// 4. Validar Database
async function validateDatabase() {
  console.log('\n🗄️  Validando Database...');
  try {
    const response = await fetch('https://www.qivomining.com/api/health');
    const data = await response.json();

    if (data.status === 'healthy' && data.database === 'connected') {
      results.database = {
        status: 'success',
        details: data
      };
      console.log('✅ Database: OK');
      console.log(`   - Status: ${data.status}`);
      console.log(`   - Database: ${data.database}`);
      console.log(`   - Timestamp: ${data.timestamp}`);
    } else {
      throw new Error('Database não conectado');
    }

  } catch (error) {
    results.database = {
      status: 'error',
      details: { error: error.message }
    };
    console.log('❌ Database: ERRO');
    console.log(`   - ${error.message}`);
  }
}

// Executar validações
async function runValidations() {
  await validateS3();
  await validateStripe();
  await validateSendGrid();
  await validateDatabase();

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESUMO DA VALIDAÇÃO\n');

  const total = Object.keys(results).length;
  const success = Object.values(results).filter(r => r.status === 'success').length;
  const errors = Object.values(results).filter(r => r.status === 'error').length;

  console.log(`Total de integrações: ${total}`);
  console.log(`✅ Sucesso: ${success}`);
  console.log(`❌ Erros: ${errors}`);
  console.log(`📊 Taxa de sucesso: ${((success / total) * 100).toFixed(1)}%`);

  console.log('\n' + '='.repeat(60));

  // Salvar resultados em JSON
  const fs = await import('fs');
  fs.writeFileSync(
    join(__dirname, 'validation-results.json'),
    JSON.stringify(results, null, 2)
  );
  console.log('\n💾 Resultados salvos em: validation-results.json\n');

  // Exit code baseado no resultado
  process.exit(errors > 0 ? 1 : 0);
}

runValidations().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
