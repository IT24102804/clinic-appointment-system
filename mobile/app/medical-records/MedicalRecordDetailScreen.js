import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Linking, Image,
} from "react-native";
import { getRecordById, deleteMedicalRecord } from "../../services/medicalRecordService";

export default function MedicalRecordDetailScreen({ route, navigation }) {
  const { recordId } = route.params;
  const [record, setRecord]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const res = await getRecordById(recordId);
        setRecord(res.data);
      } catch (error) {
        Alert.alert("Error", error.message || "Failed to load record");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [recordId]);

  const handleDelete = () => {
    Alert.alert("Delete Record", "Are you sure you want to delete this record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await deleteMedicalRecord(recordId);
            Alert.alert("Deleted", "Medical record deleted successfully");
            navigation.goBack();
          } catch (error) {
            Alert.alert("Error", error.message || "Failed to delete");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading record...</Text>
      </View>
    );
  }

  if (!record) return null;

  const visitDate    = record.visitDate ? new Date(record.visitDate).toLocaleDateString() : "—";
  const patientName  = record.patientId?.name  || "Unknown Patient";
  const patientEmail = record.patientId?.email || "";
  const doctorName   = record.doctorId?.name   || "No Doctor Assigned";
  const doctorSpec   = record.doctorId?.specialization || "";
  const apptDate     = record.appointmentId?.appointmentDate
    ? new Date(record.appointmentId.appointmentDate).toLocaleDateString() : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* ── Header ── */}
      <View style={styles.headerCard}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {record.createdBy === "doctor" ? "🩺 Created by Doctor" : "👤 Created by Patient"}
          </Text>
        </View>
        <Text style={styles.diagnosis}>{record.diagnosis}</Text>
        <Text style={styles.visitDate}>📅 Visit Date: {visitDate}</Text>
      </View>

      {/* ── Patient & Doctor ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>People Involved</Text>

        <View style={styles.row}>
          <View style={styles.halfCard}>
            <Text style={styles.cardLabel}>👤 Patient</Text>
            <Text style={styles.cardValue}>{patientName}</Text>
            {patientEmail ? <Text style={styles.cardSub}>{patientEmail}</Text> : null}
          </View>
          <View style={styles.halfCard}>
            <Text style={styles.cardLabel}>🩺 Doctor</Text>
            <Text style={styles.cardValue}>{doctorName}</Text>
            {doctorSpec ? <Text style={styles.cardSub}>{doctorSpec}</Text> : null}
          </View>
        </View>

        {apptDate ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📋 Appointment Date</Text>
            <Text style={styles.infoValue}>{apptDate}</Text>
          </View>
        ) : null}
      </View>

      {/* ── Symptoms ── */}
      {record.symptoms?.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptoms</Text>
          <View style={styles.tagWrap}>
            {record.symptoms.map((s, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* ── Treatment ── */}
      {record.treatment ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Treatment</Text>
          <Text style={styles.bodyText}>{record.treatment}</Text>
        </View>
      ) : null}

      {/* ── Prescription ── */}
      {record.prescription?.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💊 Prescription</Text>
          {record.prescription.map((p, i) => (
            <View key={i} style={styles.prescCard}>
              <Text style={styles.prescName}>{p.medicineName}</Text>
              <Text style={styles.prescDetail}>Dosage: {p.dosage}</Text>
              <Text style={styles.prescDetail}>Frequency: {p.frequency}</Text>
              <Text style={styles.prescDetail}>Duration: {p.duration}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* ── Vitals ── */}
      {(record.vitals?.bloodPressure || record.vitals?.heartRate || record.vitals?.temperature) ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>❤️ Vitals</Text>
          <View style={styles.vitalsGrid}>
            {record.vitals.bloodPressure ? (
              <View style={styles.vitalBox}>
                <Text style={styles.vitalValue}>{record.vitals.bloodPressure}</Text>
                <Text style={styles.vitalLabel}>Blood Pressure</Text>
              </View>
            ) : null}
            {record.vitals.heartRate ? (
              <View style={styles.vitalBox}>
                <Text style={styles.vitalValue}>{record.vitals.heartRate} bpm</Text>
                <Text style={styles.vitalLabel}>Heart Rate</Text>
              </View>
            ) : null}
            {record.vitals.temperature ? (
              <View style={styles.vitalBox}>
                <Text style={styles.vitalValue}>{record.vitals.temperature}°C</Text>
                <Text style={styles.vitalLabel}>Temperature</Text>
              </View>
            ) : null}
            {record.vitals.weight ? (
              <View style={styles.vitalBox}>
                <Text style={styles.vitalValue}>{record.vitals.weight} kg</Text>
                <Text style={styles.vitalLabel}>Weight</Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* ── Lab Results ── */}
      {record.labResults ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔬 Lab Results</Text>
          <Text style={styles.bodyText}>{record.labResults}</Text>
        </View>
      ) : null}

      {/* ── Notes ── */}
      {record.notes ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Notes</Text>
          <Text style={styles.bodyText}>{record.notes}</Text>
        </View>
      ) : null}

      {/* ── Attachment ── */}
      {record.attachmentUrl ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📎 Attachment</Text>
          {record.attachmentType === "image" ? (
            <Image source={{ uri: record.attachmentUrl }} style={styles.attachImage} resizeMode="contain" />
          ) : (
            <TouchableOpacity style={styles.attachBtn}
              onPress={() => Linking.openURL(record.attachmentUrl)}
            >
              <Text style={styles.attachBtnText}>📄 Open Document</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {/* ── Action Buttons ── */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.editBtn}
          onPress={() => navigation.navigate("MedicalRecordCreateEdit", { record })}
        >
          <Text style={styles.editBtnText}>✏️ Edit Record</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>🗑 Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#eef4ff", padding: 16 },
  center:       { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#eef4ff" },
  loadingText:  { marginTop: 12, fontSize: 14, color: "#475569" },

  headerCard:   { backgroundColor: "#2563eb", borderRadius: 20, padding: 20, marginBottom: 16 },
  badge:        { backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginBottom: 12 },
  badgeText:    { color: "#fff", fontSize: 12, fontWeight: "700" },
  diagnosis:    { fontSize: 26, fontWeight: "800", color: "#fff", marginBottom: 8 },
  visitDate:    { fontSize: 14, color: "rgba(255,255,255,0.85)" },

  section:      { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 14, elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b", marginBottom: 12 },

  row:          { flexDirection: "row", gap: 10, marginBottom: 8 },
  halfCard:     { flex: 1, backgroundColor: "#f8fafc", borderRadius: 12, padding: 12 },
  cardLabel:    { fontSize: 12, fontWeight: "700", color: "#64748b", marginBottom: 4 },
  cardValue:    { fontSize: 15, fontWeight: "600", color: "#1e293b" },
  cardSub:      { fontSize: 12, color: "#64748b", marginTop: 2 },

  infoRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8 },
  infoLabel:    { fontSize: 13, color: "#64748b", fontWeight: "600" },
  infoValue:    { fontSize: 13, color: "#1e293b", fontWeight: "500" },

  tagWrap:      { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag:          { backgroundColor: "#dbeafe", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  tagText:      { color: "#1d4ed8", fontSize: 13, fontWeight: "600" },

  bodyText:     { fontSize: 15, color: "#334155", lineHeight: 22 },

  prescCard:    { backgroundColor: "#f0fdf4", borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: "#22c55e" },
  prescName:    { fontSize: 15, fontWeight: "700", color: "#166534", marginBottom: 4 },
  prescDetail:  { fontSize: 13, color: "#4b5563", marginTop: 2 },

  vitalsGrid:   { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  vitalBox:     { backgroundColor: "#fef3c7", borderRadius: 12, padding: 12, minWidth: "45%", flex: 1, alignItems: "center" },
  vitalValue:   { fontSize: 18, fontWeight: "800", color: "#92400e" },
  vitalLabel:   { fontSize: 11, color: "#78350f", marginTop: 4, fontWeight: "600" },

  attachImage:  { width: "100%", height: 220, borderRadius: 12 },
  attachBtn:    { backgroundColor: "#dbeafe", padding: 14, borderRadius: 12, alignItems: "center" },
  attachBtnText: { color: "#1d4ed8", fontWeight: "700", fontSize: 15 },

  actionsRow:   { flexDirection: "row", gap: 12, marginTop: 8 },
  editBtn:      { flex: 1, backgroundColor: "#2563eb", paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  editBtnText:  { color: "#fff", fontWeight: "700", fontSize: 16 },
  deleteBtn:    { flex: 1, backgroundColor: "#fee2e2", paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  deleteBtnText: { color: "#dc2626", fontWeight: "700", fontSize: 16 },
});
