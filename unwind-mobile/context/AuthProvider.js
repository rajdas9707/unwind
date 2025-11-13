import React, { createContext, useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebaseConfig"; // must use initializeAuth with getReactNativePersistence

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Listen for Firebase Auth state changes (auto-persistent across app restarts)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // console.log("✅ User logged in:", firebaseUser.email);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        });
      } else {
        // console.log("🚪 No user logged in");
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe; // cleanup listener on unmount
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // ✅ Expose user and auth actions
  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        logout: async () => {
          await signOut(auth);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
