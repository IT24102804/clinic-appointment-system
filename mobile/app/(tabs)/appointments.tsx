import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { listAppointments } from "@/services/appointments";
import { Appointment, AppointmentStatus, DoctorRef } from "@/types/appointment";

const TEAL = "#0cb8aa";
const RED = "#ef5350";

type TabKey = "upcoming" | "past";
const UPCOMING: AppointmentStatus[] = ["pending", "confirmed"];

function getDoctorName(doc: string | DoctorRef): string {
  if (typeof doc === "object" && doc !== null && "name" in doc) return doc.name;
  return String(doc);
}
function getDoctorSpec(doc: string | DoctorRef): string {
  if (typeof doc === "object" && doc !== null && "specialization" in doc) return doc.specialization;
  return "";
}
function getDoctorFee(doc: string | DoctorRef): number | null {
  if (typeof doc === "object" && doc !== null && "fee" in doc) return doc.fee;
  return null;
}

function formatDate(v?: string) {
  if (!v) return "Not scheduled";
  return new Date(v).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
function formatTime(v?: string) {
  if (!v) return "";
  return new Date(v).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function statusStyle(s?: string) {
  if (s === "confirmed") return { bg: "#e8f5e9", color: "#2e7d32" };
  if (s === "completed") return { bg: "#e0f2f1", color: "#00695c" };
  if (s === "cancelled" || s === "no-show" || s === "rejected") return { bg: "#fce4ec", color: "#c62828" };
  return { bg: "#fff8e1", color: "#f57f17" };
}

export default function AppointmentsScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");
  const [search, setSearch] = useState("");

  const { upcoming, past } = useMemo(() => {
    const up: Appointment[] = [];
    const pa: Appointment[] = [];
    for (const a of appointments) {
      (UPCOMING.includes(a.status) ? up : pa).push(a);
    }
    up.sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
    pa.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
    return { upcoming: up, past: pa };
  }, [appointments]);

  const displayList = activeTab === "upcoming" ? upcoming : past;

  const filtered = useMemo(() => {
    if (!search.trim()) return displayList;
    const q = search.trim().toLowerCase();
    return displayList.filter(
      (a) =>
        a.reason.toLowerCase().includes(q) ||
        getDoctorName(a.doctorId).toLowerCase().includes(q) ||
        getDoctorSpec(a.doctorId).toLowerCase().includes(q)
    );
  }, [displayList, search]);

  const load = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setAppointments(await listAppointments());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.appName}>MediLanka</Text>
          <Text style={styles.headerTitle}>Appointments</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: "#e0f7f5" }]}>
          <Text style={styles.statValue}>{appointments.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#e8f5e9" }]}>
          <Text style={styles.statValue}>{upcoming.length}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: "#fff3e0" }]}>
          <Text style={styles.statValue}>{past.length}</Text>
          <Text style={styles.statLabel}>Past</Text>
        </View>
      </View>

      {/* Tab switcher */}
      <View style={styles.filterRow}>
        {(["upcoming", "past"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, activeTab === tab && styles.filterTabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.filterText, activeTab === tab && styles.filterTextActive]}>
              {tab === "upcoming" ? `Upcoming (${upcoming.length})` : `Past (${past.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search by reason, doctor..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Book button */}
      <View style={styles.bookRow}>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => router.push("/appointments/new")}
          activeOpacity={0.8}
        >
          <Text style={styles.bookBtnText}>+ Book New Appointment</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator color={TEAL} style={{ marginTop: 40 }} size="large" />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyText}>
            {search ? "No matching appointments" : activeTab === "upcoming" ? "No upcoming appointments" : "No past appointments"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={TEAL} />
          }
          renderItem={({ item }) => {
            const fee = getDoctorFee(item.doctorId);
            const ss = statusStyle(item.status);
            return (
              <Pressable onPress={() => router.push({ pathname: "/appointments/[id]", params: { id: item._id } })}>
                <View style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={[styles.statusPill, { backgroundColor: ss.bg }]}>
                      <Text style={[styles.statusPillText, { color: ss.color }]}>
                        {(item.status || "pending").toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.cardTime}>{formatTime(item.appointmentDate)}</Text>
                  </View>
                  <Text style={styles.cardDoctor}>{getDoctorName(item.doctorId)}</Text>
                  {getDoctorSpec(item.doctorId) ? (
                    <Text style={styles.cardSpec}>{getDoctorSpec(item.doctorId)}</Text>
                  ) : null}
                  <Text style={styles.cardDate}>{formatDate(item.appointmentDate)}</Text>
                  <Text style={styles.cardReason}>{item.reason}</Text>
                  {fee !== null && <Text style={styles.cardFee}>LKR {fee}</Text>}
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  header: {
    backgroundColor: TEAL,
    paddingTop: 55,
    paddingBottom: 16,
    alignItems: "center",
  },
  appName: { color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },

  statsRow: { flexDirection: "row", gap: 10, padding: 16, paddingBottom: 0 },
  statCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "800", color: "#1a1a2e" },
  statLabel: { fontSize: 11, color: "#666", fontWeight: "600", marginTop: 2 },

  filterRow: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f0f0f0" },
  filterTabActive: { backgroundColor: TEAL },
  filterText: { color: "#666", fontWeight: "600", fontSize: 13 },
  filterTextActive: { color: "#fff" },

  searchRow: { paddingHorizontal: 16, paddingTop: 12 },
  searchInput: { backgroundColor: "#fff", borderRadius: 12, padding: 12, fontSize: 14, color: "#333", borderWidth: 1, borderColor: "#eee" },

  bookRow: { paddingHorizontal: 16, paddingTop: 12 },
  bookBtn: { backgroundColor: TEAL, borderRadius: 14, padding: 14, alignItems: "center" },
  bookBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  empty: { alignItems: "center", padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: "#aaa", fontSize: 16 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 10, fontWeight: "800" },
  cardTime: { fontSize: 13, fontWeight: "700", color: TEAL },
  cardDoctor: { fontSize: 16, fontWeight: "700", color: "#1a1a2e" },
  cardSpec: { fontSize: 13, color: "#888" },
  cardDate: { fontSize: 12, color: "#888", marginTop: 2 },
  cardReason: { fontSize: 14, color: "#444", marginTop: 2 },
  cardFee: { fontSize: 13, fontWeight: "700", color: TEAL, marginTop: 2 },
});
