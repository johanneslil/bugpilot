import { useState } from 'react';
import { useUser } from '@/lib/user-context';
import { Button } from './button';

export function UserSwitcher() {
  const { userName, users, setUser, isLoading } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="min-w-[120px] gap-2"
        disabled={isLoading}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          <path
            d="M8 8C10.21 8 12 6.21 12 4C12 1.79 10.21 0 8 0C5.79 0 4 1.79 4 4C4 6.21 5.79 8 8 8ZM8 10C5.33 10 0 11.34 0 14V16H16V14C16 11.34 10.67 10 8 10Z"
            fill="currentColor"
          />
        </svg>
        {userName || 'Select User'}
      </Button>
      
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-slate-200 z-20">
            <div className="py-1">
              {users.map((user) => (
                <button
                  key={user.id}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-100"
                  onClick={() => {
                    setUser(user.id, user.name);
                    setIsOpen(false);
                  }}
                >
                  {user.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

