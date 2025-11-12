import { useParams, useNavigate } from 'react-router-dom';
import { BugDetail } from '../components/bugs/bug-detail';
import { CommentThread } from '../components/bugs/comment-thread';
import { UserSwitcher } from '../components/ui/user-switcher';
import { Button } from '../components/ui/button';
import { useChatStore } from '@/lib/store';

export function BugDetailPage() {
  const { bugId } = useParams<{ bugId: string }>();
  const navigate = useNavigate();
  const { toggleChat } = useChatStore();

  if (!bugId) {
    return <div>Bug not found</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/')}>
                ← Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Bugpilot</h1>
                <p className="text-sm text-slate-600">AI Bug Triage System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={toggleChat}>
                💬 Chat
              </Button>
              <UserSwitcher />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <BugDetail bugId={bugId} />
          <CommentThread bugId={bugId} />
        </div>
      </main>
    </div>
  );
}

