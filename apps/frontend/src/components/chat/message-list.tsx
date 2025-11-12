import type { UIMessage } from 'ai';
import ReactMarkdown from 'react-markdown';
import { MergeBugsApproval } from './merge-bugs-approval';
import { UpdateBugsApproval } from './update-bugs-approval';
import { useAutoScroll } from '@/hooks/use-auto-scroll';

type MessageListProps = {
  messages: UIMessage[];
  addToolApprovalResponse: (response: {
    id: string;
    approved: boolean;
  }) => void | PromiseLike<void>;
};

export function MessageList({ messages, addToolApprovalResponse }: MessageListProps) {
  const bottomRef = useAutoScroll([messages]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm px-4 text-center">
        <div>
          <p className="font-semibold mb-2">Bug Triage AI Assistant</p>
          <p className="text-xs">
            Ask me to query bugs, analyze trends, update metadata, or merge duplicates
          </p>
        </div>
      </div>
    );
  }

  const getTextFromMessage = (message: UIMessage): string => {
    const textParts = message.parts.filter(p => p.type === 'text');
    const text = textParts.map((p: any) => p.text).join('');
    return text;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const textContent = getTextFromMessage(message);
        const toolParts = message.parts.filter(p => p.type.startsWith('tool-'));

        return (
          <div key={message.id} className="space-y-2">
            {message.role === 'user' && textContent && (
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-blue-600 text-white">
                  <div className="text-sm prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{textContent}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {message.role === 'assistant' && (
              <div className="flex justify-start">
                <div className="max-w-[80%] space-y-2">
                  {toolParts.map((toolPart: any) => {
                    const toolCallId = toolPart.toolCallId;
                    // Extract tool name from type field (e.g., 'tool-mergeBugs' -> 'mergeBugs')
                    const toolName = toolPart.type?.replace('tool-', '') || toolPart.toolName;
                    const state = toolPart.state;
                    const args = toolPart.input;
                    const result = toolPart.output;
                    const approval = toolPart.approval;
                    const needsApproval = state === 'approval-requested' && approval;

                    return (
                      <div key={toolCallId}>
                        {/* Tool is streaming / being called (hide if approval requested) */}
                        {(state === 'input-streaming' || state === 'input-available') && !needsApproval && (
                          <div className="rounded-lg px-3 py-2 bg-blue-50 border border-blue-200">
                            <div className="text-xs font-semibold text-blue-900 mb-1">
                              🔧 Calling {toolName}
                            </div>
                            {args && (
                              <pre className="text-xs text-blue-800 overflow-x-auto max-h-32">
                                {JSON.stringify(args, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}

                        {/* Tool requires approval */}
                        {needsApproval && (
                          <div className="mt-2">
                            {toolName === 'mergeBugs' && (
                              <MergeBugsApproval
                                primaryBugId={args.primaryBugId}
                                duplicateBugIds={args.duplicateBugIds}
                                reason={args.reason}
                                mergedTitle={args.mergedTitle}
                                mergedDescription={args.mergedDescription}
                                primaryBugTitle={args.primaryBugTitle}
                                primaryBugDescription={args.primaryBugDescription}
                                duplicateBugTitles={args.duplicateBugTitles}
                                duplicateBugDescriptions={args.duplicateBugDescriptions}
                                commentCount={args.commentCount}
                                onApprove={async () => {
                                  try {
                                    await addToolApprovalResponse({
                                      id: approval.id,
                                      approved: true,
                                    });
                                  } catch (err) {
                                    console.error('[Approval] Error sending approval:', err);
                                  }
                                }}
                                onDeny={async () => {
                                  try {
                                    await addToolApprovalResponse({
                                      id: approval.id,
                                      approved: false,
                                    });
                                  } catch (err) {
                                    console.error('[Approval] Error sending denial:', err);
                                  }
                                }}
                              />
                            )}

                            {toolName === 'updateBugs' && (
                              <UpdateBugsApproval
                                bugIds={args.bugIds}
                                updates={args.updates}
                                onApprove={async () => {
                                  try {
                                    await addToolApprovalResponse({
                                      id: approval.id,
                                      approved: true,
                                    });
                                  } catch (err) {
                                    console.error('[Approval] Error sending update approval:', err);
                                  }
                                }}
                                onDeny={async () => {
                                  try {
                                    await addToolApprovalResponse({
                                      id: approval.id,
                                      approved: false,
                                    });
                                  } catch (err) {
                                    console.error('[Approval] Error sending update denial:', err);
                                  }
                                }}
                              />
                            )}
                          </div>
                        )}

                        {/* Tool output is available */}
                        {/* TODO: Invalidate React Query here based on toolName to auto update UI without refresh */}
                        {state === 'output-available' && result && (
                          <div className="rounded-lg px-3 py-2 bg-green-50 border border-green-200">
                            <div className="text-xs font-semibold text-green-900 mb-2">
                              ✓ Completed: <span className="font-mono">{toolName}</span>
                            </div>
                            <pre className="text-xs text-slate-700 overflow-x-auto max-h-40 bg-white rounded p-2 border border-green-100">
                              {JSON.stringify(result, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Tool execution error */}
                        {state === 'output-error' && (
                          <div className="rounded-lg px-3 py-2 bg-red-50 border border-red-200">
                            <div className="text-xs font-semibold text-red-900">
                              ✗ Failed: <span className="font-mono">{toolName}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {textContent && (
                    <div className="rounded-lg px-4 py-2 bg-slate-100 text-slate-900">
                      <div className="text-sm prose prose-slate prose-sm max-w-none prose-pre:p-0 prose-pre:m-0 prose-pre:bg-transparent">
                        <ReactMarkdown>{textContent}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

