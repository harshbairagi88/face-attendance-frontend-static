import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Linking, Platform } from "react-native";
import { format } from "date-fns";
import { useRouter } from "expo-router";

const API_URL = "http://192.168.1.8:8000"; // ✅ your backend IP

export default function AttendanceScreen() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [todaySummary, setTodaySummary] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [recentFaces, setRecentFaces] = useState<any[]>([]);
  const router = useRouter();
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  // 🟢 Fetch Attendance Records
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/attendance/`);
      const data = await res.json();
      setLoading(false);

      if (data.status === "ok" && data.records?.length > 0) {
        setRecords(data.records);
        setMessage(null);
      } else {
        setRecords([]);
        setMessage("No attendance records found.");
      }
    } catch (err) {
      console.warn("Error fetching attendance:", err);
      setMessage("Error connecting to backend");
      setLoading(false);
    }
  };

  // 🗓 Fetch Records by Date
  const fetchByDate = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/attendance_by_date/?date=${selectedDate}`);
      const data = await res.json();
      setLoading(false);

      if (data.status === "ok" && data.records.length > 0) {
        setRecords(data.records);
        setMessage(null);
      } else {
        setRecords([]);
        setMessage("No records for selected date.");
      }
    } catch (err) {
      console.warn("Error filtering:", err);
      setMessage("Error filtering by date");
      setLoading(false);
    }
  };

  // 👁 Fetch Recent Faces
  const fetchRecentFaces = async () => {
    try {
      const res = await fetch(`${API_URL}/recent_faces/`);
      const data = await res.json();
      if (data.status === "ok") setRecentFaces(data.recent_faces);
    } catch (err) {
      console.warn("Error fetching recent faces:", err);
    }
  };

  // 📊 Fetch Today Summary
  const fetchTodaySummary = async () => {
    try {
      const res = await fetch(`${API_URL}/today_summary/`);
      const data = await res.json();
      if (data.status === "ok") setTodaySummary(data.summary);
    } catch (err) {
      console.warn("Error fetching today summary:", err);
    }
  };

  // 📥 Download CSV
  const downloadCSV = async () => {
    try {
      const response = await fetch(`${API_URL}/attendance/download/`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        if (Platform.OS === "web") {
          const a = document.createElement("a");
          a.href = url;
          a.download = "attendance.csv";
          a.click();
          URL.revokeObjectURL(url);
        } else {
          Linking.openURL(`${API_URL}/attendance/download/`);
        }
      } else setMessage("⚠️ No CSV found");
    } catch (err) {
      console.warn("Error downloading CSV:", err);
      setMessage("Error downloading CSV");
    }
  };

  // ♻️ Auto Refresh
  useEffect(() => {
    fetchAttendance();
    fetchTodaySummary();
    fetchRecentFaces();

    refreshInterval.current = setInterval(() => {
      fetchAttendance();
      fetchRecentFaces();
      fetchTodaySummary();
    }, 10000);

    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📋 Attendance Records</Text>

      {loading && <ActivityIndicator size="large" color="#00ff88" />}
      {message && <Text style={styles.message}>{message}</Text>}

      {/* 🧾 Attendance Cards */}
      {records.map((r, idx) => (
        <TouchableOpacity
          key={idx}
          onPress={() =>
            router.push(`/history?name=${encodeURIComponent(r.name)}`)
          }
        >
          <View style={styles.card}>
            <Text style={styles.name}>{r.name}</Text>
            <Text style={styles.time}>{r.timestamp}</Text>
            <Text style={styles.confidence}>
              Confidence: {(r.confidence * 100).toFixed(1)}%
            </Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* 🔄 Buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.btn} onPress={fetchAttendance}>
          <Text style={styles.btnText}>🔄 Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: "#007bff" }]} onPress={downloadCSV}>
          <Text style={styles.btnText}>📥 Download CSV</Text>
        </TouchableOpacity>
      </View>

      {/* 📅 Filter by Date */}
      <View style={styles.filterBox}>
        <Text style={styles.filterTitle}>📅 Filter by Date</Text>
        <TextInput
          style={styles.input}
          value={selectedDate}
          onChangeText={setSelectedDate}
          placeholder="YYYY-MM-DD"
        />
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: "#00cc88", marginTop: 10 }]}
          onPress={fetchByDate}
        >
          <Text style={styles.btnText}>🔍 Apply Filter</Text>
        </TouchableOpacity>
      </View>

      {/* 📊 Today Summary */}
      {todaySummary && (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>📊 Today's Summary</Text>
          <Text style={styles.summaryText}>
            ✅ Genuine: {todaySummary.genuine} | ❌ Proxy: {todaySummary.proxy} | ❓ Unknown: {todaySummary.unknown}
          </Text>
          <Text style={styles.summaryTotal}>
            Total: {todaySummary.total}
          </Text>
        </View>
      )}

      {/* 🧑‍🤝‍🧑 Recent Faces */}
      <View style={styles.recentBox}>
        <Text style={styles.recentTitle}>🧑‍🤝‍🧑 Recent Faces Detected</Text>
        {recentFaces.length === 0 ? (
          <Text style={styles.noRecords}>No recent faces detected</Text>
        ) : (
          recentFaces.map((f, idx) => (
            <View key={idx} style={styles.faceCard}>
              <Text style={styles.faceName}>{f.name}</Text>
              <Text style={styles.faceCat}>{f.category}</Text>
              <Text style={styles.faceConf}>
                {(f.confidence * 100).toFixed(1)}%
              </Text>
              <Text style={styles.faceTime}>{f.timestamp}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", padding: 15 },
  title: {
    fontSize: 22,
    color: "#00ff88",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  message: { color: "#999", textAlign: "center", marginVertical: 10 },
  card: {
    backgroundColor: "#1e1e1e",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  name: { fontSize: 18, color: "#fff" },
  time: { color: "#bbb", marginTop: 3 },
  confidence: { color: "#00ff88", fontWeight: "bold", marginTop: 5 },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
  },
  btn: {
    backgroundColor: "#444",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  btnText: { color: "#fff", fontWeight: "bold" },
  filterBox: {
    backgroundColor: "#1e1e1e",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  filterTitle: { color: "#00ff88", fontSize: 18, marginBottom: 10 },
  input: {
    backgroundColor: "#fff",
    color: "#000",
    padding: 10,
    borderRadius: 8,
  },
  summaryBox: {
    backgroundColor: "#1e1e1e",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  summaryTitle: { color: "#00ff88", fontSize: 18, fontWeight: "bold" },
  summaryText: { color: "#fff", fontSize: 16, marginTop: 5 },
  summaryTotal: { color: "#4CAF50", fontWeight: "bold", marginTop: 5 },
  recentBox: {
    backgroundColor: "#1e1e1e",
    padding: 15,
    borderRadius: 10,
    marginTop: 25,
    marginBottom: 40,
  },
  recentTitle: { color: "#00ff88", fontSize: 18, fontWeight: "bold" },
  faceCard: {
    marginTop: 10,
    backgroundColor: "#2a2a2a",
    padding: 10,
    borderRadius: 8,
  },
  faceName: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  faceCat: { color: "#00ffff", fontSize: 14 },
  faceConf: { color: "#00ff88", fontSize: 14 },
  faceTime: { color: "#999", fontSize: 12 },
  noRecords: { color: "#888", textAlign: "center", marginTop: 10 },
});
