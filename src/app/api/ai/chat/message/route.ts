/**
 * API Route: AI Chat Message
 * POST /api/ai/chat/message
 * Send a message and get AI response
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiChatService } from '@/lib/ai-services';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { conversationId, message } = await request.json();

    if (!conversationId || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing conversationId or message' },
        { status: 400 }
      );
    }

    // Send message and get response
    const result = await aiChatService.sendMessage(conversationId, message);

    return NextResponse.json(
      {
        success: true,
        response: result.response,
        conversationId: result.conversationId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
