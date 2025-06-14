import { FontAwesome5 } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { supabase } from "../lib/supabase";

const bikeMarkerIcon = require("../assets/images/bike.png");

// Helper to generate random coordinates near a center point
const getRandomCoords = (
  center: { latitude: number; longitude: number },
  delta = 0.01
) => ({
  latitude: center.latitude + (Math.random() - 0.5) * delta,
  longitude: center.longitude + (Math.random() - 0.5) * delta,
});

const PeerCarrier = () => {
  const params = useLocalSearchParams();
  const [time, setTime] = useState(30);
  const [assignedCarrier, setAssignedCarrier] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showRetry, setShowRetry] = useState(false);
  const [isDecisionModalVisible, setIsDecisionModalVisible] = useState(false);
  const [matchingCarriers, setMatchingCarriers] = useState<any[]>([]);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [isCarrierDecisionModalVisible, setIsCarrierDecisionModalVisible] =
    useState(false);
  const [pendingRequestForMe, setPendingRequestForMe] = useState<any>(null);
  const [isMyDecisionModalVisible, setIsMyDecisionModalVisible] =
    useState(false);
  const [senderContact, setSenderContact] = useState<string | null>(null);
  const router = useRouter();

  const center = { latitude: 6.6018, longitude: 3.3515 };

  // Fetch assigned carrier from DB on mount
  useEffect(() => {
    const fetchAssignedCarrier = async () => {
      if (!params.deliveryRequestId || !params.carrierType) {
        console.log("[fetchAssignedCarrier] Missing params", params);
        setAssignedCarrier(null);
        return;
      }
      // Get the delivery_request to find the assigned_carrier_id and sender_contact
      const { data: request, error: reqError } = await supabase
        .from("delivery_request")
        .select("assigned_carrier_id, sender_contact")
        .eq("id", params.deliveryRequestId)
        .single();
      console.log("[fetchAssignedCarrier] delivery_request", request, reqError);
      if (reqError || !request?.assigned_carrier_id) {
        setAssignedCarrier(null);
        setSenderContact(request?.sender_contact || null);
        return;
      }
      setSenderContact(request.sender_contact || null);
      // Get the carrier profile for the assigned carrier, matching type and online
      const { data: carrier, error: carrierError } = await supabase
        .from("carrier_profile")
        .select(
          "user_id, latitude, longitude, carrier_type, first_name, is_online"
        )
        .eq("user_id", request.assigned_carrier_id)
        .eq("carrier_type", params.carrierType)
        .eq("is_online", true)
        .single();
      console.log(
        "[fetchAssignedCarrier] assigned carrier",
        carrier,
        carrierError
      );
      if (carrierError || !carrier) {
        setAssignedCarrier(null);
        return;
      }
      setAssignedCarrier(carrier);
    };
    fetchAssignedCarrier();
  }, [params.deliveryRequestId, params.carrierType]);

  // Fetch all online carriers of the requested type
  useEffect(() => {
    const fetchMatchingCarriers = async () => {
      if (!params.carrierType) return;
      const { data: carriers, error } = await supabase
        .from("carrier_profile")
        .select(
          "user_id, latitude, longitude, carrier_type, first_name, is_online"
        )
        .eq("carrier_type", params.carrierType)
        .eq("is_online", true);
      if (!error && carriers) {
        setMatchingCarriers(carriers);
      } else {
        setMatchingCarriers([]);
      }
    };
    fetchMatchingCarriers();
  }, [params.carrierType]);

  // Poll for online matching carriers every 5 seconds
  useEffect(() => {
    let interval: number;
    const fetchMatchingCarriers = async () => {
      if (!params.carrierType) return;
      const { data: carriers, error } = await supabase
        .from("carrier_profile")
        .select(
          "user_id, latitude, longitude, carrier_type, first_name, is_online"
        )
        .eq("carrier_type", params.carrierType)
        .eq("is_online", true);
      if (!error && carriers) {
        setMatchingCarriers(carriers);
      } else {
        setMatchingCarriers([]);
      }
    };
    fetchMatchingCarriers();
    interval = setInterval(fetchMatchingCarriers, 5000);
    return () => clearInterval(interval);
  }, [params.carrierType]);

  useEffect(() => {
    // Fetch current user id
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("[getUser]", user);
      if (user) setCurrentUserId(user.id);
    })();
  }, []);

  useEffect(() => {
    let timer: number;
    if (time === 0) {
      setShowRetry(true);
    } else {
      timer = setInterval(() => {
        setTime((prev) => {
          if (prev > 1) return prev - 1;
          return 0;
        });
        // You can add logic here to check for carrier response if needed
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [time]);

  // Retry button handler
  const handleRetry = async () => {
    setTime(30);
    setShowRetry(false);
    console.log(
      "[handleRetry] Retrying, clearing carrier_requests for message_id",
      params?.message_id
    );
    if (params && params.message_id) {
      await supabase
        .from("carrier_requests")
        .delete()
        .eq("message_id", params.message_id);
    }
  };

  // Show modal when assignedCarrier is set
  useEffect(() => {
    if (
      assignedCarrier &&
      currentUserId === assignedCarrier.user_id // Only show for assigned carrier
    ) {
      setIsDecisionModalVisible(true);
    } else {
      setIsDecisionModalVisible(false);
    }
  }, [assignedCarrier, currentUserId]);

  // Poll for delivery requests for this carrier every 5 seconds
  useEffect(() => {
    if (!currentUserId) return;
    let interval: number;
    const fetchPendingRequest = async () => {
      const { data: requests, error } = await supabase
        .from("carrier_requests")
        .select("*")
        .eq("carrier_id", currentUserId)
        .eq("status", "pending");
      console.log("[fetchPendingRequest]", requests, error);
      if (!error && requests && requests.length > 0) {
        setPendingRequest(requests[0]);
        setIsCarrierDecisionModalVisible(true);
      } else {
        setPendingRequest(null);
        setIsCarrierDecisionModalVisible(false);
      }
    };
    fetchPendingRequest();
    interval = setInterval(fetchPendingRequest, 5000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  // Real-time subscription for delivery requests
  // (Removed: this logic should only be in CarrierHome, not PeerCarrier)

  // Add a debug log in the render
  console.log("[render] PeerCarrier", {
    assignedCarrier,
    params,
    currentUserId,
  });

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
        {/* Show all matching carriers as markers */}
        {matchingCarriers.map((carrier) => (
          <Marker
            key={carrier.user_id}
            coordinate={{
              latitude: carrier.latitude,
              longitude: carrier.longitude,
            }}
            title={carrier.first_name || "Carrier"}
          >
            {carrier.carrier_type === "Bike" ? (
              <Image
                source={bikeMarkerIcon}
                style={{ width: 28, height: 28, resizeMode: "contain" }}
              />
            ) : carrier.carrier_type === "Bicycle" ? (
              <FontAwesome5 name="bicycle" size={32} color="#0DB760" />
            ) : carrier.carrier_type === "Car" ? (
              <FontAwesome5 name="car" size={32} color="#0DB760" />
            ) : (
              <FontAwesome5 name="user" size={32} color="#0DB760" />
            )}
            <Text style={{ fontWeight: "bold", fontSize: 12, marginTop: 2 }}>
              {carrier.first_name || "Carrier"}
            </Text>
          </Marker>
        ))}
        {/* Highlight assigned carrier with a different icon or color if desired */}
        {assignedCarrier && (
          <Marker
            key={assignedCarrier.user_id + "-assigned"}
            coordinate={{
              latitude: assignedCarrier.latitude,
              longitude: assignedCarrier.longitude,
            }}
            title={assignedCarrier.first_name || "Assigned Carrier"}
            pinColor="#FFD700"
          >
            <FontAwesome5 name="star" size={36} color="#FFD700" />
            <Text style={{ fontWeight: "bold", fontSize: 12, marginTop: 2 }}>
              {assignedCarrier.first_name || "Assigned Carrier"}
            </Text>
          </Marker>
        )}
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
          {assignedCarrier
            ? `Carrier assigned: ${
                assignedCarrier.first_name || assignedCarrier.user_id
              }`
            : "Waiting for carrier assignment..."}
        </Text>
        <Text style={styles.subText}>
          Please wait for a carrier{"\n"}
          <Text style={styles.subText2}>to accept your package</Text>
        </Text>

        {/* Show number of matching online carriers */}
        <Text
          style={{
            color: "#0DB760",
            fontWeight: "bold",
            fontSize: 16,
            marginBottom: 8,
          }}
        >
          {matchingCarriers.length} carrier
          {matchingCarriers.length === 1 ? "" : "s"} available online
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
            onPress={handleRetry}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
              Retry
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Decision Modal for assigned carrier (existing) */}
      <Modal visible={isDecisionModalVisible} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 24,
              width: "85%",
              alignItems: "center",
            }}
          >
            <Text
              style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12 }}
            >
              Delivery Request
            </Text>
            <Text style={{ fontSize: 16, marginBottom: 24 }}>
              Do you want to accept this delivery?
            </Text>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: "#0DB760",
                  padding: 12,
                  borderRadius: 8,
                  marginRight: 8,
                }}
                onPress={async () => {
                  // Accept: update delivery_request status to 'accepted'
                  if (params.deliveryRequestId) {
                    await supabase
                      .from("delivery_request")
                      .update({ status: "accepted" })
                      .eq("id", params.deliveryRequestId);
                  }
                  setIsDecisionModalVisible(false);
                  // Optionally navigate or show confirmation
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  Accept
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: "#e74c3c",
                  padding: 12,
                  borderRadius: 8,
                }}
                onPress={async () => {
                  // Decline: update delivery_request status to 'declined'
                  if (params.deliveryRequestId) {
                    await supabase
                      .from("delivery_request")
                      .update({ status: "declined" })
                      .eq("id", params.deliveryRequestId);
                  }
                  setIsDecisionModalVisible(false);
                  // Optionally navigate or show confirmation
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  Decline
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
