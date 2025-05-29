import { StyleSheet, View } from "react-native";

import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface IntroPaginationProps {
  total: number;
  current: number;
}

export function IntroPagination({ total, current }: IntroPaginationProps) {
  const colorScheme = useColorScheme();
  // Using a dark color for the active dot
  const activeColor = "#333333"; // Dark gray color
  const inactiveColor = Colors[colorScheme ?? "light"].tabIconDefault;
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: index === current ? activeColor : inactiveColor,
              width: index === current ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 8,
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#000",
  },
});
