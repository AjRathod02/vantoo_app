import { Text, View, StyleSheet } from "react-native";

export default function VendorLogin() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vendor Login</Text>
      <Text style={styles.hint}>
        Connect to platform auth-service (planned). API base: /api/vendor/*
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "700" },
  hint: { marginTop: 12, fontSize: 14, color: "#666", lineHeight: 20 },
});
