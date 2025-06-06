import { IntroSlider } from "@/components/intro/IntroSlider";
import { ThemedView } from "@/components/ThemedView";
import { Stack } from "expo-router";
import { StyleSheet } from "react-native";

export default function IntroScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <IntroSlider />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
});
