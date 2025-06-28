import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Clipboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

export default function SenderPayment() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"providus" | "sterling">(
    "providus"
  );
  const [showComing, setShowComing] = useState(false);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const fetchUserName = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("sender_profile")
          .select("first_name, last_name")
          .eq("user_id", user.id)
          .single();
        if (data) {
          setUserName(
            `${data.first_name || ""} ${data.last_name || ""}`.trim()
          );
        }
      }
    };
    fetchUserName();
  }, []);

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert("Copied to clipboard", text);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/wallet/SenderAddFunds")}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Fund Wallet</Text>
        <View style={styles.currency}>
          <Text style={styles.flag}>🇳🇬</Text>
          <Text style={styles.currencyText}>NGN</Text>
        </View>
      </View>

      {/* Move tabContainer down with extra marginTop */}
      <View style={[styles.tabContainer, { marginTop: 32 }]}>
        <TouchableOpacity
          style={[
            styles.inactiveTab,
            activeTab === "providus" && { backgroundColor: "#000" },
          ]}
          onPress={() => {
            setActiveTab("providus");
            setShowComing(false);
          }}
        >
          <Text
            style={[
              styles.tabTextInactive,
              activeTab === "providus" && { color: "#fff" },
            ]}
          >
            Providus
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.inactiveTab,
            activeTab === "sterling" && { backgroundColor: "#000" },
          ]}
          onPress={() => {
            setActiveTab("sterling");
            setShowComing(true);
          }}
        >
          <Text
            style={[
              styles.tabTextInactive,
              activeTab === "sterling" && { color: "#fff" },
            ]}
          >
            Sterling
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        {showComing ? (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              height: 100,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                color: "#888",
                fontWeight: "bold",
              }}
            >
              Coming Soon
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Account Holder</Text>
              <View style={styles.row}>
                <Text style={styles.value}>{userName || "Account Holder"}</Text>
                <TouchableOpacity
                  onPress={() => copyToClipboard(userName || "Account Holder")}
                >
                  <Ionicons name="copy-outline" size={20} color="#0B4D1C" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Account number:</Text>
              <View style={styles.row}>
                <Text style={styles.value}>9463621319</Text>
                <TouchableOpacity onPress={() => copyToClipboard("9463621319")}>
                  <Ionicons name="copy-outline" size={20} color="#0B4D1C" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Bank name:</Text>
              <View style={styles.row}>
                <Text style={styles.value}>Providus Bank</Text>
                <TouchableOpacity
                  onPress={() => copyToClipboard("Providus Bank PLC")}
                >
                  <Ionicons name="copy-outline" size={20} color="#0B4D1C" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>
      <TouchableOpacity
        style={[
          styles.shareButton,
          {
            marginTop: 24,
            alignSelf: "center",
            flexDirection: "row",
            alignItems: "center",
          },
        ]}
      >
        <Ionicons
          name="share-social-outline"
          size={20}
          color="#fff"
          style={{ marginRight: 6 }}
        />
        <Text style={styles.shareText}>Share Details</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FAFAFA",
  },
  title: {
    fontSize: 20,
    fontWeight: "medium",
    marginBottom: 6,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
    marginTop: 22, // add more top margin
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

  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  shareButton: {
    backgroundColor: "#0B4D1C",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 10,
  },
  shareText: {
    color: "white",
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#eee",
  },
  activeTab: {
    flex: 1,
    backgroundColor: "black",
    padding: 12,
    alignItems: "center",
  },
  inactiveTab: {
    flex: 1,
    padding: 12,
    alignItems: "center",
  },
  tabText: {
    fontWeight: "600",
    color: "white",
  },
  tabTextInactive: {
    fontWeight: "500",
    color: "#999",
  },
  infoBox: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  copyIcon: {
    fontSize: 18,
  },
});
