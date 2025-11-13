/**
 * Cache Hit Rate Chart Component
 * 
 * Visualizes cache performance metrics:
 * - L1 (memory) cache hit rate
 * - L2 (Redis) cache hit rate
 * - Overall cache hit rate
 * - Cache operations volume
 * 
 * Time ranges: 1h, 24h, 7d, 30d
 */

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export interface CacheHitRateChartProps {
  timeRange: '1h' | '24h' | '7d' | '30d';
}

interface ChartDataPoint {
  timestamp: string;
  l1HitRate: number; // percentage
  l2HitRate: number; // percentage
  overallHitRate: number; // percentage
  totalOps: number;
}

/**
 * CacheHitRateChart Component
 */
export default function CacheHitRateChart({ timeRange }: CacheHitRateChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [timeRange]);

  /**
   * Fetch cache hit rate data
   */
  const fetchData = async () => {
    try {
      const mockData: ChartDataPoint[] = generateMockData(timeRange);
      setData(mockData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch cache hit rate data:', error);
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
      const l1HitRate = 85 + Math.random() * 10; // 85-95%
      const l2HitRate = 70 + Math.random() * 15; // 70-85%
      const overallHitRate = (l1HitRate + l2HitRate) / 2;
      
      points.push({
        timestamp: new Date(timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        l1HitRate,
        l2HitRate,
        overallHitRate,
        totalOps: 500 + Math.floor(Math.random() * 500),
      });
    }

    return points;
  };

  /**
   * Format percentage
   */
  const formatPercent = (value: number): string => {
    return `${value.toFixed(0)}%`;
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
        <p className="text-sm" style={{ color: '#10b981' }}>
          L1 Cache: {data?.l1HitRate.toFixed(1)}%
        </p>
        <p className="text-sm" style={{ color: '#3b82f6' }}>
          L2 Cache: {data?.l2HitRate.toFixed(1)}%
        </p>
        <p className="text-sm font-medium" style={{ color: '#8b5cf6' }}>
          Overall: {data?.overallHitRate.toFixed(1)}%
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Operations: {data?.totalOps.toLocaleString()}
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cache Hit Rate</CardTitle>
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
        <CardTitle>Cache Hit Rate</CardTitle>
        <p className="text-sm text-muted-foreground">
          Multi-layer cache performance (L1 + L2) over {timeRange}
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="timestamp"
              tick={{ fontSize: 12 }}
              tickMargin={10}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={formatPercent}
              tick={{ fontSize: 12 }}
              tickMargin={10}
              domain={[0, 100]}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              tickMargin={10}
              label={{ value: 'Operations', angle: 90, position: 'insideRight' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="l1HitRate"
              stroke="#10b981"
              name="L1 (Memory)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="l2HitRate"
              stroke="#3b82f6"
              name="L2 (Redis)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="overallHitRate"
              stroke="#8b5cf6"
              name="Overall"
              strokeWidth={3}
              dot={false}
            />
            <Bar
              yAxisId="right"
              dataKey="totalOps"
              fill="#94a3b8"
              fillOpacity={0.3}
              name="Operations"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
