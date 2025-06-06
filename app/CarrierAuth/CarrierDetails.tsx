import { supabase } from "@/lib/supabase";
import {
  AntDesign,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";

const CARRIAGE_TYPES = [
  {
    label: "Carrier",
    icon: (
      <Ionicons
        name="person"
        size={20}
        color="#fff"
        style={{ marginRight: 10 }}
      />
    ),
  },
  {
    label: "Bicycle",
    icon: (
      <MaterialCommunityIcons
        name="bike"
        size={20}
        color="#fff"
        style={{ marginRight: 10 }}
      />
    ),
  },
  {
    label: "Bike",
    icon: (
      <MaterialCommunityIcons
        name="motorbike"
        size={20}
        color="#fff"
        style={{ marginRight: 10 }}
      />
    ),
  },
  {
    label: "Car",
    icon: (
      <FontAwesome5
        name="car"
        size={20}
        color="#fff"
        style={{ marginRight: 10 }}
      />
    ),
  },
];

const CarrierDetails = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [carriageType, setCarriageType] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNameInfo, setShowNameInfo] = useState(false);
  const router = useRouter();
  const { phone, display_name } = useLocalSearchParams();
  // phone can be string or array
  const phoneNumber =
    typeof phone === "string"
      ? phone
      : Array.isArray(phone) && phone.length > 0
      ? phone[0]
      : undefined;
  const displayName =
    typeof display_name === "string" ? display_name : "Carrier";

  const handleSubmit = async () => {
    if (!firstName || !lastName || !email || !carriageType) {
      Alert.alert("Missing Fields", "Please fill all fields.");
      return;
    }
    if (!phoneNumber) {
      Alert.alert("Missing phone number", "Please restart signup.");
      return;
    }
    setLoading(true);
    // Get current user id
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
      setLoading(false);
      Alert.alert("Error", "Could not get user ID.");
      return;
    }
    const user_id = userData.user.id;
    // Upsert to carrier_profile
    const upsertPayload = {
      user_id,
      phone: phoneNumber,
      first_name: firstName,
      last_name: lastName,
      email,
      carrier_type: carriageType,
      updated_at: new Date().toISOString(),
    };
    const { error: upsertError } = await supabase
      .from("carrier_profile")
      .upsert(upsertPayload);
    setLoading(false);
    if (upsertError) {
      Alert.alert("Error", upsertError.message || "Failed to save details.");
      return;
    }
    ToastAndroid.show("submitted successfully", ToastAndroid.SHORT);
    setTimeout(() => {
      router.replace({
        pathname: "/CarrierAuth/CreatePassword",
        params: {
          phone: phoneNumber,
          firstName,
          lastName,
          email,
          carriageType,
          display_name: displayName,
        },
      });
    }, 800);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#161b22" />
      <Text style={styles.title}>Carrier Details</Text>
      {/* First Name */}
      <View style={{ width: "100%", marginBottom: 16 }}>
        <View style={{ position: "relative" }}>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            placeholderTextColor="#888"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TouchableOpacity
            onPress={() => setShowNameInfo(true)}
            style={{
              position: "absolute",
              right: 12,
              top: 0,
              bottom: 0,
              height: "100%",
              justifyContent: "center",
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <AntDesign name="infocirlceo" size={20} color="#27ae60" />
          </TouchableOpacity>
        </View>
      </View>
      {/* Last Name */}
      <View style={{ width: "100%", marginBottom: 16 }}>
        <View style={{ position: "relative" }}>
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            placeholderTextColor="#888"
            value={lastName}
            onChangeText={setLastName}
          />
          <TouchableOpacity
            onPress={() => setShowNameInfo(true)}
            style={{
              position: "absolute",
              right: 12,
              top: 0,
              bottom: 0,
              height: "100%",
              justifyContent: "center",
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <AntDesign name="infocirlceo" size={20} color="#27ae60" />
          </TouchableOpacity>
        </View>
      </View>
      {/* Info Modal */}
      {showNameInfo && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text
              style={{
                color: "#222",
                fontSize: 16,
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              Please enter your names correctly as it matches your
              BVN/NIN/Driver License
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowNameInfo(false)}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* Email */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {/* Carriage Type Dropdown */}
      <View style={{ width: "100%", marginBottom: 16 }}>
        <TouchableOpacity
          style={[
            styles.input,
            {
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            },
          ]}
          onPress={() => setDropdownVisible((v) => !v)}
        >
          <Text style={{ color: carriageType ? "#fff" : "#888" }}>
            {carriageType || "Select Carriage Type"}
          </Text>
          <AntDesign
            name={dropdownVisible ? "up" : "down"}
            size={18}
            color="#888"
          />
        </TouchableOpacity>
        {dropdownVisible && (
          <View style={styles.dropdown}>
            {CARRIAGE_TYPES.map((type) => (
              <TouchableOpacity
                key={type.label}
                style={styles.dropdownItem}
                onPress={() => {
                  setCarriageType(type.label);
                  setDropdownVisible(false);
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {type.icon}
                  <Text style={{ color: "#fff" }}>{type.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      {/* Enter Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? "Saving..." : "Enter"}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#161b22",
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    width: "100%",
    backgroundColor: "#23272f",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#444",
    fontSize: 16,
  },
  dropdown: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: "#23272f",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#444",
    zIndex: 1000,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  button: {
    width: "100%",
    backgroundColor: "#27ae60",
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    width: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalButton: {
    backgroundColor: "#27ae60",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginTop: 8,
  },
});

export default CarrierDetails;
