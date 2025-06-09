import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { supabase } from "../lib/supabase";

// Helper to generate random coordinates near a center point
const getRandomCoords = (
  center: { latitude: number; longitude: number },
  delta = 0.01
) => ({
  latitude: center.latitude + (Math.random() - 0.5) * delta,
  longitude: center.longitude + (Math.random() - 0.5) * delta,
});

const PeerCarrier = () => {
  const [time, setTime] = useState(30); // Changed from 60 to 30
  const [carriers, setCarriers] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showRetry, setShowRetry] = useState(false);
  const router = useRouter();

  // All markers centered around Ikeja, Toyin St, Opebi
  const center = { latitude: 6.6018, longitude: 3.3515 }; // Ikeja, Toyin St, Opebi

  useEffect(() => {
    // Fetch available carriers from Supabase
    async function fetchCarriers() {
      const { data, error } = await supabase
        .from("carrier_profile")
        .select(
          "user_id, first_name, last_name, profile_image_url, latitude, longitude, carrier_type, is_online"
        )
        .limit(20);
      if (!error && data) {
        // Only show carriers who are online and have valid lat/lng
        setCarriers(
          data.filter(
            (carrier) =>
              (carrier.is_online === undefined || carrier.is_online === true) &&
              typeof carrier.latitude === "number" &&
              typeof carrier.longitude === "number"
          )
        );
      }
    }
    fetchCarriers();
    const interval = setInterval(fetchCarriers, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fetch current user id
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    })();
  }, []);

  useEffect(() => {
    if (time === 0) {
      setShowRetry(true);
      // router.replace("/Accept"); // Remove auto-navigation
    }
    const timer = setInterval(() => {
      setTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [time]);

  return (
    <View style={styles.container}>
      {/* StatusBar background workaround */}
      <View style={styles.statusBarBg} />
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Map Section */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: center.latitude,
          longitude: center.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* Carrier Markers from DB */}
        {carriers.map((carrier, idx) => {
          // Choose icon based on carrier_type
          let icon = <FontAwesome5 name="user" size={32} color="#0DB760" />;
          if (carrier.carrier_type === "Bicycle") {
            icon = <FontAwesome5 name="bicycle" size={32} color="#0DB760" />;
          } else if (carrier.carrier_type === "Bike") {
            icon = (
              <MaterialCommunityIcons
                name="motorbike"
                size={32}
                color="#0DB760"
              />
            );
          } else if (carrier.carrier_type === "Car") {
            icon = <FontAwesome5 name="car" size={32} color="#0DB760" />;
          }
          // Highlight current user
          const isCurrentUser =
            currentUserId && carrier.user_id === currentUserId;
          return (
            <Marker
              key={carrier.user_id || idx}
              coordinate={{
                latitude: carrier.latitude,
                longitude: carrier.longitude,
              }}
              title={isCurrentUser ? "You" : carrier.first_name || "Carrier"}
              {...(!isCurrentUser && { pinColor: undefined })} // Remove pinColor for current user
            >
              <View style={{ alignItems: "center" }}>
                {isCurrentUser ? (
                  // Show only gold bike icon for current user (online carrier)
                  <MaterialCommunityIcons
                    name="motorbike"
                    size={36}
                    color="#FFD700"
                  />
                ) : (
                  icon
                )}
                <Text
                  style={{ fontWeight: "bold", fontSize: 12, marginTop: 2 }}
                >
                  {isCurrentUser ? "You" : carrier.first_name || "Carrier"}
                </Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Back button */}
      <TouchableOpacity
        style={{
          position: "absolute",
          top: 50,
          left: 20,
          zIndex: 10,
          backgroundColor: "#f5f5f5",
          borderRadius: 20,
          padding: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
        onPress={() => router.back()}
      >
        <Text style={{ fontSize: 22, fontWeight: "bold" }}>←</Text>
      </TouchableOpacity>

      {/* Bottom Pop-up Card */}
      <View style={styles.card}>
        <Text style={styles.headerText}>
          {carriers.length} Carrier{carriers.length === 1 ? "" : "s"} found
        </Text>
        <Text style={styles.subText}>
          Please wait for a courier{"\n"}
          <Text style={styles.subText2}>to accept your package</Text>
        </Text>

        {/* Countdown Timer */}
        <View style={styles.timerBox}>
          <Text style={styles.timerText}>0</Text>
          <Text style={styles.timerText}>:</Text>
          <Text style={styles.timerText}>0</Text>
          <Text style={styles.timerText}>:</Text>
          <Text style={styles.timerText}>{time < 10 ? `0${time}` : time}</Text>
        </View>
        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((30 - time) / 30) * 100}%` },
            ]}
          />
        </View>
        {/* Retry Button */}
        {showRetry && (
          <TouchableOpacity
            style={{
              marginTop: 24,
              backgroundColor: "#0DB760",
              paddingVertical: 12,
              paddingHorizontal: 32,
              borderRadius: 8,
            }}
            onPress={() => {
              setTime(30);
              setShowRetry(false);
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
              Retry
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// 📐 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  statusBarBg: {
    height: 40, // Approximate status bar height, adjust if needed
    backgroundColor: "#fff",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  map: {
    width: Dimensions.get("window").width,
    height: "70%",
  },
  markerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 20,
    elevation: 5,
  },
  card: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "50%", // Take half of the screen height
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    alignItems: "center",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subText: {
    color: "#444",
    marginBottom: 20,
    textAlign: "center",
    fontSize: 18, // Increased font size
    fontWeight: "500",
  },
  subText2: {
    color: "#444",
    fontSize: 18, // Match font size
    fontWeight: "500",
  },
  timerBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32, // Increased from 20 to 32 for more space below
    marginTop: 32, // Added to push timer down from the top of the card
  },
  timerText: {
    fontSize: 24,
    fontWeight: "bold",
    marginHorizontal: 5,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 3,
    width: "100%",
    marginTop: 24, // Added to push progress bar further down
  },
  progressFill: {
    backgroundColor: "#0DB760",
    height: 6,
    borderRadius: 3,
  },
});

export default PeerCarrier;
