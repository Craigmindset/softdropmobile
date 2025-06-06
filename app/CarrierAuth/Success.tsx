import { useLocalSearchParams, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useRef } from "react";
import { StyleSheet, Text, View } from "react-native";

const Success = () => {
  const router = useRouter();
  const { phone, display_name } = useLocalSearchParams();
  const phoneNumber =
    typeof phone === "string"
      ? phone
      : Array.isArray(phone) && phone.length > 0
      ? phone[0]
      : undefined;
  const displayName =
    typeof display_name === "string" ? display_name : "Carrier";

  const animationRef = useRef<LottieView>(null);

  const handleAnimationFinish = () => {
    // If phoneNumber is missing, show an error or fallback
    if (!phoneNumber) {
      alert("Missing phone number. Please restart signup.");
      return;
    }
    router.replace({
      pathname: "/CarrierAuth/CarrierDetails",
      params: { phone: phoneNumber, display_name: displayName },
    });
  };

  return (
    <View style={styles.container}>
      <LottieView
        ref={animationRef}
        source={require("../../assets/images/Animation - 1748794352462.json")}
        autoPlay
        loop={false}
        style={{ width: 180, height: 180 }}
        onAnimationFinish={handleAnimationFinish}
      />
      <Text style={styles.successText}>Successful</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  successText: {
    marginTop: 24,
    fontSize: 22,
    fontWeight: "bold",
    color: "#0B4D1C",
    textAlign: "center",
  },
});

export default Success;
