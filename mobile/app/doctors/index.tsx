import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, Image, RefreshControl, ActivityIndicator, Platform, Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { listDoctors, updateDoctor, getPhotoUrl, computeLiveStatus } from "@/services/doctors";

const TEAL = "#0cb8aa";
const RED = "#ef5350";
const RED_DARK = "#c62828";

export default function DoctorsListScreen() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clearingEmergencyId, setClearingEmergencyId] = useState<string | null>(null);

  const fetchDoctors = async () => {
    try {
      const data = await listDoctors();
      const list = data || [];
      setDoctors(list);
      applyFilter(list, search, statusFilter);
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, []);

  useEffect(() => {
    const interval = setInterval(() => { setDoctors((prev) => [...prev]); }, 60000);
    return () => clearInterval(interval);
  }, []);

  const applyFilter = (list: any[], q: string, status: string) => {
    let result = list;
    if (q) result = result.filter((d) =>
      d.name.toLowerCase().includes(q.toLowerCase()) ||
      d.specialization.toLowerCase().includes(q.toLowerCase())
    );
    if (status !== "all") result = result.filter((d) => computeLiveStatus(d.availability) === status);
    setFiltered(result);
  };

  const onSearch = (text: string) => { setSearch(text); applyFilter(doctors, text, statusFilter); };
  const onFilter = (s: "all" | "active" | "inactive") => { setStatusFilter(s); applyFilter(doctors, search, s); };

  const handleClearEmergency = async (id: string, name: string) => {
    const confirmed = Platform.OS === "web"
      ? window.confirm(`Remove emergency contact for Dr. ${name}?`)
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            "Remove Emergency Contact",
            `Remove emergency contact for Dr. ${name}? This will not delete the doctor.`,
            [
              { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
              { text: "Remove", style: "destructive", onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmed) return;
    setClearingEmergencyId(id);
    try {
      const doc = doctors.find((d) => d._id === id);
      if (!doc) return;
      const formData = new FormData();
      formData.append("name", doc.name);
      formData.append("specialization", doc.specialization);
      formData.append("phone", doc.phone);
      formData.append("email", doc.email || "");
      formData.append("experience", String(doc.experience || 0));
      formData.append("fee", String(doc.fee || 0));
      formData.append("status", doc.status || "active");
      formData.append("availability", JSON.stringify(doc.availability || []));
      formData.append("emergencyContact", "");
      await updateDoctor(id, formData);
      const updated = doctors.map((d) => d._id === id ? { ...d, emergencyContact: "" } : d);
      setDoctors(updated);
      applyFilter(updated, search, statusFilter);
    } catch (e: any) {
      alert("Failed to remove emergency contact: " + e.message);
    } finally {
      setClearingEmergencyId(null);
    }
  };

  const callEmergency = (phone: string) => {
    const tel = `tel:${phone}`;
    if (Platform.OS === "web") window.open(tel);
    else Linking.openURL(tel);
  };

  const renderItem = ({ item }: { item: any }) => {
    const photoUrl = getPhotoUrl(item.photo);
    const liveStatus = computeLiveStatus(item.availability);
    const hasEmergency = item.emergencyContact && item.emergencyContact.trim() !== "";
    const isClearing = clearingEmergencyId === item._id;

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => router.push(`/doctors/${item._id}`)}
          activeOpacity={0.7}
        >
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.info}>
            <Text style={styles.name}>Dr. {item.name}</Text>
            <Text style={styles.spec}>{item.specialization}</Text>
            <Text style={styles.phone}>📞 {item.phone}</Text>
            {item.fee > 0 && <Text style={styles.fee}>LKR {item.fee}</Text>}
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: liveStatus === "active" ? "#e8f5e9" : "#fce4ec" },
          ]}>
            <View style={[styles.statusDot, { backgroundColor: liveStatus === "active" ? "#4caf50" : RED }]} />
            <Text style={[styles.statusText, { color: liveStatus === "active" ? "#2e7d32" : RED_DARK }]}>
              {liveStatus === "active" ? "Active" : "Inactive"}
            </Text>
          </View>
        </TouchableOpacity>

        {hasEmergency && (
          <View style={styles.emergencyStrip}>
            <Text style={styles.emergencyLabel}>🚨 Emergency</Text>
            <TouchableOpacity onPress={() => callEmergency(item.emergencyContact)} activeOpacity={0.7}>
              <Text style={styles.emergencyPhone}>{item.emergencyContact}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.clearEmergencyBtn}
              onPress={() => handleClearEmergency(item._id, item.name)}
              disabled={isClearing}
              activeOpacity={0.7}
            >
              {isClearing ? (
                <ActivityIndicator size="small" color={RED} />
              ) : (
                <Text style={styles.clearEmergencyText}>✕ Remove</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push(`/doctors/${item._id}/edit`)}
            activeOpacity={0.7}
          >
            <Text style={styles.editBtnText}>✏️ Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)")} activeOpacity={0.7}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.appName}>MediLanka</Text>
          <Text style={styles.headerTitle}>Doctors</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/doctors/new")} activeOpacity={0.7}>
          <Text style={styles.addBtn}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search name or specialization..."
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={onSearch}
        />
      </View>

      <View style={styles.filterRow}>
        {(["all", "active", "inactive"] as const).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterTab, statusFilter === s && styles.filterTabActive]}
            onPress={() => onFilter(s)}
          >
            <Text style={[styles.filterText, statusFilter === s && styles.filterTextActive]}>
              {s === "all" ? "All" : s === "active" ? "Active" : "Inactive"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={TEAL} style={{ marginTop: 40 }} size="large" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchDoctors(); }}
              tintColor={TEAL}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🏥</Text>
              <Text style={styles.emptyText}>No doctors found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  header: {
    backgroundColor: TEAL, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingTop: 55, paddingBottom: 16, paddingHorizontal: 16,
  },
  back: { color: "#fff", fontSize: 15, fontWeight: "600" },
  appName: { color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  addBtn: {
    color: "#fff", fontSize: 14, fontWeight: "700",
    backgroundColor: "rgba(255,255,255,0.25)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
  },
  searchRow: { padding: 12, backgroundColor: "#fff" },
  searchInput: { backgroundColor: "#f0f0f0", borderRadius: 12, padding: 12, fontSize: 14, color: "#333" },
  filterRow: { flexDirection: "row", backgroundColor: "#fff", paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: "#f0f0f0" },
  filterTabActive: { backgroundColor: TEAL },
  filterText: { color: "#666", fontWeight: "600", fontSize: 13 },
  filterTextActive: { color: "#fff" },
  card: {
    backgroundColor: "#fff", borderRadius: 16, marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, overflow: "hidden",
  },
  cardContent: { flexDirection: "row", padding: 14, alignItems: "center" },
  avatar: { width: 58, height: 58, borderRadius: 29 },
  avatarPlaceholder: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: TEAL, alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 22, fontWeight: "700" },
  info: { flex: 1, marginLeft: 12 },
  name: { fontWeight: "700", fontSize: 15, color: "#1a1a2e" },
  spec: { color: "#888", fontSize: 13, marginTop: 2 },
  phone: { color: "#666", fontSize: 12, marginTop: 3 },
  fee: { color: TEAL, fontSize: 13, fontWeight: "600", marginTop: 3 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 11, fontWeight: "600" },
  emergencyStrip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#fff3f3", paddingHorizontal: 14, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: "#ffd0d0",
  },
  emergencyLabel: { fontSize: 11, fontWeight: "700", color: RED_DARK },
  emergencyPhone: { flex: 1, fontSize: 12, fontWeight: "600", color: RED, textDecorationLine: "underline" },
  clearEmergencyBtn: {
    backgroundColor: "#fce4ec", paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: "#ef9a9a",
  },
  clearEmergencyText: { fontSize: 11, fontWeight: "700", color: RED_DARK },
  actions: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  editBtn: { flex: 1, padding: 12, alignItems: "center" },
  editBtnText: { color: "#5c6bc0", fontWeight: "600", fontSize: 14 },
  empty: { alignItems: "center", padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: "#aaa", fontSize: 16 },
});