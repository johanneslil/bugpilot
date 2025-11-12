import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { trpc } from './trpc';

type User = {
  id: string;
  name: string;
  email: string;
};

type UserContextType = {
  userId: string | null;
  userName: string | null;
  users: User[];
  setUser: (userId: string, userName: string) => void;
  isLoading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  
  const { data: users = [], isLoading } = trpc.user.list.useQuery();

  useEffect(() => {
    if (isLoading || users.length === 0) return;

    const storedUserId = localStorage.getItem('userId');
    const storedUserName = localStorage.getItem('userName');
    
    const userExists = users.find(u => u.id === storedUserId);
    
    if (storedUserId && storedUserName && userExists) {
      setUserId(storedUserId);
      setUserName(storedUserName);
    } else {
      setUserId(users[0].id);
      setUserName(users[0].name);
      localStorage.setItem('userId', users[0].id);
      localStorage.setItem('userName', users[0].name);
    }
  }, [users, isLoading]);

  const setUser = (newUserId: string, newUserName: string) => {
    setUserId(newUserId);
    setUserName(newUserName);
    localStorage.setItem('userId', newUserId);
    localStorage.setItem('userName', newUserName);
  };

  return (
    <UserContext.Provider value={{ userId, userName, users, setUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

