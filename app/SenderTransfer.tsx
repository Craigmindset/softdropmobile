import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  FlatList,
  Keyboard,
  Modal,
  Image as RNImage,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const recentTransfers = [
  {
    id: "1",
    name: "KAYODE ADEWALE",
    account: "0056230021",
    bank: "Sterling Bank",
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/1e/Sterling_Bank_logo.png",
  },
  {
    id: "2",
    name: "SOLOMON ESANG",
    account: "1458517001",
    bank: "Access Bank",
    logo: "https://seeklogo.com/images/A/access-bank-plc-logo-9E58A9CA71-seeklogo.com.png",
  },
  {
    id: "3",
    name: "OBAFEMI TUNDE JACKSON",
    account: "2045692650",
    bank: "First Bank",
    logo: "https://upload.wikimedia.org/wikipedia/en/3/35/First_Bank_of_Nigeria_logo.png",
  },
];

const bankLogos: { [key: string]: any } = {
  "Sterling Bank": require("../assets/images/bank_logo/sterlingbank.png"),
  "Access Bank": require("../assets/images/bank_logo/accessbank.png"),
  "First Bank": require("../assets/images/bank_logo/firstbank.png"),
  GTbank: require("../assets/images/bank_logo/gtbank.png"),
  "Providus Bank": require("../assets/images/bank_logo/providusbank.png"),
};

// Nigerian banks list (sample, add more as needed)
const banksList = [
  "Access Bank",
  "First Bank",
  "GTBank",
  "Sterling Bank",
  "Providus Bank",
  "Zenith Bank",
  "UBA",
  "Fidelity Bank",
  "Union Bank",
  "Wema Bank",
  "Polaris Bank",
  "Keystone Bank",
  "Unity Bank",
  "Stanbic IBTC Bank",
  "Ecobank",
  "Heritage Bank",
  // ...add all banks
];

export default function SenderTransfer() {
  const [accountNumber, setAccountNumber] = useState("");
  const [bank, setBank] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [bankQuery, setBankQuery] = useState("");
  const [showBack, setShowBack] = useState(false);
  const [checkingVisit, setCheckingVisit] = useState(true);

  // Check if it's the first visit
  useEffect(() => {
    (async () => {
      const visited = await AsyncStorage.getItem("senderTransferVisited");
      if (!visited) {
        setShowBack(false);
        await AsyncStorage.setItem("senderTransferVisited", "1");
      } else {
        setShowBack(true);
      }
      setCheckingVisit(false);
    })();
  }, []);

  // Filter banks for autocomplete
  const filteredBanks = banksList.filter((b) =>
    b.toLowerCase().includes(bankQuery.toLowerCase())
  );

  return (
    <>
      <StatusBar style="dark" backgroundColor="#f9fdfc" />
      <FlatList
        style={styles.container}
        data={recentTransfers}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <View style={styles.card}>
              <Text style={styles.label}>Recipient Account</Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  placeholder="Enter 10 digit Account Number"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  style={styles.input}
                  value={accountNumber}
                  maxLength={10}
                  onChangeText={(text) => {
                    // Only allow numeric and max 10 digits
                    const cleaned = text.replace(/[^0-9]/g, "").slice(0, 10);
                    setAccountNumber(cleaned);
                  }}
                />
                {accountNumber.length > 0 && (
                  <TouchableOpacity
                    style={{
                      position: "absolute",
                      right: 15,
                      top: 15,
                    }}
                    onPress={() => {
                      setAccountNumber("");
                      setBank("");
                      setRecipientName("");
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={22} color="#bbb" />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.selectBank}
                onPress={() => setBankModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.bankText}>
                  {bank ? bank : "Select or Type Bank"}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>

              <View style={styles.nameField}>
                <Text style={styles.recipientName}>{recipientName}</Text>
              </View>

              <TouchableOpacity style={styles.nextButton}>
                <Text style={styles.nextText}>Next</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity>
              <Text style={styles.seeBeneficiaries}>See Beneficiaries</Text>
            </TouchableOpacity>

            <Text style={styles.recentTitle}>Recent Transfers</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.transferItem}>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.details}>
                {item.account} · {item.bank}
              </Text>
            </View>
            <RNImage
              source={bankLogos[item.bank] || bankLogos["Sterling Bank"]}
              style={styles.bankLogo}
              resizeMode="contain"
            />
          </View>
        )}
      />

      {/* Bank selection modal with autocomplete */}
      <Modal
        visible={bankModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBankModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.2)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 20,
                width: 320,
                maxHeight: 400,
              }}
            >
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: 16,
                  marginBottom: 10,
                }}
              >
                Select or Type Bank
              </Text>
              <TextInput
                placeholder="Type bank name"
                value={bankQuery}
                onChangeText={setBankQuery}
                style={{
                  borderWidth: 1,
                  borderColor: "#eee",
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 10,
                }}
                autoFocus
              />
              <ScrollView keyboardShouldPersistTaps="handled">
                {filteredBanks.length === 0 && bankQuery.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => {
                      setBank(bankQuery);
                      setBankModalVisible(false);
                      setBankQuery("");
                    }}
                    style={{ paddingVertical: 10 }}
                  >
                    <Text style={{ color: "#00b288" }}>Use "{bankQuery}"</Text>
                  </TouchableOpacity>
                ) : (
                  filteredBanks.map((b, idx) => (
                    <TouchableOpacity
                      key={b + idx}
                      onPress={() => {
                        setBank(b);
                        setBankModalVisible(false);
                        setBankQuery("");
                      }}
                      style={{ paddingVertical: 10 }}
                    >
                      <Text>{b}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
              <TouchableOpacity
                onPress={() => setBankModalVisible(false)}
                style={{ marginTop: 10, alignSelf: "flex-end" }}
              >
                <Text style={{ color: "#B00020" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Back Button (conditionally rendered) */}
      {!checkingVisit && showBack && (
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 50,
            left: 20,
            zIndex: 100,
            backgroundColor: "#fff",
            borderRadius: 20,
            padding: 8,
            elevation: 2,
          }}
          activeOpacity={0.7}
          onPress={() => {
            // You can use navigation.goBack() or router.back() if using a router
            // For now, just a placeholder
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#0B4D1C" />
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 50,
    backgroundColor: "#f9fdfc",
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#e8f6f2",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
    marginBottom: 15,
  },
  selectBank: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    height: 45,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  bankText: {
    color: "#444",
  },
  nameField: {
    height: 40,
    justifyContent: "center",
    paddingLeft: 5,
    marginBottom: 20,
  },
  recipientName: {
    fontSize: 16,
    color: "#666",
  },
  nextButton: {
    backgroundColor: "#00b288",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  nextText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  seeBeneficiaries: {
    color: "#00b288",
    fontWeight: "500",
    marginBottom: 10,
    marginLeft: 5,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "400",
    marginBottom: 10,
  },
  transferItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  name: {
    fontWeight: "400",
    fontSize: 15,
  },
  details: {
    color: "#777",
    fontSize: 13,
  },
  bankLogo: {
    width: 30,
    height: 30,
    borderRadius: 4,
  },
});
