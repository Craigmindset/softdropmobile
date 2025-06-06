import {
  Entypo,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import * as NavigationBar from "expo-navigation-bar";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  RefreshControl,
  StatusBar as RNStatusBar,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { useOnlineStatus } from "../OnlineStatusContext";

const HEADER_BG = "#0B4D1C";

const CarrierHome = () => {
  const { isOnline, setIsOnline } = useOnlineStatus();
  const [showBalance, setShowBalance] = useState(false);
  const [blink, setBlink] = useState(true); // For blinking effect
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();

  // Fetch profile image and name on mount and refresh
  const fetchProfileData = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("carrier_profile")
        .select("profile_image_url, first_name")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setProfileImage(data.profile_image_url || null);
        setProfileName(data.first_name || null);
      }
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync("#0d1117");
    NavigationBar.setButtonStyleAsync("light");
  }, []);

  // Blinking effect for online status
  useEffect(() => {
    if (isOnline) {
      const interval = setInterval(() => setBlink((b) => !b), 600);
      return () => clearInterval(interval);
    } else {
      setBlink(true);
    }
  }, [isOnline]);

  // Image picker and upload handler
  const handlePickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to your photos.");
      return;
    }
    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const uri = asset.uri;
      // Upload to Supabase Storage
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("User not found");
        const ext = uri.split(".").pop();
        const fileName = `profile_${user.id}_${Date.now()}.${ext}`;
        const response = await fetch(uri);
        const blob = await response.blob();
        const { data, error } = await supabase.storage
          .from("image-bucket")
          .upload(fileName, blob, { upsert: true, contentType: blob.type });
        if (error) throw error;
        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("image-bucket")
          .getPublicUrl(fileName);
        const publicUrl = publicUrlData.publicUrl;
        setProfileImage(publicUrl);
        // Save URL to Carrier_profile
        await supabase
          .from("Carrier_profile")
          .update({ profile_image_url: publicUrl })
          .eq("user_id", user.id);
        Alert.alert("Profile image updated!");
      } catch (e) {
        if (e instanceof Error) {
          Alert.alert("Upload failed", e.message);
        } else {
          Alert.alert("Upload failed", String(e));
        }
      }
    }
  };

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfileData();
    setRefreshing(false);
  };

  return (
    <>
      <StatusBar style="light" backgroundColor={HEADER_BG} translucent={true} />
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0d1117" }}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: HEADER_BG,
              paddingTop:
                (Platform.OS === "android"
                  ? RNStatusBar.currentHeight || 24
                  : 44) + 12, // <-- add extra 12px padding
            },
          ]}
        >
          <View style={styles.profileSection}>
            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.7}>
              <Image
                source={
                  profileImage
                    ? { uri: profileImage }
                    : require("../../assets/images/craig.jpg")
                }
                style={styles.avatar}
              />
            </TouchableOpacity>
            <View>
              <Text style={styles.userName}>
                Hello, {profileName ? profileName : "there"}
              </Text>
              <Text style={styles.userId}>User ID: 00234</Text>
            </View>
            {/* Online/Offline Toggle */}
            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={() => setIsOnline((prev) => !prev)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.statusDot,
                  isOnline
                    ? {
                        backgroundColor: blink ? "#00FF00" : "#00FF0080", // Blinking green
                      }
                    : { backgroundColor: "#FF2D2D" }, // Solid red
                ]}
              />
              <Text style={styles.toggleText}>
                {isOnline ? "You are Online" : "Gone Offline"}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              onPress={() => {
                // TODO: Implement QR code scanner/camera activation here
                Alert.alert(
                  "QR Scanner",
                  "Camera/QR scanning would be activated here."
                );
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="qr-code" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingTop: 0 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0B4D1C"
              colors={["#0B4D1C"]}
            />
          }
        >
          {/* Digital Rewards */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 10,
            }}
          >
            {/* Digital Rewards Button */}
            <TouchableOpacity style={styles.rewardsButton}>
              <Text style={styles.rewardsText}>Digital rewards ⭐</Text>
            </TouchableOpacity>
            {/* Icons Row */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity style={{ marginHorizontal: 6 }}>
                <Ionicons name="notifications-outline" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={{ marginHorizontal: 6 }}>
                <MaterialIcons name="support-agent" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={{ marginHorizontal: 6 }}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={18}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </View>
          {/* Wallet */}
          <View style={styles.walletCard}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <Text style={[styles.walletTitle, { fontSize: 12 }]}>
                Smart Wallet
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={[
                    styles.walletNumber,
                    { marginLeft: 0, marginBottom: 0 },
                  ]}
                >
                  38231112378
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Clipboard.setStringAsync("38231112378");
                    if (Platform.OS === "android") {
                      ToastAndroid.show(
                        "Copied to clipboard!",
                        ToastAndroid.SHORT
                      );
                    } else {
                      Alert.alert("Copied to clipboard!");
                    }
                  }}
                  style={{ marginLeft: 8 }}
                >
                  <Ionicons name="copy-outline" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Balance Section */}
            <View style={styles.balanceSection}>
              <View style={styles.balanceBox}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={styles.balanceTitle}>Available Balance</Text>
                  <TouchableOpacity
                    onPress={() => setShowBalance((prev) => !prev)}
                  >
                    <Ionicons
                      name={showBalance ? "eye-outline" : "eye-off-outline"}
                      size={14}
                      color="gray"
                      style={{ marginLeft: 6 }}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.balanceAmount}>
                  {showBalance ? "₦130,000.02" : "******"}
                </Text>
              </View>
              <View style={styles.balanceBox}>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={styles.balanceTitle}>escrow account</Text>
                  <Text
                    style={[
                      styles.balanceAmount,
                      { fontSize: 14, marginTop: 4, marginRight: 10 },
                    ]}
                  >
                    ₦25,000.00
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionText}>Transfer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.plusBtn}>
                <Text style={styles.plusText}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionText}>Withdraw Fund</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Start my Ride Section */}
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 15,
              padding: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 20,
              marginBottom: 20,
            }}
          >
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                opacity: isOnline ? 1 : 0.5, // visually indicate offline state
              }}
              onPress={() => {
                // Only navigate, do NOT set online here
                router.push("/CarrierLocation");
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="steering"
                size={22}
                color="#0B4D1C"
                style={{ marginRight: 8 }}
              />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  color: "#0B4D1C",
                }}
              >
                {isOnline ? "End my Ride" : "Start my Ride"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#0B4D1C",
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 20,
                marginLeft: 16, // <-- Add this line for spacing between the two buttons
              }}
              onPress={() => {
                router.push("/Navigation");
              }}
            >
              <MaterialIcons name="navigation" size={18} color="#fff" />
              <Text
                style={{ color: "#fff", marginLeft: 8, fontWeight: "bold" }}
              >
                Use Navigation
              </Text>
            </TouchableOpacity>
          </View>

          {/* Finance & Rewards */}
          <Text style={[styles.sectionTitle, { fontSize: 12 }]}>
            Finance & Rewards
          </Text>
          <View
            style={[
              styles.rowContainer,
              {
                flexWrap: "nowrap",
                paddingLeft: 8,
                paddingRight: 8,
                justifyContent: "space-between",
                backgroundColor: "white",
                paddingVertical: 15,

                flexDirection: "column",
                flex: 1,
              },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "white",
                marginTop: 20,
              }}
            >
              <TouchableOpacity
                style={[
                  styles.gridItem,
                  {
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                    marginHorizontal: 2,
                  },
                ]}
              >
                <Entypo name="location-pin" size={20} color="orangered" />
                <Text
                  style={{
                    letterSpacing: -0.5,
                    fontWeight: "bold",
                    fontSize: 12,
                  }}
                >
                  Softpay
                </Text>
                <Text style={{ fontSize: 8, marginTop: 0 }}>smart wallet</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.gridItem,
                  {
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                    marginHorizontal: 2,
                  },
                ]}
              >
                <FontAwesome name="cutlery" size={18} color="salmon" />
                <Text
                  style={{
                    letterSpacing: -0.5,
                    fontWeight: "bold",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  Rewards
                </Text>
                <Text style={{ fontSize: 8, marginTop: 0 }}>earned points</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.gridItem,
                  {
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                    marginHorizontal: 2,
                  },
                ]}
              >
                <MaterialIcons name="wallet-giftcard" size={20} color="gold" />
                <Text
                  style={{
                    letterSpacing: -0.5,
                    fontWeight: "bold",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  Wallet
                </Text>
                <Text style={{ fontSize: 8, marginTop: 0 }}>e-wallet</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.gridItem,
                  {
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                    marginHorizontal: 2,
                  },
                ]}
              >
                <MaterialIcons name="savings" size={20} color="tomato" />
                <Text
                  style={{
                    letterSpacing: -0.5,
                    fontWeight: "bold",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  Box Save
                </Text>
                <Text style={{ fontSize: 8, marginTop: 0 }}>
                  locked savings
                </Text>
              </TouchableOpacity>
            </View>
            {/* Additional Actions */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "white",
                marginTop: 20,
              }}
            >
              <TouchableOpacity
                style={[
                  styles.gridItem,
                  {
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                    marginHorizontal: 2,
                  },
                ]}
              >
                <Entypo name="mobile" size={20} color="orangered" />
                <Text
                  style={{
                    letterSpacing: -0.5,
                    fontWeight: "bold",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  Airtime
                </Text>
                <Text style={{ fontSize: 8, marginTop: 0 }}>Recharge</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.gridItem,
                  {
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                    marginHorizontal: 2,
                  },
                ]}
              >
                <Entypo name="network" size={18} color="salmon" />
                <Text
                  style={{
                    letterSpacing: -0.5,
                    fontWeight: "bold",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  Data Bundle
                </Text>
                <Text style={{ fontSize: 8, marginTop: 0 }}>
                  Internet Service
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.gridItem,
                  {
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                    marginHorizontal: 2,
                  },
                ]}
              >
                <MaterialIcons name="sports-football" size={20} color="gold" />
                <Text
                  style={{
                    letterSpacing: -0.5,
                    fontWeight: "bold",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  Betting
                </Text>
                <Text style={{ fontSize: 8, marginTop: 0 }}>betting topup</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.gridItem,
                  {
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                    marginHorizontal: 2,
                  },
                ]}
              >
                <MaterialIcons name="movie" size={20} color="tomato" />
                <Text
                  style={{
                    letterSpacing: -0.5,
                    fontWeight: "bold",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  Movies
                </Text>
                <Text style={{ fontSize: 8, marginTop: 0 }}>Book a Ticket</Text>
              </TouchableOpacity>
            </View>
            {/* Repeat the grid items for the second row ------------------------------------*/}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "white",
                marginTop: 20,
                marginBottom: 20,
              }}
            >
              <TouchableOpacity
                style={[
                  styles.gridItem,
                  {
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                    marginHorizontal: 2,
                  },
                ]}
              >
                <MaterialIcons name="flight" size={20} color="orangered" />
                <Text
                  style={{
                    letterSpacing: -0.5,
                    fontWeight: "bold",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  Flight
                </Text>
                <Text style={{ fontSize: 8, marginTop: 0 }}>
                  Flight Booking
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.gridItem,
                  {
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                    marginHorizontal: 2,
                  },
                ]}
              >
                <MaterialIcons name="hotel" size={18} color="salmon" />
                <Text
                  style={{
                    letterSpacing: -0.5,
                    fontWeight: "bold",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  Hotels
                </Text>
                <Text style={{ fontSize: 8, marginTop: 0 }}>Reservations</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.gridItem,
                  {
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                    marginHorizontal: 2,
                  },
                ]}
              >
                <MaterialIcons name="directions-car" size={20} color="gold" />
                <Text
                  style={{
                    letterSpacing: -0.5,
                    fontWeight: "bold",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  Smart Ride
                </Text>
                <Text style={{ fontSize: 8, marginTop: 0 }}>Ride Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.gridItem,
                  {
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                    marginHorizontal: 2,
                  },
                ]}
              >
                <MaterialIcons name="emoji-people" size={20} color="tomato" />
                <Text
                  style={{
                    letterSpacing: -0.5,
                    fontWeight: "bold",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  Enterprise
                </Text>
                <Text style={{ fontSize: 8, marginTop: 0 }}>
                  Global Connect
                </Text>
              </TouchableOpacity>
            </View>
            {/* </ Finance & Rewards Grid 4-------------------------------------------------*/}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0B4D1C",
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",

    paddingVertical: 10,
    alignItems: "center",
    // backgroundColor will be set inline above
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 25,
    marginRight: 10,
  },
  userName: {
    color: "white",
    fontWeight: "medium",
    fontSize: 15,
  },
  userId: {
    color: "#ccc",
    fontSize: 12,
  },
  headerIcons: {
    flexDirection: "row",
    marginRight: 25,
  },
  rewardsButton: {
    marginTop: 10,
    alignSelf: "flex-start",
  },
  rewardsText: {
    color: "white",
    fontSize: 10,
    marginLeft: 5,
  },
  walletCard: {
    backgroundColor: "#1AB157",
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
  },
  walletTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  walletNumber: {
    color: "white",
    fontSize: 12,
    marginBottom: 10,
  },
  balanceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  balanceBox: {
    backgroundColor: "white",
    paddingRight: 10,
    paddingLeft: 15,
    paddingTop: 10,
    paddingBottom: 6,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 2,
  },
  balanceTitle: {
    fontSize: 12,
    color: "gray",
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionBtn: {
    backgroundColor: "black",
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  actionText: {
    color: "white",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "medium",
  },
  plusBtn: {
    backgroundColor: "red",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  plusText: {
    color: "white",
    fontSize: 24,
  },
  sectionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 10,
  },
  gridContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  rowContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
  },
  gridItem: {
    flexDirection: "column",
    alignItems: "center",
    marginHorizontal: 10,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 74, // Increased from 10 to 24 for more right spacing
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  toggleText: {
    color: "white",
    fontSize: 12,
  },
});

export default CarrierHome;
