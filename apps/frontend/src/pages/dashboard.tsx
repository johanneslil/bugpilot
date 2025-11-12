import { useState } from 'react';
import { BugList } from '../components/bugs/bug-list';
import { CreateBugModal } from '../components/bugs/create-bug-modal';
import { UserSwitcher } from '../components/ui/user-switcher';
import { Button } from '../components/ui/button';
import { useChatStore } from '@/lib/store';

export function Dashboard() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { toggleChat } = useChatStore();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Bugpilot</h1>
              <p className="text-sm text-slate-600">AI Bug Triage System</p>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">All Bugs</h2>
          <Button onClick={() => setCreateModalOpen(true)}>
            + Create Bug Report
          </Button>
        </div>

        <BugList />
      </main>

      <CreateBugModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </div>
  );
}

