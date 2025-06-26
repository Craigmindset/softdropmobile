import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import * as NavigationBar from "expo-navigation-bar";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import LottieView from "lottie-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Image,
  Modal,
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

const HEADER_BG = "#0B4D1C"; // fixed color code

const Wallet = () => {
  const [showBalance, setShowBalance] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userShortCode, setUserShortCode] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [backPressCount, setBackPressCount] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeChecked, setWelcomeChecked] = useState(false);
  const backPressTimer = useRef<number | null>(null);
  const router = useRouter();
  const bannerScrollRef = useRef<ScrollView>(null);
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerImages = [
    require("../../assets/images/AD2-MB.png"),
    require("../../assets/images/ads - mb.png"),
    require("../../assets/images/intro-slide-1.jpg"),
  ];

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync(HEADER_BG); // Blend system nav bar with tab background
    NavigationBar.setButtonStyleAsync("light"); // for light icons
  }, []);

  // Fetch user profile image, first name, and generate short code from user_id
  const fetchProfileData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      // Try to get cached profile first
      const cacheKey = `sender_profile_${user.id}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setProfileImage(parsed.profile_image_url || null);
          setFirstName(parsed.first_name || null);
        } catch (e) {}
      }
      // Always fetch latest in background
      // Generate a short code from user_id (first 5 chars, uppercase, fallback to '00000')
      const shortCode = user.id ? user.id.slice(0, 5).toUpperCase() : "00000";
      setUserShortCode(shortCode);
      const { data } = await supabase
        .from("sender_profile")
        .select("profile_image_url, first_name")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setProfileImage(data.profile_image_url || null);
        setFirstName(data.first_name || null);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      }
      // Check if welcome modal has been shown for this user
      const flag = await AsyncStorage.getItem(`welcomeModalShown:${user.id}`);
      if (!flag) {
        setShowWelcomeModal(true);
      }
      setWelcomeChecked(true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfileData();
    setRefreshing(false);
  };

  useEffect(() => {
    const onBackPress = () => {
      if (backPressCount === 0) {
        setBackPressCount(1);
        if (Platform.OS === "android") {
          ToastAndroid.show("Click twice to exit", ToastAndroid.SHORT);
        }
        if (backPressTimer.current) clearTimeout(backPressTimer.current);
        backPressTimer.current = setTimeout(
          () => setBackPressCount(0),
          2000
        ) as unknown as number;
        return true;
      } else {
        BackHandler.exitApp();
        return true;
      }
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => {
      sub.remove();
      if (backPressTimer.current) clearTimeout(backPressTimer.current);
    };
  }, [backPressCount]);

  // Welcome modal dismiss handler
  const handleWelcomeContinue = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await AsyncStorage.setItem(`welcomeModalShown:${user.id}`, "1");
    }
    setShowWelcomeModal(false);
  };

  // Image picker and upload handler
  const handlePickAndUploadImage = async () => {
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
      const fileName = `profile_${Date.now()}.jpg`;
      console.log("[Upload] Picked file uri:", uri);
      // Upload to Supabase Storage
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        console.log(
          "[Upload] Uploading file:",
          fileName,
          "to bucket: image-bucket"
        );
        const { data: uploadData, error } = await supabase.storage
          .from("image-bucket")
          .upload(fileName, blob, { upsert: true });
        console.log("[Upload] uploadData:", uploadData, "error:", error);
        if (error) {
          Alert.alert("Upload failed", error.message);
          return;
        }
        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("image-bucket")
          .getPublicUrl(fileName);
        console.log("[Upload] publicUrl:", publicUrlData.publicUrl);
        // Update sender_profile with new image URL
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) {
          console.log("[Upload] No user found for updating sender_profile");
          return;
        }
        const { error: updateError } = await supabase
          .from("sender_profile")
          .update({ profile_image_url: publicUrlData.publicUrl })
          .eq("user_id", user.id);
        if (updateError) {
          console.log("[Upload] Error updating sender_profile:", updateError);
        } else {
          console.log(
            "[Upload] sender_profile updated with:",
            publicUrlData.publicUrl
          );
        }
        // Update local state to show new image immediately
        setProfileImage(publicUrlData.publicUrl);
        Alert.alert("Profile updated", "Your profile image has been updated.");
      } catch (err) {
        console.log("[Upload] Exception during upload:", err);
        Alert.alert("Upload failed", String(err));
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % bannerImages.length);
    }, 3500); // 3.5 seconds per slide
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (bannerScrollRef.current) {
      bannerScrollRef.current.scrollTo({
        x: bannerIndex * 336, // 320 width + 16 marginRight
        animated: true,
      });
    }
  }, [bannerIndex]);

  return (
    <>
      {/* Welcome Modal */}
      <Modal
        visible={showWelcomeModal && welcomeChecked}
        transparent
        animationType="fade"
        onRequestClose={handleWelcomeContinue}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.7)",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 20,
              padding: 30,
              alignItems: "center",
              width: 320,
            }}
          >
            <LottieView
              source={require("../../assets/images/smiles.json")}
              autoPlay
              loop={false}
              style={{ width: 120, height: 120 }}
            />
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                marginTop: 20,
                color: "#0B4D1C",
              }}
            >
              Welcome to SoftDrop!
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: "#333",
                marginTop: 10,
                textAlign: "center",
              }}
            >
              {" "}
              Making every Move Count
            </Text>

            <TouchableOpacity
              onPress={handleWelcomeContinue}
              style={{
                marginTop: 24,
                backgroundColor: "#0B4D1C",
                borderRadius: 10,
                paddingVertical: 10,
                paddingHorizontal: 40,
              }}
            >
              <Text
                style={{ color: "white", fontWeight: "bold", fontSize: 16 }}
              >
                Continue
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <StatusBar
        style="light"
        backgroundColor={HEADER_BG}
        translucent={false}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: HEADER_BG }}>
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
            <TouchableOpacity onPress={handlePickAndUploadImage}>
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
                Hello,{" "}
                {firstName && firstName.trim().length > 0 ? firstName : "User"}
              </Text>
              <Text style={styles.userId}>
                User ID: {userShortCode ? userShortCode : "-----"}
              </Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <Ionicons name="qr-code" size={24} color="white" />
          </View>
        </View>
        {/* New row view for digital rewards and icons */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",

            marginBottom: 16, // add bottom space
            marginHorizontal: 10,
          }}
        >
          {/* Digital Rewards Button (left) */}
          <TouchableOpacity style={styles.rewardsButton}>
            <Text style={styles.rewardsText}>Digital rewards ⭐</Text>
          </TouchableOpacity>
          {/* Icons Row (right) */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity style={{ marginHorizontal: 6 }}>
              <Ionicons name="notifications-outline" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={{ marginHorizontal: 6 }}>
              <MaterialIcons name="support-agent" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={{ marginHorizontal: 6 }}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={18}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <ScrollView
            style={styles.container}
            contentContainerStyle={{
              paddingTop: 0,
              paddingBottom: 60,
              marginBottom: 40,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#0B4D1C"
                colors={["#0B4D1C"]}
              />
            }
            keyboardShouldPersistTaps="handled"
          >
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
                <TouchableOpacity
                  style={styles.plusBtn}
                  onPress={() => router.push("/wallet/SenderAddFunds")}
                >
                  <Text style={styles.plusText}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtnHeader}>
                  <Text style={[styles.actionText, { color: "white" }]}>
                    esc.Transact
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Banner Slide Section */}
            <View style={{ marginTop: 24, marginBottom: 16 }}>
              <ScrollView
                ref={bannerScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                style={{ height: 120 }}
                contentContainerStyle={{ alignItems: "center" }}
                scrollEventThrottle={16}
                onMomentumScrollEnd={(e) => {
                  const newIndex = Math.round(
                    e.nativeEvent.contentOffset.x / 336
                  );
                  setBannerIndex(newIndex);
                }}
              >
                {bannerImages.map((img, idx) => (
                  <View
                    key={idx}
                    style={{
                      width: 320,
                      height: 110,
                      marginRight: 16,
                      borderRadius: 16,
                      overflow: "hidden",
                      backgroundColor: "#fff",
                      justifyContent: "center",
                      alignItems: "center",
                      elevation: 2,
                    }}
                  >
                    <Image
                      source={img}
                      style={{
                        width: 320,
                        height: 110,
                        resizeMode: "cover",
                      }}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
            {/* Divider line */}
            <View
              style={{
                height: 2,
                backgroundColor: HEADER_BG,
                borderRadius: 2,
                marginVertical: 12,
                marginHorizontal: 8,
                opacity: 0.4, // add opacity for subtle effect
              }}
            />
            {/* Transactions header row */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginHorizontal: 8,
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  color: HEADER_BG,
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                Transactions
              </Text>
              <TouchableOpacity>
                <Text
                  style={{
                    color: HEADER_BG,
                    fontWeight: "600",
                    fontSize: 13,
                  }}
                >
                  See All
                </Text>
              </TouchableOpacity>
            </View>
            {/* Transactions list */}
            <View style={{ marginHorizontal: 8, marginBottom: 58 }}>
              {[
                {
                  date: "2025-06-25",
                  desc: "Wallet Top-up",
                  amount: "+₦20,000.00",
                  type: "credit",
                },
                {
                  date: "2025-06-24",
                  desc: "Sent to John Doe",
                  amount: "-₦5,000.00",
                  type: "debit",
                },
                {
                  date: "2025-06-23",
                  desc: "Received from Jane",
                  amount: "+₦12,500.00",
                  type: "credit",
                },
                {
                  date: "2025-06-22",
                  desc: "Escrow Payment",
                  amount: "-₦2,000.00",
                  type: "debit",
                },
                {
                  date: "2025-06-21",
                  desc: "Reward Bonus",
                  amount: "+₦1,000.00",
                  type: "credit",
                },
              ]
                .slice(0, 5)
                .map((tx, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: idx % 2 === 0 ? "#F6F6F6" : "#fff",
                      borderRadius: 10,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      marginBottom: 6,
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          color: "#222",
                          fontWeight: "600",
                          fontSize: 13,
                        }}
                      >
                        {tx.desc}
                      </Text>
                      <Text
                        style={{
                          color: "#888",
                          fontSize: 11,
                          marginTop: 2,
                        }}
                      >
                        {tx.date}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: tx.type === "credit" ? "#0B4D1C" : "#B00020",
                        fontWeight: "bold",
                        fontSize: 14,
                      }}
                    >
                      {tx.amount}
                    </Text>
                  </View>
                ))}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff", // light green background
    flex: 1,
    paddingHorizontal: 16,
    borderTopLeftRadius: 24, // add top left border radius
    borderTopRightRadius: 24, // add top right border radius
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
    color: "white", // changed from HEADER_BG to white for visibility
    fontSize: 10,
    marginLeft: 5,
  },
  walletCard: {
    backgroundColor: "black", // changed from #1AB157 to black
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
    backgroundColor: "white", // default to white for Transfer
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  actionBtnHeader: {
    backgroundColor: HEADER_BG, // for esc.Transact
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  actionText: {
    color: HEADER_BG,
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
    color: HEADER_BG,
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
});

export default Wallet;
