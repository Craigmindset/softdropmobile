import { useFonts } from "expo-font";
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-get-random-values";
import "react-native-reanimated";
import "react-native-url-polyfill/auto";

import { useColorScheme } from "@/hooks/useColorScheme";
import { useFirstLaunch } from "@/hooks/useFirstLaunch";
import { OnlineStatusProvider } from "./OnlineStatusContext";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isFirstLaunch = useFirstLaunch();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded || isFirstLaunch === null) {
    // Wait for font loading and first launch check
    return null;
  }

  if (isFirstLaunch) {
    return <Redirect href="/intro" />;
  }

  return (
    <OnlineStatusProvider>
      <>
        <Stack>
          <Stack.Screen name="intro" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="(CarriersTabs)"
            options={{
              headerShown: false,
              headerStyle: { backgroundColor: "green" },
              headerTintColor: "#fff", // optional: makes the header text/icons white
              title: "", // optional: removes the folder name/title text
            }}
          />
          <Stack.Screen name="Navigation" options={{ headerShown: false }} />
          <Stack.Screen name="CarrierHome" options={{ headerShown: false }} />
          <Stack.Screen name="SenderLogin" options={{ headerShown: false }} />
          <Stack.Screen name="Home" options={{ headerShown: false }} />
          <Stack.Screen name="FindCarrier" options={{ headerShown: false }} />
          <Stack.Screen name="CarrierLogin" options={{ headerShown: false }} />
          <Stack.Screen name="SelectCarrier" options={{ headerShown: false }} />
          <Stack.Screen name="PeerCarrier" options={{ headerShown: false }} />
          <Stack.Screen name="CarrierAuth" options={{ headerShown: false }} />
          <Stack.Screen
            name="MoreTab/SenderProfile"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CarrierAuth/CarrierDetails"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SenderAuth/CreatePassword"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SenderAuth/Success"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SenderAuth/Verification"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SenderAuth/SenderSignup"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CarrierAuth/CreatePassword"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CarrierAuth/Success"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CarrierAuth/Verification"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CarrierAuth/CarrierSignup"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="CarrierLocation"
            options={{ headerShown: false }}
          />
        </Stack>
        <StatusBar
          style="dark"
          backgroundColor="transparent"
          translucent={true}
        />
      </>
    </OnlineStatusProvider>
  );
}
