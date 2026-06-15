/**
 * Admin API: Discovery Management
 * 
 * Provides endpoints for managing content discovery
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDiscoveryManager } from '@/lib/acquisition/source-discovery/discovery-manager';

// GET /api/admin/acquisition/discovery - Get discovery sources and status
export async function GET(request: NextRequest) {
  try {
    const discoveryManager = getDiscoveryManager();
    const sources = await discoveryManager.loadContentSources();

    return NextResponse.json({
      success: true,
      data: {
        sources,
        totalSources: sources.length
      }
    });
  } catch (error) {
    console.error('Error getting discovery sources:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get discovery sources'
    }, { status: 500 });
  }
}

// POST /api/admin/acquisition/discovery - Run discovery for a source
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceId, maxResults } = body;

    if (!sourceId) {
      return NextResponse.json({ success: false, error: 'Source ID required' }, { status: 400 });
    }

    const discoveryManager = getDiscoveryManager();
    const result = await discoveryManager.runDiscovery(sourceId, { maxResults });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error running discovery:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to run discovery'
    }, { status: 500 });
  }
}
