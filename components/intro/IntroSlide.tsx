import { Image } from "expo-image";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";

interface IntroSlideProps {
  title: string;
  description: string;
  image: any;
}

export function IntroSlide({ title, description, image }: IntroSlideProps) {
  const { width } = useWindowDimensions();

  return (
    <View style={[styles.slide, { width }]}>
      <Image source={image} style={styles.image} contentFit="contain" />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "white",
  },
  image: {
    width: 350,
    height: 350,
    marginBottom: 60,
  },
  content: {
    alignItems: "center",
    gap: 22,
  },
  title: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 6,
    fontWeight: "400",
  },
  description: {
    textAlign: "center",
    fontSize: 16,
    paddingHorizontal: 20,
    marginBottom: 80,
  },
});
