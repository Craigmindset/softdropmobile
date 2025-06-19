import {
  Entypo,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as NavigationBar from "expo-navigation-bar";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useOnlineStatus } from "../OnlineStatusContext";

const HEADER_BG = "#0B4D1C";

const CarrierHome = () => {
  const { isOnline, setIsOnline } = useOnlineStatus();
  const [showBalance, setShowBalance] = useState(false);
  const [blink, setBlink] = useState(true); // For blinking effect
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false); // <-- Add loading state
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [carrierType, setCarrierType] = useState<string | null>(null);

  const router = useRouter();

  // Update is_online in carrier_profile table
  const updateOnlineStatus = async (online: boolean) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      let updateData: any = { is_online: online };
      if (online) {
        // Get location only when going online
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({});
          updateData.latitude = location.coords.latitude;
          updateData.longitude = location.coords.longitude;
        }
      }
      await supabase
        .from("carrier_profile")
        .update(updateData)
        .eq("user_id", user.id);
    }
  };

  // Handler for toggle
  const handleToggleOnline = async () => {
    setToggleLoading(true); // <-- Start loading
    try {
      console.log(
        "[CarrierHome] Toggle button pressed. Current isOnline:",
        isOnline
      );
      const newStatus = !isOnline;
      console.log("[CarrierHome] handleToggleOnline called");
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      console.log("[CarrierHome] supabase.auth.getUser result:", {
        user,
        userError,
      });
      if (!user) {
        console.warn("[CarrierHome] No user found, aborting toggle.");
        setToggleLoading(false); // <-- Stop loading on early return
        return;
      }
      let updateData: any = { is_online: newStatus };
      if (newStatus) {
        // Get location only when going online
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log("[CarrierHome] Location permission status:", status);
        if (status === "granted") {
          try {
            const location = (await Promise.race([
              Location.getCurrentPositionAsync({}),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Location timeout")), 8000)
              ),
            ])) as Location.LocationObject; // <-- Cast to correct type
            updateData.latitude = location.coords.latitude;
            updateData.longitude = location.coords.longitude;
            console.log("[CarrierHome] Got location:", updateData);
          } catch (locError) {
            console.error("[CarrierHome] Error getting location:", locError);
            // Optionally, return here or continue without location
          }
        }
      }
      let updateResult;
      try {
        updateResult = await supabase
          .from("carrier_profile")
          .update(updateData, { count: "exact" })
          .eq("user_id", user.id)
          .select();
      } catch (updateError) {
        console.error(
          "[CarrierHome] Error during supabase update:",
          updateError
        );
        setToggleLoading(false);
        return;
      }
      const { data, error, count } = updateResult;
      if (!error) {
        if (count === 0) {
          // Check if row actually exists before insert
          const { data: existing, error: selectError } = await supabase
            .from("carrier_profile")
            .select("user_id")
            .eq("user_id", user.id)
            .single();
          if (selectError) {
            console.error("[CarrierHome] Select error:", selectError);
            // Only insert if select error is 'no rows' (PGRST116)
            if (selectError.code !== "PGRST116") {
              // RLS or other error, do not insert, just log and stop
              setToggleLoading(false);
              return;
            }
          }
          if (existing) {
            // Row exists, try update again (may be RLS or race condition)
            const { error: updateAgainError } = await supabase
              .from("carrier_profile")
              .update(updateData)
              .eq("user_id", user.id);
            if (!updateAgainError) {
              setIsOnline(newStatus);
              Alert.alert("Status updated", "Your online status was updated.");
            } else {
              console.error(
                "[CarrierHome] Update again error:",
                updateAgainError
              );
            }
            setToggleLoading(false);
            return;
          }
          // Only reach here if selectError.code === 'PGRST116' (no rows)
          const insertPayload: any = {
            user_id: user.id,
            phone: user.phone || "",
            first_name: user.user_metadata?.first_name || "Unknown",
            last_name: user.user_metadata?.last_name || "Unknown",
            email: user.email || "",
            carrier_type: "Carrier",
            is_online: newStatus,
          };
          if (updateData.latitude) insertPayload.latitude = updateData.latitude;
          if (updateData.longitude)
            insertPayload.longitude = updateData.longitude;
          const { error: insertError } = await supabase
            .from("carrier_profile")
            .insert(insertPayload);
          if (!insertError) {
            Alert.alert(
              "Profile created",
              "A new carrier profile was created for you. Please try toggling again."
            );
          } else {
            console.error("[CarrierHome] Insert error:", insertError);
          }
          setToggleLoading(false);
          return;
        } else {
          // Log the actual updated row
          if (data && data.length > 0) {
            console.log("[CarrierHome] Updated row:", data[0]);
          }
          console.log(
            "[CarrierHome] DB update success, setting isOnline:",
            newStatus
          );
          setIsOnline(newStatus);
          console.log("[CarrierHome] setIsOnline called with:", newStatus);
          // Fetch the row to confirm DB value
          const { data: checkData, error: checkError } = await supabase
            .from("carrier_profile")
            .select("is_online")
            .eq("user_id", user.id)
            .single();
          if (checkError)
            console.error("[CarrierHome] Check error:", checkError);
          if (checkData) {
            console.log(
              "[CarrierHome] DB is_online after update:",
              checkData.is_online
            );
          } else {
            console.warn(
              "[CarrierHome] Could not fetch carrier_profile after update",
              checkError
            );
          }
        }
      } else {
        console.error("[CarrierHome] Failed to update online status", error);
      }
    } catch (e) {
      console.error("[CarrierHome] Unexpected error in handleToggleOnline:", e);
      Alert.alert("Unexpected error", String(e));
    } finally {
      setToggleLoading(false); // <-- Always stop loading
    }
  };

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
          .from("carrier_profile")
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

  useEffect(() => {
    const startWatching = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000, // every 10 seconds
            distanceInterval: 20, // or every 20 meters
          },
          async (location) => {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user) {
              await supabase
                .from("carrier_profile")
                .update({
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                })
                .eq("user_id", user.id);
            }
          }
        );
      }
    };

    if (isOnline) {
      startWatching();
    } else {
      // Stop watching when offline
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    };
  }, [isOnline]);

  useEffect(() => {
    let subscription: any = null;
    let userId: string | null = null;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        // Subscribe to changes for this user's carrier_profile
        subscription = supabase
          .channel("carrier_profile_changes_" + user.id)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "carrier_profile",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              console.log("[CarrierHome] Realtime payload:", payload);
              if (payload.eventType === "UPDATE" && payload.new) {
                if (typeof payload.new.is_online === "boolean") {
                  setIsOnline(payload.new.is_online);
                  console.log(
                    "[CarrierHome] Realtime setIsOnline called with:",
                    payload.new.is_online
                  );
                }
              }
            }
          )
          .subscribe();
      }
    })();
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [setIsOnline]);

  // Fetch userId and carrierType on mount
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Fetch carrier_type
        const { data: profile } = await supabase
          .from("carrier_profile")
          .select("carrier_type")
          .eq("user_id", user.id)
          .single();
        if (profile && profile.carrier_type)
          setCarrierType(profile.carrier_type);
      }
    })();
  }, []);

  // Listen for new delivery requests matching this carrier's type (broadcast model)
  useEffect(() => {
    if (!carrierType || !isOnline) {
      return;
    }
    // Subscribe to all INSERT and UPDATE events for this carrier_type
    const subscription = supabase
      .channel(`delivery-requests-broadcast-${carrierType}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "delivery_request",
          filter: `carrier_type=eq.${carrierType}`,
        },
        (payload) => {
          const req = payload.new as any;
          if (
            req &&
            req.status === "pending" && // <-- changed from "broadcasting" to "pending"
            !req.assigned_carrier_id
          ) {
            setPendingRequest(req);
            setModalVisible(true);
          } else if (req && req.assigned_carrier_id) {
            setModalVisible(false);
            setPendingRequest(null);
          }
        }
      )
      .subscribe();
    // Immediately force fetch after subscription setup
    forceFetchRequests();
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [carrierType, isOnline]);

  // Accept/decline handler for delivery requests (atomic update)
  const handleCarrierResponse = async (status: "accepted" | "declined") => {
    if (!pendingRequest || !userId) return;
    if (status === "accepted") {
      // Atomically assign carrier if still unassigned and pending
      const { error, data } = await supabase
        .from("delivery_request")
        .update({ assigned_carrier_id: userId, status: "accepted" })
        .eq("id", pendingRequest.id)
        .is("assigned_carrier_id", null)
        .eq("status", "pending")
        .select();
      if (!error && data && data.length > 0) {
        setModalVisible(false);
        setPendingRequest(null);
        ToastAndroid.show("Delivery accepted!", ToastAndroid.SHORT);
      } else {
        setModalVisible(false);
        setPendingRequest(null);
        ToastAndroid.show(
          "Request already taken by another carrier.",
          ToastAndroid.SHORT
        );
      }
    } else {
      setModalVisible(false);
      setPendingRequest(null);
    }
  };

  // Force fetch function for available delivery requests
  const forceFetchRequests = async () => {
    if (!carrierType || !isOnline) return;
    const { data: requests, error } = await supabase
      .from("delivery_request")
      .select("*")
      .eq("carrier_type", carrierType)
      .eq("status", "pending") // <-- changed from "broadcasting" to "pending"
      .is("assigned_carrier_id", null)
      .order("created_at", { ascending: false });
    if (!error && requests && requests.length > 0) {
      setPendingRequest(requests[0]);
      setModalVisible(true);
    }
  };

  // Call force fetch on mount and when toggling online
  useEffect(() => {
    forceFetchRequests();
  }, [carrierType, isOnline]);

  // Fetch existing matching delivery requests on mount or when carrierType/isOnline changes
  useEffect(() => {
    const fetchExistingRequests = async () => {
      if (!carrierType || !isOnline) return;
      const { data: requests, error } = await supabase
        .from("delivery_request")
        .select("*")
        .eq("carrier_type", carrierType)
        .eq("status", "pending") // <-- changed from "broadcasting" to "pending"
        .is("assigned_carrier_id", null)
        .order("created_at", { ascending: false });
      if (!error && requests && requests.length > 0) {
        setPendingRequest(requests[0]);
        setModalVisible(true);
      }
    };
    fetchExistingRequests();
  }, [carrierType, isOnline]);

  // Polling fallback: query for new delivery requests every 5 seconds
  useEffect(() => {
    if (!carrierType || !isOnline) return;
    const interval = setInterval(() => {
      forceFetchRequests();
    }, 5000);
    return () => clearInterval(interval);
  }, [carrierType, isOnline]);

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
                  : 44) + 12,
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
              <Text style={styles.userId}>
                User ID: {userId ? userId.substring(0, 5) : "-----"}
              </Text>
            </View>
            {/* Online/Offline Toggle */}
            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={handleToggleOnline}
              activeOpacity={0.7}
              disabled={toggleLoading} // <-- Disable while loading
            >
              <View
                style={[
                  styles.statusDot,
                  isOnline
                    ? {
                        backgroundColor: blink ? "#00FF00" : "#00FF0080",
                      }
                    : { backgroundColor: "#FF2D2D" },
                ]}
              />
              {toggleLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={{ marginLeft: 5 }}
                />
              ) : (
                <Text style={styles.toggleText}>
                  {isOnline ? "You are Online" : "Gone Offline"}
                </Text>
              )}
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
      <Modal visible={modalVisible} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              padding: 24,
              borderRadius: 16,
              alignItems: "center",
              minWidth: 320,
              maxWidth: 360,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
              New Delivery Request
            </Text>
            {pendingRequest ? (
              <View style={{ marginBottom: 16, width: "100%" }}>
                {/* Group 1: Sender, Pickup, Item (no dividers between) */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 6,
                    flexWrap: "wrap",
                    flexShrink: 1,
                  }}
                >
                  <MaterialIcons
                    name="person"
                    size={18}
                    color="#0DB760"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ fontWeight: "bold" }}>Sender: </Text>
                  <Text
                    style={{
                      fontWeight: "normal",
                      flexShrink: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    {pendingRequest.sender_name || "-"}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 6,
                    marginTop: 8,
                    flexWrap: "wrap",
                    flexShrink: 1,
                  }}
                >
                  <Entypo
                    name="location-pin"
                    size={18}
                    color="#e67e22"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ fontWeight: "bold" }}>Pick up Address: </Text>
                  <Text
                    style={{
                      fontWeight: "normal",
                      flexShrink: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    {pendingRequest.sender_location || "-"}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 6,
                    marginTop: 8,
                    flexWrap: "wrap",
                    flexShrink: 1,
                  }}
                >
                  <MaterialIcons
                    name="inventory"
                    size={18}
                    color="#2980b9"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ fontWeight: "bold" }}>Delivery Item: </Text>
                  <Text
                    style={{
                      fontWeight: "normal",
                      flexShrink: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    {pendingRequest.item_type || "-"}
                  </Text>
                </View>
                {/* Divider 1 */}
                <View
                  style={{
                    height: 1,
                    backgroundColor: "#eee",
                    marginVertical: 8,
                  }}
                />
                {/* Price */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 6,
                    flexWrap: "wrap",
                    flexShrink: 1,
                  }}
                >
                  <MaterialCommunityIcons
                    name="cash"
                    size={20}
                    color="#27ae60"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ fontWeight: "bold" }}>Price: </Text>
                  <Text
                    style={{
                      fontWeight: "normal",
                      flexShrink: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    {pendingRequest.price ? `₦${pendingRequest.price}` : "-"}
                  </Text>
                </View>
                {/* Divider 2 */}
                <View
                  style={{
                    height: 1,
                    backgroundColor: "#eee",
                    marginVertical: 8,
                  }}
                />
                {/* Delivery Address */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 6,
                    flexWrap: "wrap",
                    flexShrink: 1,
                  }}
                >
                  <MaterialIcons
                    name="place"
                    size={18}
                    color="#e74c3c"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ fontWeight: "bold" }}>Delivery Address: </Text>
                  <Text
                    style={{
                      fontWeight: "normal",
                      flexShrink: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    {pendingRequest.receiver_location || "-"}
                  </Text>
                </View>
                {/* Divider 3 */}
                <View
                  style={{
                    height: 1,
                    backgroundColor: "#eee",
                    marginVertical: 8,
                  }}
                />
                {/* ETA */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 6,
                    flexWrap: "wrap",
                    flexShrink: 1,
                  }}
                >
                  <MaterialIcons
                    name="timer"
                    size={18}
                    color="#8e44ad"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ fontWeight: "bold" }}>ETA: </Text>
                  <Text
                    style={{
                      fontWeight: "normal",
                      flexShrink: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    {pendingRequest.eta || "-"}
                  </Text>
                </View>
              </View>
            ) : (
              <Text>No delivery request details available.</Text>
            )}
            <Text style={{ marginVertical: 12 }}>
              Do you want to accept this delivery?
            </Text>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: "#0DB760",
                  padding: 12,
                  borderRadius: 8,
                  marginRight: 10,
                }}
                onPress={() => handleCarrierResponse("accepted")}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  Accept
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: "#e74c3c",
                  padding: 12,
                  borderRadius: 8,
                }}
                onPress={() => handleCarrierResponse("declined")}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  Decline
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
