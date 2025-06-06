import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { useColorScheme } from "@/hooks/useColorScheme";
import * as NavigationBar from "expo-navigation-bar";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Always set nav bar to dark color and light icons, regardless of system theme
    NavigationBar.setBackgroundColorAsync("#07251D");
    NavigationBar.setButtonStyleAsync("light");
  }, []);

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
            paddingBottom: 15, // add some bottom padding for spacing
            height: 99, // increase tab bar height for more space
            ...Platform.select({
              ios: {
                // Use a transparent background on iOS to show the blur effect
                position: "absolute",
                bottom: 16, // move tab bar up from the bottom
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
          name="Home"
          options={{
            title: "Home",
            tabBarIcon: ({ color }: { color: string }) => (
              <MaterialIcons name="home" size={25} color={color} />
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
          name="Transaction"
          options={{
            title: "Transactions",
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
