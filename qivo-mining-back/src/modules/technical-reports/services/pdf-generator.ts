/**
 * PDF Generator Service
 * 
 * Gera relatórios PDF de auditoria usando Puppeteer
 */

import puppeteer from "puppeteer";
import { storagePut } from "../../../storage.js";

interface AuditData {
  reportId: string;
  reportTitle: string;
  projectName?: string;
  effectiveDate?: string;
  standard?: string;
  score: number;
  totalRules: number;
  passedRules: number;
  failedRules: number;
  krcis: Array<{
    code: string;
    section: string;
    message: string;
    severity: string;
    weight: number;
  }>;
  recommendations: string[];
  auditDate: string;
  auditorName?: string;
}

/**
 * Gera HTML do relatório de auditoria
 */
function generateAuditHTML(data: AuditData): string {
  const {
    reportTitle,
    projectName,
    effectiveDate,
    standard,
    score,
    totalRules,
    passedRules,
    failedRules,
    krcis,
    recommendations,
    auditDate,
    auditorName,
  } = data;

  // Determinar cor do score
  let scoreColor = "#22c55e"; // green
  if (score < 50) scoreColor = "#ef4444"; // red
  else if (score < 70) scoreColor = "#f59e0b"; // orange
  else if (score < 85) scoreColor = "#eab308"; // yellow

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      padding: 40px;
      background: white;
    }
    
    .header {
      border-bottom: 4px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      color: #1e40af;
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .header .subtitle {
      color: #6b7280;
      font-size: 14px;
    }
    
    .metadata {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .metadata-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    
    .metadata-row:last-child {
      margin-bottom: 0;
    }
    
    .metadata-label {
      font-weight: 600;
      color: #4b5563;
    }
    
    .metadata-value {
      color: #1f2937;
    }
    
    .score-section {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      margin-bottom: 30px;
    }
    
    .score-value {
      font-size: 72px;
      font-weight: bold;
      color: ${scoreColor};
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    
    .score-label {
      font-size: 18px;
      margin-top: 10px;
      opacity: 0.9;
    }
    
    .stats {
      display: flex;
      justify-content: space-around;
      margin-top: 20px;
    }
    
    .stat {
      text-align: center;
    }
    
    .stat-value {
      font-size: 32px;
      font-weight: bold;
    }
    
    .stat-label {
      font-size: 12px;
      opacity: 0.8;
      margin-top: 5px;
    }
    
    .section {
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    th {
      background: #f9fafb;
      color: #374151;
      font-weight: 600;
      text-align: left;
      padding: 12px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    tr:last-child td {
      border-bottom: none;
    }
    
    .severity-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .severity-critical {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .severity-high {
      background: #fed7aa;
      color: #9a3412;
    }
    
    .severity-medium {
      background: #fef3c7;
      color: #92400e;
    }
    
    .severity-low {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .recommendations {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      border-radius: 4px;
    }
    
    .recommendations ul {
      margin-left: 20px;
      margin-top: 10px;
    }
    
    .recommendations li {
      margin-bottom: 8px;
      color: #1e40af;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    
    .no-issues {
      background: #d1fae5;
      border: 2px solid #10b981;
      color: #065f46;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Relatório de Auditoria KRCI</h1>
    <div class="subtitle">ComplianceCore Mining™ - Key Risk Compliance Indicators</div>
  </div>
  
  <div class="metadata">
    <div class="metadata-row">
      <span class="metadata-label">Relatório:</span>
      <span class="metadata-value">${reportTitle}</span>
    </div>
    ${projectName ? `
    <div class="metadata-row">
      <span class="metadata-label">Projeto:</span>
      <span class="metadata-value">${projectName}</span>
    </div>
    ` : ''}
    ${standard ? `
    <div class="metadata-row">
      <span class="metadata-label">Padrão:</span>
      <span class="metadata-value">${standard}</span>
    </div>
    ` : ''}
    ${effectiveDate ? `
    <div class="metadata-row">
      <span class="metadata-label">Data Efetiva:</span>
      <span class="metadata-value">${new Date(effectiveDate).toLocaleDateString('pt-BR')}</span>
    </div>
    ` : ''}
    <div class="metadata-row">
      <span class="metadata-label">Data da Auditoria:</span>
      <span class="metadata-value">${new Date(auditDate).toLocaleDateString('pt-BR')} às ${new Date(auditDate).toLocaleTimeString('pt-BR')}</span>
    </div>
    ${auditorName ? `
    <div class="metadata-row">
      <span class="metadata-label">Auditor:</span>
      <span class="metadata-value">${auditorName}</span>
    </div>
    ` : ''}
  </div>
  
  <div class="score-section">
    <div class="score-value">${score}%</div>
    <div class="score-label">Pontuação de Conformidade</div>
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${totalRules}</div>
        <div class="stat-label">REGRAS VERIFICADAS</div>
      </div>
      <div class="stat">
        <div class="stat-value">${passedRules}</div>
        <div class="stat-label">APROVADAS</div>
      </div>
      <div class="stat">
        <div class="stat-value">${failedRules}</div>
        <div class="stat-label">REPROVADAS</div>
      </div>
    </div>
  </div>
  
  <div class="section">
    <h2 class="section-title">KRCI Identificados</h2>
    ${krcis.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th style="width: 100px;">Código</th>
            <th style="width: 150px;">Seção</th>
            <th>Descrição</th>
            <th style="width: 100px;">Severidade</th>
            <th style="width: 80px;">Peso</th>
          </tr>
        </thead>
        <tbody>
          ${krcis.map(k => `
            <tr>
              <td><strong>${k.code}</strong></td>
              <td>${k.section}</td>
              <td>${k.message}</td>
              <td><span class="severity-badge severity-${k.severity}">${k.severity}</span></td>
              <td>${k.weight}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : `
      <div class="no-issues">
        ✓ Nenhum KRCI identificado. Relatório em conformidade total com os padrões internacionais.
      </div>
    `}
  </div>
  
  ${recommendations.length > 0 ? `
    <div class="section">
      <h2 class="section-title">Recomendações</h2>
      <div class="recommendations">
        <strong>Ações sugeridas para melhorar a conformidade:</strong>
        <ul>
          ${recommendations.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>
    </div>
  ` : ''}
  
  <div class="footer">
    <p>Gerado automaticamente pelo ComplianceCore Mining™</p>
    <p>Este relatório é confidencial e destinado exclusivamente ao uso interno.</p>
  </div>
</body>
</html>
  `;
}

/**
 * Gera PDF da auditoria e faz upload para S3
 */
export async function generateAuditPDF(
  data: AuditData,
  tenantId: string
): Promise<string> {
  const html = generateAuditHTML(data);

  // Gerar PDF com Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm',
    },
  });

  await browser.close();

  // Upload para S3
  const fileName = `audit-${data.reportId}-${Date.now()}.pdf`;
  const s3Key = `tenants/${tenantId}/audits/${fileName}`;

  const result = await storagePut(s3Key, pdfBuffer, 'application/pdf');

  return result.url;
}

