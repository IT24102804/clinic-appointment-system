import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { listDoctors, computeLiveStatus } from "@/services/doctors";

const TEAL = "#0cb8aa";
const RED = "#ef5350";
const RED_BG = "#fce4ec";
const RED_DARK = "#c62828";

export default function DashboardScreen() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDoctors = async () => {
    try {
      const data = await listDoctors();
      setDoctors(data || []);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchDoctors(); };

  const active = doctors.filter((d) => computeLiveStatus(d.availability) === "active").length;
  const inactive = doctors.filter((d) => computeLiveStatus(d.availability) === "inactive").length;

  const emergencyDoctors = doctors.filter((d) => d.emergencyContact && d.emergencyContact.trim() !== "");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const callEmergency = (phone: string, doctorName: string) => {
    const tel = `tel:${phone}`;
    if (Platform.OS === "web") {
      window.open(tel);
    } else {
      Alert.alert(
        "📞 Call Emergency Contact",
        `Call emergency contact of Dr. ${doctorName}?\n${phone}`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Call Now", style: "default", onPress: () => Linking.openURL(tel) },
        ]
      );
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TEAL} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, Admin 👋</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Total Doctors" value={doctors.length} emoji="👨‍⚕️" bg="#e8faf8" />
        <StatCard label="Active" value={active} emoji="✅" bg="#e8f5e9" />
        <StatCard label="Inactive" value={inactive} emoji="⏸️" bg="#fff3e0" />
      </View>

      {emergencyDoctors.length > 0 && (
        <View style={styles.emergencySection}>
          <View style={styles.emergencyHeader}>
            <Text style={styles.emergencyTitle}>🚨 Emergency Contacts</Text>
            <Text style={styles.emergencySubtitle}>
              If a patient is in serious condition, contact the doctor's emergency line immediately
            </Text>
          </View>
          {emergencyDoctors.map((doc) => (
            <View key={doc._id} style={styles.emergencyCard}>
              <View style={styles.emergencyAvatarWrap}>
                <View style={styles.emergencyAvatar}>
                  <Text style={styles.emergencyAvatarText}>
                    {doc.name?.charAt(0)?.toUpperCase() || "D"}
                  </Text>
                </View>
                <View style={styles.emergencyPulse} />
              </View>
              <View style={styles.emergencyInfo}>
                <Text style={styles.emergencyDrName}>Dr. {doc.name}</Text>
                <Text style={styles.emergencySpec}>{doc.specialization}</Text>
                <Text style={styles.emergencyPhone}>📞 {doc.emergencyContact}</Text>
              </View>
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => callEmergency(doc.emergencyContact, doc.name)}
                activeOpacity={0.8}
              >
                <Text style={styles.callBtnText}>CALL</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <ActionCard emoji="➕" label="Add Doctor" color="#0cb8aa" onPress={() => router.push("/doctors/new")} />
        <ActionCard emoji="📋" label="View All" color="#5c6bc0" onPress={() => router.push("/doctors")} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Doctors</Text>
        <TouchableOpacity onPress={() => router.push("/doctors")}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={TEAL} style={{ marginTop: 20 }} />
      ) : doctors.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No doctors yet. Add your first doctor!</Text>
          <TouchableOpacity style={styles.addFirstBtn} onPress={() => router.push("/doctors/new")}>
            <Text style={styles.addFirstText}>+ Add Doctor</Text>
          </TouchableOpacity>
        </View>
      ) : (
        doctors.slice(0, 5).map((doc) => (
          <TouchableOpacity
            key={doc._id}
            style={styles.doctorRow}
            onPress={() => router.push(`/doctors/${doc._id}`)}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{doc.name?.charAt(0)?.toUpperCase() || "D"}</Text>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>Dr. {doc.name}</Text>
              <Text style={styles.doctorSpec}>{doc.specialization}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: computeLiveStatus(doc.availability) === "active" ? "#e8f5e9" : "#fce4ec" },
            ]}>
              <View style={[
                styles.statusDot,
                { backgroundColor: computeLiveStatus(doc.availability) === "active" ? "#4caf50" : "#ef5350" },
              ]} />
              <Text style={[
                styles.statusText,
                { color: computeLiveStatus(doc.availability) === "active" ? "#2e7d32" : "#c62828" },
              ]}>
                {computeLiveStatus(doc.availability) === "active" ? "Active" : "Inactive"}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function StatCard({ label, value, emoji, bg }: { label: string; value: number; emoji: string; bg: string; }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionCard({ emoji, label, color, onPress }: { emoji: string; label: string; color: string; onPress: () => void; }) {
  return (
    <TouchableOpacity style={[styles.actionCard, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  header: {
    backgroundColor: TEAL, padding: 24, paddingTop: 60, paddingBottom: 30,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  greeting: { fontSize: 22, fontWeight: "700", color: "#fff" },
  date: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 20 },
  statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: "center" },
  statEmoji: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: "800", color: "#1a1a2e" },
  statLabel: { fontSize: 11, color: "#666", marginTop: 2, textAlign: "center" },
  emergencySection: {
    marginHorizontal: 16, marginTop: 20, backgroundColor: RED_BG,
    borderRadius: 20, padding: 14, borderWidth: 1.5, borderColor: "#ef9a9a",
  },
  emergencyHeader: { marginBottom: 12 },
  emergencyTitle: { fontSize: 16, fontWeight: "800", color: RED_DARK, marginBottom: 4 },
  emergencySubtitle: { fontSize: 12, color: "#b71c1c", lineHeight: 17 },
  emergencyCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 12,
    flexDirection: "row", alignItems: "center", marginBottom: 8,
    borderLeftWidth: 4, borderLeftColor: RED,
    shadowColor: RED, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2,
  },
  emergencyAvatarWrap: { position: "relative", marginRight: 12 },
  emergencyAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: RED,
    alignItems: "center", justifyContent: "center",
  },
  emergencyPulse: {
    position: "absolute", width: 50, height: 50, borderRadius: 25,
    borderWidth: 2, borderColor: RED, top: -3, left: -3, opacity: 0.4,
  },
  emergencyAvatarText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  emergencyInfo: { flex: 1 },
  emergencyDrName: { fontWeight: "700", color: "#1a1a2e", fontSize: 14 },
  emergencySpec: { color: "#888", fontSize: 12, marginTop: 1 },
  emergencyPhone: { color: RED_DARK, fontSize: 12, fontWeight: "600", marginTop: 2 },
  callBtn: {
    backgroundColor: RED, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 12, alignItems: "center", justifyContent: "center",
  },
  callBtnText: { color: "#fff", fontWeight: "800", fontSize: 13, letterSpacing: 0.5 },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, marginTop: 24, marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#1a1a2e", paddingHorizontal: 16, marginTop: 24, marginBottom: 10 },
  seeAll: { color: TEAL, fontWeight: "600", fontSize: 13 },
  actionsRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16 },
  actionCard: { flex: 1, borderRadius: 16, padding: 20, alignItems: "center" },
  actionEmoji: { fontSize: 28 },
  actionLabel: { color: "#fff", fontWeight: "700", fontSize: 14, marginTop: 8 },
  emptyCard: { backgroundColor: "#fff", borderRadius: 16, padding: 30, alignItems: "center", marginHorizontal: 16 },
  emptyText: { color: "#888", textAlign: "center", marginBottom: 16 },
  addFirstBtn: { backgroundColor: TEAL, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  addFirstText: { color: "#fff", fontWeight: "700" },
  doctorRow: {
    backgroundColor: "#fff", borderRadius: 14, marginHorizontal: 16, marginBottom: 10,
    padding: 14, flexDirection: "row", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: TEAL, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  doctorInfo: { flex: 1, marginLeft: 12 },
  doctorName: { fontWeight: "700", color: "#1a1a2e", fontSize: 15 },
  doctorSpec: { color: "#888", fontSize: 13, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 4 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, flexDirection: "row", alignItems: "center" },
  statusText: { fontSize: 12, fontWeight: "600" },
});