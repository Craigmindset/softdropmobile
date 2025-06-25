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

// Add onDone prop
export function IntroSlider({ onDone }: { onDone?: () => void }) {
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

  // Call onDone if provided, otherwise fallback to router.replace
  const onGetStarted = useCallback(() => {
    if (onDone) {
      onDone();
    } else {
      router.replace("/divider");
    }
  }, [onDone]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={slidesRef}
        data={INTRO_SLIDES}
        renderItem={({ item }) => <IntroSlide {...item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        onScroll={onScroll}
        scrollEventThrottle={16}
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
