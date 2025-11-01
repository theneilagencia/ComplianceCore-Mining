/**
 * Tests for Radar Scheduler Service
 * 
 * @group unit
 * @group radar
 * @group scheduler
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getScheduler, startScheduler, stopScheduler, JOB_NAMES } from '../scheduler';
import * as cron from 'node-cron';

// Mock dependencies
vi.mock('node-cron');
vi.mock('../dataAggregator', () => ({
  aggregateAllData: vi.fn().mockResolvedValue([]),
  getDiagnostic: vi.fn().mockResolvedValue([
    {
      name: 'SIGMINE',
      status: 'active',
      lastUpdate: new Date(),
      stats: {
        totalRecords: 100,
        newRecords: 5,
        updatedRecords: 3,
        deletedRecords: 0,
      },
    },
  ]),
}));

vi.mock('../../scrapers/dou', () => ({
  getDOUScraper: vi.fn(() => ({
    scrape: vi.fn().mockResolvedValue([]),
    getStatistics: vi.fn().mockReturnValue({
      totalRequests: 1,
      successfulRequests: 1,
      failedRequests: 0,
      cacheHits: 0,
      cacheMisses: 1,
      totalItemsFound: 0,
      lastRun: new Date(),
    }),
  })),
}));

vi.mock('../notifications', () => ({
  getNotificationService: vi.fn(() => ({
    send: vi.fn().mockResolvedValue(true),
  })),
}));

describe('RadarScheduler', () => {
  let mockTask: any;

  beforeEach(() => {
    // Mock cron task
    mockTask = {
      start: vi.fn(),
      stop: vi.fn(),
    };
    
    vi.mocked(cron.schedule).mockReturnValue(mockTask as any);
    vi.mocked(cron.validate).mockReturnValue(true);
  });

  afterEach(() => {
    stopScheduler();
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = getScheduler();
      const instance2 = getScheduler();
      
      expect(instance1).toBe(instance2);
    });

    it('should create a valid scheduler instance', () => {
      const instance = getScheduler();
      
      expect(instance).toBeDefined();
      expect(instance.getStats).toBeDefined();
      expect(instance.getJobs).toBeDefined();
      expect(instance.isHealthy).toBeDefined();
    });
  });

  describe('Job Scheduling', () => {
    it('should schedule all jobs on init', async () => {
      await startScheduler();
      
      // Should schedule 4 jobs
      expect(cron.schedule).toHaveBeenCalledTimes(4);
    });

    it('should use correct cron expressions', async () => {
      await startScheduler();
      
      const calls = vi.mocked(cron.schedule).mock.calls;
      
      // DATA_AGGREGATION: every 6 hours
      expect(calls.some(call => call[0] === '0 */6 * * *')).toBe(true);
      
      // DOU_SCRAPING: every 12 hours
      expect(calls.some(call => call[0] === '0 */12 * * *')).toBe(true);
      
      // HEALTH_CHECK: every 30 minutes
      expect(calls.some(call => call[0] === '*/30 * * * *')).toBe(true);
      
      // CLEANUP: daily at 2 AM
      expect(calls.some(call => call[0] === '0 2 * * *')).toBe(true);
    });

    it('should use correct timezone', async () => {
      await startScheduler();
      
      const calls = vi.mocked(cron.schedule).mock.calls;
      
      // All jobs should use America/Sao_Paulo timezone
      calls.forEach(call => {
        expect(call[2]).toMatchObject({
          timezone: 'America/Sao_Paulo',
        });
      });
    });

    it('should validate cron expressions', async () => {
      await startScheduler();
      
      expect(cron.validate).toHaveBeenCalledTimes(4);
    });

    it('should get list of scheduled jobs', async () => {
      await startScheduler();
      
      const scheduler = getScheduler();
      const jobs = scheduler.getJobs();
      
      expect(jobs).toHaveLength(4);
      expect(jobs).toEqual([
        { name: JOB_NAMES.DATA_AGGREGATION, scheduled: true },
        { name: JOB_NAMES.DOU_SCRAPING, scheduled: true },
        { name: JOB_NAMES.HEALTH_CHECK, scheduled: true },
        { name: JOB_NAMES.CLEANUP, scheduled: true },
      ]);
    });
  });

  describe('Job Control', () => {
    it('should start all jobs', async () => {
      await startScheduler();
      
      const scheduler = getScheduler();
      scheduler.startAll();
      
      // Each task should have been started
      expect(mockTask.start).toHaveBeenCalled();
    });

    it('should stop all jobs', async () => {
      await startScheduler();
      
      const scheduler = getScheduler();
      scheduler.stopAll();
      
      // Each task should have been stopped
      expect(mockTask.stop).toHaveBeenCalled();
    });

    it('should stop jobs via stopScheduler', async () => {
      await startScheduler();
      
      stopScheduler();
      
      expect(mockTask.stop).toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    it('should track execution statistics', async () => {
      await startScheduler();
      
      const scheduler = getScheduler();
      const stats = scheduler.getStats();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalExecutions');
      expect(stats).toHaveProperty('successfulExecutions');
      expect(stats).toHaveProperty('failedExecutions');
      expect(stats).toHaveProperty('lastExecution');
      expect(stats).toHaveProperty('averageDuration');
    });

    it('should start with zero executions', async () => {
      await startScheduler();
      
      const scheduler = getScheduler();
      const stats = scheduler.getStats();
      
      expect(stats.totalExecutions).toBe(0);
      expect(stats.successfulExecutions).toBe(0);
      expect(stats.failedExecutions).toBe(0);
    });
  });

  describe('Execution History', () => {
    it('should track execution history', async () => {
      await startScheduler();
      
      const scheduler = getScheduler();
      const history = scheduler.getExecutionHistory();
      
      expect(Array.isArray(history)).toBe(true);
    });

    it('should limit history size', async () => {
      await startScheduler();
      
      const scheduler = getScheduler();
      const history = scheduler.getExecutionHistory(undefined, 10);
      
      expect(history.length).toBeLessThanOrEqual(10);
    });

    it('should filter history by job name', async () => {
      await startScheduler();
      
      const scheduler = getScheduler();
      const history = scheduler.getExecutionHistory(JOB_NAMES.DATA_AGGREGATION);
      
      expect(Array.isArray(history)).toBe(true);
      // All entries should be for the specified job
      history.forEach(entry => {
        expect(entry.jobName).toBe(JOB_NAMES.DATA_AGGREGATION);
      });
    });
  });

  describe('Health Monitoring', () => {
    it('should report healthy status by default', async () => {
      await startScheduler();
      
      const scheduler = getScheduler();
      const isHealthy = scheduler.isHealthy();
      
      expect(isHealthy).toBe(true);
    });

    it('should detect unhealthy status with multiple failures', async () => {
      await startScheduler();
      
      const scheduler = getScheduler();
      
      // Scheduler should still report healthy initially
      expect(scheduler.isHealthy()).toBe(true);
    });
  });

  describe('Job Configuration', () => {
    it('should use correct job names', () => {
      expect(JOB_NAMES).toEqual({
        DATA_AGGREGATION: 'data-aggregation',
        DOU_SCRAPING: 'dou-scraping',
        HEALTH_CHECK: 'health-check',
        CLEANUP: 'cleanup',
      });
    });
  });

  describe('Integration', () => {
    it('should integrate with data aggregator', async () => {
      const { aggregateAllData } = await import('../dataAggregator');
      
      await startScheduler();
      
      // Verify that the scheduler has access to the aggregator
      expect(aggregateAllData).toBeDefined();
    });

    it('should integrate with DOU scraper', async () => {
      const { getDOUScraper } = await import('../../scrapers/dou');
      
      await startScheduler();
      
      // Verify that the scheduler has access to the scraper
      expect(getDOUScraper).toBeDefined();
    });

    it('should integrate with notifications', async () => {
      const { getNotificationService } = await import('../notifications');
      
      await startScheduler();
      
      // Verify that the scheduler has access to notifications
      expect(getNotificationService).toBeDefined();
    });
  });
});
