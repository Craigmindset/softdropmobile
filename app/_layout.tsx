import { useFonts } from "expo-font";
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { useFirstLaunch } from "@/hooks/useFirstLaunch";

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
    <>
      <Stack>
        <Stack.Screen name="intro" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="SenderLogin" options={{ headerShown: false }} />
        <Stack.Screen name="Home" options={{ headerShown: false }} />
        <Stack.Screen name="FindCarrier" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="dark" backgroundColor="#000" translucent={true} />
    </>
  );
}
