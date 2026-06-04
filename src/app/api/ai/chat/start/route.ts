/**
 * API Route: AI Chat Start
 * POST /api/ai/chat/start
 * Initializes a new AI chat conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiChatService } from '@/lib/ai-services';

export async function POST(request: NextRequest) {
  try {
    const { topic = 'general' } = await request.json();

    // Get user ID if authenticated
    const userId = null; // Would get from session in production

    // Start conversation
    const conversation = await aiChatService.startConversation(userId, topic);

    return NextResponse.json(
      {
        success: true,
        conversationId: conversation.id,
        message: 'Chat session started',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error starting chat:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start chat' },
      { status: 500 }
    );
  }
}
