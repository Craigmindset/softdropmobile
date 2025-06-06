import { AntDesign } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { GOOGLE_MAPS_APIKEY } from "../constants/Keys"; // You must create this file and add your API key

const Navigation = () => {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [region, setRegion] = useState(undefined);
  const [routeCoords, setRouteCoords] = useState(
    [] as { latitude: number; longitude: number }[]
  );
  const [userLocation, setUserLocation] = useState<
    { latitude: number; longitude: number } | undefined
  >(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const mapRef = useRef<MapView>(null);

  // Get user location on mount
  React.useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  // Handle destination input and fetch route
  const handleDestination = async () => {
    if (!destination || !userLocation) return;
    setLoading(true);
    setError("");
    Keyboard.dismiss();
    try {
      // Geocode destination
      const geoRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          destination
        )}&key=${GOOGLE_MAPS_APIKEY}`
      );
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        setError("Destination not found.");
        setLoading(false);
        return;
      }
      const destLoc = geoData.results[0].geometry.location;
      // Get directions
      const dirRes = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${userLocation.latitude},${userLocation.longitude}&destination=${destLoc.lat},${destLoc.lng}&key=${GOOGLE_MAPS_APIKEY}`
      );
      const dirData = await dirRes.json();
      if (!dirData.routes || dirData.routes.length === 0) {
        setError("No route found.");
        setLoading(false);
        return;
      }
      const points = decodePolyline(dirData.routes[0].overview_polyline.points);
      setRouteCoords(points);
      setLoading(false);
      // Center map
      if (mapRef.current) {
        mapRef.current.fitToCoordinates(points, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    } catch (e) {
      setError("Failed to fetch route.");
      setLoading(false);
    }
  };

  // Polyline decoder
  function decodePolyline(encoded) {
    let points = [];
    let index = 0,
      len = encoded.length;
    let lat = 0,
      lng = 0;
    while (index < len) {
      let b,
        shift = 0,
        result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;
      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" backgroundColor="#fff" />
      {/* Back Icon */}
      <View
        style={{
          position: "absolute",
          top: 40,
          left: 20,
          zIndex: 100,
        }}
      >
        <AntDesign
          name="arrowleft"
          size={28}
          color="#333"
          onPress={() => router.back()}
        />
      </View>
      <TextInput
        style={[styles.input, { marginTop: 100 }]}
        placeholder="Enter destination address"
        value={destination}
        onChangeText={setDestination}
        onSubmitEditing={handleDestination}
        returnKeyType="go"
      />
      <View style={{ alignItems: "center", marginBottom: 12 }}>
        <View style={styles.enterButtonWrapper}>
          <AntDesign.Button
            name="arrowright"
            backgroundColor="#2ecc71"
            color="#fff"
            size={22}
            borderRadius={20}
            onPress={handleDestination}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : "Enter"}
          </AntDesign.Button>
        </View>
        {error ? (
          <Text style={{ color: "red", marginTop: 8 }}>{error}</Text>
        ) : null}
      </View>
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          region={region}
          showsUserLocation={true}
        >
          {userLocation && <Marker coordinate={userLocation} title="You" />}
          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeWidth={4}
              strokeColor="#2ecc71"
            />
          )}
        </MapView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#fff",
    zIndex: 10,
  },
  enterButtonWrapper: {
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
});

export default Navigation;
