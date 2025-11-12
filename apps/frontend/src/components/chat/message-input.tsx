import { type FormEvent } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

type MessageInputProps = {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent) => void;
  disabled?: boolean;
};

export function MessageInput({ input, onInputChange, onSubmit, disabled }: MessageInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && input.trim()) {
        onSubmit(e);
      }
    }
  };

  return (
    <form onSubmit={onSubmit} className="border-t border-slate-200 p-4">
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask about bugs, trends, or request actions..."
          rows={2}
          disabled={disabled}
          className="flex-1"
          autoComplete="off"
        />
        <Button
          type="submit"
          disabled={disabled || !input.trim()}
          size="sm"
        >
          Send
        </Button>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </form>
  );
}

