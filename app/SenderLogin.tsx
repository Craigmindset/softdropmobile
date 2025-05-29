import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
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

const SenderLoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Load cached phone number on mount
  React.useEffect(() => {
    (async () => {
      const cachedPhone = await AsyncStorage.getItem("cachedPhoneNumber");
      if (cachedPhone) setPhoneNumber(cachedPhone);
    })();
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

    if (password.length !== 6) {
      Alert.alert("Invalid Password", "Password must be 6 digits");
      return;
    }

    // Simple authentication logic (replace with real API call)
    const validPhone = "09057871672";
    const validPassword = "111111";

    if (phoneNumber === validPhone && password === validPassword) {
      await AsyncStorage.setItem("cachedPhoneNumber", phoneNumber); // Cache phone number
      Alert.alert("Login Successful", "Welcome!");
      router.push("/Home");
    } else {
      Alert.alert("Login Failed", "Incorrect phone number or password.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
            <TouchableOpacity>
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
