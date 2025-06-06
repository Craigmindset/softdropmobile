import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const CreatePassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  const router = useRouter();
  const { phone } = useLocalSearchParams();

  // Handle both string and string[] types
  let phoneNumber: string | undefined = undefined;
  if (typeof phone === "string" && phone.length > 0) phoneNumber = phone;
  else if (
    Array.isArray(phone) &&
    phone.length > 0 &&
    typeof phone[0] === "string"
  )
    phoneNumber = phone[0];

  console.log(
    "[CreatePassword] phone param:",
    phone,
    "phoneNumber:",
    phoneNumber
  );

  const isMatch = password.length > 0 && password === confirm;

  const handleSubmit = async () => {
    if (!phoneNumber) {
      alert("Missing phone number. Please restart signup.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    try {
      // 1. Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        alert(updateError.message || "Failed to set password.");
        return;
      }

      // 2. Fetch current user ID
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData?.user?.id) {
        alert("Failed to get user ID.");
        return;
      }

      const user_id = userData.user.id;

      // 3. Upsert user profile in sender_profile
      const upsertPayload = {
        user_id,
        phone: phoneNumber,
        password_set: true,
        updated_at: new Date().toISOString(),
      };

      console.log("[SenderProfile Upsert] Payload:", upsertPayload);

      // Debug: log current session and user_id before upsert
      const sessionResult = await supabase.auth.getSession();
      console.log("[Session]", sessionResult);
      if (sessionResult.data.session) {
        console.log("[Session User ID]", sessionResult.data.session.user.id);
        console.log("[Upsert user_id]", user_id);
        if (sessionResult.data.session.user.id !== user_id) {
          console.log(
            "[Mismatch] session user id does not match upsert user_id!"
          );
        } else {
          console.log("[Match] session user id matches upsert user_id.");
        }
      } else {
        console.log("[No session] No active session found!");
      }

      // Use correct table name (lowercase)
      const { data: profileData, error: profileError } = await supabase
        .from("sender_profile")
        .upsert(upsertPayload)
        .select();

      if (profileError) {
        console.log("[Upsert] Error:", profileError);
        alert(profileError.message || "Failed to save profile.");
        return;
      }

      if (!profileData || profileData.length === 0) {
        console.log("[Upsert] No data returned:", profileData);
        alert("Profile not saved. No data returned from Supabase.");
        return;
      }

      // 4. Show success message and navigate to sender login screen
      alert("Account created successfully");
      router.replace({ pathname: "/SenderLogin", params: {} });
    } catch (e) {
      console.error("[CreatePassword Error]:", e);
      alert("Unexpected error. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.replace("/SenderLogin")}
      >
        <Ionicons name="arrow-back" size={24} color="#3C3C3C" />
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.title}>Create Password</Text>

      {/* Password Label */}
      <Text style={styles.label}>Enter Password</Text>

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          secureTextEntry={secureText}
          value={password}
          onChangeText={setPassword}
          placeholder="xxxxxx"
          placeholderTextColor="#000"
          keyboardType="numeric"
          maxLength={6}
        />
        <TouchableOpacity onPress={() => setSecureText(!secureText)}>
          <Ionicons
            name={secureText ? "eye-off" : "eye"}
            size={24}
            color="gray"
          />
        </TouchableOpacity>
      </View>

      {/* Confirm Password Field */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          secureTextEntry={secureConfirm}
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Confirm password"
          placeholderTextColor="#000"
          keyboardType="numeric"
          maxLength={6}
        />
        <TouchableOpacity onPress={() => setSecureConfirm(!secureConfirm)}>
          <Ionicons
            name={secureConfirm ? "eye-off" : "eye"}
            size={24}
            color="gray"
          />
        </TouchableOpacity>
      </View>

      {confirm.length > 0 && !isMatch && (
        <Text style={{ color: "red", marginTop: 8, marginLeft: 8 }}>
          Passwords do not match
        </Text>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, { opacity: isMatch ? 1 : 0.5 }]}
        disabled={!isMatch}
        onPress={handleSubmit}
      >
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: "#FAFAFA",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F3F3",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#2B1717",
    textAlign: "center",
    marginTop: 20,
  },
  label: {
    marginTop: 40,
    marginBottom: 8,
    fontSize: 16,
    color: "#000",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 50,
    justifyContent: "space-between",
    marginTop: 16,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: "#000",
    letterSpacing: 1,
    opacity: 0.8,
  },
  submitButton: {
    backgroundColor: "#1ABC9C",
    marginTop: 40,
    borderRadius: 20,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default CreatePassword;
