import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import Toast from "react-native-toast-message";
import * as FileSystem from "expo-file-system";

const WS_URL = "ws://192.168.1.8:8000/ws/stream"; // 🔁 Change to your backend IP
const FRAME_W = 640;
const FRAME_H = 480;
const SEND_INTERVAL_MS = 500; // ✅ smooth FPS
const MIRROR_FRONT = true; // ✅ fixes reversed bounding boxes on front camera

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const [recognizedFaces, setRecognizedFaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [layout, setLayout] = useState({ width: FRAME_W, height: FRAME_H });

  const cameraRef = useRef<any>(null);
  const isStoppedRef = useRef(false);
  const wsRef = useRef<WebSocket | null>(null);
  const captureLoopRef = useRef<NodeJS.Timeout | null>(null);
  const shownToastNames = useRef<Record<string, number>>({});

  const { width: camWidth, height: camHeight } = Dimensions.get("window");

  // ✅ Establish WebSocket connection once
  const connectWebSocket = () => {
    wsRef.current = new WebSocket(WS_URL);

    wsRef.current.onopen = () => {
      console.log("🟢 WebSocket connected to backend");
      setConnected(true);
      Toast.show({
        type: "success",
        text1: "Connected to backend ✅",
        position: "bottom",
      });
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.faces) {
          setRecognizedFaces(data.faces);
          handleAttendanceToasts(data.faces);
        }
      } catch (err) {
        console.warn("⚠️ Error parsing backend message:", err);
      }
    };

    wsRef.current.onerror = (err) => {
      console.warn("❌ WebSocket error:", err);
    };

    wsRef.current.onclose = (ev) => {
      console.log("🔴 WS closed:", ev?.code, ev?.reason);
      setConnected(false);
      if (capturing) {
        setTimeout(() => {
          console.log("♻️ Reconnecting...");
          connectWebSocket();
        }, 2000);
      }
    };
  };

  // ✅ Capture camera frame and send over WebSocket
  const captureAndSendFrame = async () => {
    if (isStoppedRef.current || !cameraRef.current) return;
    if (!wsRef.current || wsRef.current.readyState !== 1) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.3,
        skipProcessing: true,
        base64: true,
      });

      // 🛑 Check again (in case Stop clicked during capture)
      if (isStoppedRef.current) return;

      if (photo?.base64) {
        wsRef.current.send(`data:image/jpeg;base64,${photo.base64}`);
        console.log("📸 Frame sent to backend");
      }
    } catch (err) {
      if (!isStoppedRef.current)
        console.warn("⚠️ captureAndSendFrame error:", err);
    }
  };

  // ✅ Start continuous frame sending
  const startCapturing = async () => {
    if (capturing) return;
    isStoppedRef.current = false; // ✅ Reset stop flag

    if (!wsRef.current || wsRef.current.readyState !== 1) {
      connectWebSocket();
      await new Promise((resolve) => setTimeout(resolve, 800)); // ensure connected
    }

    setCapturing(true);
    setLoading(true);

    captureLoopRef.current = setInterval(() => {
      if (!isStoppedRef.current) captureAndSendFrame(); // ✅ only capture if not stopped
    }, SEND_INTERVAL_MS);

    setLoading(false);
  };

  // ✅ Stop capturing and WebSocket
  const stopCapturing = () => {
    console.log("🛑 Stopping capture loop...");
    isStoppedRef.current = true; // ✅ Stop any further captures
    setCapturing(false);
    setConnected(false);

    if (captureLoopRef.current) {
      clearInterval(captureLoopRef.current);
      captureLoopRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (err) {
        console.warn("Error closing WS:", err);
      }
      wsRef.current = null;
    }

    setRecognizedFaces([]);
  };

  // ✅ Toasts for Genuine / Fake detection
  const handleAttendanceToasts = (faces: any[]) => {
    const now = Date.now();
    faces.forEach((face) => {
      const name = face.name || "Unknown";
      const category = face.category || "Unknown";

      // show toast only if not shown recently
      const lastShown = shownToastNames.current[name] || 0;
      if (now - lastShown < 3000) return;
      shownToastNames.current[name] = now;

      if (category === "Genuine" && name !== "Unknown") {
        Toast.show({
          type: "success",
          text1: `${name} marked present`,
          text2: "Attendance recorded ✅",
          position: "bottom",
          visibilityTime: 2000,
        });
      } else if (category === "Fake" || category === "Proxy Detected") {
        Toast.show({
          type: "error",
          text1: "Fake/Proxy detected ❌",
          text2: name,
          position: "bottom",
          visibilityTime: 2000,
        });
      } else if (category === "Unknown") {
        Toast.show({
          type: "info",
          text1: "Unknown person detected",
          position: "bottom",
          visibilityTime: 1500,
        });
      }
    });
  };

  // ✅ Render bounding boxes
  const renderBoundingBoxes = () => {
    if (!Array.isArray(recognizedFaces)) return null;

    const scaleX = layout.width / FRAME_W;
    const scaleY = layout.height / FRAME_H;

    return recognizedFaces.map((face, idx) => {
      const bbox = face.bbox || [0, 0, FRAME_W, FRAME_H];
      let [x1, y1, x2, y2] = bbox.map(Number);

      // ✅ Mirror horizontally if front camera
      if (MIRROR_FRONT) {
        const w = FRAME_W;
        const boxWidth = x2 - x1;
        const mirroredLeft = w - x1 - boxWidth;
        x1 = mirroredLeft;
        x2 = mirroredLeft + boxWidth;
      }

      const left = x1 * scaleX;
      const top = y1 * scaleY;
      const width = (x2 - x1) * scaleX;
      const height = (y2 - y1) * scaleY;

      // ✅ Category color
      let borderColor = "gray";
      if (face.category === "Genuine") borderColor = "lime";
      else if (face.category === "Fake" || face.category === "Proxy Detected")
        borderColor = "red";
      else if (face.category === "Unknown") borderColor = "deepskyblue";

      return (
        <View
          key={idx}
          style={[
            styles.bbox,
            { borderColor: borderColor, left, top, width, height },
          ]}
        >
          <Text style={styles.label}>
            {face.name} ({(face.confidence * 100).toFixed(1)}%)
          </Text>
          <Text style={[styles.liveness, { borderColor }]}>
            {face.movement_status}
          </Text>
        </View>
      );
    });
  };
  useEffect(() => {
    if (!permission) requestPermission();
    return () => stopCapturing();
  }, [permission]);

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text>No camera access</Text>
        <Button title="Allow camera" onPress={() => requestPermission()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        ref={cameraRef}
        facing="front"
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setLayout({ width, height });
        }}
      />

      {/* 🟩 Overlay bounding boxes */}
      <View style={StyleSheet.absoluteFill}>{renderBoundingBoxes()}</View>

      <View style={styles.overlay}>
        {loading ? (
          <ActivityIndicator size="large" color="#00ff00" />
        ) : recognizedFaces.length > 0 ? (
          <Text style={styles.resultText}>
            {recognizedFaces.length} faces detected
          </Text>
        ) : (
          <Text style={styles.resultText}>Waiting for detection...</Text>
        )}
      </View>

      <View style={styles.controls}>
        <Button
          title={capturing ? "Stop" : "Start"}
          onPress={capturing ? stopCapturing : startCapturing}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  overlay: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 10,
  },
  bbox: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: 5,
  },
  label: {
    backgroundColor: "rgba(0,0,0,0.5)",
    color: "white",
    fontSize: 12,
    paddingHorizontal: 3,
  },
  liveness: { fontSize: 12, fontWeight: "bold", marginTop: 2 },
  controls: { position: "absolute", bottom: 40, alignSelf: "center" },
  resultText: { color: "white", fontSize: 16, textAlign: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});

// -------------------------------------------------------------------
