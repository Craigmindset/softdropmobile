import * as Location from "expo-location";
import React, { createContext, useContext, useState } from "react";
import { supabase } from "../lib/supabase";

const OnlineStatusContext = createContext({
  isOnline: false,
  setIsOnline: (online: boolean) => {},
});

export const OnlineStatusProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isOnline, setIsOnlineState] = useState(false);

  const setIsOnline = async (online: boolean) => {
    setIsOnlineState(online);
    // Update DB
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      let updateData: any = { is_online: online };
      if (online) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({});
          updateData.latitude = location.coords.latitude;
          updateData.longitude = location.coords.longitude;
        }
      }
      await supabase
        .from("carrier_profile")
        .update(updateData)
        .eq("user_id", user.id);
    }
  };

  return (
    <OnlineStatusContext.Provider value={{ isOnline, setIsOnline }}>
      {children}
    </OnlineStatusContext.Provider>
  );
};

export const useOnlineStatus = () => useContext(OnlineStatusContext);
