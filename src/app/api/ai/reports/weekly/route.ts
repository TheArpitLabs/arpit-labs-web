import { NextResponse } from 'next/server';
import { contentGenerationService } from '@/lib/ai-services';

export async function POST() {
  try {
    const weeklyReport = await contentGenerationService.generateWeeklyReport();

    return NextResponse.json({ success: true, weeklyReport }, { status: 200 });
  } catch (error) {
    console.error('Error generating weekly report:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to generate weekly report' },
      { status: 500 }
    );
  }
}
