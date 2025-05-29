import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

const FindCarrier = () => {
  const router = useRouter();
  const [insurance, setInsurance] = useState(false);
  const [quantity, setQuantity] = useState(0);

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.mapContainer}>
          {/* Back Icon */}
          <TouchableOpacity
            style={styles.backIcon}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#222" />
          </TouchableOpacity>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.mapImage}
            initialRegion={{
              latitude: 6.5244,
              longitude: 3.3792,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
          >
            <Marker coordinate={{ latitude: 6.5244, longitude: 3.3792 }}>
              <View style={{ alignItems: "center" }}>
                <Ionicons name="location-sharp" size={18} color="tomato" />
                <Text
                  style={{
                    fontSize: 10,
                    color: "#333",
                    backgroundColor: "#fff",
                    paddingHorizontal: 4,
                    borderRadius: 4,
                    marginTop: 2,
                  }}
                >
                  Lagos
                </Text>
              </View>
            </Marker>
          </MapView>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.heading}>Find your choosen route</Text>

          {/* Route Type Tabs */}
          <View style={styles.routeTabs}>
            <TouchableOpacity style={styles.routeTabActive}>
              <Ionicons name="location" size={18} color="#fff" />
              <Text style={styles.routeTabTextActive}>Intra-City</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.routeTab}>
              <MaterialIcons name="map" size={18} color="#bbb" />
              <Text style={styles.routeTabText}>Inter-State</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.routeTab}>
              <FontAwesome name="globe" size={18} color="#bbb" />
              <Text style={styles.routeTabText}>International</Text>
            </TouchableOpacity>
          </View>

          {/* Item Type */}
          <Text style={styles.label}>
            What type of item do you want to send?
          </Text>
          <View style={styles.inputField} />

          {/* Quantity and Insurance */}
          <View style={styles.row}>
            <View style={styles.quantityContainer}>
              <Text style={styles.label}>Quantity</Text>
              <View style={styles.quantityBox}>
                <Text style={styles.quantityText}>{quantity}</Text>
              </View>
            </View>

            <View style={styles.insuranceContainer}>
              <Text style={styles.label}>Do you want to insure the item?</Text>
              <View style={styles.insuranceRow}>
                <Text style={styles.insuranceOption}>No</Text>
                <Switch
                  value={insurance}
                  onValueChange={setInsurance}
                  thumbColor="#fff"
                  trackColor={{ true: "#0f0", false: "#999" }}
                />
                <Text style={styles.insuranceOption}>Yes</Text>
              </View>
            </View>
          </View>

          {/* Upload Image */}
          <Text style={styles.label}>Upload Image of Item</Text>
          <View style={styles.imageUploadRow}>
            <TouchableOpacity style={styles.uploadButton}>
              <Text style={styles.plus}>+</Text>
            </TouchableOpacity>
            <View style={styles.imagePlaceholder} />
            <View style={styles.imagePlaceholder} />
          </View>

          {/* Location Fields */}
          <View style={styles.rowWithIcon}>
            <Ionicons
              name="location"
              size={18}
              color="#0f0"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.label}>Use my location</Text>
          </View>
          <TextInput style={styles.input} placeholder="Enter sender location" />
          <TextInput
            style={styles.input}
            placeholder="Enter receiver location"
          />
          <Text style={styles.savedLocation}>
            Saved Mikano International Limited - Lagos 41B Freedom Way...
          </Text>

          {/* Receiver Details */}
          <TextInput style={styles.input} placeholder="Enter receiver’s name" />
          <TextInput
            style={styles.input}
            placeholder="Enter receiver’s contact"
            keyboardType="phone-pad"
          />

          {/* Submit Button */}
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Find a Carrier</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000",
  },
  mapContainer: {
    height: 400,
    width: "100%",
    position: "relative",
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  backIcon: {
    position: "absolute",
    top: 44, // moved down to avoid status bar overlay (was 16)
    left: 16,
    zIndex: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 4,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  formContainer: {
    backgroundColor: "#0c0c0c",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  heading: {
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
  routeTab: {
    alignItems: "center",
    padding: 8,
  },
  routeTabText: {
    color: "#bbb",
    fontSize: 12,
    marginTop: 4,
  },
  routeTabActive: {
    alignItems: "center",
    padding: 8,
    backgroundColor: "#222",
    borderRadius: 8,
  },
  routeTabTextActive: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
  },
  label: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 4,
  },
  inputField: {
    height: 40,
    backgroundColor: "#222",
    borderRadius: 8,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  quantityContainer: {
    flex: 1,
  },
  quantityBox: {
    height: 40,
    backgroundColor: "#222",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    color: "#fff",
    fontSize: 16,
  },
  insuranceContainer: {
    flex: 1.5,
    marginLeft: 10,
  },
  insuranceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  insuranceOption: {
    color: "#fff",
    marginHorizontal: 8,
  },
  imageUploadRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  uploadButton: {
    width: 60,
    height: 60,
    backgroundColor: "#0f4",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  plus: {
    fontSize: 28,
    color: "#fff",
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: "#666",
    borderRadius: 8,
    marginLeft: 10,
  },
  rowWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  input: {
    height: 40,
    backgroundColor: "#222",
    borderRadius: 8,
    paddingHorizontal: 10,
    color: "#fff",
    marginBottom: 12,
  },
  savedLocation: {
    fontSize: 12,
    color: "#999",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#0f8",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default FindCarrier;
