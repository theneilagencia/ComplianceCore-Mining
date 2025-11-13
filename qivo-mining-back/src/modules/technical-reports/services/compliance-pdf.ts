/**
 * Compliance PDF Generator
 * Generates pre-certification compliance reports
 */

import puppeteer from 'puppeteer';

interface ComplianceResult {
  regulator: string;
  score: number;
  totalItems: number;
  passedItems: number;
  failedItems: number;
  pendingItems: number;
  checklist: Array<{
    id: string;
    requirement: string;
    category: string;
    mandatory: boolean;
    status: 'pass' | 'fail' | 'pending';
    notes?: string;
  }>;
  pendingRequirements: string[];
  recommendations: string[];
}

interface ReportMetadata {
  title: string;
  projectName?: string;
  company?: string;
  effectiveDate?: string;
}

export async function generateCompliancePDF(
  complianceResult: ComplianceResult,
  reportMetadata: ReportMetadata
): Promise<Buffer> {
  const { regulator, score, totalItems, passedItems, failedItems, pendingItems, checklist, pendingRequirements, recommendations } = complianceResult;

  // Determine status color
  let scoreColor = '#dc2626'; // red
  if (score >= 90) scoreColor = '#16a34a'; // green
  else if (score >= 70) scoreColor = '#eab308'; // yellow
  else if (score >= 50) scoreColor = '#f97316'; // orange

  // Determine status badge
  let statusBadge = 'NOT COMPLIANT';
  let statusBadgeColor = '#dc2626';
  if (score >= 90) {
    statusBadge = 'COMPLIANT';
    statusBadgeColor = '#16a34a';
  } else if (score >= 70) {
    statusBadge = 'PARTIALLY COMPLIANT';
    statusBadgeColor = '#eab308';
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 40px;
      background: #f9fafb;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }
    .header p {
      font-size: 16px;
      opacity: 0.9;
    }
    .metadata {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      border: 1px solid #e5e7eb;
    }
    .metadata-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .metadata-row:last-child {
      border-bottom: none;
    }
    .metadata-label {
      font-weight: 600;
      color: #6b7280;
    }
    .metadata-value {
      color: #111827;
    }
    .score-section {
      background: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 20px;
      text-align: center;
      border: 1px solid #e5e7eb;
    }
    .score-circle {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background: ${scoreColor};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      font-weight: bold;
      margin: 0 auto 20px;
    }
    .status-badge {
      display: inline-block;
      background: ${statusBadgeColor};
      color: white;
      padding: 8px 20px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
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
      color: #111827;
    }
    .stat-label {
      font-size: 14px;
      color: #6b7280;
      margin-top: 5px;
    }
    .section {
      background: white;
      padding: 25px;
      border-radius: 8px;
      margin-bottom: 20px;
      border: 1px solid #e5e7eb;
    }
    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #667eea;
    }
    .checklist-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    .checklist-table th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }
    .checklist-table td {
      padding: 12px;
      border-bottom: 1px solid #f3f4f6;
    }
    .status-pass {
      color: #16a34a;
      font-weight: 600;
    }
    .status-fail {
      color: #dc2626;
      font-weight: 600;
    }
    .status-pending {
      color: #eab308;
      font-weight: 600;
    }
    .mandatory-badge {
      background: #fef3c7;
      color: #92400e;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    .pending-list {
      list-style: none;
      padding: 0;
    }
    .pending-list li {
      padding: 10px;
      background: #fef2f2;
      border-left: 4px solid #dc2626;
      margin-bottom: 8px;
      border-radius: 4px;
    }
    .recommendations-list {
      list-style: none;
      padding: 0;
    }
    .recommendations-list li {
      padding: 10px;
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      margin-bottom: 8px;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Pre-Certification Compliance Report</h1>
    <p>Regulator: ${regulator} | Generated: ${new Date().toLocaleString('en-US')}</p>
  </div>

  <div class="metadata">
    <div class="metadata-row">
      <span class="metadata-label">Report Title:</span>
      <span class="metadata-value">${reportMetadata.title || 'N/A'}</span>
    </div>
    <div class="metadata-row">
      <span class="metadata-label">Project Name:</span>
      <span class="metadata-value">${reportMetadata.projectName || 'N/A'}</span>
    </div>
    <div class="metadata-row">
      <span class="metadata-label">Company:</span>
      <span class="metadata-value">${reportMetadata.company || 'N/A'}</span>
    </div>
    <div class="metadata-row">
      <span class="metadata-label">Effective Date:</span>
      <span class="metadata-value">${reportMetadata.effectiveDate || 'N/A'}</span>
    </div>
  </div>

  <div class="score-section">
    <div class="score-circle">${score.toFixed(0)}%</div>
    <div class="status-badge">${statusBadge}</div>
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${totalItems}</div>
        <div class="stat-label">Total Requirements</div>
      </div>
      <div class="stat">
        <div class="stat-value" style="color: #16a34a;">${passedItems}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat">
        <div class="stat-value" style="color: #dc2626;">${failedItems}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat">
        <div class="stat-value" style="color: #eab308;">${pendingItems}</div>
        <div class="stat-label">Pending</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Compliance Checklist</h2>
    <table class="checklist-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Requirement</th>
          <th>Category</th>
          <th>Type</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${checklist.map(item => `
          <tr>
            <td><strong>${item.id}</strong></td>
            <td>${item.requirement}</td>
            <td>${item.category}</td>
            <td>${item.mandatory ? '<span class="mandatory-badge">MANDATORY</span>' : 'Optional'}</td>
            <td class="status-${item.status}">${item.status.toUpperCase()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  ${pendingRequirements.length > 0 ? `
    <div class="section">
      <h2 class="section-title">Pending Requirements</h2>
      <ul class="pending-list">
        ${pendingRequirements.map(req => `<li>${req}</li>`).join('')}
      </ul>
    </div>
  ` : ''}

  <div class="section">
    <h2 class="section-title">Recommendations</h2>
    <ul class="recommendations-list">
      ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
    </ul>
  </div>

  <div class="footer">
    <p>ComplianceCore Mining™ | Pre-Certification Report</p>
    <p>This report is generated automatically and should be reviewed by a qualified professional.</p>
  </div>
</body>
</html>
  `;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(html);
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
  });

  await browser.close();

  return Buffer.from(pdfBuffer);
}

