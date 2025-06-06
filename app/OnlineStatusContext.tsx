import * as Location from "expo-location";
import React, { createContext, useContext, useState } from "react";
import { supabase } from "../lib/supabase";

type OnlineStatusContextType = {
  isOnline: boolean;
  setIsOnline: React.Dispatch<React.SetStateAction<boolean>>;
};

const OnlineStatusContext = createContext<OnlineStatusContextType | undefined>(
  undefined
);

export const OnlineStatusProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOnline, setIsOnline] = useState(false); // Set default to offline

  // Realtime location update when online
  React.useEffect(() => {
    let locationInterval: ReturnType<typeof setInterval> | null = null;
    let userId: string | null = null;

    const startLocationUpdates = async () => {
      // Get user id from supabase session
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user?.id) return;
      userId = data.user.id;
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      // Start interval
      locationInterval = setInterval(async () => {
        const loc = await Location.getCurrentPositionAsync({});
        if (!loc?.coords) return;
        // Reverse geocode to get LGA (subregion) and state (region)
        let lga = null;
        let state = null;
        try {
          const geo = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          if (geo && geo.length > 0) {
            lga = geo[0].subregion || null;
            state = geo[0].region || null;
          }
        } catch (e) {
          console.log("Reverse geocoding failed:", e);
        }
        // Upsert location to carrier_locations table with LGA and state
        try {
          const { error } = await supabase.from("carrier_locations").upsert({
            user_id: userId,
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            lga: lga,
            state: state,
            updated_at: new Date().toISOString(),
          });
          if (error) {
            console.log("Supabase upsert error:", error);
          } else {
            console.log("Location upserted successfully");
          }
        } catch (err) {
          console.log("Unexpected error during upsert:", err);
        }
      }, 10000); // Update every 10 seconds
    };

    const stopLocationUpdates = () => {
      if (locationInterval) clearInterval(locationInterval);
      locationInterval = null;
    };

    if (isOnline) {
      startLocationUpdates();
    } else {
      stopLocationUpdates();
    }
    return () => stopLocationUpdates();
  }, [isOnline]);

  return (
    <OnlineStatusContext.Provider value={{ isOnline, setIsOnline }}>
      {children}
    </OnlineStatusContext.Provider>
  );
};

export const useOnlineStatus = () => {
  const context = useContext(OnlineStatusContext);
  if (!context)
    throw new Error("useOnlineStatus must be used within OnlineStatusProvider");
  return context;
};

export default OnlineStatusProvider;
