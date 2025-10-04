import React, { createContext, useState, useEffect } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setCurrentUser(JSON.parse(storedUser));
    }
    
    setLoading(false);
  }, []);

  // Login function
  const login = (user, authToken) => {
    setCurrentUser(user);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(user));
  };

  // Logout function
  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value = { 
    user: currentUser, 
    token,
    login, 
    logout,
    loading 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};