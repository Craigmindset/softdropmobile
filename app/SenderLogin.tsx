import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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
      // Format phone number to international format for Supabase
      const formatPhone = (phone: string): string => {
        if (phone.startsWith("0") && phone.length === 11) {
          return "+234" + phone.slice(1);
        }
        return phone;
      };
      const formattedPhone = formatPhone(phoneNumber);
      // Supabase sign in with phone and password
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
      await AsyncStorage.setItem("cachedPhoneNumber", phoneNumber); // Cache phone number
      Alert.alert("Login Successful", "Welcome!");
      router.replace("/(tabs)/Home");
    } catch (e) {
      Alert.alert("Login Failed", "Unexpected error. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
    fontWeight: "bold",
  },
  characterCount: {
    fontSize: 12,
    color: "#aaa",
    textAlign: "right",
    marginTop: 4,
  },
});

export default SenderLoginScreen;
