import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddFunds() {
  const router = useRouter();

  return (
    <>
      <StatusBar style="dark" backgroundColor="#fff" translucent={false} />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace("/(CarriersTabs)/CarrierHome")}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Add Funds</Text>
          <View style={styles.currency}>
            <Text style={styles.flag}>🇳🇬</Text>
            <Text style={styles.currencyText}>NGN</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.option}
          onPress={() => router.push("/wallet/Payment")}
        >
          <MaterialIcons name="account-balance" size={24} color="#0B4D1C" />
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Add via bank transfer</Text>
            <Text style={styles.optionSub}>
              Fund your wallet using bank transfer
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Feather name="credit-card" size={24} color="#0B4D1C" />
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Add via debit card</Text>
            <Text style={styles.optionSub}>
              Top up your wallet using a debit card
            </Text>
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
    marginTop: 22, // add more top margin
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  currency: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  flag: {
    fontSize: 16,
    marginRight: 4,
  },
  currencyText: {
    fontWeight: "600",
    marginRight: 4,
  },
  option: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  optionText: {
    marginLeft: 12,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  optionSub: {
    fontSize: 14,
    color: "#888",
  },
});
