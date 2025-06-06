import { Entypo, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

const menuItems = [
  {
    label: "My Profile",
    icon: <Ionicons name="person-circle-outline" size={20} color="#333" />,
  },
  {
    label: "Settings",
    icon: <Ionicons name="settings-outline" size={20} color="#333" />,
  },
  {
    label: "My Wallet",
    icon: <Ionicons name="wallet-outline" size={20} color="#333" />,
  },
  {
    label: "Transaction History",
    icon: <Ionicons name="time-outline" size={20} color="#333" />,
  },
  {
    label: "Track Items",
    icon: <Ionicons name="location-outline" size={20} color="#333" />,
  },
  {
    label: "Digital Token",
    icon: (
      <MaterialCommunityIcons name="hand-coin-outline" size={20} color="#333" />
    ),
  },
  {
    label: "Messages",
    icon: <Ionicons name="mail-outline" size={20} color="#333" />,
  },
  {
    label: "My referrals",
    icon: <Ionicons name="person-add-outline" size={20} color="#333" />,
  },
  {
    label: "FAQ",
    icon: <Ionicons name="help-circle-outline" size={20} color="#333" />,
  },
  {
    label: "Support",
    icon: <Entypo name="chat" size={20} color="#333" />,
  },
  {
    label: "Logout",
    icon: <Ionicons name="log-out-outline" size={20} color="#333" />,
  },
];

const More = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userShortCode, setUserShortCode] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      // Generate a short code from user_id (last 5 chars, uppercase, fallback to '00000')
      const shortCode = user.id ? user.id.slice(-5).toUpperCase() : "00000";
      setUserShortCode(shortCode);
      const { data } = await supabase
        .from("sender_profile")
        .select("profile_image_url, first_name")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setProfileImage(data.profile_image_url || null);
        setFirstName(data.first_name || null);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#0B4D1C"]}
          tintColor="#0B4D1C"
        />
      }
    >
      {/* User Header */}
      <View style={styles.header}>
        <Image
          source={
            profileImage
              ? { uri: profileImage }
              : { uri: "https://via.placeholder.com/60" }
          }
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.greeting}>
            Hello,{" "}
            {firstName && firstName.trim().length > 0 ? firstName : "User"}
          </Text>

          <Text style={styles.userId}>
            User ID: {userShortCode ? userShortCode : "-----"}
          </Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="qr-code" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Menu List */}
      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>My Account</Text>

        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={async () => {
              if (item.label === "My Profile") {
                router.push("/MoreTab/SenderProfile");
              } else if (item.label === "Logout") {
                await supabase.auth.signOut();
                router.replace("/SenderLogin");
              }
              // Add more navigation logic for other menu items if needed
            }}
          >
            <View style={styles.menuLeft}>
              {item.icon}
              <Text style={styles.menuText}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}

        {/* Switch Button */}
        <TouchableOpacity style={styles.switchButton}>
          <Text style={styles.switchText}>Switch to Carrier</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F6F6", // changed from #FAFAFA to a softer off-white
  },
  header: {
    backgroundColor: "#103928",
    padding: 20,
    paddingTop: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderColor: "#fff",
    borderWidth: 1.5,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  greeting: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  phone: {
    color: "#D0FFD1",
    fontSize: 13,
    marginTop: 2,
  },
  userId: {
    fontSize: 12,
    color: "#A2F0B2",
    marginTop: 2,
  },
  rewards: {
    fontSize: 12,
    color: "#FFDA6A",
    marginTop: 2,
  },
  menuContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderColor: "#eee",
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuText: {
    fontSize: 15,
    color: "#333",
  },
  switchButton: {
    backgroundColor: "#1ABC9C",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 30,
    alignItems: "center",
  },
  switchText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  versionText: {
    textAlign: "center",
    marginTop: 20,
    color: "#aaa",
    fontSize: 12,
  },
});

export default More;
