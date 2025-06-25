console.warn = () => {};

import { IntroSlider } from "@/components/intro/IntroSlider";
import { ThemedView } from "@/components/ThemedView";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";

export default function IntroScreen() {
  const [showIntro, setShowIntro] = useState(false);
  const [checked, setChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const seen = await AsyncStorage.getItem("introSeen");
      setShowIntro(!seen);
      setChecked(true);
    })();
  }, []);

  useEffect(() => {
    if (checked && !showIntro) {
      router.replace("/divider");
    }
  }, [checked, showIntro, router]);

  if (!checked) return null; // Wait for AsyncStorage check

  if (showIntro) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <IntroSlider
          onDone={async () => {
            await AsyncStorage.setItem("introSeen", "true");
            setShowIntro(false);
          }}
        />
      </ThemedView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
});
