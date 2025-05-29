import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { INTRO_SLIDES } from "@/constants/intro";
import { useColorScheme } from "@/hooks/useColorScheme";
// import { ThemedText } from "../ThemedText";
// import { ThemedView } from "../ThemedView";
import { IntroPagination } from "./IntroPagination";
import { IntroSlide } from "./IntroSlide";

export function IntroSlider() {
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const slidesRef = useRef<FlatList>(null);
  const colorScheme = useColorScheme();

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const slideSize = event.nativeEvent.layoutMeasurement.width;
      const index = event.nativeEvent.contentOffset.x / slideSize;
      const roundIndex = Math.round(index);
      setCurrentIndex(roundIndex);
    },
    []
  );

  const onGetStarted = useCallback(() => {
    // Navigate to the divider screen
    router.replace("/divider");
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        ref={slidesRef}
        data={INTRO_SLIDES}
        renderItem={({ item }) => <IntroSlide {...item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id.toString()}
      />
      <View style={styles.footer}>
        <IntroPagination total={INTRO_SLIDES.length} current={currentIndex} />
        <Pressable
          style={[styles.button, { backgroundColor: "black" }]}
          onPress={onGetStarted}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 60,
    alignItems: "center",
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
