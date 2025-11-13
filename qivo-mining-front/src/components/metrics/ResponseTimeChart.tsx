/**
 * Response Time Chart Component
 * 
 * Visualizes HTTP response time metrics:
 * - P50 (median)
 * - P95 (95th percentile)
 * - P99 (99th percentile)
 * - Average response time
 * 
 * Time ranges: 1h, 24h, 7d, 30d
 */

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export interface ResponseTimeChartProps {
  timeRange: '1h' | '24h' | '7d' | '30d';
}

interface ChartDataPoint {
  timestamp: string;
  p50: number;
  p95: number;
  p99: number;
  avg: number;
}

/**
 * ResponseTimeChart Component
 */
export default function ResponseTimeChart({ timeRange }: ResponseTimeChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 10s
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [timeRange]);

  /**
   * Fetch response time data
   */
  const fetchData = async () => {
    try {
      // Mock data for demonstration
      // In production, fetch from /api/metrics with time range
      const mockData: ChartDataPoint[] = generateMockData(timeRange);
      
      setData(mockData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch response time data:', error);
      setLoading(false);
    }
  };

  /**
   * Generate mock data
   */
  const generateMockData = (range: string): ChartDataPoint[] => {
    const points: ChartDataPoint[] = [];
    const now = Date.now();
    let intervals: number;
    let intervalMs: number;

    switch (range) {
      case '1h':
        intervals = 60; // 60 data points
        intervalMs = 60 * 1000; // 1 minute
        break;
      case '24h':
        intervals = 144; // 144 data points
        intervalMs = 10 * 60 * 1000; // 10 minutes
        break;
      case '7d':
        intervals = 168; // 168 data points
        intervalMs = 60 * 60 * 1000; // 1 hour
        break;
      case '30d':
        intervals = 360; // 360 data points
        intervalMs = 2 * 60 * 60 * 1000; // 2 hours
        break;
      default:
        intervals = 144;
        intervalMs = 10 * 60 * 1000;
    }

    for (let i = intervals; i >= 0; i--) {
      const timestamp = now - i * intervalMs;
      const baseValue = 100 + Math.random() * 200;
      
      points.push({
        timestamp: new Date(timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        p50: baseValue + Math.random() * 50,
        p95: baseValue + 100 + Math.random() * 100,
        p99: baseValue + 200 + Math.random() * 150,
        avg: baseValue + 50 + Math.random() * 75,
      });
    }

    return points;
  };

  /**
   * Format Y-axis values (milliseconds)
   */
  const formatYAxis = (value: number): string => {
    return `${value.toFixed(0)}ms`;
  };

  /**
   * Custom tooltip
   */
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value.toFixed(2)}ms
          </p>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Response Time</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Response Time</CardTitle>
        <p className="text-sm text-muted-foreground">
          HTTP request response time percentiles over {timeRange}
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="timestamp"
              tick={{ fontSize: 12 }}
              tickMargin={10}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 12 }}
              tickMargin={10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="p50"
              stroke="#10b981"
              name="P50 (Median)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="avg"
              stroke="#3b82f6"
              name="Average"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="p95"
              stroke="#f59e0b"
              name="P95"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="p99"
              stroke="#ef4444"
              name="P99"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
