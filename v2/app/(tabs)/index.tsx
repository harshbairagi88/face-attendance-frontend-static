import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎓 Face Attendance System</Text>
      <Text style={styles.subtitle}>Choose an option below:</Text>

      <View style={styles.buttonContainer}>
        <Button
          title="📷 Start Attendance"
          onPress={() => router.push("/camera")}
        />

        <View style={{ height: 15 }} />

        <Button
          title="🧑‍💻 Register New Face"
          onPress={() => router.push("/RegisterScreen")}
          color="#00cc66"
        />

        <View style={{ height: 15 }} />

        <Button
          title="📋 View Attendance"
          onPress={() => router.push("/attendance")}
          color="#007bff"
        />

        <View style={{ height: 15 }} />
        <Button
          title="📊 View Dashboard"
          onPress={() => router.push("/dashboard")}
          color="#00cc66"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "gray",
    marginBottom: 30,
  },
  buttonContainer: {
    width: "80%",
  },
});
