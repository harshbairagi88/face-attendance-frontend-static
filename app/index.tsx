import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎓 Face Attendance System</Text>

      {/* 📸 Take Attendance */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: "#1E90FF" }]}
        onPress={() => router.push("/camera")}
      >
        <Text style={styles.cardIcon}>📸</Text>
        <Text style={styles.cardText}>Take Attendance</Text>
      </TouchableOpacity>

      {/* 👤 Register Student */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: "#28a745" }]}
        onPress={() => router.push("/register")}
      >
        <Text style={styles.cardIcon}>👤</Text>
        <Text style={styles.cardText}>Register Student</Text>
      </TouchableOpacity>

      {/* 📋 View Attendance */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: "#FF8C00" }]}
        onPress={() => router.push("/attendance")}
      >
        <Text style={styles.cardIcon}>📋</Text>
        <Text style={styles.cardText}>View Attendance</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 40,
    textAlign: "center",
    color: "#333",
  },
  card: {
    width: "80%",
    padding: 20,
    borderRadius: 15,
    marginVertical: 10,
    alignItems: "center",
    elevation: 4, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  cardText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
});
