import { DividerScreen } from "@/components/divider/DividerScreen";
import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function DividerRoute() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <DividerScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
