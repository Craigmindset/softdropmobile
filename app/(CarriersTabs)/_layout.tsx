import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function CarriersTabs() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#fff", // <-- set active tab icon/text color to white
        tabBarInactiveTintColor: "rgba(180, 169, 169, 0.62)", // <-- add this line for faded inactive icons
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          backgroundColor: "#07251D", // <-- set your custom color here
          paddingTop: 10,
          ...Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: "absolute",
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
          title: "MyTrip",
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
            <MaterialIcons name="wallet" size={25} color={color} />
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
  );
}
