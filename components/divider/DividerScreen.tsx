import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function DividerScreen() {
  const colorScheme = useColorScheme();

  const handleOptionPress = (option: string) => {
    // TODO: Implement navigation based on selected option
    console.log("Selected option:", option);
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/intro-slide-4.jpg")}
        style={styles.image}
      />
      <Text style={styles.title}>What would you like to do today?</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => handleOptionPress("send")}
      >
        <Text style={styles.buttonText}>Wanna send a parcel?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => handleOptionPress("carrier")}
      >
        <Text style={styles.buttonText}>Become a Carrier</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => handleOptionPress("receive")}
      >
        <Text style={styles.buttonText}>Receive a Parcel</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        softdrop logistics | Insured by{" "}
        <Text style={styles.highlight}>Insurance Company</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: 300,
    height: 300,
    marginBottom: 32,
    resizeMode: "contain",
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 40,
    textAlign: "center",
  },
  button: {
    width: "100%",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#D3D3D3",

    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    fontSize: 12,
    textAlign: "center",
  },
  highlight: {
    color: Colors.light.tint,
  },
});
