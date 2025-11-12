import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { trpc, getTRPCClient } from './lib/trpc';
import { UserProvider } from './lib/user-context';
import { Dashboard } from './pages/dashboard';
import { BugDetailPage } from './pages/bug-detail-page';
import { ChatPanel } from './components/chat/chat-panel';

export function App() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }));
  
  const [trpcClient] = useState(() => getTRPCClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/bugs/:bugId" element={<BugDetailPage />} />
            </Routes>
            <ChatPanel />
          </BrowserRouter>
        </UserProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

