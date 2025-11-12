/**
 * API Tracker Service
 * 
 * Monitors API usage, costs, availability, and performance.
 * Provides analytics and alerts for API consumption.
 */

import { db } from '../../../lib/database';
import { logger } from '../../../lib/logger';

export interface APIUsageRecord {
  source_id: number;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  request_size_bytes?: number;
  response_size_bytes?: number;
  cost: number;
  error_message?: string;
  metadata?: Record<string, any>;
}

export interface APISource {
  id: number;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  is_free: boolean;
  cost_per_request: number;
  monthly_quota: number | null;
  base_url: string;
  api_key_required: boolean;
  config: Record<string, any>;
  last_sync_at: Date | null;
  last_error: string | null;
}

export interface APIUsageStats {
  source_id: number;
  source_name: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  total_cost: number;
  avg_response_time_ms: number;
  quota_used_percentage: number | null;
  uptime_percentage: number;
  last_request_at: Date | null;
}

export interface APIHealthCheck {
  source_id: number;
  source_name: string;
  is_healthy: boolean;
  status_code: number | null;
  response_time_ms: number | null;
  error_message: string | null;
  checked_at: Date;
}

export class APITracker {
  /**
   * Track an API request
   */
  async trackRequest(record: APIUsageRecord): Promise<void> {
    try {
      await db.query(
        `INSERT INTO radar_api_usage (
          source_id, endpoint, method, status_code, response_time_ms,
          request_size_bytes, response_size_bytes, cost, error_message, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          record.source_id,
          record.endpoint,
          record.method,
          record.status_code,
          record.response_time_ms,
          record.request_size_bytes,
          record.response_size_bytes,
          record.cost,
          record.error_message,
          JSON.stringify(record.metadata || {}),
        ]
      );
    } catch (error: any) {
      logger.error('[APITracker] Failed to track request:', error.message);
      // Don't throw - tracking failures shouldn't break the main flow
    }
  }

  /**
   * Get API source by name
   */
  async getSourceByName(name: string): Promise<APISource | null> {
    try {
      const result = await db.query(
        'SELECT * FROM radar_api_sources WHERE name = $1',
        [name]
      );

      return result.rows[0] || null;
    } catch (error: any) {
      logger.error('[APITracker] Failed to get source by name:', error.message);
      throw error;
    }
  }

  /**
   * Get API source by type
   */
  async getSourceByType(type: string): Promise<APISource | null> {
    try {
      const result = await db.query(
        'SELECT * FROM radar_api_sources WHERE type = $1',
        [type]
      );

      return result.rows[0] || null;
    } catch (error: any) {
      logger.error('[APITracker] Failed to get source by type:', error.message);
      throw error;
    }
  }

  /**
   * Get all API sources
   */
  async getAllSources(): Promise<APISource[]> {
    try {
      const result = await db.query(
        'SELECT * FROM radar_api_sources ORDER BY name'
      );

      return result.rows;
    } catch (error: any) {
      logger.error('[APITracker] Failed to get all sources:', error.message);
      throw error;
    }
  }

  /**
   * Get usage statistics for a specific API source
   */
  async getUsageStats(
    sourceId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<APIUsageStats | null> {
    try {
      const params: any[] = [sourceId];
      let dateFilter = '';

      if (startDate && endDate) {
        dateFilter = 'AND created_at BETWEEN $2 AND $3';
        params.push(startDate, endDate);
      } else if (startDate) {
        dateFilter = 'AND created_at >= $2';
        params.push(startDate);
      }

      const result = await db.query(
        `SELECT 
          u.source_id,
          s.name as source_name,
          COUNT(*) as total_requests,
          COUNT(*) FILTER (WHERE u.status_code >= 200 AND u.status_code < 300) as successful_requests,
          COUNT(*) FILTER (WHERE u.status_code >= 400) as failed_requests,
          COALESCE(SUM(u.cost), 0) as total_cost,
          COALESCE(AVG(u.response_time_ms), 0) as avg_response_time_ms,
          CASE 
            WHEN s.monthly_quota IS NOT NULL THEN 
              (COUNT(*) * 100.0 / s.monthly_quota)
            ELSE NULL
          END as quota_used_percentage,
          (COUNT(*) FILTER (WHERE u.status_code >= 200 AND u.status_code < 300) * 100.0 / COUNT(*)) as uptime_percentage,
          MAX(u.created_at) as last_request_at
        FROM radar_api_usage u
        JOIN radar_api_sources s ON u.source_id = s.id
        WHERE u.source_id = $1 ${dateFilter}
        GROUP BY u.source_id, s.name, s.monthly_quota`,
        params
      );

      return result.rows[0] || null;
    } catch (error: any) {
      logger.error('[APITracker] Failed to get usage stats:', error.message);
      throw error;
    }
  }

  /**
   * Get usage statistics for all API sources
   */
  async getAllUsageStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<APIUsageStats[]> {
    try {
      const params: any[] = [];
      let dateFilter = '';

      if (startDate && endDate) {
        dateFilter = 'WHERE u.created_at BETWEEN $1 AND $2';
        params.push(startDate, endDate);
      } else if (startDate) {
        dateFilter = 'WHERE u.created_at >= $1';
        params.push(startDate);
      }

      const result = await db.query(
        `SELECT 
          u.source_id,
          s.name as source_name,
          COUNT(*) as total_requests,
          COUNT(*) FILTER (WHERE u.status_code >= 200 AND u.status_code < 300) as successful_requests,
          COUNT(*) FILTER (WHERE u.status_code >= 400) as failed_requests,
          COALESCE(SUM(u.cost), 0) as total_cost,
          COALESCE(AVG(u.response_time_ms), 0) as avg_response_time_ms,
          CASE 
            WHEN s.monthly_quota IS NOT NULL THEN 
              (COUNT(*) * 100.0 / s.monthly_quota)
            ELSE NULL
          END as quota_used_percentage,
          (COUNT(*) FILTER (WHERE u.status_code >= 200 AND u.status_code < 300) * 100.0 / NULLIF(COUNT(*), 0)) as uptime_percentage,
          MAX(u.created_at) as last_request_at
        FROM radar_api_usage u
        JOIN radar_api_sources s ON u.source_id = s.id
        ${dateFilter}
        GROUP BY u.source_id, s.name, s.monthly_quota
        ORDER BY s.name`,
        params
      );

      return result.rows;
    } catch (error: any) {
      logger.error('[APITracker] Failed to get all usage stats:', error.message);
      throw error;
    }
  }

  /**
   * Get total cost for a period
   */
  async getTotalCost(startDate?: Date, endDate?: Date): Promise<number> {
    try {
      const params: any[] = [];
      let dateFilter = '';

      if (startDate && endDate) {
        dateFilter = 'WHERE created_at BETWEEN $1 AND $2';
        params.push(startDate, endDate);
      } else if (startDate) {
        dateFilter = 'WHERE created_at >= $1';
        params.push(startDate);
      }

      const result = await db.query(
        `SELECT COALESCE(SUM(cost), 0) as total_cost
        FROM radar_api_usage
        ${dateFilter}`,
        params
      );

      return parseFloat(result.rows[0].total_cost);
    } catch (error: any) {
      logger.error('[APITracker] Failed to get total cost:', error.message);
      throw error;
    }
  }

  /**
   * Check health of an API source
   */
  async checkHealth(sourceId: number): Promise<APIHealthCheck> {
    try {
      const source = await db.query(
        'SELECT * FROM radar_api_sources WHERE id = $1',
        [sourceId]
      );

      if (!source.rows[0]) {
        throw new Error(`API source ${sourceId} not found`);
      }

      const sourceName = source.rows[0].name;

      // Get last 10 requests
      const recentRequests = await db.query(
        `SELECT status_code, response_time_ms, error_message, created_at
        FROM radar_api_usage
        WHERE source_id = $1
        ORDER BY created_at DESC
        LIMIT 10`,
        [sourceId]
      );

      if (recentRequests.rows.length === 0) {
        return {
          source_id: sourceId,
          source_name: sourceName,
          is_healthy: true, // No data yet, assume healthy
          status_code: null,
          response_time_ms: null,
          error_message: null,
          checked_at: new Date(),
        };
      }

      // Calculate health metrics
      const successfulRequests = recentRequests.rows.filter(
        (r) => r.status_code >= 200 && r.status_code < 300
      ).length;
      const successRate = successfulRequests / recentRequests.rows.length;
      const isHealthy = successRate >= 0.8; // 80% success rate

      const lastRequest = recentRequests.rows[0];

      return {
        source_id: sourceId,
        source_name: sourceName,
        is_healthy: isHealthy,
        status_code: lastRequest.status_code,
        response_time_ms: lastRequest.response_time_ms,
        error_message: lastRequest.error_message,
        checked_at: new Date(),
      };
    } catch (error: any) {
      logger.error('[APITracker] Failed to check health:', error.message);
      throw error;
    }
  }

  /**
   * Check health of all API sources
   */
  async checkAllHealth(): Promise<APIHealthCheck[]> {
    try {
      const sources = await this.getAllSources();
      const healthChecks = await Promise.all(
        sources.map((source) => this.checkHealth(source.id))
      );

      return healthChecks;
    } catch (error: any) {
      logger.error('[APITracker] Failed to check all health:', error.message);
      throw error;
    }
  }

  /**
   * Update API source status
   */
  async updateSourceStatus(
    sourceId: number,
    status: 'active' | 'inactive' | 'error',
    errorMessage?: string
  ): Promise<void> {
    try {
      await db.query(
        `UPDATE radar_api_sources
        SET status = $1, last_error = $2, updated_at = NOW()
        WHERE id = $3`,
        [status, errorMessage || null, sourceId]
      );

      logger.info(`[APITracker] Updated source ${sourceId} status to ${status}`);
    } catch (error: any) {
      logger.error('[APITracker] Failed to update source status:', error.message);
      throw error;
    }
  }

  /**
   * Update last sync timestamp
   */
  async updateLastSync(sourceId: number): Promise<void> {
    try {
      await db.query(
        'UPDATE radar_api_sources SET last_sync_at = NOW() WHERE id = $1',
        [sourceId]
      );
    } catch (error: any) {
      logger.error('[APITracker] Failed to update last sync:', error.message);
      throw error;
    }
  }

  /**
   * Get quota usage alerts
   * 
   * Returns sources that have exceeded a certain percentage of their quota
   */
  async getQuotaAlerts(threshold: number = 80): Promise<Array<{
    source_id: number;
    source_name: string;
    quota_used_percentage: number;
    requests_remaining: number;
  }>> {
    try {
      const result = await db.query(
        `SELECT 
          s.id as source_id,
          s.name as source_name,
          s.monthly_quota,
          COUNT(u.id) as requests_used,
          (COUNT(u.id) * 100.0 / s.monthly_quota) as quota_used_percentage,
          (s.monthly_quota - COUNT(u.id)) as requests_remaining
        FROM radar_api_sources s
        LEFT JOIN radar_api_usage u ON s.id = u.source_id 
          AND u.created_at >= date_trunc('month', CURRENT_DATE)
        WHERE s.monthly_quota IS NOT NULL
        GROUP BY s.id, s.name, s.monthly_quota
        HAVING (COUNT(u.id) * 100.0 / s.monthly_quota) >= $1
        ORDER BY quota_used_percentage DESC`,
        [threshold]
      );

      return result.rows;
    } catch (error: any) {
      logger.error('[APITracker] Failed to get quota alerts:', error.message);
      throw error;
    }
  }

  /**
   * Get cost alerts
   * 
   * Returns sources that have exceeded a certain cost threshold
   */
  async getCostAlerts(threshold: number = 100): Promise<Array<{
    source_id: number;
    source_name: string;
    total_cost: number;
    period: string;
  }>> {
    try {
      const result = await db.query(
        `SELECT 
          s.id as source_id,
          s.name as source_name,
          COALESCE(SUM(u.cost), 0) as total_cost,
          'current_month' as period
        FROM radar_api_sources s
        LEFT JOIN radar_api_usage u ON s.id = u.source_id 
          AND u.created_at >= date_trunc('month', CURRENT_DATE)
        WHERE s.is_free = false
        GROUP BY s.id, s.name
        HAVING COALESCE(SUM(u.cost), 0) >= $1
        ORDER BY total_cost DESC`,
        [threshold]
      );

      return result.rows;
    } catch (error: any) {
      logger.error('[APITracker] Failed to get cost alerts:', error.message);
      throw error;
    }
  }

  /**
   * Clean up old usage records
   * 
   * Deletes records older than the specified number of days
   */
  async cleanupOldRecords(daysToKeep: number = 90): Promise<number> {
    try {
      const result = await db.query(
        `DELETE FROM radar_api_usage
        WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'`,
        []
      );

      const deletedCount = result.rowCount || 0;
      logger.info(`[APITracker] Cleaned up ${deletedCount} old usage records`);

      return deletedCount;
    } catch (error: any) {
      logger.error('[APITracker] Failed to cleanup old records:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
let apiTracker: APITracker | null = null;

export function getAPITracker(): APITracker {
  if (!apiTracker) {
    apiTracker = new APITracker();
  }

  return apiTracker;
}

/**
 * Middleware to automatically track API requests
 * 
 * Wrap your API client calls with this function to automatically track usage
 */
export async function trackAPICall<T>(
  sourceName: string,
  endpoint: string,
  method: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const tracker = getAPITracker();
  const source = await tracker.getSourceByName(sourceName);

  if (!source) {
    logger.warn(`[APITracker] Source ${sourceName} not found, skipping tracking`);
    return apiCall();
  }

  const startTime = Date.now();
  let statusCode = 0;
  let errorMessage: string | undefined;

  try {
    const result = await apiCall();
    statusCode = 200; // Assume success if no error
    return result;
  } catch (error: any) {
    statusCode = error.response?.status || 500;
    errorMessage = error.message;
    throw error;
  } finally {
    const responseTimeMs = Date.now() - startTime;
    const cost = source.cost_per_request || 0;

    await tracker.trackRequest({
      source_id: source.id,
      endpoint,
      method,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
      cost,
      error_message: errorMessage,
    });
  }
}
