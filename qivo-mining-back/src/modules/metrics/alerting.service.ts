/**
 * Alerting Service - Metrics-based Alerting System
 * 
 * Monitors metrics and triggers alerts when thresholds are exceeded:
 * - Configurable thresholds per metric
 * - Multiple alert channels (SSE, webhook, email)
 * - Alert history and acknowledgment
 * - Automatic alert resolution
 * - Alert grouping and deduplication
 */

import { SSEEventType, type SSEService } from '../sse/sse.service';
import type { MetricsService, MetricSnapshot } from './metrics.service';

export interface AlertRule {
  id: string;
  name: string;
  metricName: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration: number; // ms - how long condition must be true
  severity: 'info' | 'warning' | 'error' | 'critical';
  enabled: boolean;
  labels?: Record<string, string>;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  metricName: string;
  currentValue: number;
  threshold: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  startedAt: Date;
  resolvedAt?: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  status: 'firing' | 'resolved' | 'acknowledged';
  labels?: Record<string, string>;
}

export interface AlertChannel {
  type: 'sse' | 'webhook' | 'email';
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface AlertingConfig {
  checkInterval: number; // ms
  channels: AlertChannel[];
  groupingWindow: number; // ms
  deduplicationWindow: number; // ms
}

export interface AlertStats {
  totalAlerts: number;
  firingAlerts: number;
  resolvedAlerts: number;
  acknowledgedAlerts: number;
  alertsByRule: Record<string, number>;
  alertsBySeverity: Record<string, number>;
}

/**
 * AlertingService - Monitor metrics and trigger alerts
 */
export class AlertingService {
  private metricsService: MetricsService;
  private sseService?: SSEService;
  private config: AlertingConfig;
  private rules: Map<string, AlertRule>;
  private alerts: Map<string, Alert>;
  private alertHistory: Alert[];
  private checkTimer?: NodeJS.Timeout;
  private conditionStartTimes: Map<string, Date>;

  constructor(
    metricsService: MetricsService,
    config: Partial<AlertingConfig> = {}
  ) {
    this.metricsService = metricsService;
    this.config = {
      checkInterval: 30000, // 30s
      channels: [
        { type: 'sse', enabled: true, config: {} },
      ],
      groupingWindow: 300000, // 5min
      deduplicationWindow: 600000, // 10min
      ...config,
    };

    this.rules = new Map();
    this.alerts = new Map();
    this.alertHistory = [];
    this.conditionStartTimes = new Map();

    // Add default rules
    this.addDefaultRules();
  }

  /**
   * Set SSE service for real-time alerts
   */
  setSSEService(sseService: SSEService): void {
    this.sseService = sseService;
  }

  /**
   * Add default alerting rules
   */
  private addDefaultRules(): void {
    // Response time alerts
    this.addRule({
      id: 'high-response-time',
      name: 'High Response Time',
      metricName: 'http_request_duration_seconds_p95',
      condition: 'gt',
      threshold: 2, // 2 seconds
      duration: 60000, // 1 minute
      severity: 'warning',
      enabled: true,
    });

    // Error rate alerts
    this.addRule({
      id: 'high-error-rate',
      name: 'High Error Rate',
      metricName: 'http_request_errors_total',
      condition: 'gt',
      threshold: 10, // 10 errors
      duration: 60000,
      severity: 'error',
      enabled: true,
    });

    // Cache hit rate alerts
    this.addRule({
      id: 'low-cache-hit-rate',
      name: 'Low Cache Hit Rate',
      metricName: 'cache_hit_rate',
      condition: 'lt',
      threshold: 50, // 50%
      duration: 300000, // 5 minutes
      severity: 'warning',
      enabled: true,
    });

    // OCR accuracy alerts
    this.addRule({
      id: 'low-ocr-accuracy',
      name: 'Low OCR Accuracy',
      metricName: 'ocr_accuracy_percentage',
      condition: 'lt',
      threshold: 90, // 90%
      duration: 60000,
      severity: 'warning',
      enabled: true,
    });

    // Connection alerts
    this.addRule({
      id: 'high-connection-count',
      name: 'High Active Connections',
      metricName: 'active_connections',
      condition: 'gt',
      threshold: 900, // 90% of max 1000
      duration: 60000,
      severity: 'warning',
      enabled: true,
    });
  }

  /**
   * Add alert rule
   */
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove alert rule
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * Update alert rule
   */
  updateRule(ruleId: string, updates: Partial<AlertRule>): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      this.rules.set(ruleId, { ...rule, ...updates });
    }
  }

  /**
   * Get all rules
   */
  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Start alert checking
   */
  start(): void {
    if (this.checkTimer) {
      return;
    }

    this.checkTimer = setInterval(() => {
      this.checkAlerts();
    }, this.config.checkInterval);
  }

  /**
   * Stop alert checking
   */
  stop(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = undefined;
    }
  }

  /**
   * Check all alert rules
   */
  private async checkAlerts(): Promise<void> {
    const metrics = await this.metricsService.getMetrics();

    const rulesArray = Array.from(this.rules.values());
    for (const rule of rulesArray) {
      if (!rule.enabled) {
        continue;
      }

      await this.checkRule(rule, metrics);
    }

    // Auto-resolve alerts
    this.autoResolveAlerts(metrics);
  }

  /**
   * Check single alert rule
   */
  private async checkRule(rule: AlertRule, metrics: MetricSnapshot[]): Promise<void> {
    const metric = metrics.find((m) => {
      if (m.name !== rule.metricName) {
        return false;
      }

      if (rule.labels) {
        return Object.entries(rule.labels).every(
          ([key, value]) => m.labels?.[key] === value
        );
      }

      return true;
    });

    if (!metric) {
      return;
    }

    const conditionMet = this.evaluateCondition(
      metric.value,
      rule.condition,
      rule.threshold
    );

    const conditionKey = `${rule.id}:${JSON.stringify(rule.labels || {})}`;

    if (conditionMet) {
      // Track when condition started
      if (!this.conditionStartTimes.has(conditionKey)) {
        this.conditionStartTimes.set(conditionKey, new Date());
      }

      // Check if condition has been true for required duration
      const conditionStart = this.conditionStartTimes.get(conditionKey)!;
      const duration = Date.now() - conditionStart.getTime();

      if (duration >= rule.duration) {
        await this.fireAlert(rule, metric.value);
      }
    } else {
      // Condition not met, clear start time
      this.conditionStartTimes.delete(conditionKey);
    }
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(
    value: number,
    condition: AlertRule['condition'],
    threshold: number
  ): boolean {
    switch (condition) {
      case 'gt':
        return value > threshold;
      case 'lt':
        return value < threshold;
      case 'eq':
        return value === threshold;
      case 'gte':
        return value >= threshold;
      case 'lte':
        return value <= threshold;
      default:
        return false;
    }
  }

  /**
   * Fire alert
   */
  private async fireAlert(rule: AlertRule, currentValue: number): Promise<void> {
    // Check for duplicate alert
    const existingAlert = Array.from(this.alerts.values()).find(
      (a) => a.ruleId === rule.id && a.status === 'firing'
    );

    if (existingAlert) {
      // Check deduplication window
      const timeSinceStart = Date.now() - existingAlert.startedAt.getTime();
      if (timeSinceStart < this.config.deduplicationWindow) {
        return;
      }
    }

    // Create new alert
    const alert: Alert = {
      id: `${rule.id}-${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      metricName: rule.metricName,
      currentValue,
      threshold: rule.threshold,
      severity: rule.severity,
      message: this.generateAlertMessage(rule, currentValue),
      startedAt: new Date(),
      status: 'firing',
      labels: rule.labels,
    };

    this.alerts.set(alert.id, alert);
    this.alertHistory.push(alert);

    // Send alert through channels
    await this.sendAlert(alert);
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(rule: AlertRule, currentValue: number): string {
    const condition = rule.condition.toUpperCase();
    return `${rule.name}: ${rule.metricName} (${currentValue.toFixed(2)}) is ${condition} threshold (${rule.threshold})`;
  }

  /**
   * Send alert through configured channels
   */
  private async sendAlert(alert: Alert): Promise<void> {
    for (const channel of this.config.channels) {
      if (!channel.enabled) {
        continue;
      }

      try {
        switch (channel.type) {
          case 'sse':
            await this.sendSSEAlert(alert);
            break;
          case 'webhook':
            await this.sendWebhookAlert(alert, channel.config);
            break;
          case 'email':
            await this.sendEmailAlert(alert, channel.config);
            break;
        }
      } catch (error) {
        console.error(`Failed to send alert via ${channel.type}:`, error);
      }
    }
  }

  /**
   * Send alert via SSE
   */
  private async sendSSEAlert(alert: Alert): Promise<void> {
    if (!this.sseService) {
      return;
    }

    this.sseService.broadcast({
      type: SSEEventType.ALERT_FIRED,
      data: alert,
    });
  }

  /**
   * Send alert via webhook
   */
  private async sendWebhookAlert(
    alert: Alert,
    config: Record<string, unknown>
  ): Promise<void> {
    const webhookUrl = config.url as string;
    if (!webhookUrl) {
      return;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.statusText}`);
    }
  }

  /**
   * Send alert via email
   */
  private async sendEmailAlert(
    alert: Alert,
    config: Record<string, unknown>
  ): Promise<void> {
    // Email implementation would go here
    console.log('Email alert:', alert);
  }

  /**
   * Auto-resolve alerts when conditions are no longer met
   */
  private autoResolveAlerts(metrics: MetricSnapshot[]): void {
    const alertsArray = Array.from(this.alerts.values());
    for (const alert of alertsArray) {
      if (alert.status !== 'firing') {
        continue;
      }

      const rule = this.rules.get(alert.ruleId);
      if (!rule) {
        continue;
      }

      const metric = metrics.find((m) => m.name === rule.metricName);
      if (!metric) {
        continue;
      }

      const conditionMet = this.evaluateCondition(
        metric.value,
        rule.condition,
        rule.threshold
      );

      if (!conditionMet) {
        this.resolveAlert(alert.id);
      }
    }
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return;
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();

    if (this.sseService) {
      this.sseService.broadcast({
        type: SSEEventType.ALERT_RESOLVED,
        data: alert,
      });
    }

    // Remove from active alerts
    this.alerts.delete(alertId);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string, userId: string): void {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return;
    }

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;

    if (this.sseService) {
      this.sseService.broadcast({
        type: SSEEventType.ALERT_ACKNOWLEDGED,
        data: alert,
      });
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(
      (a) => a.status === 'firing' || a.status === 'acknowledged'
    );
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit: number = 100): Alert[] {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Get alert statistics
   */
  getStats(): AlertStats {
    const alerts = Array.from(this.alerts.values());
    
    return {
      totalAlerts: this.alertHistory.length,
      firingAlerts: alerts.filter((a) => a.status === 'firing').length,
      resolvedAlerts: this.alertHistory.filter((a) => a.status === 'resolved').length,
      acknowledgedAlerts: alerts.filter((a) => a.status === 'acknowledged').length,
      alertsByRule: this.alertHistory.reduce((acc, alert) => {
        acc[alert.ruleId] = (acc[alert.ruleId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      alertsBySeverity: this.alertHistory.reduce((acc, alert) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Clear alert history
   */
  clearHistory(): void {
    this.alertHistory = [];
  }
}
