import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole, mockUser } from '@/data/mockData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (_email: string, _password: string, role: UserRole) => {
    const roleNames: Record<UserRole, string> = {
      fleet_operator: 'fleetoperator.xyz',
      maintenance_engineer: 'Carlos Mendez',
      admin: 'Admin User',
    };
    setUser({
      ...mockUser,
      role,
      name: roleNames[role],
      email: _email,
    });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
