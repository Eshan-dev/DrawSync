import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:3030";

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(
    () => localStorage.getItem("access_token") || null
  );
  const [refreshToken, setRefreshToken] = useState(
    () => localStorage.getItem("refresh_token") || null
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Persist tokens to localStorage whenever they change
  useEffect(() => {
    if (accessToken) localStorage.setItem("access_token", accessToken);
    else localStorage.removeItem("access_token");
  }, [accessToken]);

  useEffect(() => {
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
    else localStorage.removeItem("refresh_token");
  }, [refreshToken]);

  // Attempt to refresh the access token using the refresh token
  const doRefresh = useCallback(async () => {
    const storedRefresh = localStorage.getItem("refresh_token");
    if (!storedRefresh) return null;
    try {
      const res = await fetch(`${API_BASE}/users/refresh`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${storedRefresh}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.access_token);
        return data.access_token;
      } else {
        logout();
        return null;
      }
    } catch (e) {
      logout();
      return null;
    }
    // eslint-disable-next-line
  }, []);

  // Fetch user profile using access token
  const fetchProfile = useCallback(async (token) => {
    try {
      const res = await fetch(`${API_BASE}/users/profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else if (res.status === 403) {
        await doRefresh();
      }
    } catch (e) {
      // ignore network errors
    }
  }, [doRefresh]);

  // On mount, fetch profile if we have a stored access token
  useEffect(() => {
    if (accessToken) {
      fetchProfile(accessToken);
    }
    // eslint-disable-next-line
  }, []);

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      await fetchProfile(data.access_token);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  };

  const isAuthenticated = !!accessToken;

  return (
    <AuthContext.Provider
      value={{ accessToken, refreshToken, user, loading, isAuthenticated, register, login, logout, doRefresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
