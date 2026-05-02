import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image, Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { createMedicalRecord, updateMedicalRecord } from "../../services/medicalRecordService";

export default function MedicalRecordCreateEditScreen({ route, navigation }) {
  const record = route.params?.record; // If editing, this is passed in

  // ── Form Fields ──
  const [diagnosis,    setDiagnosis]    = useState(record?.diagnosis    || "");
  const [symptoms,     setSymptoms]     = useState(record?.symptoms?.join(", ") || "");
  const [treatment,    setTreatment]    = useState(record?.treatment    || "");
  const [labResults,   setLabResults]   = useState(record?.labResults   || "");
  const [notes,        setNotes]        = useState(record?.notes        || "");
  const [visitDate,    setVisitDate]    = useState(
    record?.visitDate ? record.visitDate.split("T")[0] : new Date().toISOString().split("T")[0]
  );

  // ── Vitals ──
  const [bloodPressure, setBloodPressure] = useState(record?.vitals?.bloodPressure || "");
  const [heartRate,     setHeartRate]     = useState(record?.vitals?.heartRate?.toString()     || "");
  const [temperature,   setTemperature]   = useState(record?.vitals?.temperature?.toString()   || "");
  const [weight,        setWeight]        = useState(record?.vitals?.weight?.toString()         || "");

  // ── Prescription (single medicine for simplicity) ──
  const [medName,  setMedName]  = useState(record?.prescription?.[0]?.medicineName || "");
  const [dosage,   setDosage]   = useState(record?.prescription?.[0]?.dosage       || "");
  const [freq,     setFreq]     = useState(record?.prescription?.[0]?.frequency    || "");
  const [duration, setDuration] = useState(record?.prescription?.[0]?.duration     || "");

  // ── File Upload ──
  const [attachment, setAttachment] = useState(null); // { uri, name, type }
  const [existingAttachUrl, setExistingAttachUrl] = useState(record?.attachmentUrl || null);

  // ── UI State ──
  const [loading, setLoading] = useState(false);
  const [userId, setUserId]   = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const id = await AsyncStorage.getItem("userId");
      setUserId(id);
    };
    loadUser();
  }, []);

  // ── Pick Image from Gallery ──
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setAttachment({
        uri:  asset.uri,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.mimeType || "image/jpeg",
      });
      setExistingAttachUrl(null);
    }
  };

  // ── Pick Document (PDF) ──
  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf"],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setAttachment({
        uri:  asset.uri,
        name: asset.name,
        type: asset.mimeType || "application/pdf",
      });
      setExistingAttachUrl(null);
    }
  };

  // ── Save Record ──
  const handleSave = async () => {
    // Basic validation
    if (!diagnosis.trim()) {
      Alert.alert("Validation Error", "Diagnosis is required.");
      return;
    }
    if (!visitDate.trim()) {
      Alert.alert("Validation Error", "Visit date is required.");
      return;
    }

    setLoading(true);
    try {
      // ✅ Build FormData — required because we may attach a file
      const formData = new FormData();

      // Core fields (patientId uses logged-in user's ID)
      formData.append("patientId",  userId);
      formData.append("diagnosis",  diagnosis.trim());
      formData.append("treatment",  treatment.trim());
      formData.append("labResults", labResults.trim());
      formData.append("notes",      notes.trim());
      formData.append("visitDate",  visitDate.trim());
      formData.append("createdBy",  "patient");

      // Symptoms — send as JSON string (backend parses it)
      const symptomsArray = symptoms.split(",").map(s => s.trim()).filter(Boolean);
      formData.append("symptoms", JSON.stringify(symptomsArray));

      // Vitals — send as JSON string
      const vitals = {};
      if (bloodPressure) vitals.bloodPressure = bloodPressure;
      if (heartRate)     vitals.heartRate     = Number(heartRate);
      if (temperature)   vitals.temperature   = Number(temperature);
      if (weight)        vitals.weight        = Number(weight);
      formData.append("vitals", JSON.stringify(vitals));

      // Prescription — send as JSON string
      if (medName.trim()) {
        const prescription = [{
          medicineName: medName.trim(),
          dosage:       dosage.trim()   || "As directed",
          frequency:    freq.trim()     || "Once daily",
          duration:     duration.trim() || "5 days",
        }];
        formData.append("prescription", JSON.stringify(prescription));
      }

      // ✅ File attachment (image or PDF) — sent as multipart
      if (attachment) {
        formData.append("attachment", {
          uri:  Platform.OS === "android" ? attachment.uri : attachment.uri.replace("file://", ""),
          name: attachment.name,
          type: attachment.type,
        });
      }

      if (record?._id) {
        await updateMedicalRecord(record._id, formData);
        Alert.alert("✅ Updated", "Medical record updated successfully.");
      } else {
        await createMedicalRecord(formData);
        Alert.alert("✅ Saved", "Medical record created successfully.");
      }

      navigation.goBack();
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", error.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

      <Text style={styles.title}>
        {record ? "✏️ Edit Medical Record" : "➕ Add Medical Record"}
      </Text>

      {/* ── Visit Info ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Visit Information</Text>

        <Text style={styles.label}>Diagnosis *</Text>
        <TextInput style={styles.input} placeholder="e.g. Viral Fever"
          value={diagnosis} onChangeText={setDiagnosis} />

        <Text style={styles.label}>Visit Date *  (YYYY-MM-DD)</Text>
        <TextInput style={styles.input} placeholder="e.g. 2026-05-01"
          value={visitDate} onChangeText={setVisitDate} />

        <Text style={styles.label}>Symptoms  (comma separated)</Text>
        <TextInput style={styles.input} placeholder="e.g. fever, headache, cough"
          value={symptoms} onChangeText={setSymptoms} />

        <Text style={styles.label}>Treatment</Text>
        <TextInput style={[styles.input, styles.textArea]}
          placeholder="Describe the treatment plan..." multiline
          value={treatment} onChangeText={setTreatment} />
      </View>

      {/* ── Prescription ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💊 Prescription (optional)</Text>

        <Text style={styles.label}>Medicine Name</Text>
        <TextInput style={styles.input} placeholder="e.g. Paracetamol"
          value={medName} onChangeText={setMedName} />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Dosage</Text>
            <TextInput style={styles.input} placeholder="500mg"
              value={dosage} onChangeText={setDosage} />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Frequency</Text>
            <TextInput style={styles.input} placeholder="3x daily"
              value={freq} onChangeText={setFreq} />
          </View>
        </View>

        <Text style={styles.label}>Duration</Text>
        <TextInput style={styles.input} placeholder="e.g. 5 days"
          value={duration} onChangeText={setDuration} />
      </View>

      {/* ── Vitals ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>❤️ Vitals (optional)</Text>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Blood Pressure</Text>
            <TextInput style={styles.input} placeholder="120/80"
              value={bloodPressure} onChangeText={setBloodPressure} />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Heart Rate (bpm)</Text>
            <TextInput style={styles.input} placeholder="72" keyboardType="numeric"
              value={heartRate} onChangeText={setHeartRate} />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Temp (°C)</Text>
            <TextInput style={styles.input} placeholder="37.0" keyboardType="numeric"
              value={temperature} onChangeText={setTemperature} />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput style={styles.input} placeholder="65" keyboardType="numeric"
              value={weight} onChangeText={setWeight} />
          </View>
        </View>
      </View>

      {/* ── Lab Results & Notes ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔬 Lab Results & Notes</Text>

        <Text style={styles.label}>Lab Results</Text>
        <TextInput style={[styles.input, styles.textArea]}
          placeholder="e.g. Blood test: Normal, CBC within range" multiline
          value={labResults} onChangeText={setLabResults} />

        <Text style={styles.label}>Doctor Notes</Text>
        <TextInput style={[styles.input, styles.textArea]}
          placeholder="Additional notes, follow-up instructions..." multiline
          value={notes} onChangeText={setNotes} />
      </View>

      {/* ── File Upload (Cloudinary) ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📎 Attach File  (Lab Report / Scan)</Text>
        <Text style={styles.uploadHint}>Upload a JPG, PNG, or PDF — max 5MB</Text>
        <Text style={styles.uploadHint}>Files are stored securely on Cloudinary ☁️</Text>

        <View style={styles.uploadRow}>
          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
            <Text style={styles.uploadBtnText}>📷 Pick Image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: "#f0fdf4" }]} onPress={pickDocument}>
            <Text style={[styles.uploadBtnText, { color: "#16a34a" }]}>📄 Pick PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Show new file chosen */}
        {attachment ? (
          <View style={styles.filePreview}>
            {attachment.type.startsWith("image/") ? (
              <Image source={{ uri: attachment.uri }} style={styles.previewImage} resizeMode="cover" />
            ) : null}
            <Text style={styles.fileName}>✅ {attachment.name}</Text>
            <TouchableOpacity onPress={() => setAttachment(null)}>
              <Text style={styles.removeFile}>✕ Remove</Text>
            </TouchableOpacity>
          </View>
        ) : existingAttachUrl ? (
          <View style={styles.filePreview}>
            <Text style={styles.fileName}>📎 Existing file attached</Text>
            <Text style={styles.uploadHint} numberOfLines={1}>{existingAttachUrl}</Text>
          </View>
        ) : (
          <View style={styles.noFile}>
            <Text style={styles.noFileText}>No file attached</Text>
          </View>
        )}
      </View>

      {/* ── Save Button ── */}
      <TouchableOpacity
        style={[styles.saveButton, loading && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>
            {record ? "Update Record" : "Save Record"}
          </Text>
        )}
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: "#eef4ff", padding: 16 },
  title:          { fontSize: 24, fontWeight: "800", color: "#0f172a", marginBottom: 20, marginTop: 4 },
  section:        { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 14, elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4 },
  sectionTitle:   { fontSize: 15, fontWeight: "700", color: "#1e293b", marginBottom: 14 },
  label:          { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input:          { backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#dde3f0", borderRadius: 10, padding: 13, fontSize: 15, color: "#1e3a5f", marginBottom: 14 },
  textArea:       { height: 90, textAlignVertical: "top" },
  row:            { flexDirection: "row" },
  uploadHint:     { fontSize: 12, color: "#64748b", marginBottom: 4 },
  uploadRow:      { flexDirection: "row", gap: 10, marginTop: 10, marginBottom: 10 },
  uploadBtn:      { flex: 1, backgroundColor: "#dbeafe", padding: 14, borderRadius: 12, alignItems: "center" },
  uploadBtnText:  { color: "#1d4ed8", fontWeight: "700", fontSize: 14 },
  filePreview:    { backgroundColor: "#f0fdf4", borderRadius: 12, padding: 12, alignItems: "center", marginTop: 4 },
  previewImage:   { width: "100%", height: 160, borderRadius: 10, marginBottom: 8 },
  fileName:       { fontSize: 13, color: "#166534", fontWeight: "600" },
  removeFile:     { color: "#dc2626", marginTop: 6, fontWeight: "600", fontSize: 13 },
  noFile:         { backgroundColor: "#f8fafc", borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "dashed", marginTop: 4 },
  noFileText:     { color: "#94a3b8", fontSize: 13 },
  saveButton:     { backgroundColor: "#2563eb", padding: 18, borderRadius: 14, alignItems: "center", marginTop: 8 },
  saveButtonText: { color: "#fff", fontWeight: "800", fontSize: 17 },
});
