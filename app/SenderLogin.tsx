import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

const SenderLoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const router = useRouter();

  // Load cached phone number on mount
  React.useEffect(() => {
    (async () => {
      const cachedPhone = await AsyncStorage.getItem("cachedPhoneNumber");
      if (cachedPhone) setPhoneNumber(cachedPhone);
    })();
  }, []);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(
        ({
          data,
        }: {
          data: { session: import("@supabase/supabase-js").Session | null };
        }) => {
          const { session } = data;
          if (session) {
            // User is already logged in, route to home or dashboard
            router.replace("/(tabs)/Home");
          }
          // Do NOT redirect if not logged in!
        }
      );
  }, []);

  const handlePhoneNumberChange = (text: string) => {
    // Only allow numbers and limit to 11 digits
    const formattedText = text.replace(/[^0-9]/g, "").slice(0, 11);
    setPhoneNumber(formattedText);
  };

  const handlePasswordChange = (text: string) => {
    // Only allow numbers and limit to 6 digits
    const formattedText = text.replace(/[^0-9]/g, "").slice(0, 6);
    setPassword(formattedText);
  };

  const handleLogin = async () => {
    if (phoneNumber.length !== 11) {
      Alert.alert("Invalid Phone Number", "Please enter 11 digits");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Invalid Password", "Password must be at least 6 digits");
      return;
    }
    try {
      const formatPhone = (phone: string): string => {
        if (phone.startsWith("0") && phone.length === 11) {
          return "+234" + phone.slice(1);
        }
        return phone;
      };
      const formattedPhone = formatPhone(phoneNumber);
      const { data, error } = await supabase.auth.signInWithPassword({
        phone: formattedPhone,
        password,
      });
      if (error) {
        Alert.alert(
          "Login Failed",
          error.message || "Incorrect phone number or password."
        );
        return;
      }

      // Check if first time login
      const hasLoggedIn = await AsyncStorage.getItem("hasLoggedIn");
      if (!hasLoggedIn) {
        setWelcomeMessage("Login Successful! Welcome to SoftDrop");
        await AsyncStorage.setItem("hasLoggedIn", "true");
      } else {
        setWelcomeMessage("Making every, Move Count\nWelcome Back");
      }
      await AsyncStorage.setItem("cachedPhoneNumber", phoneNumber);
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        router.replace("/(tabs)/Home");
      }, 2200); // Show modal for 2.2 seconds
    } catch (e) {
      Alert.alert("Login Failed", "Unexpected error. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Success Modal with Lottie */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LottieView
              source={require("../assets/images/smiles.json")}
              autoPlay
              loop={false}
              style={{ width: 120, height: 120 }}
            />
            <Text style={styles.modalText}>{welcomeMessage}</Text>
          </View>
        </View>
      </Modal>

      {/* Blur background when modal is visible */}
      {showSuccessModal ? (
        <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
      ) : null}

      {/* Back Icon */}
      <TouchableOpacity
        style={{
          position: "absolute",
          top: 40,
          left: 20,
          zIndex: 100,
          backgroundColor: "rgba(0,0,0,0.08)",
          borderRadius: 20,
          padding: 8,
        }}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <AntDesign name="arrowleft" size={24} color="#333" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Login | Sender's Account</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Enter phone number (11 digits)</Text>
            <TextInput
              style={styles.input}
              placeholder="08xxxxxxxxx"
              placeholderTextColor="#888"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={handlePhoneNumberChange}
              maxLength={11}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Enter password (6 digits)</Text>
            <TextInput
              style={styles.input}
              placeholder="******"
              placeholderTextColor="#888"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={handlePasswordChange}
              keyboardType="numeric"
              maxLength={6}
            />
            <TouchableOpacity
              style={styles.togglePassword}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.toggleText}>
                {showPassword ? "Hide" : "Show"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.characterCount}>
              {password.length}/6 digits
            </Text>
          </View>

          <TouchableOpacity>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push("/SenderAuth/SenderSignup")}
            >
              <Text style={styles.signupLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 40,
    textAlign: "center",
    color: "#333",
  },
  inputGroup: {
    marginBottom: 20,
    position: "relative",
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#666",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    color: "#222", // ensure input text is dark
  },
  togglePassword: {
    position: "absolute",
    right: 16,
    top: 40,
  },
  toggleText: {
    color: "#3498db",
    fontSize: 14,
  },
  forgotPassword: {
    color: "#3498db",
    textAlign: "right",
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: "#2ecc71",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  signupText: {
    color: "#666",
  },
  signupLink: {
    color: "#e74c3c",
    fontWeight: "medium",
    fontSize: 16,
  },
  characterCount: {
    fontSize: 12,
    color: "#aaa",
    textAlign: "right",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    elevation: 5,
  },
  modalText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "bold",
    color: "#111", // changed from "#2ecc71" to black
    textAlign: "center",
  },
});

export default SenderLoginScreen;
