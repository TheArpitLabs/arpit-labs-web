'use client';

import React, { useState, useEffect } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon?: React.ReactNode;
}

function MetricCard({ title, value, change, changeType, icon }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change !== undefined && (
            <p className={`text-sm mt-2 ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
              {changeType === 'increase' ? '+' : ''}{change}%
            </p>
          )}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
    </div>
  );
}

interface ChartData {
  label: string;
  value: number;
}

interface ChartProps {
  data: ChartData[];
  title: string;
  type?: 'line' | 'bar' | 'area';
  color?: string;
}

function Chart({ data, title, type = 'line', color = '#3B82F6' }: ChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const height = 200;
  const width = 100;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="relative" style={{ height: `${height}px` }}>
        {type === 'bar' ? (
          <div className="flex items-end justify-between h-full gap-2">
            {data.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: color,
                  }}
                />
                <span className="text-xs text-gray-600 mt-2">{item.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
            <path
              d={data.map((item, index) => {
                const x = (index / (data.length - 1)) * width;
                const y = height - (item.value / maxValue) * height;
                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke={color}
              strokeWidth="2"
            />
            {type === 'area' && (
              <path
                d={`${data.map((item, index) => {
                  const x = (index / (data.length - 1)) * width;
                  const y = height - (item.value / maxValue) * height;
                  return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')} L ${width} ${height} L 0 ${height} Z`}
                fill={color}
                fillOpacity="0.2"
              />
            )}
          </svg>
        )}
      </div>
    </div>
  );
}

interface TableData {
  [key: string]: string | number;
}

interface TableProps {
  data: TableData[];
  columns: { key: string; label: string }[];
  title: string;
}

function Table({ data, columns, title }: TableProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              {columns.map((column) => (
                <th key={column.key} className="text-left py-2 px-4 text-sm font-medium text-gray-600">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-b">
                {columns.map((column) => (
                  <td key={column.key} className="py-2 px-4 text-sm text-gray-900">
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface AnalyticsDashboardProps {
  dateRange?: '7d' | '30d' | '90d' | '1y';
  refreshInterval?: number;
}

export function AnalyticsDashboard({ dateRange = '30d', refreshInterval = 30000 }: AnalyticsDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalVisits: 0,
    uniqueVisitors: 0,
    bounceRate: 0,
    avgSessionDuration: 0,
  });
  const [trafficData, setTrafficData] = useState<ChartData[]>([]);
  const [topPages, setTopPages] = useState<TableData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMetrics({
        totalVisits: 45231,
        uniqueVisitors: 32145,
        bounceRate: 42.5,
        avgSessionDuration: 245,
      });

      setTrafficData([
        { label: 'Mon', value: 1200 },
        { label: 'Tue', value: 1900 },
        { label: 'Wed', value: 1500 },
        { label: 'Thu', value: 2100 },
        { label: 'Fri', value: 1800 },
        { label: 'Sat', value: 900 },
        { label: 'Sun', value: 1100 },
      ]);

      setTopPages([
        { page: '/projects', views: 12450, bounce: '35%' },
        { page: '/blog', views: 8230, bounce: '42%' },
        { page: '/about', views: 5670, bounce: '28%' },
        { page: '/contact', views: 3450, bounce: '55%' },
        { page: '/', views: 15430, bounce: '38%' },
      ]);

      setIsLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, refreshInterval);

    return () => clearInterval(interval);
  }, [dateRange, refreshInterval]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Visits"
          value={metrics.totalVisits.toLocaleString()}
          change={12.5}
          changeType="increase"
        />
        <MetricCard
          title="Unique Visitors"
          value={metrics.uniqueVisitors.toLocaleString()}
          change={8.3}
          changeType="increase"
        />
        <MetricCard
          title="Bounce Rate"
          value={`${metrics.bounceRate}%`}
          change={2.1}
          changeType="decrease"
        />
        <MetricCard
          title="Avg. Session Duration"
          value={`${Math.floor(metrics.avgSessionDuration / 60)}m ${metrics.avgSessionDuration % 60}s`}
          change={5.7}
          changeType="increase"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart
          data={trafficData}
          title="Traffic Overview"
          type="area"
          color="#3B82F6"
        />
        <Chart
          data={[
            { label: 'Direct', value: 35 },
            { label: 'Organic', value: 28 },
            { label: 'Referral', value: 22 },
            { label: 'Social', value: 15 },
          ]}
          title="Traffic Sources"
          type="bar"
          color="#10B981"
        />
      </div>

      {/* Top Pages Table */}
      <Table
        data={topPages}
        columns={[
          { key: 'page', label: 'Page' },
          { key: 'views', label: 'Views' },
          { key: 'bounce', label: 'Bounce Rate' },
        ]}
        title="Top Pages"
      />
    </div>
  );
}
