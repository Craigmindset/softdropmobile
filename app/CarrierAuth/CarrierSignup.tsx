import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * Formats a Nigerian phone number (e.g., 08012345678) to international format (+2348012345678).
 */
const formatPhone = (phone: string): string => {
  if (phone.startsWith("0") && phone.length === 11) {
    return "+234" + phone.slice(1);
  }
  return phone;
};

const CarrierSignup = () => {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOtp = async () => {
    console.log("User pressed Enter. Phone input:", phone);
    if (phone.length !== 11 || !phone.startsWith("0")) {
      console.log("Invalid phone number input.");
      alert("Please enter a valid 11-digit phone number starting with 0.");
      return;
    }
    setLoading(true);
    const formattedPhone = formatPhone(phone);
    console.log("Formatted phone for Supabase:", formattedPhone);
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });
    setLoading(false);
    if (error) {
      console.log("Supabase OTP error:", error);
      alert(error.message || "Failed to send OTP. Please try again.");
      return;
    }
    console.log("OTP sent successfully. Navigating to verification screen.");
    // Optionally, you can pass the OTP hash if needed for verification
    router.push({
      pathname: "/CarrierAuth/Verification",
      params: { phone: formattedPhone },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color="#222" />
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.title}>create an account</Text>

      {/* Input Section */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Please input your phone number</Text>
        <TextInput
          style={styles.input}
          placeholder="Phone number"
          placeholderTextColor="#aaa"
          keyboardType="phone-pad"
          value={phone}
          maxLength={11}
          onChangeText={(text) => {
            // Only allow digits and max 11 characters
            const cleaned = text.replace(/[^0-9]/g, "");
            setPhone(cleaned.slice(0, 11));
          }}
        />
        {/* Info Text under the input */}
        <Text style={styles.infoTextSmall}>
          An OTP will be sent to verify the inputted number.
        </Text>
      </View>

      {/* Enter Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleSendOtp}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Sending OTP..." : "Enter"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  backButton: {
    position: "absolute",
    top: 48,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  title: {
    textAlign: "center",
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 36,
    marginBottom: 40,
    color: "#222",
  },
  infoText: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    marginTop: 12,
    marginBottom: 8,
  },
  infoTextSmall: {
    textAlign: "left",
    color: "#888",
    fontSize: 12,
    marginTop: 8,
    marginLeft: 2,
  },
  inputSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#fafafa",
    color: "#222",
  },
  button: {
    backgroundColor: "#2ecc71",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});

export default CarrierSignup;
