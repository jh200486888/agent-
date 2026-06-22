import { NextRequest, NextResponse } from 'next/server';
import { streamChat } from '@/lib/llm';
import { createConversation, createMessage, updateConversation } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversation_id, model_id, messages } = body as {
      conversation_id?: string;
      model_id: string;
      messages: { role: string; content: string }[];
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    if (!model_id) {
      return NextResponse.json({ error: 'Model ID is required' }, { status: 400 });
    }

    let convId = conversation_id;

    // Create conversation if not provided
    if (!convId) {
      const userMsg = messages.find((m) => m.role === 'user');
      const title = userMsg
        ? userMsg.content.slice(0, 50) + (userMsg.content.length > 50 ? '...' : '')
        : 'New Chat';
      const conv = await createConversation(title, model_id);
      convId = conv.id;
    } else {
      await updateConversation(convId, { model_id });
    }

    // Save user message
    const userMessage = messages[messages.length - 1];
    if (userMessage && userMessage.role === 'user') {
      await createMessage(convId, 'user', userMessage.content, model_id);
    }

    // Stream chat response
    const stream = await streamChat(request, messages, model_id);

    // Collect full response for saving
    const [saveStream, responseStream] = stream.tee();

    // Save assistant message in background
    (async () => {
      try {
        const reader = saveStream.getReader();
        let fullContent = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = new TextDecoder().decode(value);
          const lines = text.split('\n').filter((l) => l.startsWith('data: '));
          for (const line of lines) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content' && data.content) {
                fullContent += data.content;
              }
            } catch {
              // skip parse errors
            }
          }
        }
        if (fullContent) {
          await createMessage(convId!, 'assistant', fullContent, model_id);
        }
      } catch {
        // silent fail on save
      }
    })();

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
