/**
 * Scheduler Service
 * 
 * Gerenciador de tarefas agendadas (cron jobs) para o módulo Radar
 * - Data Aggregation: a cada 6 horas
 * - DOU Scraping: a cada 12 horas
 * - Notificações automáticas
 * - Logging e monitoramento
 */

import cron, { ScheduledTask } from 'node-cron';
import { aggregateAllData, getDiagnostic } from './dataAggregator';
import { getDOUScraper, type DOUDocument } from '../scrapers/dou';
import { getNotificationService } from './notifications';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface JobConfig {
  name: string;
  schedule: string; // Cron expression
  enabled: boolean;
  timezone?: string;
}

export interface JobExecution {
  jobName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'running' | 'success' | 'failed';
  error?: string;
  result?: any;
}

export interface SchedulerStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  lastExecution: Record<string, Date>;
  averageDuration: Record<string, number>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

// Cron schedules
const SCHEDULES = {
  DATA_AGGREGATION: '0 */6 * * *',    // Every 6 hours at minute 0
  DOU_SCRAPING: '0 */12 * * *',       // Every 12 hours at minute 0
  HEALTH_CHECK: '*/30 * * * *',       // Every 30 minutes
  CLEANUP: '0 2 * * *',                // Daily at 2 AM
};

// Job names
export const JOB_NAMES = {
  DATA_AGGREGATION: 'data-aggregation',
  DOU_SCRAPING: 'dou-scraping',
  HEALTH_CHECK: 'health-check',
  CLEANUP: 'cleanup',
} as const;

// ============================================================================
// SCHEDULER CLASS
// ============================================================================

export class RadarScheduler {
  private jobs: Map<string, ScheduledTask> = new Map();
  private executionHistory: JobExecution[] = [];
  private stats: SchedulerStats;
  private maxHistorySize = 1000;

  constructor() {
    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      lastExecution: {},
      averageDuration: {},
    };
  }

  /**
   * Initialize all scheduled jobs
   */
  async init(): Promise<void> {
    console.log('[RadarScheduler] Initializing scheduler...');

    // Data Aggregation Job
    this.scheduleJob({
      name: JOB_NAMES.DATA_AGGREGATION,
      schedule: SCHEDULES.DATA_AGGREGATION,
      enabled: true,
      timezone: DEFAULT_TIMEZONE,
    }, async () => {
      await this.runDataAggregation();
    });

    // DOU Scraping Job
    this.scheduleJob({
      name: JOB_NAMES.DOU_SCRAPING,
      schedule: SCHEDULES.DOU_SCRAPING,
      enabled: true,
      timezone: DEFAULT_TIMEZONE,
    }, async () => {
      await this.runDOUScraping();
    });

    // Health Check Job
    this.scheduleJob({
      name: JOB_NAMES.HEALTH_CHECK,
      schedule: SCHEDULES.HEALTH_CHECK,
      enabled: true,
      timezone: DEFAULT_TIMEZONE,
    }, async () => {
      await this.runHealthCheck();
    });

    // Cleanup Job
    this.scheduleJob({
      name: JOB_NAMES.CLEANUP,
      schedule: SCHEDULES.CLEANUP,
      enabled: true,
      timezone: DEFAULT_TIMEZONE,
    }, async () => {
      await this.runCleanup();
    });

    console.log(`[RadarScheduler] ${this.jobs.size} jobs scheduled`);
  }

  /**
   * Schedule a new job
   */
  private scheduleJob(
    config: JobConfig,
    handler: () => Promise<void>
  ): void {
    if (!cron.validate(config.schedule)) {
      throw new Error(`Invalid cron expression: ${config.schedule}`);
    }

    const task = cron.schedule(
      config.schedule,
      async () => {
        if (!config.enabled) {
          console.log(`[RadarScheduler] Job ${config.name} is disabled, skipping`);
          return;
        }

        const execution: JobExecution = {
          jobName: config.name,
          startTime: new Date(),
          status: 'running',
        };

        try {
          console.log(`[RadarScheduler] Starting job: ${config.name}`);
          
          await handler();

          execution.endTime = new Date();
          execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
          execution.status = 'success';

          this.stats.successfulExecutions++;
          console.log(`[RadarScheduler] Job ${config.name} completed in ${execution.duration}ms`);

        } catch (error) {
          execution.endTime = new Date();
          execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
          execution.status = 'failed';
          execution.error = error instanceof Error ? error.message : String(error);

          this.stats.failedExecutions++;
          console.error(`[RadarScheduler] Job ${config.name} failed:`, error);

        } finally {
          this.recordExecution(execution);
        }
      },
      {
        timezone: config.timezone || DEFAULT_TIMEZONE,
      }
    );

    this.jobs.set(config.name, task);
    console.log(`[RadarScheduler] Job ${config.name} scheduled: ${config.schedule}`);
  }

  /**
   * Record job execution
   */
  private recordExecution(execution: JobExecution): void {
    this.executionHistory.push(execution);
    this.stats.totalExecutions++;
    this.stats.lastExecution[execution.jobName] = execution.startTime;

    // Update average duration
    if (execution.duration) {
      const jobExecutions = this.executionHistory.filter(
        e => e.jobName === execution.jobName && e.duration
      );
      const avgDuration = jobExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) / jobExecutions.length;
      this.stats.averageDuration[execution.jobName] = avgDuration;
    }

    // Limit history size
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.shift();
    }
  }

  // ============================================================================
  // JOB HANDLERS
  // ============================================================================

  /**
   * Data Aggregation Job - Runs every 6 hours
   */
  private async runDataAggregation(): Promise<void> {
    console.log('[DataAggregation] Starting data aggregation...');

    const result = await aggregateAllData();

    console.log(`[DataAggregation] Aggregated ${result.operations.length} operations from ${result.sources.length} sources`);

    // Send notification if high-priority issues found
    const activeSources = result.sources.filter(s => s.status === 'active');
    const errorSources = result.sources.filter(s => s.status === 'error');

    if (errorSources.length > 0) {
      const notificationService = getNotificationService();
      await notificationService.sendNotification({
        id: `aggregation-${Date.now()}`,
        title: `⚠️ Data Aggregation Alert`,
        source: 'Radar System',
        url: 'https://qivo.mining/radar',
        publishedAt: new Date(),
        category: 'Other',
        severity: 'medium',
        summary: `${errorSources.length} data source(s) failed: ${errorSources.map(s => s.name).join(', ')}`,
      });
    }

    return;
  }

  /**
   * DOU Scraping Job - Runs every 12 hours
   */
  private async runDOUScraping(): Promise<void> {
    console.log('[DOUScraping] Starting DOU scraping...');

    const scraper = getDOUScraper();
    const documents = await scraper.scrape();

    console.log(`[DOUScraping] Found ${documents.length} relevant DOU documents`);

    // Send notifications for high-relevance documents
    const highRelevanceDocs = documents.filter(doc => doc.relevance === 'high');

    if (highRelevanceDocs.length > 0) {
      const notificationService = getNotificationService();

      for (const doc of highRelevanceDocs.slice(0, 5)) { // Max 5 notifications
        // Map DOU categories to notification categories
        const categoryMap: Record<string, 'ANM' | 'DOU' | 'Other'> = {
          'ANM': 'ANM',
          'CFEM': 'ANM',
          'LICENCA': 'ANM',
          'CONCESSAO': 'ANM',
          'PESQUISA': 'ANM',
          'OUTROS': 'DOU',
        };

        await notificationService.sendNotification({
          id: doc.id,
          title: `📄 DOU: ${doc.title}`,
          source: 'DOU',
          url: doc.url,
          publishedAt: doc.publishedAt,
          category: categoryMap[doc.category] || 'DOU',
          severity: doc.relevance === 'high' ? 'high' : 'medium',
          summary: doc.content.substring(0, 200) + '...',
          tags: doc.terms,
        });
      }
    }

    return;
  }

  /**
   * Health Check Job - Runs every 30 minutes
   */
  private async runHealthCheck(): Promise<void> {
    console.log('[HealthCheck] Running health check...');

    const diagnostic = await getDiagnostic();

    const totalSources = diagnostic.length;
    const activeSources = diagnostic.filter(s => s.status === 'active').length;
    const errorSources = diagnostic.filter(s => s.status === 'error').length;

    console.log(`[HealthCheck] Sources: ${activeSources}/${totalSources} active, ${errorSources} errors`);

    // Alert if more than 50% of sources are down
    if (errorSources > totalSources / 2) {
      const notificationService = getNotificationService();
      await notificationService.sendNotification({
        id: `health-${Date.now()}`,
        title: '🚨 RADAR SYSTEM ALERT',
        source: 'Health Check',
        url: 'https://qivo.mining/radar/health',
        publishedAt: new Date(),
        category: 'Other',
        severity: 'critical',
        summary: `Critical: ${errorSources}/${totalSources} data sources are down!`,
      });
    }

    return;
  }

  /**
   * Cleanup Job - Runs daily at 2 AM
   */
  private async runCleanup(): Promise<void> {
    console.log('[Cleanup] Running cleanup...');

    // Clean old execution history (keep last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const beforeCount = this.executionHistory.length;
    this.executionHistory = this.executionHistory.filter(
      e => e.startTime > sevenDaysAgo
    );
    const afterCount = this.executionHistory.length;

    console.log(`[Cleanup] Removed ${beforeCount - afterCount} old execution records`);

    // Clear scraper cache
    const scraper = getDOUScraper();
    scraper.clearCache();

    console.log('[Cleanup] Cleanup completed');
    return;
  }

  // ============================================================================
  // CONTROL METHODS
  // ============================================================================

  /**
   * Start a specific job manually
   */
  async runJob(jobName: string): Promise<void> {
    console.log(`[RadarScheduler] Manually running job: ${jobName}`);

    switch (jobName) {
      case JOB_NAMES.DATA_AGGREGATION:
        await this.runDataAggregation();
        break;
      case JOB_NAMES.DOU_SCRAPING:
        await this.runDOUScraping();
        break;
      case JOB_NAMES.HEALTH_CHECK:
        await this.runHealthCheck();
        break;
      case JOB_NAMES.CLEANUP:
        await this.runCleanup();
        break;
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }

  /**
   * Stop a specific job
   */
  stopJob(jobName: string): void {
    const task = this.jobs.get(jobName);
    if (task) {
      task.stop();
      console.log(`[RadarScheduler] Job ${jobName} stopped`);
    }
  }

  /**
   * Start a specific job
   */
  startJob(jobName: string): void {
    const task = this.jobs.get(jobName);
    if (task) {
      task.start();
      console.log(`[RadarScheduler] Job ${jobName} started`);
    }
  }

  /**
   * Stop all jobs
   */
  stopAll(): void {
    console.log('[RadarScheduler] Stopping all jobs...');
    this.jobs.forEach((task, name) => {
      task.stop();
      console.log(`[RadarScheduler] Job ${name} stopped`);
    });
  }

  /**
   * Start all jobs
   */
  startAll(): void {
    console.log('[RadarScheduler] Starting all jobs...');
    this.jobs.forEach((task, name) => {
      task.start();
      console.log(`[RadarScheduler] Job ${name} started`);
    });
  }

  /**
   * Get scheduler statistics
   */
  getStats(): SchedulerStats {
    return { ...this.stats };
  }

  /**
   * Get execution history
   */
  getExecutionHistory(jobName?: string, limit: number = 100): JobExecution[] {
    let history = this.executionHistory;

    if (jobName) {
      history = history.filter(e => e.jobName === jobName);
    }

    return history.slice(-limit);
  }

  /**
   * Get list of scheduled jobs
   */
  getJobs(): Array<{ name: string; scheduled: boolean }> {
    return Array.from(this.jobs.entries()).map(([name, task]) => ({
      name,
      scheduled: true, // node-cron doesn't expose running state directly
    }));
  }

  /**
   * Check if scheduler is healthy
   */
  isHealthy(): boolean {
    const recentFailures = this.executionHistory
      .filter(e => e.status === 'failed')
      .filter(e => {
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);
        return e.startTime > oneHourAgo;
      });

    // Healthy if less than 3 failures in the last hour
    return recentFailures.length < 3;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let schedulerInstance: RadarScheduler | null = null;

export function getScheduler(): RadarScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new RadarScheduler();
  }
  return schedulerInstance;
}

/**
 * Initialize and start the scheduler
 */
export async function startScheduler(): Promise<RadarScheduler> {
  const scheduler = getScheduler();
  await scheduler.init();
  return scheduler;
}

/**
 * Stop the scheduler
 */
export function stopScheduler(): void {
  const scheduler = getScheduler();
  scheduler.stopAll();
}

export default {
  RadarScheduler,
  getScheduler,
  startScheduler,
  stopScheduler,
  JOB_NAMES,
};
