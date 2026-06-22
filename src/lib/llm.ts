import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function streamChat(
  request: NextRequest,
  messages: { role: string; content: string }[],
  modelId: string
): Promise<ReadableStream> {
  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
  const config = new Config();
  const client = new LLMClient(config, customHeaders);

  const stream = client.stream(
    messages.map((m) => ({ role: m.role as 'system' | 'user' | 'assistant', content: m.content })),
    { model: modelId, temperature: 0.7 }
  );

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.content) {
            const data = JSON.stringify({ type: 'content', content: chunk.content.toString() });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        controller.close();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errorMsg })}\n\n`)
        );
        controller.close();
      }
    },
  });
}
