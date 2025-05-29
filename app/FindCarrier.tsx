import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

const FindCarrier = () => {
  const [insurance, setInsurance] = useState(false);
  const [quantity, setQuantity] = useState(0);

  return (
    <>
      {/* Status Bar */}
      <StatusBar barStyle="light-content" backgroundColor="#0d1117" />
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0d1117" }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Map Section */}
          <MapView style={styles.map} />

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Header */}
            <Text style={styles.header}>Find your choosen route</Text>

            {/* Route Tabs */}
            <View style={styles.routeTabs}>
              <TouchableOpacity style={styles.activeTab}>
                <FontAwesome5 name="city" size={16} color="white" />
                <Text style={styles.activeTabText}>Intra-City</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.inactiveTab}>
                <MaterialIcons name="map" size={16} color="#999" />
                <Text style={styles.inactiveTabText}>Inter-State</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.inactiveTab}>
                <FontAwesome5 name="globe" size={16} color="#999" />
                <Text style={styles.inactiveTabText}>International</Text>
              </TouchableOpacity>
            </View>

            {/* Item Type Dropdown (Mocked as TextInput for simplicity) */}
            <Text style={styles.label}>
              What type of item do you want to send?
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Select item type"
              placeholderTextColor="#777"
            />

            {/* Quantity and Insurance Section */}
            <View style={styles.rowBetween}>
              <View style={styles.column}>
                <Text style={styles.label}>Quantity</Text>
                <View style={styles.quantityBox}>
                  <Text style={styles.quantityText}>{quantity}</Text>
                </View>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>
                  Do you want to insure the item?
                </Text>
                <View style={styles.insuranceRow}>
                  <Text style={styles.insuranceLabel}>No</Text>
                  <Switch
                    value={insurance}
                    onValueChange={setInsurance}
                    thumbColor={insurance ? "#fff" : "#fff"}
                    trackColor={{ false: "#444", true: "#27ae60" }}
                  />
                  <Text style={styles.insuranceLabel}>Yes</Text>
                </View>
              </View>
            </View>

            {/* Image Upload Section */}
            <Text style={styles.label}>Upload Image of Item</Text>
            <View style={styles.imageRow}>
              <TouchableOpacity style={styles.imageUpload}>
                <Text style={styles.uploadText}>+</Text>
              </TouchableOpacity>
              <View style={styles.imagePlaceholder} />
              <View style={styles.imagePlaceholder} />
            </View>

            {/* Location Fields */}
            <View style={styles.rowWithIcon}>
              <Ionicons name="location" size={18} color="#27ae60" />
              <Text style={styles.useLocation}>Use my location</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter sender location"
              placeholderTextColor="#777"
            />
            <TextInput
              style={styles.input}
              placeholder="Enter receiver location"
              placeholderTextColor="#777"
            />
            <Text style={styles.savedAddress}>
              Saved Mikano International Limited - Lagos 41B Freedom Way...
            </Text>

            {/* Receiver Details */}
            <TextInput
              style={styles.input}
              placeholder="Enter receiver’s name"
              placeholderTextColor="#777"
            />
            <TextInput
              style={styles.input}
              placeholder="Enter receiver’s contact"
              placeholderTextColor="#777"
              keyboardType="phone-pad"
            />

            {/* Submit Button */}
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Find a Carrier</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d1117",
  },
  map: {
    height: 300,
    width: "100%",
  },
  formContainer: {
    padding: 20,
    backgroundColor: "#0d1117",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  header: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  routeTabs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  activeTab: {
    alignItems: "center",
  },
  inactiveTab: {
    alignItems: "center",
  },
  activeTabText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
  },
  inactiveTabText: {
    color: "#999",
    fontSize: 12,
    marginTop: 4,
  },
  label: {
    color: "#ccc",
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#161b22",
    color: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  column: {
    flex: 1,
  },
  quantityBox: {
    backgroundColor: "#161b22",
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    color: "#fff",
    fontSize: 16,
  },
  insuranceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  insuranceLabel: {
    color: "#fff",
    marginHorizontal: 6,
  },
  imageRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  imageUpload: {
    width: 60,
    height: 60,
    backgroundColor: "#27ae60",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  uploadText: {
    color: "#fff",
    fontSize: 24,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 8,
  },
  rowWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 6,
  },
  useLocation: {
    color: "#27ae60",
    fontSize: 14,
  },
  savedAddress: {
    color: "#888",
    fontSize: 12,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#27ae60",
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },
});

export default FindCarrier;
