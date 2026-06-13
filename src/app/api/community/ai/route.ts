import { NextRequest, NextResponse } from 'next/server';

async function callOpenAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI key missing');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that summarizes and suggests tags.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 300,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = body.type || 'summary';
    const content = body.content || '';

    if (!content) return NextResponse.json({ success: false, error: 'Missing content' }, { status: 400 });

    if (type === 'similar') {
      const { semanticSearchService } = await import('@/lib/ai-services');
      const results = await semanticSearchService.search(content, 5);
      return NextResponse.json({ success: true, results }, { status: 200 });
    }

    if (type === 'summary') {
      const prompt = `Summarize the following text in 2-3 sentences:\n\n${content}`;
      const summary = await callOpenAI(prompt);
      return NextResponse.json({ success: true, summary }, { status: 200 });
    }

    if (type === 'tags') {
      const prompt = `Suggest up to 8 concise tags for the following discussion content. Return a JSON array of lowercase tags only.\n\n${content}`;
      const tagsText = await callOpenAI(prompt);
      // attempt to parse JSON array
      const jsonMatch = tagsText.match(/\[[\s\S]*\]/m);
      let tags: string[] = [];
      if (jsonMatch) {
        try { tags = JSON.parse(jsonMatch[0]); } catch (e) { /* fallback */ }
      }
      if (!tags.length) {
        tags = tagsText.split(/[,\n]/).map((t: string) => t.trim().toLowerCase()).filter(Boolean).slice(0,8);
      }
      return NextResponse.json({ success: true, tags }, { status: 200 });
    }

    return NextResponse.json({ success: false, error: 'Unknown type' }, { status: 400 });
  } catch (err: any) {
    console.error('AI helper error', err);
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
