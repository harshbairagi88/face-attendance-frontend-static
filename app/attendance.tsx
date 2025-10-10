import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import axios from "axios";

export default function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Replace with your backend IP (same one you used for mark_attendance)
  const BASE_URL = "https://harshbairagi-face-attendance-backend.hf.space";

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/get_attendance`);
        setAttendance(res.data.attendance);
      } catch (err) {
        console.error("Error fetching attendance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading attendance...</Text>
      </View>
    );
  }

  if (attendance.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No attendance marked today.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Today's Attendance</Text>
      <FlatList
        data={attendance}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  item: { padding: 15, borderBottomWidth: 1, borderBottomColor: "#ddd" },
  name: { fontSize: 18, fontWeight: "600" },
  time: { fontSize: 14, color: "gray" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
