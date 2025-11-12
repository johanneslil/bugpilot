import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai';
import { useChatStore } from '@/lib/store';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

export function ChatPanel() {
  const { chatOpen, toggleChat } = useChatStore();
  const [input, setInput] = useState('');

  const {
    messages,
    sendMessage,
    status,
    error,
    addToolApprovalResponse,
  } = useChat({
    transport: new DefaultChatTransport({
      api: `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/chat/agent`,
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onError: (err) => {
      console.error('[Chat] Error callback triggered:', err);
      console.error('[Chat] Error details:', JSON.stringify(err, null, 2));
    },
  });

  const hasPendingApprovals = messages.some(msg => 
    msg.role === 'assistant' && 
    msg.parts.some((p: any) => p.state === 'approval-requested')
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status === 'streaming' || hasPendingApprovals) return;

    await sendMessage({ text: input });
    setInput('');
  };

  return (
    <>
      <div
        className={cn(
          'fixed right-0 top-0 h-full bg-white border-l border-slate-200 shadow-lg z-40 transition-transform duration-300 flex flex-col',
          chatOpen ? 'translate-x-0' : 'translate-x-full',
          'w-[600px]'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="font-semibold text-lg">Bug Triage AI</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleChat}
          >
            ✕
          </Button>
        </div>

        <MessageList messages={messages} addToolApprovalResponse={addToolApprovalResponse} />
        <MessageInput
          input={input}
          onInputChange={(e) => setInput(e.target.value)}
          onSubmit={handleSubmit}
          disabled={status === 'streaming' || hasPendingApprovals}
        />
        {hasPendingApprovals && (
          <div className="p-3 mx-4 mb-4 text-sm text-amber-700 bg-amber-50 rounded-lg border border-amber-200">
            ⏳ Please approve or deny the pending action above before sending a new message.
          </div>
        )}
        {error && (
          <div className="p-3 mx-4 mb-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
            Error: {error.message}
          </div>
        )}
      </div>

      {!chatOpen && (
        <Button
          className="fixed bottom-6 right-6 z-30 rounded-full w-14 h-14 shadow-lg"
          onClick={toggleChat}
        >
          💬
        </Button>
      )}
    </>
  );
}

