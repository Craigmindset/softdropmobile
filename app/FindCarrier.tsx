import {
  AntDesign,
  Entypo,
  FontAwesome5,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import * as Contacts from "expo-contacts"; // Add this import at the top
import * as ImagePicker from "expo-image-picker";
import type { LocationObjectCoords } from "expo-location";
import * as Location from "expo-location";
import * as NavigationBar from "expo-navigation-bar";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { Region } from "react-native-maps";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { supabase } from "../lib/supabase";

const HEADER_BG = "#0d1117";

const FindCarrier = () => {
  const [insurance, setInsurance] = useState(false);
  const [quantity, setQuantity] = useState(1); // Set default quantity to 1
  const [location, setLocation] = useState<LocationObjectCoords | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [itemType, setItemType] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [images, setImages] = useState<(string | null)[]>([null, null]); // For two image slots
  const [senderLocation, setSenderLocation] = useState(""); // Add this state
  const [lastSenderAddress, setLastSenderAddress] = useState(""); // Add this state at the top inside your component
  const [receiverLocation, setReceiverLocation] = useState(""); // Add this state at the top
  const [receiverContact, setReceiverContact] = useState(""); // Add this state
  const [receiverName, setReceiverName] = useState(""); // Add this state for receiver name
  const [isInterState, setIsInterState] = useState(false); // Track Inter-State selection
  const [deliveryMethod, setDeliveryMethod] = useState("arrival"); // "arrival" or "home"

  const router = useRouter();

  const itemOptions = [
    "Documents",
    "Gadgets",
    "Clothing",
    "Cosmetics",
    "Auto-part",
  ];

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync("#000");
    NavigationBar.setButtonStyleAsync("light");
  }, []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  // Function to get address from coordinates
  const getAddressFromCoords = async (coords: LocationObjectCoords) => {
    try {
      let [address] = await Location.reverseGeocodeAsync(coords);
      if (address) {
        // Compose a readable address string
        return `${address.name || ""} ${address.street || ""}, ${
          address.city || ""
        }, ${address.region || ""}, ${address.country || ""}`.replace(
          /\s+/g,
          " "
        );
      }
    } catch (e) {}
    return "";
  };

  // Handler for picking image
  const handlePickImage = async (index: number) => {
    // Ask for permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to your photos.");
      return;
    }

    // Let user pick image from camera or gallery
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const uri = asset.uri;
      const fileType =
        asset.type ||
        (uri.split(".").pop() as string | undefined)?.toLowerCase();
      const allowedTypes = ["jpeg", "jpg", "png"];
      const fileSize = asset.fileSize; // Expo SDK 49+ uses fileSize

      // Check file type
      const isTypeAllowed =
        (fileType ? allowedTypes.includes(fileType) : false) ||
        (asset.mimeType &&
          allowedTypes.some((type) => asset.mimeType?.includes(type)));

      // Check file size (max 5MB = 5 * 1024 * 1024 bytes)
      const isSizeAllowed = !fileSize || fileSize <= 5 * 1024 * 1024;

      if (!isTypeAllowed || !isSizeAllowed) {
        Alert.alert(
          "Invalid Image",
          "Accepted Formats: Only JPEG, JPG, and PNG files are allowed.\nMaximum Size: The image file size must not exceed 5 MB."
        );
        return;
      }

      // Update the selected image in the images array
      const newImages = [...images];
      newImages[index] = uri;
      setImages(newImages);
    }
  };

  // Handler to pick contact
  const handlePickContact = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Please allow access to your contacts."
      );
      return;
    }
    const { data } = await Contacts.presentFormAsync();
    if (data && data.phoneNumbers && data.phoneNumbers.length > 0) {
      setReceiverContact(data.phoneNumbers[0].number);
    }
  };

  // Handler for submitting delivery request
  const handleSubmitDeliveryRequest = async () => {
    if (
      !itemType ||
      !senderLocation ||
      !receiverLocation ||
      !receiverContact ||
      !receiverName
    ) {
      Alert.alert("Missing Fields", "Please fill all required fields.");
      return;
    }
    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("Auth error:", userError);
        Alert.alert(
          "Auth Error",
          "Could not get current user. Please log in again."
        );
        return;
      }
      const sender_id = user.id;

      // Fetch sender_name and sender_contact from sender_profile
      let sender_name = null;
      let sender_contact = null;
      try {
        const { data: senderProfile, error: senderProfileError } =
          await supabase
            .from("sender_profile")
            .select("first_name, last_name, phone")
            .eq("user_id", sender_id)
            .single();
        if (!senderProfileError && senderProfile) {
          sender_name = `${senderProfile.first_name || ""} ${
            senderProfile.last_name || ""
          }`.trim();
          sender_contact = senderProfile.phone || null;
        }
      } catch (e) {
        // fallback: leave sender_name and sender_contact as null
      }

      // Geocode receiver location
      let receiver_latitude = null;
      let receiver_longitude = null;
      if (receiverLocation && receiverLocation.trim().length > 0) {
        try {
          const geoResults = await Location.geocodeAsync(receiverLocation);
          if (geoResults && geoResults.length > 0) {
            receiver_latitude = geoResults[0].latitude;
            receiver_longitude = geoResults[0].longitude;
          }
        } catch (geoErr) {
          console.error("Geocoding error for receiver location:", geoErr);
        }
      }

      // Prepare params for navigation
      const navParams = {
        sender_latitude: location?.latitude
          ? String(location.latitude)
          : undefined,
        sender_longitude: location?.longitude
          ? String(location.longitude)
          : undefined,
        receiver_latitude: receiver_latitude
          ? String(receiver_latitude)
          : undefined,
        receiver_longitude: receiver_longitude
          ? String(receiver_longitude)
          : undefined,
        sender_location: senderLocation,
        receiver_location: receiverLocation,
        sender_id, // <-- Ensure sender_id is passed
        item_type: itemType && itemType.trim() ? itemType : "Other", // <-- Always pass a non-empty value
        quantity: String(quantity ?? 1), // <-- Always pass a value
        insurance: String(insurance ?? false), // <-- Always pass a value
        is_inter_state: String(isInterState ?? false), // <-- Always pass a value
        images: images.filter((img): img is string => !!img), // Only strings
        sender_contact, // <-- Use fetched sender_contact from sender_profile
        sender_name, // <-- Use fetched sender_name
        receiver_contact: receiverContact,
        receiver_name: receiverName,
        delivery_method: deliveryMethod,
      };
      if (!navParams.item_type || !navParams.item_type.trim()) {
        console.warn(
          "[FindCarrier] item_type missing or empty, defaulting to 'Other'. Params:",
          navParams
        );
        navParams.item_type = "Other";
      }
      console.log(
        "[FindCarrier] Navigating to SelectCarrier with params:",
        navParams
      );
      router.push({
        pathname: "/SelectCarrier",
        params: navParams,
      }); // Navigate to SelectCarrier screen
    } catch (e: unknown) {
      if (e instanceof Error) {
        console.error("Unexpected error:", e);
        Alert.alert("Error", e.message || "An error occurred.");
      } else {
        console.error("Unknown error:", e);
        Alert.alert("Error", "An error occurred.");
      }
    }
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        translucent={true}
        backgroundColor="transparent"
      />

      {/* Back Icon */}
      <TouchableOpacity
        style={{
          position: "absolute",
          top: 40,
          left: 20,
          zIndex: 100,
          backgroundColor: "rgba(0,0,0,0.5)",
          borderRadius: 20,
          padding: 8,
        }}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <AntDesign name="arrowleft" size={24} color="#fff" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Map Section */}
          <View style={styles.mapWrapper}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              region={region || undefined}
              showsUserLocation={true}
              showsMyLocationButton={true}
              loadingEnabled={true}
              userInterfaceStyle="dark"
              // Add your Google Maps API key in app.json or AndroidManifest.xml for production
            >
              {location && (
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  title="You are here"
                />
              )}
            </MapView>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* drawer handle */}
            <View
              style={{
                alignSelf: "center",
                width: 48,
                height: 6,
                backgroundColor: "#ececec",
                borderRadius: 3,
                marginBottom: 16,
                opacity: 0.8,
              }}
            />
            <View
              style={{
                marginTop: 8,
                marginBottom: 16,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Find your choosen route
              </Text>
            </View>
            {/* Route Tabs */}
            <View style={styles.routeTabs}>
              <TouchableOpacity
                style={isInterState ? styles.inactiveTab : styles.activeTab}
                onPress={() => setIsInterState(false)}
              >
                <Entypo
                  name="location-pin"
                  size={30}
                  color={isInterState ? "#999" : "#27ae60"}
                />
                <Text
                  style={
                    isInterState ? styles.inactiveTabText : styles.activeTabText
                  }
                >
                  Intra-City
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={isInterState ? styles.activeTab : styles.inactiveTab}
                onPress={() => setIsInterState(true)}
              >
                <MaterialIcons
                  name="map"
                  size={30}
                  color={isInterState ? "#27ae60" : "#999"}
                />
                <Text
                  style={
                    isInterState ? styles.activeTabText : styles.inactiveTabText
                  }
                >
                  Inter-State
                </Text>
              </TouchableOpacity>
              <View style={[styles.inactiveTab, { position: "relative" }]}>
                <FontAwesome5 name="globe" size={30} color="#999" />
                <Text style={styles.inactiveTabText}>International</Text>
                {/* Coming Soon Badge */}
                <View
                  style={{
                    position: "absolute",
                    top: -8,
                    right: -16,
                    backgroundColor: "#e67e22",
                    borderRadius: 8,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontSize: 10, fontWeight: "bold" }}
                  >
                    Coming Soon
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ marginTop: 20 }}>
              {/* Item Type Dropdown */}
              <Text style={styles.label}>
                What type of item do you want to send?
              </Text>
              <View style={{ position: "relative" }}>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => setDropdownVisible((v) => !v)}
                  style={[
                    styles.input,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    },
                  ]}
                >
                  <Text style={{ color: itemType ? "#fff" : "#777" }}>
                    {itemType || "Select item type"}
                  </Text>
                  <AntDesign
                    name={dropdownVisible ? "up" : "down"}
                    size={18}
                    color="#777"
                  />
                </TouchableOpacity>
                {dropdownVisible && (
                  <View style={styles.dropdown}>
                    {itemOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setItemType(option);
                          setDropdownVisible(false);
                        }}
                      >
                        <Text style={{ color: "#fff" }}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Quantity and Insurance Section */}
            <View style={styles.rowBetween}>
              <View style={styles.column}>
                <Text style={styles.label}>Quantity</Text>
                <View style={styles.quantityRow}>
                  <TouchableOpacity
                    style={styles.minusButton}
                    onPress={() => setQuantity((q) => Math.max(0, q - 1))}
                  >
                    <AntDesign name="minus" size={20} color="#fff" />
                  </TouchableOpacity>
                  <View style={styles.quantityBox}>
                    <Text style={styles.quantityText}>{quantity}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.plusButton}
                    onPress={() => setQuantity(quantity + 1)}
                  >
                    <AntDesign name="plus" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Insure item?</Text>
                <View style={styles.insuranceRow}>
                  <Text style={styles.insuranceLabel}>No</Text>
                  <Switch
                    value={insurance}
                    onValueChange={(val) => {
                      setInsurance(val);
                      if (val) {
                        Alert.alert(
                          "Premium Insurance",
                          "Your item is now premiumly insured. This will impact your estimated cost."
                        );
                      }
                    }}
                    thumbColor="#fff"
                    trackColor={{ false: "#444", true: "#27ae60" }}
                  />
                  <Text style={styles.insuranceLabel}>Yes</Text>
                </View>
              </View>
            </View>

            {/* Image Upload Section */}
            <Text style={[styles.label, { marginTop: 20 }]}>
              Upload Image of Item
            </Text>
            <View style={styles.imageRow}>
              {[0, 1].map((idx) => (
                <View key={idx} style={{ position: "relative" }}>
                  <TouchableOpacity
                    style={[
                      styles.imageUpload,
                      images[idx] && { borderColor: "#27ae60", borderWidth: 2 },
                    ]}
                    onPress={() => handlePickImage(idx)}
                    activeOpacity={images[idx] ? 1 : 0.7}
                  >
                    {images[idx] ? (
                      <Image
                        source={{ uri: images[idx] }}
                        style={{ width: 56, height: 56, borderRadius: 6 }}
                      />
                    ) : (
                      <Text style={styles.uploadText}>+</Text>
                    )}
                  </TouchableOpacity>
                  {images[idx] && (
                    <TouchableOpacity
                      style={styles.deleteIcon}
                      onPress={() => {
                        // Remove the image from the array
                        const newImages = [...images];
                        newImages[idx] = null;
                        setImages(newImages);
                      }}
                    >
                      <AntDesign name="closecircle" size={10} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* Location Fields */}
            <View
              style={[styles.rowWithIcon, { marginTop: 16, marginBottom: 16 }]} // was 32, now 16
            >
              {/* Increased marginTop for more spacing */}
              <TouchableOpacity
                onPress={async () => {
                  if (location) {
                    const address = await getAddressFromCoords(location);
                    setSenderLocation(address);
                  } else {
                    Alert.alert(
                      "Location not available",
                      "Unable to get your current location."
                    );
                  }
                }}
                activeOpacity={0.7}
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <Ionicons name="location" size={18} color="#27ae60" />
                <Text style={styles.useLocation}>Use my location</Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginBottom: 12, position: "relative" }}>
              <TextInput
                style={styles.input}
                placeholder="Enter sender location"
                placeholderTextColor="#777"
                value={senderLocation}
                onChangeText={setSenderLocation}
              />
              {senderLocation.length > 0 && (
                <TouchableOpacity
                  style={{
                    position: "absolute",
                    right: 12,
                    top: 0,
                    bottom: 0,
                    height: "100%",
                    justifyContent: "center",
                    zIndex: 10,
                    padding: 4,
                  }}
                  onPress={() => setSenderLocation("")}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <AntDesign
                    name="closecircle"
                    size={20}
                    color="rgba(187,187,187,0.7)"
                  />
                </TouchableOpacity>
              )}
            </View>
            <View style={{ position: "relative" }}>
              <TextInput
                style={styles.input}
                placeholder="Enter receiver location"
                placeholderTextColor="#777"
                value={receiverLocation}
                onChangeText={setReceiverLocation}
              />
              {receiverLocation.length > 0 && (
                <TouchableOpacity
                  style={{
                    position: "absolute",
                    right: 12,
                    top: 0,
                    bottom: 0,
                    height: "100%",
                    justifyContent: "center",
                    zIndex: 10,
                    padding: 4,
                  }}
                  onPress={() => setReceiverLocation("")}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <AntDesign
                    name="closecircle"
                    size={20}
                    color="rgba(187,187,187,0.7)"
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Receiver Details */}
            <View style={{ marginTop: 24 }}>
              {/* was 40, now 24 */}
              {/* Divider with text */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 18,
                }}
              >
                <View style={{ flex: 1, height: 1, backgroundColor: "#333" }} />
                <Text
                  style={{
                    color: "#fff",
                    marginHorizontal: 12,
                    fontSize: 13,
                  }}
                >
                  Enter Receivers Details
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: "#333" }} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter receiver’s name"
                placeholderTextColor="#777"
                value={receiverName}
                onChangeText={setReceiverName}
              />
              <View style={{ position: "relative" }}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter receiver’s contact"
                  placeholderTextColor="#777"
                  keyboardType="phone-pad"
                  value={receiverContact}
                  onChangeText={setReceiverContact}
                />
                {/* Phone icon aligned right */}
                <TouchableOpacity
                  style={{
                    position: "absolute",
                    right: 29, // place it just before the clear icon
                    top: 0,
                    bottom: 0,
                    height: "100%",
                    justifyContent: "center",
                    zIndex: 10,
                    padding: 4,
                  }}
                  onPress={handlePickContact}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons name="phone" size={20} color="#f5f5f5" />
                </TouchableOpacity>
                {receiverContact.length > 0 && (
                  <TouchableOpacity
                    style={{
                      position: "absolute",
                      right: 12,
                      top: 0,
                      bottom: 0,
                      height: "100%",
                      justifyContent: "center",
                      zIndex: 10,
                      padding: 4,
                    }}
                    onPress={() => setReceiverContact("")}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <AntDesign
                      name="closecircle"
                      size={20}
                      color="rgba(187,187,187,0.7)"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Delivery Method Section - Conditionally Rendered */}
            {isInterState && (
              <View
                style={{
                  marginBottom: 20,
                  backgroundColor: "#23272f",
                  borderRadius: 10,
                  padding: 16,
                  marginTop: 4,
                }}
              >
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: 16,
                    marginBottom: 12,
                    color: "#fff",
                  }}
                >
                  Select Delivery Method
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  {/* Upon Arrival Button */}
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor:
                        deliveryMethod === "arrival" ? "#27ae60" : "#2c2f36",
                      padding: 12,
                      borderRadius: 8,
                      marginRight: 8,
                    }}
                    onPress={() => setDeliveryMethod("arrival")}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons
                      name="location-on"
                      size={20}
                      color={deliveryMethod === "arrival" ? "#fff" : "#aaa"}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={{
                        color: deliveryMethod === "arrival" ? "#fff" : "#ccc",
                        fontWeight: "bold",
                      }}
                    >
                      Upon arrival
                    </Text>
                  </TouchableOpacity>
                  {/* Home Delivery Button */}
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor:
                        deliveryMethod === "home" ? "#27ae60" : "#2c2f36",
                      padding: 12,
                      borderRadius: 8,
                      marginLeft: 8,
                    }}
                    onPress={() => setDeliveryMethod("home")}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons
                      name="home"
                      size={20}
                      color={deliveryMethod === "home" ? "#fff" : "#aaa"}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={{
                        color: deliveryMethod === "home" ? "#fff" : "#ccc",
                        fontWeight: "bold",
                      }}
                    >
                      Home Delivery
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.button, { marginTop: 32 }]}
              onPress={handleSubmitDeliveryRequest}
            >
              <Text style={styles.buttonText}>Find a Carrier</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent", // Make background transparent
    marginTop: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },
  backIcon: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
    padding: 8,
  },
  mapWrapper: {
    width: "100%",
    height: 250,
    backgroundColor: "#222",
  },
  map: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  formContainer: {
    padding: 20,
    backgroundColor: "#161b22",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 26,

    height: "100%",
    paddingBottom: 88, // Add padding to avoid content being cut off
  },
  routeTabs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: 20,
    marginHorizontal: 15,
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
    borderWidth: 1, // Add this line for a thin border
    borderColor: "#444", // Choose a subtle border color
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 20, // Add this line for spacing above the section
  },
  column: {
    flex: 1,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start", // keep items to the left
    gap: 8,
    width: 120, // set a width if you want more space between box and plus
  },
  quantityBox: {
    backgroundColor: "#161b22",
    borderRadius: 8,
    height: 40,
    width: 48, // reduced width for the box
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    color: "#fff",
    fontSize: 16,
  },
  plusButton: {
    width: 32, // reduced from 40
    height: 32, // reduced from 40
    backgroundColor: "#27ae60",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6, // reduced from 8
    marginLeft: "auto", // push the plus icon to the far right within the row
  },
  minusButton: {
    width: 32, // reduced from 40
    height: 32, // reduced from 40
    backgroundColor: "#e74c3c",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6, // reduced from 8
    marginRight: 8,
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
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#161b22",
    borderRadius: 8,
    marginTop: 4,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#444",
    zIndex: 1000,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  deleteIcon: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#161b22",
    borderRadius: 20,
    padding: 4,
  },
});

export default FindCarrier;
