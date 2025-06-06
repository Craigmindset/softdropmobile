import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

const SenderProfile = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [initialProfile, setInitialProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setJoined(
        user.created_at ? new Date(user.created_at).toLocaleDateString() : ""
      );
      // Fetch sender_profile
      const { data } = await supabase
        .from("sender_profile")
        .select("first_name, last_name, profile_image_url, email")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setProfileImage(data.profile_image_url || null);
        setEmail(data.email || ""); // <-- update email from sender_profile, not user.email
        setInitialProfile({
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          email: data.email || "",
        });
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to your photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      try {
        const asset = result.assets[0];
        const fileUri = asset.uri;
        let blob;
        if (Platform.OS === "android" && fileUri.startsWith("content://")) {
          // Read file as base64 and convert to blob
          const base64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          blob = new Blob([byteArray], { type: asset.type || "image/jpeg" });
        } else {
          const response = await fetch(fileUri);
          blob = await response.blob();
        }
        const ext = fileUri.split(".").pop();
        const contentType = asset.type || blob.type || "image/jpeg";
        const fileName = `profile_${userId}_${Date.now()}.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("image-bucket")
          .upload(fileName, blob, { upsert: true, contentType });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage
          .from("image-bucket")
          .getPublicUrl(fileName);
        const publicUrl = publicUrlData.publicUrl;
        const { error: updateError } = await supabase
          .from("sender_profile")
          .update({ profile_image_url: publicUrl })
          .eq("user_id", userId);
        if (updateError) throw updateError;
        setProfileImage(publicUrl);
        Alert.alert("Profile image updated!");
      } catch (e) {
        Alert.alert(
          "Image upload failed",
          (e instanceof Error ? e.message : String(e)) +
            (Platform.OS === "android"
              ? "\n(Tip: Try a custom dev client or production build if using Expo Go)"
              : "")
        );
      }
    }
  };

  // Check if any profile field has changed
  const isProfileChanged =
    firstName !== initialProfile.firstName ||
    lastName !== initialProfile.lastName ||
    email !== initialProfile.email;

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      if (!userId) throw new Error("User not found");
      const { error } = await supabase
        .from("sender_profile")
        .update({
          first_name: firstName,
          last_name: lastName,
          email: email,
        })
        .eq("user_id", userId);
      if (error) throw error;
      setInitialProfile({ firstName, lastName, email }); // Reset initial profile to new values
      // Blur all inputs after successful update
      firstNameRef.current?.blur();
      lastNameRef.current?.blur();
      emailRef.current?.blur();
      Alert.alert("Profile updated!");
    } catch (e) {
      Alert.alert("Update failed", e instanceof Error ? e.message : String(e));
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0B4D1C" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <View
        style={{
          position: "absolute",
          top: 44,
          left: 20,
          zIndex: 100,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: "#fff",
            borderRadius: 20,
            padding: 8,
            elevation: 2,
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#0B4D1C" />
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0B4D1C"]}
            tintColor="#0B4D1C"
          />
        }
      >
        <View style={styles.profileImageContainer}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.7}>
            <Image
              source={
                profileImage
                  ? { uri: profileImage }
                  : require("../../assets/images/avatar1.png")
              }
              style={styles.profileImage}
            />
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>First Name</Text>
          <View style={{ position: "relative", width: "100%" }}>
            <TextInput
              ref={firstNameRef}
              style={[styles.input, { paddingRight: 38 }]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
            />
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={{ position: "absolute", right: 10, top: 13 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#0B4D1C"
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Last Name</Text>
          <View style={{ position: "relative", width: "100%" }}>
            <TextInput
              ref={lastNameRef}
              style={[styles.input, { paddingRight: 38 }]}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
            />
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={{ position: "absolute", right: 10, top: 13 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#0B4D1C"
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            ref={emailRef}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={[styles.input, { backgroundColor: "#eee" }]}
            value={phone}
            editable={false}
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Joined</Text>
          <TextInput
            style={[styles.input, { backgroundColor: "#eee" }]}
            value={joined}
            editable={false}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.updateButton,
            { opacity: updating || !isProfileChanged ? 0.5 : 1 },
          ]}
          onPress={handleUpdate}
          disabled={updating || !isProfileChanged}
          activeOpacity={0.7}
        >
          <Text style={styles.updateButtonText}>
            {updating ? "Updating..." : "Update"}
          </Text>
        </TouchableOpacity>
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>
                Please enter your names correctly as it matches your
                BVN/NIN/Driver License
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#FDF6F0", // creamy white
    flexGrow: 1,
    alignItems: "center",
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 40, // bring image further down
  },
  profileImage: {
    width: 72, // reduce size
    height: 72, // reduce size
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#0B4D1C",
    marginBottom: 8,
  },
  changePhotoText: {
    color: "#0B4D1C",
    fontSize: 13,
    textAlign: "center",
    marginTop: 2,
  },
  formGroup: {
    width: "100%",
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  updateButton: {
    backgroundColor: "#0B4D1C",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    maxWidth: 320,
    marginHorizontal: 24,
  },
  modalText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 18,
  },
  modalButton: {
    backgroundColor: "#0B4D1C",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
});

export default SenderProfile;
