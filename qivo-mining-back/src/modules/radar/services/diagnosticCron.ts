/**
 * Diagnostic Cron Service
 * Runs automated health checks every 24 hours
 */

import cron from 'node-cron';
import { getDiagnostic } from './dataAggregator';
import fs from 'fs';
import path from 'path';

interface DiagnosticLog {
  timestamp: string;
  overall_status: 'healthy' | 'degraded' | 'partial';
  sources: Array<{
    source: string;
    status: string;
    last_sync: string;
    entries_count: number;
  }>;
  summary: {
    total_sources: number;
    active: number;
    errors: number;
    unavailable: number;
    total_entries: number;
  };
}

// Store logs in memory (in production, use a database)
const diagnosticLogs: DiagnosticLog[] = [];
const MAX_LOGS = 100; // Keep last 100 logs

// Log file path
const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'radar-diagnostic.log');

/**
 * Ensure log directory exists
 */
function ensureLogDirectory() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * Write log to file
 */
function writeLogToFile(log: DiagnosticLog) {
  try {
    ensureLogDirectory();
    const logLine = JSON.stringify(log) + '\n';
    fs.appendFileSync(LOG_FILE, logLine);
  } catch (error) {
    console.error('[DiagnosticCron] Error writing log to file:', error);
  }
}

/**
 * Read logs from file
 */
export function readLogsFromFile(limit: number = 50): DiagnosticLog[] {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return [];
    }

    const content = fs.readFileSync(LOG_FILE, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.length > 0);
    
    // Get last N lines
    const recentLines = lines.slice(-limit);
    
    return recentLines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(log => log !== null) as DiagnosticLog[];
  } catch (error) {
    console.error('[DiagnosticCron] Error reading logs from file:', error);
    return [];
  }
}

/**
 * Run diagnostic check
 */
async function runDiagnostic() {
  console.log('[DiagnosticCron] Running scheduled diagnostic check...');
  
  try {
    const sources = await getDiagnostic();
    
    const allActive = sources.every(s => s.status === 'active' && s.entriesCount > 0);
    const hasErrors = sources.some(s => s.status === 'error');
    
    const log: DiagnosticLog = {
      timestamp: new Date().toISOString(),
      overall_status: allActive ? 'healthy' : hasErrors ? 'degraded' : 'partial',
      sources: sources.map(s => ({
        source: s.name,
        status: s.status,
        last_sync: s.lastSync,
        entries_count: s.entriesCount,
      })),
      summary: {
        total_sources: sources.length,
        active: sources.filter(s => s.status === 'active').length,
        errors: sources.filter(s => s.status === 'error').length,
        unavailable: sources.filter(s => s.status === 'unavailable').length,
        total_entries: sources.reduce((sum, s) => sum + s.entriesCount, 0),
      },
    };
    
    // Store in memory
    diagnosticLogs.push(log);
    if (diagnosticLogs.length > MAX_LOGS) {
      diagnosticLogs.shift();
    }
    
    // Write to file
    writeLogToFile(log);
    
    console.log(`[DiagnosticCron] Diagnostic completed: ${log.overall_status}`);
    console.log(`[DiagnosticCron] Active sources: ${log.summary.active}/${log.summary.total_sources}`);
    console.log(`[DiagnosticCron] Total entries: ${log.summary.total_entries}`);
    
    // Alert if degraded
    if (log.overall_status === 'degraded') {
      console.warn('[DiagnosticCron] ⚠️ System is degraded! Some sources have errors.');
      const errorSources = sources.filter(s => s.status === 'error');
      errorSources.forEach(s => {
        console.warn(`[DiagnosticCron]   - ${s.name}: ERROR`);
      });
    }
    
  } catch (error) {
    console.error('[DiagnosticCron] Error running diagnostic:', error);
    
    const errorLog: DiagnosticLog = {
      timestamp: new Date().toISOString(),
      overall_status: 'degraded',
      sources: [],
      summary: {
        total_sources: 0,
        active: 0,
        errors: 1,
        unavailable: 0,
        total_entries: 0,
      },
    };
    
    diagnosticLogs.push(errorLog);
    writeLogToFile(errorLog);
  }
}

/**
 * Get recent diagnostic logs
 */
export function getRecentLogs(limit: number = 50): DiagnosticLog[] {
  // Try to read from file first
  const fileLogs = readLogsFromFile(limit);
  if (fileLogs.length > 0) {
    return fileLogs;
  }
  
  // Fallback to memory logs
  return diagnosticLogs.slice(-limit);
}

/**
 * Get latest diagnostic status
 */
export function getLatestStatus(): DiagnosticLog | null {
  const logs = getRecentLogs(1);
  return logs.length > 0 ? logs[0] : null;
}

/**
 * Start the cron job
 */
export function startDiagnosticCron() {
  console.log('[DiagnosticCron] Starting diagnostic cron job...');
  
  // Run every 24 hours at 3:00 AM
  // Cron format: second minute hour day month weekday
  // '0 0 3 * * *' = Every day at 3:00 AM
  const cronSchedule = '0 0 3 * * *';
  
  cron.schedule(cronSchedule, () => {
    runDiagnostic();
  }, {
    scheduled: true,
    timezone: 'America/Sao_Paulo', // Brazil timezone
  });
  
  console.log(`[DiagnosticCron] Cron job scheduled: ${cronSchedule} (America/Sao_Paulo)`);
  console.log('[DiagnosticCron] Next run: Every day at 3:00 AM');
  
  // Run immediately on startup
  console.log('[DiagnosticCron] Running initial diagnostic check...');
  runDiagnostic();
}

/**
 * Manual trigger for diagnostic check
 */
export async function triggerManualDiagnostic(): Promise<DiagnosticLog> {
  console.log('[DiagnosticCron] Manual diagnostic triggered');
  await runDiagnostic();
  const latest = getLatestStatus();
  if (!latest) {
    throw new Error('Failed to get diagnostic status');
  }
  return latest;
}

export default {
  startDiagnosticCron,
  getRecentLogs,
  getLatestStatus,
  triggerManualDiagnostic,
};

