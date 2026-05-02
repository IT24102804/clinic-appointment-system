import React, { useCallback, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, RefreshControl, Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getPatientRecords, deleteMedicalRecord } from "../../services/medicalRecordService";

export default function MedicalRecordListScreen({ navigation }) {
  const [records, setRecords]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName]     = useState("");

  const loadRecords = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // ✅ FIX: Read the real logged-in userId from AsyncStorage (saved during login)
      const patientId = await AsyncStorage.getItem("userId");
      const name      = await AsyncStorage.getItem("userName");
      setUserName(name || "");

      if (!patientId) {
        Alert.alert("Session Error", "Please login again.");
        return;
      }

      const response = await getPatientRecords(patientId);
      setRecords(response?.data || []);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to load medical records");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadRecords(); }, []));

  const handleDelete = (id) => {
    Alert.alert("Delete Record", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await deleteMedicalRecord(id);
            Alert.alert("Success", "Medical record deleted");
            loadRecords();
          } catch (error) {
            Alert.alert("Error", error.message || "Failed to delete");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const patientName = item?.patientId?.name || "Unknown Patient";
    const doctorName  = item?.doctorId?.name  || "No Doctor Assigned";
    const visitDate   = item?.visitDate ? new Date(item.visitDate).toLocaleDateString() : "No Date";

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.85}
        onPress={() => navigation.navigate("MedicalRecordDetail", { recordId: item._id })}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {item.createdBy === "doctor" ? "🩺 Doctor" : "👤 Patient"}
            </Text>
          </View>
          <Text style={styles.dateText}>{visitDate}</Text>
        </View>

        <Text style={styles.cardTitle}>{item.diagnosis || "No Diagnosis"}</Text>

        <View style={styles.infoGroup}>
          <Text style={styles.infoLabel}>Patient</Text>
          <Text style={styles.infoValue}>{patientName}</Text>
        </View>
        <View style={styles.infoGroup}>
          <Text style={styles.infoLabel}>Doctor</Text>
          <Text style={styles.infoValue}>{doctorName}</Text>
        </View>
        {item.treatment ? (
          <View style={styles.infoGroup}>
            <Text style={styles.infoLabel}>Treatment</Text>
            <Text style={styles.infoValue} numberOfLines={2}>{item.treatment}</Text>
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.secondaryButton}
            onPress={() => navigation.navigate("MedicalRecordCreateEdit", { record: item })}
          >
            <Text style={styles.secondaryButtonText}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item._id)}>
            <Text style={styles.deleteButtonText}>🗑 Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading medical records...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.screenTitle}>Medical Records</Text>
        {userName ? <Text style={styles.welcomeText}>Welcome, {userName} 👋</Text> : null}
        <Text style={styles.screenSubtitle}>
          Your complete clinical history — linking patients, doctors & appointments.
        </Text>
        <TouchableOpacity style={styles.primaryButton}
          onPress={() => navigation.navigate("MedicalRecordCreateEdit")}
        >
          <Text style={styles.primaryButtonText}>+ Add New Record</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={records.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadRecords(true)} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No Medical Records Yet</Text>
            <Text style={styles.emptyText}>
              Tap "+ Add New Record" to start building your clinical history.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: "#eef4ff", padding: 16 },
  centerScreen:   { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#eef4ff" },
  loadingText:    { marginTop: 12, fontSize: 14, color: "#475569" },
  headerCard:     { backgroundColor: "#fff", borderRadius: 20, padding: 18, marginBottom: 16, elevation: 3, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6 },
  screenTitle:    { fontSize: 28, fontWeight: "800", color: "#0f172a", marginBottom: 2 },
  welcomeText:    { fontSize: 14, color: "#2563eb", fontWeight: "600", marginBottom: 6 },
  screenSubtitle: { fontSize: 13, lineHeight: 19, color: "#475569", marginBottom: 16 },
  primaryButton:  { backgroundColor: "#2563eb", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  listContent:    { paddingBottom: 24 },
  card:           { backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 14, elevation: 3, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6 },
  cardTopRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  badge:          { backgroundColor: "#dbeafe", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  badgeText:      { color: "#1d4ed8", fontWeight: "700", fontSize: 12 },
  dateText:       { fontSize: 12, color: "#64748b" },
  cardTitle:      { fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 14 },
  infoGroup:      { marginBottom: 10 },
  infoLabel:      { fontSize: 12, fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: 2 },
  infoValue:      { fontSize: 15, color: "#1e293b", fontWeight: "500" },
  actionsRow:     { flexDirection: "row", gap: 10, marginTop: 12 },
  secondaryButton:{ flex: 1, backgroundColor: "#e2e8f0", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  secondaryButtonText: { color: "#0f172a", fontWeight: "700", fontSize: 14 },
  deleteButton:   { flex: 1, backgroundColor: "#fee2e2", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  deleteButtonText: { color: "#dc2626", fontWeight: "700", fontSize: 14 },
  emptyContainer: { flexGrow: 1, justifyContent: "center" },
  emptyBox:       { backgroundColor: "#fff", borderRadius: 18, padding: 24, alignItems: "center" },
  emptyTitle:     { fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 8 },
  emptyText:      { fontSize: 14, color: "#64748b", textAlign: "center", lineHeight: 20 },
});
