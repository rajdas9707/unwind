import React from 'react';
import { AuthProvider } from './AuthProvider';

// Enhanced AuthProvider (now just wraps the original AuthProvider)
export const EnhancedAuthProvider = ({ children }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

export default EnhancedAuthProvider;
