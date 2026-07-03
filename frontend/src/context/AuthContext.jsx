import { createContext, useContext, useState, useEffect } from "react";

import { loginUser, registerUser, getCurrentUser } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await getCurrentUser();
        setUser(res.data.user);
      } catch (err) {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);
  async function login(email, password) {
    try {
      const res = await loginUser({ email, password });

      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);

      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Login failed");
    }
  }

  async function register(name, email, password) {
    try {
      const res = await registerUser({
        name,
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);

      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Registration failed");
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
