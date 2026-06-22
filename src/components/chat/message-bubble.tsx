'use client';

import { memo } from 'react';
import { Bot, User } from 'lucide-react';
import MarkdownRenderer from './markdown-renderer';

interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
  modelId?: string | null;
}

function MessageBubble({ role, content, isStreaming, modelId }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={`message-enter flex gap-3 px-4 py-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
          <Bot size={16} className="text-white" />
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
        {!isUser && modelId && (
          <div className="text-xs text-muted-foreground mb-1 ml-1">{modelId}</div>
        )}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{content}</p>
          ) : (
            <>
              <MarkdownRenderer content={content} />
              {isStreaming && <span className="typing-cursor" />}
            </>
          )}
        </div>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
          <User size={16} className="text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export default memo(MessageBubble);
