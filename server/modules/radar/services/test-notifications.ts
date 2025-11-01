/**
 * Teste do Sistema de Notificações
 * Execute com: tsx server/modules/radar/services/test-notifications.ts
 */

import { sendRegulatoryNotification, testNotificationChannels, type RegulatoryUpdate } from './notifications';

async function main() {
  console.log('🧪 Testando Sistema de Notificações QIVO\n');

  // Teste 1: Verificar canais configurados
  console.log('1️⃣  Testando todos os canais configurados...\n');
  await testNotificationChannels();

  // Teste 2: Enviar notificação de teste
  console.log('\n2️⃣  Enviando notificação de teste...\n');
  
  const testUpdate: RegulatoryUpdate = {
    id: 'test-001',
    title: 'Nova Resolução ANM sobre Sustentabilidade em Mineração',
    source: 'Agência Nacional de Mineração (ANM)',
    url: 'https://www.gov.br/anm/pt-br',
    publishedAt: new Date(),
    category: 'ANM',
    severity: 'high',
    summary: 'Publicada nova resolução estabelecendo diretrizes para práticas sustentáveis em operações de mineração. A norma entra em vigor em 90 dias e exige adequação de todas as empresas cadastradas.',
    tags: ['sustentabilidade', 'compliance', 'mineração', 'ESG'],
  };

  try {
    await sendRegulatoryNotification(testUpdate);
    console.log('\n✅ Teste concluído com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error);
    process.exit(1);
  }
}

main();
