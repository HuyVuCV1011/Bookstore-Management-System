import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextType, User } from '../types';
import { authService } from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!accessToken;

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check if we have a token first
      const token = localStorage.getItem('accessToken');

      if (!token) {
        // No token, user is not authenticated
        setUser(null);
        setAccessToken(null);
        setIsLoading(false);
        return;
      }

      // Try to get current user (will use refresh token cookie)
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setAccessToken(token);
    } catch (error) {
      // No valid session or token expired
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean) => {
    try {
      const response = await authService.login(email, password, rememberMe);
      setUser(response.user);
      setAccessToken(response.accessToken);
      localStorage.setItem('accessToken', response.accessToken);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: any) => {
    try {
      await authService.register(data);
      // Automatically login after successful registration
      await login(data.email, data.password, false);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
    }
  };

  const refreshToken = async (): Promise<string> => {
    try {
      const response = await authService.refreshToken();
      setAccessToken(response.accessToken);
      localStorage.setItem('accessToken', response.accessToken);
      return response.accessToken;
    } catch (error) {
      // Refresh failed, logout
      await logout();
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
