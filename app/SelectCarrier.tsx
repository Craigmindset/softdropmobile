import {
  AntDesign,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import { supabase } from "../lib/supabase";
import { useDeliveryRequest } from "./DeliveryRequestContext";

const bikeMarkerIcon = require("../assets/images/bike.png");

// Helper to calculate distance between two lat/lng points (Haversine formula)
function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

// Helper to extract numeric minutes from eta string (e.g., '8 min' => 8)
function parseEtaMinutes(eta: string): number {
  const match = eta.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// Helper to calculate price and ETA for each carrier
function calculateCarrierPriceAndEta(carrier: any, distanceKm: number) {
  // Base fares by carrier title
  const baseFares: Record<string, number> = {
    Carrier: 1500,
    "Bicycle Carrier": 2500,
    "Bike Carrier": 3500,
    "Car Carrier": 4000,
  };
  const baseFare = baseFares[carrier.title] || 0;
  const etaMinutes = parseEtaMinutes(carrier.eta);
  const timeCost = 50 * etaMinutes;
  const distanceCost = 100 * distanceKm;
  const total = baseFare + timeCost + distanceCost;
  return {
    price: `₦${Math.round(total).toLocaleString()}`,
    modalPrice: `₦${Math.round(total).toLocaleString()}`,
    modalEta: `${etaMinutes} min`,
  };
}

const GOOGLE_MAPS_API_KEY =
  Constants?.expoConfig?.extra?.GOOGLE_PLACES_API_KEY ||
  process.env.GOOGLE_PLACES_API_KEY;

// Helper to fetch real-time ETA and route distance from Google Directions API
async function fetchEtaAndDistance(
  mode: string,
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
) {
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (
      data.routes &&
      data.routes[0] &&
      data.routes[0].legs &&
      data.routes[0].legs[0]
    ) {
      const duration = data.routes[0].legs[0].duration.value; // seconds
      const distanceMeters = data.routes[0].legs[0].distance.value; // meters
      return {
        etaMin: Math.round(duration / 60),
        distanceKm: distanceMeters / 1000,
      };
    }
  } catch (e) {
    // fallback
  }
  return { etaMin: null, distanceKm: null };
}

// Add mapping from carrier title to carriage_type
const CARRIAGE_TYPE_MAP: Record<string, string> = {
  Carrier: "Carrier",
  "Bicycle Carrier": "Bicycle",
  "Bike Carrier": "Bike",
  "Car Carrier": "Car",
};

export default function SelectCarrierScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setRequest } = useDeliveryRequest();

  // Use only the robust marker logic for map and polyline, remove senderLocation/receiverLocation legacy fallback
  // Remove senderLocation and receiverLocation above, and use only senderMarker and receiverMarker everywhere for map and polyline

  // Fix: parse all params as floats and check for valid numbers
  function parseCoord(val: any): number | null {
    const n = Number(val);
    return isNaN(n) ? null : n;
  }
  const senderLat = parseCoord(params.sender_latitude ?? params.senderLat);
  const senderLng = parseCoord(params.sender_longitude ?? params.senderLng);
  const receiverLat = parseCoord(
    params.receiver_latitude ?? params.receiverLat
  );
  const receiverLng = parseCoord(
    params.receiver_longitude ?? params.receiverLng
  );

  // Only use marker if both lat/lng are valid numbers from params (inputted address)
  // Never use device location for sender marker; fallback is a neutral default (Lagos center)
  const senderMarker =
    senderLat !== null && senderLng !== null
      ? { latitude: senderLat, longitude: senderLng }
      : { latitude: 6.5244, longitude: 3.3792 }; // Lagos center as fallback

  // Same logic for receiver marker
  const receiverMarker =
    receiverLat !== null && receiverLng !== null
      ? { latitude: receiverLat, longitude: receiverLng }
      : { latitude: 6.5244, longitude: 3.3792 }; // Lagos center as fallback

  // If either marker is missing, fallback to a default region
  const initialRegion =
    senderMarker && receiverMarker
      ? {
          latitude: (senderMarker.latitude + receiverMarker.latitude) / 2,
          longitude: (senderMarker.longitude + receiverMarker.longitude) / 2,
          latitudeDelta: 0.01, // Street-level zoom
          longitudeDelta: 0.01, // Street-level zoom
        }
      : {
          latitude: 6.6018,
          longitude: 3.3515,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

  const distanceKm =
    senderMarker && receiverMarker
      ? getDistanceFromLatLonInKm(
          senderMarker.latitude,
          senderMarker.longitude,
          receiverMarker.latitude,
          receiverMarker.longitude
        )
      : 0;

  // Add state for real route distance
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const distanceText = routeDistanceKm
    ? `${routeDistanceKm.toFixed(1)} km`
    : `${distanceKm.toFixed(1)} km`;

  // Modal state
  const [isModalVisible, setModalVisible] = useState(false);
  // Update modalCarrier state to include cardTitle
  const [modalCarrier, setModalCarrier] = useState({
    icon: null,
    title: "",
    price: "",
    eta: "",
    cardTitle: "", // <-- add this property
  });

  // When a carrier card is pressed, show modal with up-to-date info
  // In handleCardPress, pass both the card's title and modalTitle
  const handleCardPress = (carrier: any) => {
    setModalCarrier({
      ...carrier,
      eta: carrier.modalEta,
      modalEta: carrier.modalEta,
      cardTitle: carrier.title, // always the card's title, e.g., 'Bike Carrier'
      modalTitle: carrier.modalTitle, // can be 'Intra-city Delivery', but not used for mapping
    });
    setModalVisible(true);
  };

  // Pull to refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Carrier data state
  const [carriers, setCarriers] = useState([
    {
      icon: <MaterialCommunityIcons name="walk" size={24} color="#000" />,
      title: "Carrier",
      mode: "walking",
      eta: "Loading",
      price: "",
      description: "Package delivery",
      note: "Cheaper but longer delivery time",
      modalIcon: (
        <MaterialCommunityIcons
          name="walk"
          size={40}
          color="#000"
          style={{ alignSelf: "center", marginBottom: 10 }}
        />
      ),
      modalTitle: "Intra-city Delivery",
    },
    {
      icon: <FontAwesome5 name="bicycle" size={24} color="#d32f2f" />,
      title: "Bicycle Carrier",
      mode: "bicycling",
      eta: "Loading",
      price: "",
      description: "Package delivery",
      note: undefined,
      modalIcon: (
        <FontAwesome5
          name="bicycle"
          size={40}
          color="#d32f2f"
          style={{ alignSelf: "center", marginBottom: 10 }}
        />
      ),
      modalTitle: "Intra-city Delivery",
    },
    {
      icon: <FontAwesome5 name="motorcycle" size={24} color="#0288d1" />,
      title: "Bike Carrier",
      mode: "driving",
      eta: "Loading",
      price: "",
      description: "Package delivery",
      note: undefined,
      modalIcon: (
        <FontAwesome5
          name="motorcycle"
          size={40}
          color="#0288d1"
          style={{ alignSelf: "center", marginBottom: 10 }}
        />
      ),
      modalTitle: "Intra-city Delivery",
    },
    {
      icon: <FontAwesome5 name="car" size={24} color="#1565c0" />,
      title: "Car Carrier",
      mode: "driving",
      eta: "Loading",
      price: "",
      description: "Package delivery",
      note: undefined,
      modalIcon: (
        <FontAwesome5
          name="car"
          size={40}
          color="#1565c0"
          style={{ alignSelf: "center", marginBottom: 10 }}
        />
      ),
      modalTitle: "Intra-city Delivery",
    },
  ]);

  // Add state for online carriers
  const [onlineCarriers, setOnlineCarriers] = useState<any[]>([]);

  // Fetch online carriers on mount and every 5 seconds
  useEffect(() => {
    async function fetchOnlineCarriers() {
      const { data, error } = await supabase
        .from("carrier_profile")
        .select("user_id, latitude, longitude, carrier_type, first_name")
        .eq("is_online", true);
      if (!error && data) {
        setOnlineCarriers(
          data.filter(
            (carrier) =>
              typeof carrier.latitude === "number" &&
              typeof carrier.longitude === "number"
          )
        );
      }
    }
    fetchOnlineCarriers();
    const interval = setInterval(fetchOnlineCarriers, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real-time ETA on mount or when sender/receiver changes
  useEffect(() => {
    async function updateEtasAndDistance() {
      // Use the first carrier's mode for the main route distance (e.g., walking)
      const { etaMin, distanceKm: realDistance } = await fetchEtaAndDistance(
        carriers[0].mode,
        senderMarker,
        receiverMarker
      );
      if (realDistance) setRouteDistanceKm(realDistance);
      else setRouteDistanceKm(null);
      // Use real route distance for all price calculations
      const usedDistance = realDistance || distanceKm;
      const updated = await Promise.all(
        carriers.map(async (carrier) => {
          const { etaMin: eta } = await fetchEtaAndDistance(
            carrier.mode,
            senderMarker,
            receiverMarker
          );
          const etaStr = eta ? `${eta} min` : carrier.eta;
          const calc = calculateCarrierPriceAndEta(
            { ...carrier, eta: etaStr },
            usedDistance
          );
          return { ...carrier, ...calc, eta: etaStr, modalEta: etaStr };
        })
      );
      setCarriers(updated);
    }
    updateEtasAndDistance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    senderMarker.latitude,
    senderMarker.longitude,
    receiverMarker.latitude,
    receiverMarker.longitude,
  ]);

  // Simulate fetching carrier data (replace with real API call)
  const fetchCarriers = async () => {
    // TODO: Replace with real API call to fetch available carriers
    // For now, just reset to the static list after a delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setCarriers([...carriers]);
  };

  // Dummy refresh handler replaced with real data reload
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCarriers();
    setRefreshing(false);
  };

  // Helper: get address from params (support both camelCase and snake_case)
  const senderAddress = params.sender_location || params.senderLocation || null;
  const receiverAddress =
    params.receiver_location || params.receiverLocation || null;

  return (
    <View style={styles.container}>
      {/* Back Icon */}
      <TouchableOpacity
        style={{
          position: "absolute",
          top: 48,
          left: 20,
          zIndex: 100,
          backgroundColor: "rgba(0,0,0,0.5)",
          borderRadius: 20,
          padding: 8,
        }}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <AntDesign name="arrowleft" size={20} color="#fff" />
      </TouchableOpacity>

      {/* ============ Top Map Area (Real MapView) ============ */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.mapImage}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          userInterfaceStyle="light"
        >
          {/* Sender Marker */}
          {senderMarker && (
            <Marker
              coordinate={senderMarker}
              title="Sender"
              pinColor="#27ae60"
              tracksViewChanges={true}
            >
              <FontAwesome5 name="map-marker-alt" size={22} color="#27ae60" />
            </Marker>
          )}
          {/* Receiver Marker */}
          {receiverMarker && (
            <Marker
              coordinate={receiverMarker}
              title="Receiver"
              pinColor="#e74c3c"
              tracksViewChanges={true}
            >
              <FontAwesome5 name="map-marker-alt" size={22} color="#e74c3c" />
            </Marker>
          )}
          {/* Online Carrier Markers */}
          {onlineCarriers.map((carrier, idx) => (
            <Marker
              key={carrier.user_id || idx}
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
              ) : (
                <FontAwesome5 name="bicycle" size={28} color="#0DB760" />
              )}
            </Marker>
          ))}
          {/* Line connecting both markers */}
          {senderMarker && receiverMarker && (
            <Polyline
              coordinates={[senderMarker, receiverMarker]}
              strokeColor="#1565c0"
              strokeWidth={3}
            />
          )}
        </MapView>
        {/* Distance Overlay */}
        <View style={styles.distanceLabel}>
          <Text style={styles.distanceText}>{distanceText}</Text>
        </View>
      </View>

      {/* ============ Carrier List Section ============ */}
      <View style={[styles.bottomPanel, { marginTop: -60 }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Each carrier option below is a card-style component */}
          {carriers.map((carrier, idx) => (
            <CarrierCard
              key={idx}
              icon={carrier.icon}
              title={carrier.title}
              eta={carrier.eta}
              price={carrier.price}
              description={carrier.description}
              note={carrier.note}
              onPress={() =>
                handleCardPress({
                  icon: carrier.modalIcon,
                  title: carrier.title, // pass the card's title here
                  price: carrier.price,
                  eta: carrier.eta,
                  modalTitle: carrier.modalTitle,
                })
              }
            />
          ))}
        </ScrollView>
      </View>

      {/* =========== Modal Popup =========== */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}
        >
          <View
            style={styles.modalCard}
            // Prevent modal from closing when clicking inside the card
            onStartShouldSetResponder={() => true}
          >
            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <AntDesign name="close" size={24} color="black" />
            </TouchableOpacity>

            {/* Carrier Icon */}
            {modalCarrier.icon}

            {/* Title */}
            <Text style={styles.modalTitle}>{modalCarrier.title}</Text>

            {/* Address Block */}
            <View style={styles.routeBlock}>
              <View style={styles.routeDotBlock}>
                <View style={styles.startDot} />
                <View style={styles.routeLine} />
                <View style={styles.endDot} />
              </View>
              <View>
                <Text style={styles.routeText}>
                  Sender:{" "}
                  {senderAddress
                    ? String(senderAddress)
                    : senderMarker.latitude.toFixed(5) +
                      ", " +
                      senderMarker.longitude.toFixed(5)}
                </Text>
                <Text style={styles.routeText}>
                  Receiver:{" "}
                  {receiverAddress
                    ? String(receiverAddress)
                    : receiverMarker.latitude.toFixed(5) +
                      ", " +
                      receiverMarker.longitude.toFixed(5)}
                </Text>
                <Text style={styles.routeText}>ETA: {modalCarrier.eta}</Text>
              </View>
            </View>

            {/* Cost Info */}
            <Text style={styles.costLabel}>Estimated Carrier Cost</Text>
            <View style={styles.costRow}>
              <Text style={styles.costAmount}>{modalCarrier.price}</Text>
              <Text style={styles.vatText}>Inclusive VAT: 7.5%</Text>
            </View>

            {/* Select Button */}
            <TouchableOpacity
              style={styles.selectBtn}
              onPress={async () => {
                setModalVisible(false);
                // Map card title to carrier_type explicitly
                const cardTitleToType = {
                  Carrier: "Carrier",
                  "Bicycle Carrier": "Bicycle",
                  "Bike Carrier": "Bike",
                  "Car Carrier": "Car",
                };
                const cardTitle = modalCarrier.cardTitle || modalCarrier.title;
                // Fix TS error: cast cardTitle as keyof typeof cardTitleToType
                const carrierType =
                  cardTitleToType[cardTitle as keyof typeof cardTitleToType] ||
                  "Carrier";
                try {
                  // Find the first available online carrier of this type
                  const { data: carriers, error } = await supabase
                    .from("carrier_profile")
                    .select("user_id")
                    .eq("carrier_type", carrierType)
                    .eq("is_online", true);
                  if (error) {
                    alert(error.message || "Failed to find carriers");
                    return;
                  }
                  if (!carriers || carriers.length === 0) {
                    alert(`No available carriers for type: ${carrierType}`);
                    return;
                  }
                  const selectedCarrier = carriers[0];

                  // Fetch sender_name from sender_profile
                  const { data: senderProfile, error: senderProfileError } =
                    await supabase
                      .from("sender_profile")
                      .select("first_name, last_name")
                      .eq("user_id", params.sender_id)
                      .single();
                  if (senderProfileError || !senderProfile) {
                    alert("Could not fetch sender profile. Please try again.");
                    return;
                  }
                  const sender_name = `${senderProfile.first_name || ""} ${
                    senderProfile.last_name || ""
                  }`.trim();

                  // Parse price to number if possible
                  let priceValue = null;
                  if (typeof modalCarrier.price === "string") {
                    // Remove currency symbol and commas
                    priceValue = Number(
                      modalCarrier.price.replace(/[^\d.]/g, "")
                    );
                  } else if (typeof modalCarrier.price === "number") {
                    priceValue = modalCarrier.price;
                  }
                  // Prepare all params for delivery_request insert
                  let imagesField = null;
                  if (
                    Array.isArray(params.images) &&
                    params.images.length > 0
                  ) {
                    imagesField = params.images;
                  } else if (
                    typeof params.images === "string" &&
                    params.images.trim() !== ""
                  ) {
                    // If a single image string is passed, wrap in array
                    imagesField = [params.images];
                  } // else leave as null
                  const insertPayload = {
                    sender_id: params.sender_id,
                    sender_name,
                    sender_contact: params.sender_contact, // <-- Use sender_contact from params
                    sender_location: params.sender_location,
                    sender_latitude: params.sender_latitude
                      ? Number(params.sender_latitude)
                      : null,
                    sender_longitude: params.sender_longitude
                      ? Number(params.sender_longitude)
                      : null,
                    receiver_location: params.receiver_location,
                    receiver_latitude: params.receiver_latitude
                      ? Number(params.receiver_latitude)
                      : null,
                    receiver_longitude: params.receiver_longitude
                      ? Number(params.receiver_longitude)
                      : null,
                    receiver_name: params.receiver_name,
                    receiver_contact: params.receiver_contact,
                    item_type: params.item_type,
                    quantity: params.quantity ? Number(params.quantity) : 1,
                    insurance: String(params.insurance) === "true",
                    is_inter_state: String(params.is_inter_state) === "true",
                    images: imagesField,
                    delivery_method: params.delivery_method,
                    price: priceValue,
                    carrier_type: carrierType,
                    assigned_carrier_id: selectedCarrier.user_id,
                    status: "pending",
                  };
                  console.log("[SelectCarrier] insertPayload:", insertPayload);
                  console.log("[SelectCarrier] params:", params);
                  // Insert new delivery_request
                  const { data: newRequest, error: insertError } =
                    await supabase
                      .from("delivery_request")
                      .insert([insertPayload])
                      .select()
                      .single();
                  if (insertError || !newRequest) {
                    console.error(
                      "[SelectCarrier] Supabase insertError:",
                      insertError
                    );
                    alert(
                      "Failed to create delivery request. Please try again."
                    );
                    return;
                  }
                  // Navigate to PeerCarrier screen and pass deliveryRequestId, carrierType, and price
                  router.push({
                    pathname: "/PeerCarrier",
                    params: {
                      deliveryRequestId: newRequest.id,
                      carrierType,
                      price: modalCarrier.price,
                    },
                  });
                } catch (e) {
                  alert("Failed to create delivery request");
                }
              }}
            >
              <Text style={styles.selectBtnText}>Select Carrier</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ============ Reusable Carrier Card Component ============
type CarrierCardProps = {
  icon: React.ReactNode;
  title: string;
  eta: string;
  price: string;
  description: string;
  note?: string;
  onPress: () => void;
};

function CarrierCard({
  icon,
  title,
  eta,
  price,
  description,
  note,
  onPress,
}: CarrierCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View style={styles.card}>
        {/* Left Icon */}
        <View style={styles.iconBox}>{icon}</View>

        {/* Info Section */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.etaText}>
            ETA{" "}
            {eta === "Loading" ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#00c2a8"
                  style={{ marginLeft: 4 }}
                />
                <Text style={{ fontWeight: "bold" }}> (fetching...)</Text>
              </>
            ) : (
              <Text style={{ fontWeight: "bold" }}>{eta}</Text>
            )}{" "}
            away
          </Text>
          <Text style={styles.cardDescription}>{description}</Text>
          {note && <Text style={styles.cardNote}>{note}</Text>}
        </View>

        {/* Price */}
        <Text style={styles.priceText}>{price}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ============ Styles ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e8f5e9",
  },

  mapContainer: {
    height: "45%",
    backgroundColor: "#ccc",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
  },

  mapImage: {
    width: "100%",
    height: "100%",
  },

  distanceLabel: {
    position: "absolute",
    right: 20,
    top: 20,
    backgroundColor: "white",
    padding: 8,
    borderRadius: 8,
    elevation: 5,
  },

  distanceText: {
    fontWeight: "bold",
    fontSize: 16,
  },

  bottomPanel: {
    flex: 1,
    backgroundColor: "#00c2a8",
    paddingHorizontal: 15,
    paddingTop: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
  },

  iconBox: {
    marginRight: 12,
    backgroundColor: "#f1f1f1",
    borderRadius: 8,
    padding: 8,
  },

  cardInfo: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },

  etaText: {
    fontSize: 13,
    color: "#555",
  },

  cardDescription: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },

  cardNote: {
    fontSize: 11,
    color: "#009688",
    marginTop: 4,
  },

  priceText: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#000",
  },

  // =========== Modal Styles ===========
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCard: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    right: 15,
    top: 15,
    zIndex: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  routeBlock: {
    flexDirection: "row",
    marginBottom: 20,
  },
  routeDotBlock: {
    alignItems: "center",
    marginRight: 10,
  },
  startDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "black",
    marginBottom: 3,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: "#00c2a8",
  },
  endDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#00c2a8",
    marginTop: 3,
  },
  routeText: {
    marginBottom: 5,
    fontSize: 13,
    color: "#333",
  },
  costLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 5,
  },
  costRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  costAmount: {
    fontSize: 22,
    fontWeight: "bold",
  },
  vatText: {
    fontSize: 12,
    color: "#555",
  },
  selectBtn: {
    backgroundColor: "black",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  selectBtnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
