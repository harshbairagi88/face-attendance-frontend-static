import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Platform,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [images, setImages] = useState<string[]>([]); // ✅ keep only one state

  // 👉 Pick multiple images
  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: Platform.OS === "ios", // multiple selection works on iOS
        quality: 1,
      });

      console.log("📂 Raw picker result:", result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uris = result.assets.map((asset) => asset.uri);

        if (Platform.OS === "ios") {
          setImages(uris); // replace
        } else {
          setImages((prev) => [...prev, ...uris]); // append for Android
        }

        console.log("✅ Selected images:", uris);
      } else {
        console.log("⚠️ No images selected or cancelled");
      }
    } catch (err) {
      console.error("❌ Error picking images:", err);
    }
  };

  // 👉 Submit registration
  const submitRegistration = async () => {
    if (!name || images.length === 0) {
      Alert.alert(
        "⚠️ Missing Info",
        "Enter a name and select at least 1 image"
      );
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);

      for (let idx = 0; idx < images.length; idx++) {
        const uri = images[idx];
        // ✅ Fetch blob data from URI
        const response = await fetch(uri);
        const blob = await response.blob();

        // ✅ Convert blob into a real File (cross-origin safe)
        const file = new File([blob], `${name}_${idx + 1}.jpg`, {
          type: "image/jpeg",
        });

        formData.append("files", file);
      }

      console.log("📤 Uploading:", name, "with", images.length, "images");

      const res = await axios.post(
        "https://harshbairagi-face-attendance-backend.hf.space/register_student", // use same IP as attendance
        formData,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      Alert.alert("✅ Success", res.data.message);
      setName("");
      setImages([]);
    } catch (err: any) {
      console.error("❌ Registration failed:", err.message);
      Alert.alert("❌ Error", "Failed to register student");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>👤 Register Student</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter student name"
        value={name}
        onChangeText={setName}
      />

      <TouchableOpacity style={styles.btn} onPress={pickImages}>
        <Text style={styles.btnText}>📷 Select Images</Text>
      </TouchableOpacity>

      {/* Preview */}
      {images.length > 0 && (
        <View style={styles.previewContainer}>
          {images.map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.previewImage} />
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: "green" }]}
        onPress={submitRegistration}
      >
        <Text style={styles.btnText}>✅ Register</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    width: "80%",
    marginBottom: 15,
  },
  btn: {
    backgroundColor: "#1E90FF",
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    width: "80%",
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  previewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 15,
    justifyContent: "center",
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    margin: 5,
  },
});
