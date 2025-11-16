import { auth, db } from "../firebaseConfig"; // Adjust the import path as necessary
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
// import { doc, setDoc } from "firebase/firestore";
import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { signup } from "../api/auth";
import { AuthContext } from "../context/AuthProvider";
import CustomAlert from "../components/CustomAlert";
import { useMembership } from "../context/MembershipProvider";

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const membership = useMembership();

  const STORAGE_KEY = "@unwind_membership";

  // Custom alert state
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "info",
    title: "",
    message: "",
    buttonText: "Got it",
  });

  // Helper function to show custom alert
  const showAlert = (type, title, message, buttonText = "Got it") => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      buttonText,
    });
  };

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      showAlert(
        "warning",
        "Missing Information",
        "Please fill in all fields to continue your ZenithMind journey",
        "Got it"
      );
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      showAlert(
        "error",
        "Password Mismatch",
        "Your passwords don't match. Let's make sure they're identical for security!",
        "Fix it"
      );
      return;
    }

    setIsLoading(true);

    try {
      let userCredential;

      if (isLogin) {
        // Login user
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Check if email is verified
        if (!userCredential.user.emailVerified) {
          showAlert(
            "warning",
            "Email Verification Required",
            "Please check your inbox and verify your email to access ZenithMind's full features!",
            "I'll check now"
          );
          setIsLoading(false);
          return;
        }

        await AsyncStorage.setItem(
          "userInfo",
          JSON.stringify({
            name: userCredential?.user.displayName || "User",
            email: userCredential?.user.email,
            joinDate: new Date(userCredential.user.metadata.creationTime)
              .toISOString()
              .split("T")[0],
            uid: userCredential?.user.uid,
          })
        );

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(membership));
        console.log("✅ Membership synced:", membership);

        showAlert(
          "success",
          "Welcome to ZenithMind!",
          "You're all set! Let's start your productive and mindful journey.",
          "Let's go!"
        );
      } else {
        // Register user
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        //update user in the backend with name,uid,email

        const response = await signup({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: name || "User",
          trialStart: new Date().toISOString().split("T")[0],
        });

        if (!response || response.status !== 200) {
          await userCredential?.user.delete();
          throw new Error("Signup failed at backend");
        }

        await updateProfile(userCredential.user, {
          displayName: name || "User",
          isAccessAllowed: true,
        });

        // 🔑 Reload the user to apply changes
        await userCredential.user.reload();

        // Send verification email
        await sendEmailVerification(userCredential.user);

        showAlert(
          "success",
          "Account Created Successfully!",
          "Welcome to ZenithMind! Please check your email and click the verification link to activate your account.",
          "Check email"
        );
      }

      if (userCredential?.user?.emailVerified) router.replace("/(tabs)");
      else {
        setIsLogin(!isLogin);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      // console.error('Auth error:', error);

      let errorTitle = "Authentication Issue";
      let errorMessage = "Something went wrong. Please try again.";

      if (error.code === "auth/user-not-found") {
        errorTitle = "Account Not Found";
        errorMessage =
          "No account found with this email. Would you like to create one?";
      } else if (error.code === "auth/wrong-password") {
        errorTitle = "Incorrect Password";
        errorMessage =
          "The password is incorrect. Try again or reset your password.";
      } else if (error.code === "auth/email-already-in-use") {
        errorTitle = "Email Already Registered";
        errorMessage =
          "This email is already registered. Try signing in instead!";
      } else if (error.code === "auth/weak-password") {
        errorTitle = "Weak Password";
        errorMessage =
          "Please choose a stronger password with at least 6 characters.";
      } else if (error.code === "auth/invalid-email") {
        errorTitle = "Invalid Email";
        errorMessage = "Please enter a valid email address to continue.";
      }

      showAlert("error", errorTitle, errorMessage, "Try again");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      showAlert(
        "warning",
        "Email Required",
        "Please enter your email address first to reset your password",
        "Got it"
      );
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      showAlert(
        "success",
        "Reset Link Sent!",
        "Check your email for password reset instructions. Don't forget to check your spam folder!",
        "Perfect!"
      );
    } catch (error) {
      let errorMessage = "Unable to send reset email. Please try again.";
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      }
      showAlert("error", "Reset Failed", errorMessage, "Try again");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="diamond-outline" size={48} color="#6366F1" />
        </View>
        <Text style={styles.title}>ZenithMind</Text>
        <Text style={styles.tagline}>
          Your productivity & mindfulness companion
        </Text>
        <Text style={styles.subtitle}>
          {isLogin
            ? "Welcome back to your journey"
            : "Begin your mindful productivity journey"}
        </Text>
      </View>

      <View style={styles.form}>
        {!isLogin && (
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={22} color="#8B5CF6" />
            <TextInput
              style={styles.textInput}
              placeholder="Full Name"
              placeholderTextColor="#A1A1AA"
              value={name}
              onChangeText={setName}
            />
          </View>
        )}

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={22} color="#8B5CF6" />
          <TextInput
            style={styles.textInput}
            placeholder="Email address"
            placeholderTextColor="#A1A1AA"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="key-outline" size={22} color="#8B5CF6" />
          <TextInput
            style={styles.textInput}
            placeholder="Password"
            placeholderTextColor="#A1A1AA"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {!isLogin && (
          <View style={styles.inputContainer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color="#8B5CF6"
            />
            <TextInput
              style={styles.textInput}
              placeholder="Confirm Password"
              placeholderTextColor="#A1A1AA"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>
        )}

        {isLogin && (
          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.switchButtonText}>
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </Text>
        </TouchableOpacity>
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        onClose={closeAlert}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttonText={alertConfig.buttonText}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  header: {
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 10,
    color: "#8B5CF6",
    fontWeight: "500",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 17,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "400",
  },
  form: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.1)",
    shadowColor: "rgba(139, 92, 246, 0.1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 18,
    paddingLeft: 16,
    color: "#F1F5F9",
    fontSize: 16,
    fontWeight: "500",
  },
  forgotPassword: {
    color: "#8B5CF6",
    textAlign: "right",
    marginBottom: 20,
    fontSize: 15,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#8B5CF6",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  switchButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  switchButtonText: {
    color: "#94A3B8",
    fontSize: 15,
    fontWeight: "500",
  },
});
