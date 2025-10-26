import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Button,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import Toast from "react-native-toast-message";

const API_URL = "http://192.168.1.8:8000"; // change to your backend IP

export default function RegisterScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<"form" | "camera" | "preview" | "uploading">(
    "form"
  );
  const [name, setName] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [capturedUris, setCapturedUris] = useState<string[]>([]);
  const cameraRef = useRef<any>(null);

  const startRegistration = async () => {
    if (!name.trim()) {
      Toast.show({ type: "error", text1: "Please enter your name first" });
      return;
    }
    if (!permission?.granted) {
      await requestPermission();
    }
    setStep("camera");
  };

  const capturePhotos = async () => {
    if (!cameraRef.current) return;
    setCapturedUris([]);
    setCapturing(true);
    Toast.show({ type: "info", text1: "Capturing 3 photos..." });

    const photos: string[] = [];
    for (let i = 0; i < 3; i++) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.4,
        skipProcessing: true,
      });
      photos.push(photo.uri);
      Toast.show({ type: "info", text1: `Captured photo ${i + 1}/3` });
      await new Promise((res) => setTimeout(res, 1000));
    }

    setCapturedUris(photos);
    setCapturing(false);
    setStep("preview");
  };

  const uploadRegistration = async () => {
    setStep("uploading");
    try {
      const formData = new FormData();
      formData.append("name", name);

      capturedUris.forEach((uri, idx) => {
        const fileName = uri.split("/").pop();
        const file = {
          uri,
          name: fileName || `face_${idx + 1}.jpg`,
          type: "image/jpeg",
        };
        formData.append("files", file as any);
      });

      const res = await fetch(`${API_URL}/register_multi/`, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data", // ✅ ensure multipart
        },
        body: formData,
      });

      const data = await res.json();
      console.log("Register response:", data);

      if (data.status === "registered") {
        Toast.show({
          type: "success",
          text1: `${data.name} registered successfully ✅`,
          text2: `Used ${data.frames_used} photos`,
        });
        setName("");
        setCapturedUris([]);
        setStep("form");
      } else {
        Toast.show({
          type: "error",
          text1: "Registration failed",
          text2: data.message || "Try again",
        });
        setStep("preview");
      }
    } catch (err) {
      console.warn("registerFace error:", err);
      Toast.show({
        type: "error",
        text1: "Network error",
      });
      setStep("preview");
    }
  };

  // Step 1: Show form only
  if (step === "form") {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Register New Face</Text>
        <TextInput
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <Button title="Continue" onPress={startRegistration} />
      </View>
    );
  }

  // Step 2: Show camera and capture process
  // Step 2: Show camera and capture process
  if (step === "camera") {
    if (!permission?.granted) {
      return (
        <View style={styles.center}>
          <Text>No access to camera</Text>
          <Button title="Allow camera" onPress={() => requestPermission()} />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <CameraView ref={cameraRef} style={styles.camera} facing="front" />

        {/* 🟩 Face Outline Overlay */}
        <View style={styles.overlay}>
          <View style={styles.faceGuideBox}>
            <Text style={styles.guideText}>Align your face inside the box</Text>
          </View>
        </View>

        {/* 🟠 Capture Button / Loader */}
        <View style={styles.overlayCenter}>
          {capturing ? (
            <ActivityIndicator size="large" color="#00ff00" />
          ) : (
            <TouchableOpacity style={styles.captureBtn} onPress={capturePhotos}>
              <Text style={styles.captureText}>📸 Capture Photos</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Step 3: Show preview + confirm/retake buttons

  if (step === "preview") {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Preview Captured Photos</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {capturedUris.map((uri, idx) => (
            <Image key={idx} source={{ uri }} style={styles.previewImage} />
          ))}
        </ScrollView>

        <View style={styles.previewButtons}>
          {/* 🔁 Retake button on LEFT now */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#ff4444" }]}
            onPress={() => {
              setCapturedUris([]);
              setStep("camera");
            }}
          >
            <Text style={styles.btnText}>🔁 Retake</Text>
          </TouchableOpacity>

          {/* ✅ Looks Good button on RIGHT now */}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#007bff" }]}
            onPress={uploadRegistration}
          >
            <Text style={styles.btnText}>✅ Looks Good</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Step 4: Uploading/loading screen
  if (step === "uploading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00ff00" />
        <Text style={{ marginTop: 20, fontSize: 16, color: "gray" }}>
          Registering your face, please wait...
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  title: {
    fontSize: 20,
    color: "white",
    marginBottom: 20,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    width: "80%",
    marginBottom: 20,
  },
  overlayCenter: {
    position: "absolute",
    alignSelf: "center",
    bottom: "10%",
  },
  captureBtn: {
    backgroundColor: "#00cc66",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
  },
  captureText: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
  },
  previewImage: {
    width: 100,
    height: 100,
    marginHorizontal: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#00ff00",
  },
  previewButtons: {
    flexDirection: "row",
    marginTop: 35,
    marginBottom: 40,
  },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
    marginHorizontal: 10,
  },
  btnText: {
    color: "white",
    fontWeight: "600",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.15)", // light dim
  },
  faceGuideBox: {
    width: "70%",
    aspectRatio: 0.8, // more vertical rectangle
    borderWidth: 3,
    borderColor: "#00ffcc", // aqua glow
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  guideText: {
    position: "absolute",
    bottom: -30,
    fontSize: 14,
    color: "white",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 10,
    borderRadius: 10,
  },
});
