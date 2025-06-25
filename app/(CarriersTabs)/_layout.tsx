import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Dimensions, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { useColorScheme } from "@/hooks/useColorScheme";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as NavigationBar from "expo-navigation-bar";
import { useRouter } from "expo-router";

export default function CarriersTabs() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = Dimensions.get("window");

  // Dynamic tab bar height: base + safe area inset, responsive to device
  const BASE_TAB_BAR_HEIGHT = 59;
  const tabBarHeight = BASE_TAB_BAR_HEIGHT + insets.bottom;

  useEffect(() => {
    // Always set nav bar to dark color and light icons, regardless of system theme
    NavigationBar.setBackgroundColorAsync("#07251D");
    NavigationBar.setButtonStyleAsync("light");
  }, []);

  // Single session enforcement: check session_id on mount and periodically
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const checkSession = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      const localSessionId = await AsyncStorage.getItem("session_id");
      const { data } = await supabase
        .from("users")
        .select("session_id")
        .eq("id", user.id)
        .single();
      if (data && data.session_id && data.session_id !== localSessionId) {
        // Session mismatch: force logout
        await supabase.auth.signOut();
        await AsyncStorage.removeItem("session_id");
        router.replace("/SenderLogin"); // or your login route
      }
    };
    checkSession();
    interval = setInterval(checkSession, 10000); // check every 10s
    return () => clearInterval(interval);
  }, [router]);

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" style="light" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#fff", // <-- set active tab icon/text color to white
          tabBarInactiveTintColor: "rgba(180, 169, 169, 0.62)", // <-- add this line for faded inactive icons
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: {
            backgroundColor: "#07251D", // <-- set your custom color here
            paddingTop: 2,
            paddingBottom: insets.bottom || 8,
            height: tabBarHeight, // increase tab bar height for more space
            ...Platform.select({
              ios: {
                // Use a transparent background on iOS to show the blur effect
                position: "absolute",
                bottom: 0, // move tab bar up from the bottom
                left: 0,
                right: 0,
              },
              android: {
                position: "absolute",
                bottom: 0, // move tab bar up from the bottom
                left: 0,
                right: 0,
                // add some bottom padding for spacing
              },
              default: {},
            }),
          },
        }}
      >
        <Tabs.Screen
          name="CarrierHome"
          options={{
            title: "Home",
            tabBarIcon: ({ color }: { color: string }) => (
              <MaterialIcons name="home" size={25} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="MyTrip"
          options={{
            title: "My Trip",
            tabBarIcon: ({ color }: { color: string }) => (
              <MaterialIcons name="wallet" size={25} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="Wallet"
          options={{
            title: "Wallet",
            tabBarIcon: ({ color }: { color: string }) => (
              <MaterialIcons name="history" size={25} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="More"
          options={{
            title: "More",
            tabBarIcon: ({ color }: { color: string }) => (
              <MaterialIcons name="more-vert" size={25} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
