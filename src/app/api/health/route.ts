/**
 * Health check endpoint
 */

import { NextResponse } from 'next/server';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: { status: 'pass' | 'fail'; responseTime?: number };
    cache: { status: 'pass' | 'fail'; responseTime?: number };
    external: { status: 'pass' | 'fail'; responseTime?: number };
  };
  version: string;
  environment: string;
}

export async function GET(request: Request) {
  const startTime = Date.now();
  const checks = {
    database: { status: 'pass' as 'pass' | 'fail', responseTime: 0 },
    cache: { status: 'pass' as 'pass' | 'fail', responseTime: 0 },
    external: { status: 'pass' as 'pass' | 'fail', responseTime: 0 },
  };

  // Check database connectivity
  try {
    const dbStart = Date.now();
    // Add actual database check here
    // await db.query('SELECT 1');
    checks.database.responseTime = Date.now() - dbStart;
  } catch (error) {
    checks.database.status = 'fail';
  }

  // Check cache connectivity
  try {
    const cacheStart = Date.now();
    // Add actual cache check here
    // await cache.ping();
    checks.cache.responseTime = Date.now() - cacheStart;
  } catch (error) {
    checks.cache.status = 'fail';
  }

  // Check external services
  try {
    const externalStart = Date.now();
    // Add actual external service check here
    // await fetch('https://api.example.com/health');
    checks.external.responseTime = Date.now() - externalStart;
  } catch (error) {
    checks.external.status = 'fail';
  }

  // Determine overall health status
  const failedChecks = Object.values(checks).filter(check => check.status === 'fail');
  const status = failedChecks.length === 0 ? 'healthy' : 
                 failedChecks.length === 1 ? 'degraded' : 'unhealthy';

  const response: HealthCheckResponse = {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };

  const statusCode = status === 'healthy' ? 200 : 
                     status === 'degraded' ? 200 : 503;

  return NextResponse.json(response, { status: statusCode });
}

export async function HEAD(request: Request) {
  return new Response(null, { status: 200 });
}
