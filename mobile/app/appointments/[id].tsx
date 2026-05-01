import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import {
  getAppointment,
  updateAppointmentStatus,
  deleteAppointment,
} from "@/services/appointments";
import { Appointment, DoctorRef } from "@/types/appointment";

const TEAL = "#0cb8aa";
const RED = "#ef5350";
const RED_DARK = "#c62828";

function getDoctorField(doc: string | DoctorRef, field: keyof DoctorRef) {
  if (typeof doc === "object" && doc !== null && field in doc)
    return (doc as any)[field];
  return null;
}

function formatDate(v?: string) {
  if (!v) return "N/A";
  return new Date(v).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
function formatTime(v?: string) {
  if (!v) return "";
  return new Date(v).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusStyle(s?: string) {
  if (s === "confirmed") return { bg: "#e8f5e9", color: "#2e7d32", label: "CONFIRMED" };
  if (s === "completed") return { bg: "#e0f2f1", color: "#00695c", label: "COMPLETED" };
  if (s === "cancelled") return { bg: "#fce4ec", color: "#c62828", label: "CANCELLED" };
  if (s === "rejected") return { bg: "#fce4ec", color: "#c62828", label: "REJECTED" };
  if (s === "no-show") return { bg: "#fff3e0", color: "#e65100", label: "NO-SHOW" };
  return { bg: "#fff8e1", color: "#f57f17", label: "PENDING" };
}

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAppointment(id);
      setAppointment(data);
    } catch (e: any) {
      Alert.alert("Error", e.message);
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  async function handleStatusChange(newStatus: string) {
    const confirmed =
      Platform.OS === "web"
        ? window.confirm(`Change status to "${newStatus}"?`)
        : await new Promise<boolean>((resolve) =>
            Alert.alert("Confirm", `Change status to "${newStatus}"?`, [
              { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
              { text: "Yes", onPress: () => resolve(true) },
            ])
          );
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await updateAppointmentStatus(id, newStatus as any);
      await load();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    const confirmed =
      Platform.OS === "web"
        ? window.confirm("Delete this appointment permanently?")
        : await new Promise<boolean>((resolve) =>
            Alert.alert("Delete", "Delete this appointment permanently?", [
              { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
              { text: "Delete", style: "destructive", onPress: () => resolve(true) },
            ])
          );
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await deleteAppointment(id);
      router.replace("/(tabs)/appointments");
    } catch (e: any) {
      Alert.alert("Error", e.message);
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={TEAL} />
      </View>
    );
  }
  if (!appointment) return null;

  const ss = statusStyle(appointment.status);
  const doctorName = getDoctorField(appointment.doctorId, "name");
  const doctorSpec = getDoctorField(appointment.doctorId, "specialization");
  const doctorFee = getDoctorField(appointment.doctorId, "fee");
  const doctorExp = getDoctorField(appointment.doctorId, "experience");
  const canModify = ["pending", "confirmed"].includes(appointment.status);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/appointments")}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.appName}>MediLanka</Text>
          <Text style={styles.headerTitle}>Appointment Details</Text>
        </View>
        {canModify ? (
          <TouchableOpacity onPress={() => router.push({ pathname: "/appointments/[id]/edit", params: { id } })}>
            <Text style={styles.editBtn}>✏️ Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusPill, { backgroundColor: ss.bg }]}>
            <Text style={[styles.statusPillText, { color: ss.color }]}>{ss.label}</Text>
          </View>
          <Text style={styles.statusDate}>{formatDate(appointment.appointmentDate)}</Text>
          <Text style={styles.statusTime}>{formatTime(appointment.appointmentDate)}</Text>
        </View>

        {/* Doctor info */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>🩺 Doctor Information</Text>
          {doctorName && <InfoRow emoji="👨‍⚕️" label="Doctor" value={`Dr. ${doctorName}`} />}
          {doctorSpec && <InfoRow emoji="🏥" label="Specialization" value={doctorSpec} />}
          {doctorExp && <InfoRow emoji="🏅" label="Experience" value={`${doctorExp} years`} />}
          {doctorFee && <InfoRow emoji="💰" label="Session Fee" value={`LKR ${doctorFee}`} highlight />}
        </View>

        {/* Visit info */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>📋 Visit Information</Text>
          <InfoRow emoji="📝" label="Reason" value={appointment.reason} />
          {appointment.notes && <InfoRow emoji="📄" label="Notes" value={appointment.notes} />}
          <InfoRow emoji="🆔" label="Patient ID" value={typeof appointment.patientId === "string" ? appointment.patientId : "—"} />
          <InfoRow emoji="📅" label="Created" value={formatDate(appointment.createdAt)} />
        </View>

        {/* Actions */}
        {canModify && (
          <View style={styles.actionsCard}>
            <Text style={styles.cardTitle}>⚡ Quick Actions</Text>
            {actionLoading ? (
              <ActivityIndicator color={TEAL} />
            ) : (
              <View style={styles.actionsGrid}>
                {appointment.status === "pending" && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#e8f5e9" }]} onPress={() => handleStatusChange("confirmed")}>
                    <Text style={[styles.actionBtnText, { color: "#2e7d32" }]}>✅ Confirm</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#e0f2f1" }]} onPress={() => handleStatusChange("completed")}>
                  <Text style={[styles.actionBtnText, { color: "#00695c" }]}>✔ Complete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#fff3e0" }]} onPress={() => handleStatusChange("cancelled")}>
                  <Text style={[styles.actionBtnText, { color: "#e65100" }]}>✕ Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#fce4ec" }]} onPress={handleDelete}>
                  <Text style={[styles.actionBtnText, { color: RED_DARK }]}>🗑 Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function InfoRow({ emoji, label, value, highlight }: { emoji: string; label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoEmoji}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, highlight && { color: TEAL }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    backgroundColor: TEAL, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingTop: 55, paddingBottom: 16, paddingHorizontal: 16,
  },
  back: { color: "#fff", fontSize: 15, fontWeight: "600" },
  appName: { color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  editBtn: {
    color: "#fff", fontWeight: "700", fontSize: 13,
    backgroundColor: "rgba(255,255,255,0.25)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
  },

  statusCard: {
    backgroundColor: "#fff", margin: 16, borderRadius: 20, padding: 24, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, elevation: 3, gap: 8,
  },
  statusPill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  statusPillText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  statusDate: { fontSize: 18, fontWeight: "800", color: "#1a1a2e" },
  statusTime: { fontSize: 22, fontWeight: "800", color: TEAL },

  infoCard: {
    backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a2e", marginBottom: 14 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  infoEmoji: { fontSize: 18, width: 28, marginTop: 2 },
  infoLabel: { fontSize: 11, color: "#888" },
  infoValue: { fontSize: 14, fontWeight: "600", color: "#1a1a2e" },

  actionsCard: {
    backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionBtn: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, minWidth: "45%" },
  actionBtnText: { fontSize: 14, fontWeight: "700", textAlign: "center" },
});
