/**
 * OCR Accuracy Chart Component
 * 
 * Visualizes OCR performance metrics:
 * - Overall accuracy percentage
 * - Accuracy by document type
 * - Processing time correlation
 * - Success/failure counts
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

export interface OCRAccuracyChartProps {
  timeRange: '1h' | '24h' | '7d' | '30d';
}

interface ChartDataPoint {
  timestamp: string;
  accuracy: number; // percentage
  avgProcessingTime: number; // seconds
  successCount: number;
  failureCount: number;
  totalDocuments: number;
}

/**
 * OCRAccuracyChart Component
 */
export default function OCRAccuracyChart({ timeRange }: OCRAccuracyChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [timeRange]);

  /**
   * Fetch OCR accuracy data
   */
  const fetchData = async () => {
    try {
      const mockData: ChartDataPoint[] = generateMockData(timeRange);
      setData(mockData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch OCR accuracy data:', error);
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
      const accuracy = 92 + Math.random() * 6; // 92-98%
      const successCount = Math.floor(15 + Math.random() * 20);
      const failureCount = Math.floor(Math.random() * 3);
      
      points.push({
        timestamp: new Date(timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        accuracy,
        avgProcessingTime: 2 + Math.random() * 3, // 2-5 seconds
        successCount,
        failureCount,
        totalDocuments: successCount + failureCount,
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
   * Format time
   */
  const formatTime = (value: number): string => {
    return `${value.toFixed(1)}s`;
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
        <p className="text-sm font-semibold" style={{ color: '#10b981' }}>
          Accuracy: {data?.accuracy.toFixed(1)}%
        </p>
        <p className="text-sm text-muted-foreground">
          Avg Processing: {data?.avgProcessingTime.toFixed(2)}s
        </p>
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-sm" style={{ color: '#3b82f6' }}>
            Successful: {data?.successCount}
          </p>
          <p className="text-sm" style={{ color: '#ef4444' }}>
            Failed: {data?.failureCount}
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            Total: {data?.totalDocuments}
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>OCR Accuracy</CardTitle>
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
        <CardTitle>OCR Accuracy & Performance</CardTitle>
        <p className="text-sm text-muted-foreground">
          OCR accuracy percentage and processing metrics over {timeRange}
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
              domain={[85, 100]}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              tickMargin={10}
              label={{ value: 'Count', angle: 90, position: 'insideRight' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Accuracy line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="accuracy"
              stroke="#10b981"
              name="Accuracy %"
              strokeWidth={3}
              dot={false}
            />
            
            {/* Success/Failure bars */}
            <Bar
              yAxisId="right"
              dataKey="successCount"
              fill="#3b82f6"
              fillOpacity={0.6}
              name="Successful"
              stackId="stack"
            />
            <Bar
              yAxisId="right"
              dataKey="failureCount"
              fill="#ef4444"
              fillOpacity={0.6}
              name="Failed"
              stackId="stack"
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Processing Time Chart */}
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Average Processing Time</h4>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="timestamp"
                tick={{ fontSize: 10 }}
                tickMargin={5}
              />
              <YAxis
                tickFormatter={formatTime}
                tick={{ fontSize: 10 }}
                tickMargin={5}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(2)}s`, 'Processing Time']}
              />
              <Line
                type="monotone"
                dataKey="avgProcessingTime"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
