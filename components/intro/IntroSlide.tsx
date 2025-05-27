import { Image } from "expo-image";
import { StyleSheet, useWindowDimensions } from "react-native";

import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";

interface IntroSlideProps {
  title: string;
  description: string;
  image: any;
}

export function IntroSlide({ title, description, image }: IntroSlideProps) {
  const { width } = useWindowDimensions();

  return (
    <ThemedView style={[styles.slide, { width }]}>
      <Image source={image} style={styles.image} contentFit="contain" />
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText style={styles.description}>{description}</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  image: {
    width: 350,
    height: 350,
    marginBottom: 50,
  },
  content: {
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 24,
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    fontSize: 16,
    paddingHorizontal: 20,
  },
});
