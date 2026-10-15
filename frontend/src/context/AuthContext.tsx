import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, LoginPayload, RegisterPayload, ProfileUpdatePayload, ChangePasswordPayload } from '../types/auth';
import { apiClient, ApiError, getAuthToken, clearAuthToken } from '../services/api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginPayload) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (payload: ProfileUpdatePayload) => Promise<boolean>;
  changePassword: (payload: ChangePasswordPayload) => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem('fts_auth_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Validate and sync user session on mount
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const currentToken = getAuthToken();
      if (!currentToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const freshUser = await apiClient.getMe();
        if (isMounted) {
          setUser(freshUser);
          setToken(currentToken);
        }
      } catch (err) {
        if (isMounted) {
          clearAuthToken();
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verifySession();

    // Session expiration event listener
    const handleSessionExpired = () => {
      if (isMounted) {
        setUser(null);
        setToken(null);
        setError('Your session has expired. Please log in again.');
      }
    };

    window.addEventListener('fts:session-expired', handleSessionExpired);
    return () => {
      isMounted = false;
      window.removeEventListener('fts:session-expired', handleSessionExpired);
    };
  }, []);

  const login = async (credentials: LoginPayload): Promise<boolean> => {
    setError(null);
    try {
      const res = await apiClient.login(credentials);
      setUser(res.user);
      setToken(res.access_token);
      return true;
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Invalid login credentials.';
      setError(msg);
      return false;
    }
  };

  const register = async (payload: RegisterPayload): Promise<boolean> => {
    setError(null);
    try {
      const res = await apiClient.register(payload);
      setUser(res.user);
      setToken(res.access_token);
      return true;
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Failed to register account.';
      setError(msg);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient.logout();
    } finally {
      setUser(null);
      setToken(null);
      setError(null);
    }
  };

  const updateProfile = async (payload: ProfileUpdatePayload): Promise<boolean> => {
    setError(null);
    try {
      const updatedUser = await apiClient.updateProfile(payload);
      setUser(updatedUser);
      return true;
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Failed to update profile.';
      setError(msg);
      return false;
    }
  };

  const changePassword = async (payload: ChangePasswordPayload): Promise<boolean> => {
    setError(null);
    try {
      await apiClient.changePassword(payload);
      return true;
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Failed to change password.';
      setError(msg);
      return false;
    }
  };

  const isAuthenticated = Boolean(token && user);
  const isAdmin = Boolean(user && user.role === 'admin');

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated,
    isAdmin,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
