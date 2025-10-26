import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Button,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { format } from "date-fns";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";

const API_URL = "http://192.168.1.8:8000"; // ✅ Replace with your backend IP

export default function HistoryScreen() {
  const { name } = useLocalSearchParams();
  const router = useRouter();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<any | null>(null);

  // Fetch all attendance records for the student
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/attendance_by_name/?name=${name}`);
      const data = await res.json();
      setLoading(false);

      if (data.status === "ok" && data.records.length > 0) {
        setRecords(data.records);
        calculateSummary(data.records);
      } else {
        setRecords([]);
        setMessage("No attendance found for this student.");
      }
    } catch (err: any) {
      console.warn("Error fetching student history:", err);
      setLoading(false);
      setMessage("Error fetching history data");
    }
  };

  // 🧮 Calculate stats: total, avg confidence, first/last attendance
  const calculateSummary = (records: any[]) => {
    if (records.length === 0) return;

    const total = records.length;
    const avgConfidence =
      records.reduce((acc, r) => acc + parseFloat(r.confidence || 0), 0) /
      total;

    const sortedByTime = [...records].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    setSummary({
      total,
      avgConfidence,
      first: sortedByTime[0].timestamp,
      last: sortedByTime[sortedByTime.length - 1].timestamp,
    });
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📅 {name}'s Attendance History</Text>

      {loading && <ActivityIndicator size="large" color="#00ff00" />}
      {message && <Text style={styles.message}>{message}</Text>}

      {/* 🔹 Summary Section */}
      {summary && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📊 Summary</Text>
          <Text style={styles.summaryText}>Total Records: {summary.total}</Text>
          <Text style={styles.summaryText}>
            Avg Confidence: {(summary.avgConfidence * 100).toFixed(1)}%
          </Text>
          <Text style={styles.summaryText}>
            First Attendance:{" "}
            {format(new Date(summary.first), "MMM dd, yyyy HH:mm")}
          </Text>
          <Text style={styles.summaryText}>
            Last Attendance:{" "}
            {format(new Date(summary.last), "MMM dd, yyyy HH:mm")}
          </Text>
        </View>
      )}

      {records.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>📊 Confidence Trend Over Time</Text>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={records.map((r) => ({
                timestamp: r.timestamp.split(" ")[1],
                confidence: (r.confidence * 100).toFixed(1),
              }))}
              margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
            >
              <XAxis
                dataKey="timestamp"
                stroke="#fff"
                hide={records.length > 6}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="confidence"
                stroke="#00ff88"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </View>
      )}

      {/* 🔹 Individual Records */}
      {records.map((r, idx) => (
        <View key={idx} style={styles.card}>
          <Text style={styles.timestamp}>🕒 {r.timestamp}</Text>
          <Text style={styles.confidence}>
            Confidence: {(r.confidence * 100).toFixed(1)}%
          </Text>
        </View>
      ))}

      <View style={styles.btnContainer}>
        <Button title="⬅️ Back" onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa", padding: 15 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: "#222",
  },
  summaryCard: {
    backgroundColor: "#1e1e1e",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  summaryTitle: {
    color: "#00ff88",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  summaryText: {
    color: "#fff",
    fontSize: 15,
    marginBottom: 4,
  },
  card: {
    backgroundColor: "#2a2a2a",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  timestamp: { color: "#fff", fontSize: 16 },
  confidence: { color: "#4CAF50", fontWeight: "bold", marginTop: 5 },
  message: { textAlign: "center", color: "#888", marginTop: 10 },
  btnContainer: { marginTop: 20, alignItems: "center" },
});
