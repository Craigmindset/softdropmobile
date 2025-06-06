import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";

const OTP_LENGTH = 6;
const COUNTDOWN_START = 30;

const Verification = () => {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = useState(COUNTDOWN_START);
  const inputs = useRef<Array<TextInput | null>>([]);
  const router = useRouter();
  const { phone } = useLocalSearchParams();
  // phone will be string | string[] | undefined, so ensure it's a string
  const phoneNumber = typeof phone === "string" ? phone : undefined;

  // Countdown timer
  useEffect(() => {
    if (timer === 0) {
      if (otp.join("").length < OTP_LENGTH) {
        ToastAndroid.show("Please enter your OTP", ToastAndroid.SHORT);
      }
      return;
    }
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, otp]);

  // Handle OTP input
  const handleChange = (text: string, idx: number) => {
    if (!/^\d*$/.test(text)) return; // Only digits
    const newOtp = [...otp];
    newOtp[idx] = text.slice(-1);
    setOtp(newOtp);

    // Move to next input if filled
    if (text && idx < OTP_LENGTH - 1) {
      inputs.current[idx + 1]?.focus();
    }
    // Move to previous input if deleted
    if (!text && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  // Resend code
  const handleResend = () => {
    setTimer(COUNTDOWN_START);
    setOtp(Array(OTP_LENGTH).fill(""));
    // Optionally trigger resend OTP logic here
  };

  // Next Button handler
  const handleNext = async () => {
    const enteredOtp = otp.join("");
    if (enteredOtp.length < OTP_LENGTH) {
      ToastAndroid.show("Please enter your OTP", ToastAndroid.SHORT);
      return;
    }
    if (!phoneNumber) {
      ToastAndroid.show("Phone number missing", ToastAndroid.SHORT);
      return;
    }
    // Verify OTP with Supabase
    const { error } = await supabase.auth.verifyOtp({
      phone: phoneNumber,
      token: enteredOtp,
      type: "sms",
    });
    if (error) {
      ToastAndroid.show(error.message || "Invalid OTP", ToastAndroid.SHORT);
      return;
    }
    router.push({
      pathname: "/CarrierAuth/Success",
      params: { phone: phoneNumber, display_name: "Carrier" },
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
      <Text style={styles.title}>OTP Validation</Text>

      {/* OTP Boxes */}
      <View style={styles.otpContainer}>
        {otp.map((digit, idx) => (
          <TextInput
            key={idx}
            ref={(ref) => {
              inputs.current[idx] = ref;
            }}
            style={styles.otpBox}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChange(text, idx)}
            autoFocus={idx === 0}
            returnKeyType="next"
            textAlign="center"
          />
        ))}
      </View>

      {/* Info and Countdown */}
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>Didn't receive it?</Text>
        <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
          <Text style={[styles.resendText, timer > 0 && { color: "#bbb" }]}>
            Get a new code
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.countdownText}>
        {timer > 0 ? `Resend code in ${timer}s` : "You can request a new code"}
      </Text>

      {/* Next Button */}
      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Next</Text>
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
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 36,
    marginBottom: 32,
    color: "#222",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
    gap: 5,
  },
  otpBox: {
    width: 44,
    height: 54,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    fontSize: 22,
    color: "#222",
    backgroundColor: "#fafafa",
    marginHorizontal: 2, // Increased from 4 to 8 for more spacing
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    gap: 4,
  },
  infoText: {
    color: "#888",
    fontSize: 13,
  },
  resendText: {
    color: "#0B4D1C",
    fontWeight: "bold",
    fontSize: 13,
    marginLeft: 6,
  },
  countdownText: {
    textAlign: "center",
    color: "#888",
    fontSize: 13,
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#0B4D1C",
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

export default Verification;
