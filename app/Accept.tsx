import {
  Entypo,
  FontAwesome,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Accept = () => {
  const params = useLocalSearchParams();
  const carrierName = params.carrierName || "Carrier";
  const carrierPhone = params.carrierPhone || "-";
  const carrierType = params.carrierType || "-";
  const itemType = params.itemType || "-";
  const senderName = params.senderName || "-";
  const senderContact = params.senderContact || "-";
  const pickupAddress = params.pickupAddress || "-";
  const deliveryAddress = params.deliveryAddress || "-";
  const receiverName = params.receiverName || "-";
  const price = params.price || "-";

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>
            {carrierName} accepted your order
          </Text>
        </View>

        {/* Centered Avatar */}
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: "https://randomuser.me/api/portraits/women/44.jpg",
              }}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.name}>{carrierName}</Text>
        </View>

        {/* Card-like Details Section */}
        <View style={styles.cardSection}>
          <View style={styles.infoRow}>
            <FontAwesome
              name="phone"
              size={18}
              color="#27ae60"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.infoText}>{carrierPhone}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <MaterialIcons
              name="directions-car"
              size={18}
              color="#2980b9"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.infoText}>{carrierType}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <MaterialIcons
              name="inventory"
              size={18}
              color="#8e44ad"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.infoText}>Item: {itemType}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <MaterialIcons
              name="person"
              size={18}
              color="#0DB760"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.infoText}>Sender: {senderName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <FontAwesome
              name="phone"
              size={18}
              color="#27ae60"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.infoText}>Sender Contact: {senderContact}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Entypo
              name="location-pin"
              size={18}
              color="#e67e22"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.infoText}>Pick up: {pickupAddress}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Entypo
              name="location-pin"
              size={18}
              color="#e74c3c"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.infoText}>Delivery: {deliveryAddress}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <MaterialIcons
              name="person"
              size={18}
              color="#2980b9"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.infoText}>Receiver: {receiverName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <MaterialIcons
              name="attach-money"
              size={18}
              color="#27ae60"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.infoText}>Price: ₦{price}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="message" size={24} color="#333" />
            <Text style={styles.actionButtonText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <FontAwesome name="phone" size={24} color="#333" />
            <Text style={styles.actionButtonText}>Internet call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="wallet-outline" size={24} color="#333" />
            <Text style={styles.actionButtonText}>wallet Account</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Payment Button */}
        <TouchableOpacity style={styles.paymentButton}>
          <Text style={styles.paymentButtonText}>Make Payment</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: "center",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  profileSection: {
    alignItems: "flex-start", // align left
    marginBottom: 10,
    width: "100%",
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    marginBottom: 15,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4, // reduced from 8
    width: "100%",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    textAlign: "left",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  actionButton: {
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 14,
    color: "#333",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 8, // reduced from 16
  },
  paymentButton: {
    backgroundColor: "#0DB760",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  paymentButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  cardSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    width: "100%",
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#fff",
  },
});

export default Accept;
