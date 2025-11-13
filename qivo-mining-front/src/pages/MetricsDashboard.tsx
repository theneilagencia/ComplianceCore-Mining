/**
 * Metrics Dashboard - Real-time System Monitoring
 * 
 * Interactive dashboard with:
 * - Response time visualization
 * - Error rate tracking
 * - Cache hit rate analysis
 * - OCR accuracy monitoring
 * - Real-time SSE updates
 * - Alert management
 * 
 * @module MetricsDashboard
 * @sprint SPRINT5-004
 */

import React, { useState, useEffect } from 'react';

// Get API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
import { useSSE, useSSEEvent } from '../hooks/useSSE';
import { SSEEventType } from '../hooks/useSSE';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  FileText,
  RefreshCw
} from 'lucide-react';
import ResponseTimeChart from '../components/metrics/ResponseTimeChart';
import ErrorRateChart from '../components/metrics/ErrorRateChart';
import CacheHitRateChart from '../components/metrics/CacheHitRateChart';
import OCRAccuracyChart from '../components/metrics/OCRAccuracyChart';

export interface MetricSnapshot {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  labels?: Record<string, string | number>;
  timestamp: Date;
}

export interface MetricStats {
  totalMetrics: number;
  activeMetrics: number;
  collectionInterval: number;
  uptime: number;
  lastCollection: Date;
}

export interface AlertData {
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
  status: 'firing' | 'resolved' | 'acknowledged';
}

/**
 * MetricsDashboard Component
 */
export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricSnapshot[]>([]);
  const [stats, setStats] = useState<MetricStats | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  // Connect to SSE for real-time updates
  const { connectionState: sseStatus } = useSSE({
    url: '/api/events/stream',
    autoReconnect: true,
  });

  // Listen for metrics updates
  useSSEEvent(SSEEventType.METRICS_UPDATED, (event) => {
    if (autoRefresh && event.data?.metrics) {
      setMetrics(event.data.metrics);
      setStats(event.data.stats);
    }
  });

  // Listen for alert events
  useSSEEvent(SSEEventType.ALERT_FIRED, (event) => {
    if (event.data) {
      setAlerts((prev) => [event.data, ...prev]);
    }
  });

  useSSEEvent(SSEEventType.ALERT_RESOLVED, (event) => {
    if (event.data) {
      setAlerts((prev) => 
        prev.map((alert) => 
          alert.id === event.data.id ? event.data : alert
        )
      );
    }
  });

  useSSEEvent(SSEEventType.ALERT_ACKNOWLEDGED, (event) => {
    if (event.data) {
      setAlerts((prev) => 
        prev.map((alert) => 
          alert.id === event.data.id ? event.data : alert
        )
      );
    }
  });

  // Fetch initial metrics
  useEffect(() => {
    fetchMetrics();
    fetchAlerts();
  }, []);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMetrics();
    }, 10000); // 10s

    return () => clearInterval(interval);
  }, [autoRefresh]);

  /**
   * Fetch current metrics
   */
  const fetchMetrics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/metrics`, {
        credentials: 'include',
      });
      const result = await response.json();

      if (result.success) {
        setMetrics(result.data.metrics);
        setStats(result.data.stats);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch metrics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch active alerts
   */
  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/metrics/alerts`, {
        credentials: 'include',
      });
      const result = await response.json();

      if (result.success) {
        setAlerts(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  /**
   * Acknowledge alert
   */
  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/metrics/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: 'current-user' }),
      });

      if (response.ok) {
        fetchAlerts();
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  /**
   * Get metric value by name
   */
  const getMetricValue = (name: string): number => {
    const metric = metrics.find((m) => m.name === name);
    return metric?.value ?? 0;
  };

  /**
   * Format uptime
   */
  const formatUptime = (ms: number): string => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  /**
   * Get severity badge color
   */
  const getSeverityColor = (severity: AlertData['severity']): string => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'error': return 'destructive';
      case 'warning': return 'warning';
      case 'info': return 'default';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="animate-spin h-8 w-8 text-primary" />
        <span className="ml-2">Loading metrics...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Metrics Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and performance analytics
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* SSE Status */}
          <Badge variant={sseStatus === 'connected' ? 'default' : 'destructive'}>
            {sseStatus === 'connected' ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Live
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3 mr-1" />
                {sseStatus}
              </>
            )}
          </Badge>

          {/* Auto-refresh toggle */}
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh
          </Button>

          {/* Manual refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
          >
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* System Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatUptime(stats.uptime) : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              System running time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Metrics</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.activeMetrics ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total: {stats?.totalMetrics ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getMetricValue('cache_hit_rate').toFixed(1)}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getMetricValue('cache_hit_rate') >= 80 ? (
                <><TrendingUp className="h-3 w-3 mr-1 text-green-500" /> Good</>
              ) : (
                <><TrendingDown className="h-3 w-3 mr-1 text-red-500" /> Low</>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OCR Accuracy</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getMetricValue('ocr_accuracy_percentage').toFixed(1)}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getMetricValue('ocr_accuracy_percentage') >= 95 ? (
                <><TrendingUp className="h-3 w-3 mr-1 text-green-500" /> Excellent</>
              ) : (
                <><TrendingDown className="h-3 w-3 mr-1 text-yellow-500" /> Check</>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {alerts.filter((a) => a.status === 'firing').length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
              Active Alerts ({alerts.filter((a) => a.status === 'firing').length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts
                .filter((a) => a.status === 'firing')
                .map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(alert.severity) as any}>
                          {alert.severity}
                        </Badge>
                        <span className="font-medium">{alert.ruleName}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {alert.message}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      Acknowledge
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Tabs */}
      <Tabs defaultValue="response-time" className="space-y-4">
        <TabsList>
          <TabsTrigger value="response-time">Response Time</TabsTrigger>
          <TabsTrigger value="error-rate">Error Rate</TabsTrigger>
          <TabsTrigger value="cache">Cache Performance</TabsTrigger>
          <TabsTrigger value="ocr">OCR Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="response-time" className="space-y-4">
          <ResponseTimeChart timeRange={selectedTimeRange} />
        </TabsContent>

        <TabsContent value="error-rate" className="space-y-4">
          <ErrorRateChart timeRange={selectedTimeRange} />
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <CacheHitRateChart timeRange={selectedTimeRange} />
        </TabsContent>

        <TabsContent value="ocr" className="space-y-4">
          <OCRAccuracyChart timeRange={selectedTimeRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
