/**
 * Error Rate Chart Component
 * 
 * Visualizes HTTP error rate metrics:
 * - Total errors count
 * - Error rate percentage
 * - Error breakdown by type (4xx vs 5xx)
 * 
 * Time ranges: 1h, 24h, 7d, 30d
 */

import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export interface ErrorRateChartProps {
  timeRange: '1h' | '24h' | '7d' | '30d';
}

interface ChartDataPoint {
  timestamp: string;
  clientErrors: number; // 4xx
  serverErrors: number; // 5xx
  totalErrors: number;
  errorRate: number; // percentage
}

/**
 * ErrorRateChart Component
 */
export default function ErrorRateChart({ timeRange }: ErrorRateChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [timeRange]);

  /**
   * Fetch error rate data
   */
  const fetchData = async () => {
    try {
      const mockData: ChartDataPoint[] = generateMockData(timeRange);
      setData(mockData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch error rate data:', error);
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
        intervals = 60;
        intervalMs = 60 * 1000;
        break;
      case '24h':
        intervals = 144;
        intervalMs = 10 * 60 * 1000;
        break;
      case '7d':
        intervals = 168;
        intervalMs = 60 * 60 * 1000;
        break;
      case '30d':
        intervals = 360;
        intervalMs = 2 * 60 * 60 * 1000;
        break;
      default:
        intervals = 144;
        intervalMs = 10 * 60 * 1000;
    }

    for (let i = intervals; i >= 0; i--) {
      const timestamp = now - i * intervalMs;
      const clientErrors = Math.floor(Math.random() * 10);
      const serverErrors = Math.floor(Math.random() * 5);
      const totalErrors = clientErrors + serverErrors;
      const totalRequests = 1000 + Math.floor(Math.random() * 500);
      
      points.push({
        timestamp: new Date(timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        clientErrors,
        serverErrors,
        totalErrors,
        errorRate: (totalErrors / totalRequests) * 100,
      });
    }

    return points;
  };

  /**
   * Custom tooltip
   */
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const data = payload[0]?.payload;

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium mb-2">{label}</p>
        <p className="text-sm text-muted-foreground mb-1">
          Total Errors: {data?.totalErrors}
        </p>
        <p className="text-sm" style={{ color: '#f59e0b' }}>
          Client Errors (4xx): {data?.clientErrors}
        </p>
        <p className="text-sm" style={{ color: '#ef4444' }}>
          Server Errors (5xx): {data?.serverErrors}
        </p>
        <p className="text-sm font-medium mt-1">
          Error Rate: {data?.errorRate.toFixed(2)}%
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Rate</CardTitle>
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
        <CardTitle>Error Rate</CardTitle>
        <p className="text-sm text-muted-foreground">
          HTTP errors breakdown (4xx vs 5xx) over {timeRange}
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="timestamp"
              tick={{ fontSize: 12 }}
              tickMargin={10}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickMargin={10}
              label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="clientErrors"
              stackId="1"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.6}
              name="Client Errors (4xx)"
            />
            <Area
              type="monotone"
              dataKey="serverErrors"
              stackId="1"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.6}
              name="Server Errors (5xx)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
