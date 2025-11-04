import React, { createContext, useState, useContext } from 'react';

const OperationContext = createContext();

export const OperationProvider = ({ children }) => {
  const [isOperating, setIsOperating] = useState(false);
  const [operationMessage, setOperationMessage] = useState('');

  const startOperation = (message) => {
    setIsOperating(true);
    setOperationMessage(message);
  };

  const endOperation = () => {
    setIsOperating(false);
    setOperationMessage('');
  };

  return (
    <OperationContext.Provider
      value={{
        isOperating,
        operationMessage,
        startOperation,
        endOperation,
      }}
    >
      {children}
    </OperationContext.Provider>
  );
};

export const useOperation = () => {
  const context = useContext(OperationContext);
  if (!context) {
    throw new Error('useOperation must be used within an OperationProvider');
  }
  return context;
};
