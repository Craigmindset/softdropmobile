import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

// Helper to generate random coordinates near a center point
const getRandomCoords = (center, delta = 0.01) => ({
  latitude: center.latitude + (Math.random() - 0.5) * delta,
  longitude: center.longitude + (Math.random() - 0.5) * delta,
});

const PeerCarrier = () => {
  const [time, setTime] = useState(60); // Changed from 59 to 60
  const router = useRouter();

  // All markers centered around Ikeja, Toyin St, Opebi
  const center = { latitude: 6.6018, longitude: 3.3515 }; // Ikeja, Toyin St, Opebi
  const fallbackMarkers = [
    {
      coordinate: {
        latitude: center.latitude + 0.002,
        longitude: center.longitude + 0.002,
      },
      title: "Courier 1",
    },
    {
      coordinate: {
        latitude: center.latitude - 0.002,
        longitude: center.longitude - 0.002,
      },
      title: "Courier 2",
    },
    {
      coordinate: {
        latitude: center.latitude + 0.0015,
        longitude: center.longitude - 0.0015,
      },
      title: "Courier 3",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // Navigate to Accept screen when countdown finishes
    if (time === 0) {
      router.replace("/Accept");
    }

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
        {/* Courier Markers centered around Ikeja, Toyin St, Opebi */}
        {fallbackMarkers.map((marker, idx) => (
          <Marker key={idx} coordinate={marker.coordinate} title={marker.title}>
            <View style={{ alignItems: "center" }}>
              <Image
                source={require("../assets/images/avatar1.png")}
                style={styles.markerAvatar}
              />
              <Text style={{ fontWeight: "bold", fontSize: 12, marginTop: 2 }}>
                Carrier
              </Text>
            </View>
          </Marker>
        ))}
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
        <Text style={styles.headerText}>3 Carrier found</Text>
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
              { width: `${((60 - time) / 60) * 100}%` },
            ]}
          />
        </View>
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
