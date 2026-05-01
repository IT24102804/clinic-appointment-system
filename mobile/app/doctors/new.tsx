import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { createDoctor } from "@/services/doctors";
import DoctorForm from "@/components/DoctorForm";
import { API_BASE_URL } from "@/constants/api";

const TEAL = "#0cb8aa";

export default function NewDoctorScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState("");

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setLastError("");
    try {
      console.log("Sending to:", API_BASE_URL + "/api/doctors");
      const result = await createDoctor(formData);
      console.log("Success:", result);
      router.replace("/doctors");
    } catch (error: any) {
      console.log("FAILED:", error.message);
      setLastError(error.message);
      Alert.alert("Error adding doctor", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/doctors")} activeOpacity={0.7}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.appName}>MediLanka</Text>
          <Text style={styles.title}>Add New Doctor</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* Show API URL so you can confirm it is correct */}
      <View style={styles.debugBar}>
        <Text style={styles.debugText}>🔗 {API_BASE_URL}</Text>
        {lastError ? <Text style={styles.errorText}>❌ {lastError}</Text> : null}
      </View>

      <DoctorForm
        onSubmit={handleSubmit}
        submitLabel="➕ Add Doctor"
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  header: {
    backgroundColor: TEAL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 55,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  back: { color: "#fff", fontSize: 15, fontWeight: "600" },
  appName: { color: "rgba(255,255,255,0.85)", fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  title: { color: "#fff", fontSize: 16, fontWeight: "700" },
  debugBar: {
    backgroundColor: "#1a1a2e",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  debugText: { color: "#0cb8aa", fontSize: 12, fontFamily: "monospace" },
  errorText: { color: "#ff6b6b", fontSize: 12, marginTop: 4, fontWeight: "600" },
});