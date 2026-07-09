import { Text, View, StyleSheet, Pressable } from "react-native";
import { Link } from "expo-router";

export default function VendorHome() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vantoo Vendor</Text>
      <Text style={styles.subtitle}>
        Independent vendor app — manage stores, products, and orders.
      </Text>
      <Link href="/login" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Vendor Login</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "700", color: "#111" },
  subtitle: { marginTop: 8, fontSize: 15, color: "#666", lineHeight: 22 },
  button: {
    marginTop: 32,
    backgroundColor: "#FF6B00",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
