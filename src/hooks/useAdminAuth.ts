import { useState, useEffect } from 'react';
import { goToUrl } from '../routes';

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  token: string | null;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const useAdminAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    loading: true,
    error: null,
    token: null
  });

  useEffect(() => {
    // Désactiver temporairement l'authentification :
    setAuthState({
      isAuthenticated: true,
      loading: false,
      error: null,
      token: 'fake-token'
    });

    // checkAuthStatus(); // désactivé pour débogage local
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setAuthState(prev => ({ ...prev, loading: false }));
        return;
      }

      const response = await fetch(`${API_BASE}/api/admin/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setAuthState({
          isAuthenticated: true,
          loading: false,
          error: null,
          token
        });
      } else {
        localStorage.removeItem('admin_token');
        setAuthState({
          isAuthenticated: false,
          loading: false,
          error: null,
          token: null
        });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error);
      localStorage.removeItem('admin_token');
      setAuthState({
        isAuthenticated: false,
        loading: false,
        error: null,
        token: null
      });
    }
  };

  const login = async (password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('admin_token', data.token);
        setAuthState({
          isAuthenticated: true,
          loading: false,
          error: null,
          token: data.token
        });
        goToUrl('/admin');
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: data.message || 'Erreur lors de la connexion'
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Erreur de connexion au serveur'
      }));
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setAuthState({
      isAuthenticated: false,
      loading: false,
      error: null,
      token: null
    });
    goToUrl('/admin/login');
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      throw new Error('Non authentifié');
    }

    const response = await fetch(`${API_BASE}/api/admin/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors du changement de mot de passe');
    }

    return data;
  };

  return {
    ...authState,
    login,
    logout,
    changePassword,
    checkAuthStatus
  };
};

