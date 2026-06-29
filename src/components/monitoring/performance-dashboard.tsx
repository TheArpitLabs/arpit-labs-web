'use client';

import React, { useState, useEffect } from 'react';

interface Metric {
  name: string;
  value: number;
  unit: string;
  threshold?: number;
  status: 'good' | 'warning' | 'critical';
}

interface PerformanceData {
  metrics: Metric[];
  timeline: Array<{ time: string; value: number }>;
  alerts: Array<{ time: string; message: string; severity: 'info' | 'warning' | 'error' }>;
}

export function PerformanceDashboard() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setData({
        metrics: [
          { name: 'Response Time', value: 245, unit: 'ms', threshold: 500, status: 'good' },
          { name: 'Throughput', value: 1250, unit: 'req/s', threshold: 1000, status: 'good' },
          { name: 'Error Rate', value: 0.5, unit: '%', threshold: 1, status: 'good' },
          { name: 'Memory Usage', value: 65, unit: '%', threshold: 80, status: 'good' },
          { name: 'CPU Usage', value: 45, unit: '%', threshold: 70, status: 'good' },
          { name: 'Disk I/O', value: 120, unit: 'MB/s', threshold: 200, status: 'good' },
        ],
        timeline: Array.from({ length: 12 }, (_, i) => ({
          time: `${i * 5}m ago`,
          value: 200 + Math.random() * 100,
        })),
        alerts: [
          { time: '10m ago', message: 'High memory usage detected', severity: 'warning' },
          { time: '25m ago', message: 'Response time spike', severity: 'warning' },
          { time: '1h ago', message: 'Service restarted', severity: 'info' },
        ],
      });
      setIsLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Time range selector */}
      <div className="flex gap-2">
        {['5m', '15m', '1h', '6h', '24h'].map((range) => (
          <button
            key={range}
            onClick={() => setSelectedTimeRange(range)}
            className={`px-4 py-2 rounded-lg ${
              selectedTimeRange === range
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.metrics.map((metric) => (
          <div
            key={metric.name}
            className={`p-4 rounded-lg border-2 ${
              metric.status === 'good'
                ? 'border-green-500 bg-green-50'
                : metric.status === 'warning'
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-red-500 bg-red-50'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">{metric.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {metric.value} {metric.unit}
                </p>
              </div>
              <div
                className={`w-3 h-3 rounded-full ${
                  metric.status === 'good'
                    ? 'bg-green-500'
                    : metric.status === 'warning'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              />
            </div>
            {metric.threshold && (
              <p className="text-xs text-gray-500 mt-2">
                Threshold: {metric.threshold} {metric.unit}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Timeline chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time Trend</h3>
        <div className="h-48 flex items-end gap-2">
          {data.timeline.map((point, index) => (
            <div
              key={index}
              className="flex-1 bg-blue-500 rounded-t"
              style={{
                height: `${(point.value / 400) * 100}%`,
              }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {data.timeline.map((point, index) => (
            <span key={index}>{point.time}</span>
          ))}
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
        <div className="space-y-3">
          {data.alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                alert.severity === 'error'
                  ? 'bg-red-50 border border-red-200'
                  : alert.severity === 'warning'
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-blue-50 border border-blue-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    alert.severity === 'error'
                      ? 'bg-red-100 text-red-700'
                      : alert.severity === 'warning'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {alert.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
