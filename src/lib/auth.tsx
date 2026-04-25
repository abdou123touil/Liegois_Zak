import React, { createContext, useContext, useEffect, useState } from "react";
import { useGetMe, Employee, removeToken } from "@/lib/api-client";
import { useLocation } from "wouter";

type AuthContextType = {
  user: Employee | null;
  isLoading: boolean;
  setUser: (user: Employee | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Employee | null>(null);
  const { data: meData, isLoading, isFetching, isSuccess, isError } = useGetMe();

  const isLoadingAuth = isLoading || isFetching || (!isSuccess && !isError);

  useEffect(() => {
    if (meData) {
      setUser(meData);
    } else if (isError) {
      setUser(null);
    }
  }, [meData, isError]);

  const logout = () => {
    removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading: isLoadingAuth, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setLocation("/login");
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        console.warn("Unauthorized access attempt by user with role:", user.role);
        setLocation("/login");
      }
    }
  }, [user, isLoading, setLocation, allowedRoles]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  }

  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}