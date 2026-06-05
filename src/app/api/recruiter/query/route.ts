import { NextRequest, NextResponse } from 'next/server';
import { semanticSearchService } from '@/lib/ai-services';

interface RecruiterQueryResult {
  answer: string;
  context: Array<{
    title: string;
    sourceType: string;
    preview: string;
  }>;
}

async function generateAnswer(question: string, contextEntries: Array<{ title: string; sourceType: string; preview: string }>) {
  const apiKey = process.env.OPENAI_API_KEY;
  const contextText = contextEntries
    .map((entry, index) => `Source ${index + 1} [${entry.sourceType}]: ${entry.title}\n${entry.preview}`)
    .join('\n\n');

  if (!apiKey) {
    if (!contextEntries.length) {
      return 'No indexed content is available for this question at the moment.';
    }

    return `I found the following relevant content:\n\n${contextText}`;
  }

  const systemPrompt = `You are a recruiter assistant for Arpit Labs. Answer questions using the provided content references and keep the response concise and factual.`;
  const userPrompt = `Question: ${question}\n\nRelevant information:\n${contextText}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 400,
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('OpenAI recruiter answer failed:', response.status, text);
    return contextEntries.length
      ? `I found these references but could not generate a final answer: ${contextText}`
      : 'Unable to generate an answer at this time.';
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || `I found these references:\n\n${contextText}`;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    const question = typeof payload?.question === 'string' ? payload.question.trim() : '';

    if (!question) {
      return NextResponse.json({ success: false, error: 'Missing question' }, { status: 400 });
    }

    const searchResults = await semanticSearchService.search(question, 5);
    const context = searchResults.map((result) => ({
      title: result.title,
      sourceType: result.sourceType,
      preview: result.preview,
    }));

    const answer = await generateAnswer(question, context);

    const response: RecruiterQueryResult = {
      answer,
      context,
    };

    return NextResponse.json({ success: true, ...response }, { status: 200 });
  } catch (error) {
    console.error('Recruiter query failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Query failed' },
      { status: 500 }
    );
  }
}
