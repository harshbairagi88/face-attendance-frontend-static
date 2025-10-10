import React, { useState, useRef } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import axios from "axios";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [facing, setFacing] = useState<"front" | "back">("back"); 
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const router = useRouter();

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>We need camera permission</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      let photo = await cameraRef.current.takePictureAsync({ base64: true });
      setPhotoUri(photo.uri);
      setResultMessage(null); 
      console.log("📸 Photo captured:", photo.uri);
    }
  };

  const toggleCamera = () => setFacing((prev) => (prev === "back" ? "front" : "back"));
  const retakePicture = () => {
    setPhotoUri(null);
    setResultMessage(null);
  };

  const usePhoto = async () => {
  if (!photoUri) return;

  try {
    console.log("📸 Starting upload for:", photoUri);

    // ✅ Web builds often sandbox blob URIs. This ensures it’s fetched properly.
    const response = await fetch(photoUri, { mode: "cors" });
    if (!response.ok) {
      throw new Error(`Failed to fetch image blob: ${response.statusText}`);
    }

    const blob = await response.blob();
    console.log("✅ Blob fetched successfully:", blob);

    // ✅ Prepare FormData
    const formData = new FormData();
    const file = new File([blob], "attendance.jpg", { type: "image/jpeg" });
    formData.append("file", file);

    console.log("🚀 Sending to backend...");
    const res = await axios.post(
      "https://harshbairagi-face-attendance-backend.hf.space/mark_attendance",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
      }
    );

    console.log("✅ Backend Response:", res.data);
    setResultMessage(res.data.message || "Attendance processed");
  } catch (error: any) {
    console.error("📡 Upload error:", error);

    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      setResultMessage(`❌ Server Error: ${error.response.status}`);
    } else if (error.request) {
      console.error("No response received:", error.request);
      setResultMessage("⚠️ Network error - backend not reachable");
    } else {
      console.error("Error message:", error.message);
      setResultMessage("❌ Unexpected error occurred");
    }
  }
};


  return (
    <View style={styles.container}>
      {!photoUri ? (
        <>
          <CameraView style={styles.camera} ref={cameraRef} facing={facing} />

          {/* Bottom Toolbar */}
          <View style={styles.toolbar}>
            <TouchableOpacity
              style={[styles.toolBtn, { backgroundColor: "#1E90FF" }]}
              onPress={takePicture}
            >
              <Text style={styles.btnText}>📸</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolBtn, { backgroundColor: "#444" }]}
              onPress={toggleCamera}
            >
              <Text style={styles.btnText}>🔄</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolBtn, { backgroundColor: "orange" }]}
              onPress={() => router.push("/attendance")}
            >
              <Text style={styles.btnText}>📋</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.center}>
          <Text style={{ color: "#fff" }}>Preview:</Text>
          <Image source={{ uri: photoUri }} style={styles.preview} />

          {resultMessage && (
            <Text
              style={{
                color: resultMessage.includes("Unknown") ? "#ff6b6b" : "#9cffb0",
                marginTop: 15,
                fontSize: 16,
                textAlign: "center",
              }}
            >
              {resultMessage}
            </Text>
          )}

          <View style={{ flexDirection: "row", marginTop: 20 }}>
            <TouchableOpacity style={[styles.btn, { marginRight: 10 }]} onPress={retakePicture}>
              <Text style={styles.btnText}>🔄 Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { backgroundColor: "green" }]} onPress={usePhoto}>
              <Text style={styles.btnText}>✅ Use Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },

  toolbar: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  toolBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  btn: {
    backgroundColor: "#1E90FF",
    padding: 15,
    borderRadius: 10,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  preview: { width: 250, height: 250, marginTop: 20, borderRadius: 12 },
});
