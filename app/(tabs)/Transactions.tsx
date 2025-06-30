import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Transaction = {
  id: string;
  type: string;
  date: string;
  amount: string;
};

const transactions: Transaction[] = [
  { id: "1", type: "Card deposit", date: "23 June, 2025", amount: "-$8.02" },
  { id: "2", type: "NGN to USD", date: "23 June, 2025", amount: "₦13,000.00" },
  {
    id: "3",
    type: "CRAIG OSAMUYI IREDIA",
    date: "23 June, 2025",
    amount: "+₦13,000.00",
  },
  { id: "4", type: "Card deposit", date: "17 June, 2025", amount: "-$6.00" },
  { id: "5", type: "Card deposit", date: "14 June, 2025", amount: "-$6.42" },
  { id: "6", type: "NGN to USD", date: "14 June, 2025", amount: "₦20,000.00" },
  {
    id: "7",
    type: "Escrow Payment",
    date: "13 June, 2025",
    amount: "-₦2,000.00",
  },
  {
    id: "8",
    type: "Reward Bonus",
    date: "12 June, 2025",
    amount: "+₦1,000.00",
  },
  {
    id: "9",
    type: "Transfer to UBA",
    date: "11 June, 2025",
    amount: "-₦5,500.00",
  },
  {
    id: "10",
    type: "Transfer from GTBank",
    date: "10 June, 2025",
    amount: "+₦8,000.00",
  },
  { id: "11", type: "Card deposit", date: "09 June, 2025", amount: "-$7.00" },
  { id: "12", type: "NGN to USD", date: "08 June, 2025", amount: "₦15,000.00" },
  {
    id: "13",
    type: "Escrow Payment",
    date: "07 June, 2025",
    amount: "-₦1,200.00",
  },
  {
    id: "14",
    type: "Reward Bonus",
    date: "06 June, 2025",
    amount: "+₦2,000.00",
  },
  {
    id: "15",
    type: "Transfer to Zenith",
    date: "05 June, 2025",
    amount: "-₦3,000.00",
  },
  {
    id: "16",
    type: "Transfer from Access",
    date: "04 June, 2025",
    amount: "+₦4,500.00",
  },
];

export default function Transactions() {
  const renderItem = ({ item }: { item: Transaction }) => (
    <View style={styles.item}>
      <View style={styles.iconPlaceholder}>
        <Ionicons name="swap-horizontal" size={20} color="#3FC380" />
      </View>
      <View style={styles.textContent}>
        <Text style={styles.title}>{item.type}</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
      <Text style={styles.amount}>{item.amount}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#fff" />
      <Text style={styles.header}>Transactions</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 20 }}
        contentContainerStyle={{ alignItems: "center", minHeight: 36 }} // ensure enough height for chips
      >
        {/* Filter Chips */}
        <TouchableOpacity
          style={{
            paddingTop: 6,
            paddingBottom: 12, // increased bottom padding
            paddingHorizontal: 16,
            backgroundColor: "#e6fff2",
            borderRadius: 16,
            marginRight: 8,
          }}
        >
          <Text style={{ color: "#00b288", fontWeight: "600" }}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            paddingTop: 6,
            paddingBottom: 12,
            paddingHorizontal: 16,
            backgroundColor: "#e6f0ff", // light blue background
            borderRadius: 16,
            marginRight: 8,
          }}
        >
          <Text style={{ color: "#444" }}>Deposits</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            paddingTop: 6,
            paddingBottom: 12,
            paddingHorizontal: 22,
            backgroundColor: "#f8f3ff", // lighter purple background
            borderRadius: 16,
            marginRight: 8,
          }}
        >
          <Text style={{ color: "#444" }}>Transfers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            paddingTop: 6,
            paddingBottom: 12,
            paddingHorizontal: 22,
            backgroundColor: "#e6fff2", // light green background
            borderRadius: 16,
            marginRight: 8,
          }}
        >
          <Text style={{ color: "#444" }}>Escrow</Text>
        </TouchableOpacity>

        {/* Add more filter chips as needed */}
      </ScrollView>
      <View style={styles.searchRow}>
        <TextInput placeholder="Search here" style={styles.searchInput} />
        <TouchableOpacity style={styles.filterIcon}>
          <Ionicons name="filter" size={20} color="#444" />
        </TouchableOpacity>
      </View>
      <Text style={styles.subHeader}>All Transactions</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 40,
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },
  searchRow: {
    marginTop: 10,
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginRight: 10,
    backgroundColor: "#f7f7f7",
    color: "#222", // Ensure input text is visible
  },
  filterIcon: {
    padding: 10,
    backgroundColor: "#f1f1f1",
    borderRadius: 10,
  },
  subHeader: {
    fontWeight: "600",
    marginBottom: 10,
    fontSize: 16,
    color: "#555",
  },
  list: {
    paddingBottom: 100,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  iconPlaceholder: {
    backgroundColor: "#e6fff2",
    padding: 10,
    borderRadius: 50,
    marginRight: 10,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontWeight: "400",
    fontSize: 13,
    color: "#222",
  },
  date: {
    color: "#999",
    fontSize: 13,
  },
  amount: {
    fontWeight: "400",
    fontSize: 13,
  },
});
