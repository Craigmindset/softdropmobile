import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { supabase } from "../lib/supabase";
import { useOnlineStatus } from "./OnlineStatusContext";

const { width } = Dimensions.get("window");

const CARRIER_INITIAL_POSITION = {
  latitude: 6.6018,
  longitude: 3.3515,
  latitudeDelta: 0.002,
  longitudeDelta: 0.002,
};

const CarrierLocation = () => {
  const [carrierPosition, setCarrierPosition] = React.useState(
    CARRIER_INITIAL_POSITION
  );
  const [profileImage, setProfileImage] = React.useState<string | null>(null);
  const { isOnline, setIsOnline } = useOnlineStatus();
  const router = useRouter();

  // Create multiple wave animations for layered radar effect
  const waveAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  // Animate each wave with a delay to create a ripple effect
  useEffect(() => {
    waveAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 400), // Staggered start
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  // Get user's current location on mount
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access location was denied");
        setCarrierPosition(CARRIER_INITIAL_POSITION);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setCarrierPosition({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      });
    })();
  }, []);

  // Fetch profile image from Supabase
  React.useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("carrier_profile")
          .select("profile_image_url")
          .eq("user_id", user.id)
          .single();
        if (data && data.profile_image_url) {
          setProfileImage(data.profile_image_url);
        }
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent />

      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#0B4D1C" />
        </TouchableOpacity>
        <Image
          source={
            profileImage
              ? { uri: profileImage }
              : require("../assets/images/avatar1.png")
          }
          style={styles.avatar}
        />
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.statusContainer}
          onPress={() => setIsOnline((prev) => !prev)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.onlineDot,
              { backgroundColor: isOnline ? "#00FF00" : "#FF2D2D" },
            ]}
          />
          <Text style={styles.onlineText}>
            {isOnline ? "Online" : "Offline"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map View */}
      <MapView
        style={styles.map}
        initialRegion={carrierPosition}
        region={carrierPosition}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        zoomEnabled={true}
        scrollEnabled={true}
      >
        {carrierPosition && (
          <Marker coordinate={carrierPosition}>
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                width: 50, // Increased width
                height: 50, // Increased height
              }}
            >
              <Image
                source={require("../assets/images/avatar1.png")}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15, // half of width/height for a circle
                  borderWidth: 1,
                  borderColor: "#fff",
                  backgroundColor: "#fff",
                  resizeMode: "contain",
                }}
              />
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 44,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  backButton: {
    marginRight: 10,
    padding: 4,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  onlineText: {
    color: "#0B4D1C",
    fontWeight: "bold",
    fontSize: 13,
  },
  map: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 180, // Increased from 120 to 180
    height: 180, // Increased from 120 to 180
  },
  wave: {
    position: "absolute",
    width: 700,
    height: 700,
    borderRadius: 150,
    backgroundColor: "#1AB157",
    alignSelf: "center",
  },
  markerDot: {
    width: 180,
    height: 180,
    borderRadius: 9,
    backgroundColor: "#0B4D1C",
    borderWidth: 3,
    borderColor: "#fff",
    alignSelf: "center",
  },
});

export default CarrierLocation;
