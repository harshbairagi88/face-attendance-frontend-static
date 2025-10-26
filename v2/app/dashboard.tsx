import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Button } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

const API_URL = "http://192.168.1.8:8000"; // ✅ Replace with your backend IP
const screenWidth = Dimensions.get("window").width;

export default function DashboardScreen() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/dashboard_summary/`);
      const data = await res.json();
      setLoading(false);

      if (data.status === "ok") {
        setSummary(data.summary);
        setMessage(null);
      } else {
        setMessage("No attendance data found.");
      }
    } catch (err) {
      console.warn("Error fetching summary:", err);
      setMessage("Error connecting to backend.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00ff00" />
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  if (message) {
    return (
      <View style={styles.center}>
        <Text>{message}</Text>
        <Button title="Refresh" onPress={fetchSummary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Attendance Summary</Text>

      <View style={styles.statsBox}>
        <Text style={styles.statText}>Total: {summary.total}</Text>
        <Text style={styles.statText}>✅ Genuine: {summary.genuine}</Text>
        <Text style={styles.statText}>⚠️ Proxy: {summary.proxy}</Text>
        <Text style={styles.statText}>❓ Unknown: {summary.unknown}</Text>
      </View>

      <BarChart
        data={{
          labels: ["Genuine", "Proxy", "Unknown"],
          datasets: [
            {
              data: [summary.genuine, summary.proxy, summary.unknown],
            },
          ],
        }}
        width={screenWidth - 30}
        height={250}
        yAxisLabel=""
        chartConfig={{
          backgroundColor: "#1e1e1e",
          backgroundGradientFrom: "#1e1e1e",
          backgroundGradientTo: "#3c3c3c",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 255, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          style: { borderRadius: 16 },
        }}
        style={styles.chart}
      />

      <Button title="🔄 Refresh" onPress={fetchSummary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", padding: 20 },
  title: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  statsBox: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  statText: { color: "#fff", fontSize: 18, marginVertical: 4 },
  chart: { borderRadius: 16, marginBottom: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
