import {
  AntDesign,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";

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

export default function SelectCarrierScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

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

  // Only use marker if both lat/lng are valid numbers
  const senderMarker =
    senderLat !== null && senderLng !== null
      ? { latitude: senderLat, longitude: senderLng }
      : { latitude: 6.6018, longitude: 3.3515 };
  const receiverMarker =
    receiverLat !== null && receiverLng !== null
      ? { latitude: receiverLat, longitude: receiverLng }
      : { latitude: 6.4294, longitude: 3.4219 };

  const initialRegion = {
    latitude: (senderMarker.latitude + receiverMarker.latitude) / 2,
    longitude: (senderMarker.longitude + receiverMarker.longitude) / 2,
    latitudeDelta:
      Math.abs(senderMarker.latitude - receiverMarker.latitude) + 0.09,
    longitudeDelta:
      Math.abs(senderMarker.longitude - receiverMarker.longitude) + 0.04,
  };

  const distanceKm = getDistanceFromLatLonInKm(
    senderMarker.latitude,
    senderMarker.longitude,
    receiverMarker.latitude,
    receiverMarker.longitude
  );
  const distanceText = `${distanceKm.toFixed(1)} km`;

  // Modal state
  const [isModalVisible, setModalVisible] = useState(false);
  const [modalCarrier, setModalCarrier] = useState({
    icon: null,
    title: "",
    price: "",
    eta: "",
  });

  const handleCardPress = (carrier: any) => {
    setModalCarrier(carrier);
    setModalVisible(true);
  };

  // Pull to refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Carrier data state
  const [carriers, setCarriers] = useState([
    {
      icon: <MaterialCommunityIcons name="walk" size={24} color="#000" />,
      title: "Carrier",
      eta: "12 min",
      price: "₦1500",
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
      modalPrice: "₦1,500",
      modalEta: "12 min",
    },
    {
      icon: <FontAwesome5 name="bicycle" size={24} color="#d32f2f" />,
      title: "Bicycle Carrier",
      eta: "8 min",
      price: "₦2500",
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
      modalPrice: "₦2,500",
      modalEta: "8 min",
    },
    {
      icon: <FontAwesome5 name="motorcycle" size={24} color="#0288d1" />,
      title: "Bike Carrier",
      eta: "8 min",
      price: "₦3000",
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
      modalPrice: "₦3,000",
      modalEta: "8 min",
    },
    {
      icon: <FontAwesome5 name="car" size={24} color="#1565c0" />,
      title: "Car Carrier",
      eta: "8 min",
      price: "₦3800",
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
      modalPrice: "₦3,800",
      modalEta: "8 min",
    },
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
          <Marker
            coordinate={senderMarker}
            title="Sender"
            pinColor="#27ae60"
            tracksViewChanges={true}
          >
            <FontAwesome5 name="map-marker-alt" size={22} color="#27ae60" />
          </Marker>
          {/* Receiver Marker */}
          <Marker
            coordinate={receiverMarker}
            title="Receiver"
            pinColor="#e74c3c"
            tracksViewChanges={true}
          >
            <FontAwesome5 name="map-marker-alt" size={22} color="#e74c3c" />
          </Marker>
          {/* Line connecting both markers */}
          <Polyline
            coordinates={[senderMarker, receiverMarker]}
            strokeColor="#1565c0"
            strokeWidth={3}
          />
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
                  title: carrier.modalTitle,
                  price: carrier.modalPrice,
                  eta: carrier.modalEta,
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
              onPress={() => {
                setModalVisible(false);
                router.push("/PeerCarrier");
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
            ETA <Text style={{ fontWeight: "bold" }}>{eta}</Text> away
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
