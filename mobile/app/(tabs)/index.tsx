import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { listDoctors, computeLiveStatus } from "@/services/doctors";
import { listAppointments } from "@/services/appointments";
import { Appointment } from "@/types/appointment";

const TEAL = "#0cb8aa";

export default function HomeScreen() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const stats = useMemo(() => {
    const active = doctors.filter(
      (d) => computeLiveStatus(d.availability) === "active"
    ).length;
    const upcoming = appointments.filter((a) =>
      ["pending", "confirmed"].includes(a.status)
    ).length;
    const completed = appointments.filter(
      (a) => a.status === "completed"
    ).length;
    return {
      totalDoctors: doctors.length,
      activeDoctors: active,
      inactiveDoctors: doctors.length - active,
      totalAppointments: appointments.length,
      upcoming,
      completed,
    };
  }, [doctors, appointments]);

  const recentDoctors = useMemo(() => doctors.slice(0, 3), [doctors]);

  const loadData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      const [docData, apptData] = await Promise.all([
        listDoctors(),
        listAppointments(),
      ]);
      setDoctors(docData || []);
      setAppointments(apptData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={TEAL} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, Admin 👋</Text>
        <Text style={styles.date}>{today}</Text>
      </View>

      <FlatList
        data={[1]}
        keyExtractor={() => "dashboard"}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadData(true)}
            tintColor={TEAL}
          />
        }
        renderItem={() => (
          <View style={styles.content}>
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: "#e8f5e9" }]}>
                <Text style={styles.statIcon}>🩺</Text>
                <Text style={styles.statValue}>{stats.totalDoctors}</Text>
                <Text style={styles.statLabel}>Total Doctors</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: "#e0f7f5" }]}>
                <Text style={styles.statIcon}>📅</Text>
                <Text style={styles.statValue}>{stats.upcoming}</Text>
                <Text style={styles.statLabel}>Upcoming</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: "#fff3e0" }]}>
                <Text style={styles.statIcon}>✅</Text>
                <Text style={styles.statValue}>{stats.completed}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: TEAL }]}
                onPress={() => router.push("/appointments/new")}
                activeOpacity={0.8}
              >
                <Text style={styles.actionIcon}>+</Text>
                <Text style={styles.actionText}>Book Appointment</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: "#7c4dff" }]}
                onPress={() => router.push("/doctors")}
                activeOpacity={0.8}
              >
                <Text style={styles.actionIcon}>📋</Text>
                <Text style={styles.actionText}>Manage Doctors</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: "#5c6bc0" }]}
                onPress={() => router.push("/(tabs)/appointments")}
                activeOpacity={0.8}
              >
                <Text style={styles.actionIcon}>📅</Text>
                <Text style={styles.actionText}>View Appointments</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: "#26a69a" }]}
                onPress={() => router.push("/doctors/new")}
                activeOpacity={0.8}
              >
                <Text style={styles.actionIcon}>🩺</Text>
                <Text style={styles.actionText}>Add Doctor</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Doctors */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Recent Doctors</Text>
              <TouchableOpacity onPress={() => router.push("/doctors")}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {recentDoctors.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>🏥</Text>
                <Text style={styles.emptyText}>No doctors added yet</Text>
              </View>
            ) : (
              recentDoctors.map((doc) => {
                const liveStatus = computeLiveStatus(doc.availability);
                return (
                  <TouchableOpacity
                    key={doc._id}
                    style={styles.doctorCard}
                    onPress={() => router.push(`/doctors/${doc._id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.doctorAvatar}>
                      <Text style={styles.doctorAvatarText}>
                        {doc.name?.charAt(0)?.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.doctorInfo}>
                      <Text style={styles.doctorName}>Dr. {doc.name}</Text>
                      <Text style={styles.doctorSpec}>
                        {doc.specialization}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            liveStatus === "active" ? "#e8f5e9" : "#fce4ec",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              liveStatus === "active" ? "#4caf50" : "#ef5350",
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              liveStatus === "active" ? "#2e7d32" : "#c62828",
                          },
                        ]}
                      >
                        {liveStatus === "active" ? "Active" : "Inactive"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            <View style={{ height: 30 }} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    backgroundColor: TEAL,
    paddingTop: 55,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  greeting: { color: "#fff", fontSize: 22, fontWeight: "800" },
  date: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 },
  content: { padding: 16, gap: 16 },

  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statIcon: { fontSize: 22 },
  statValue: { fontSize: 24, fontWeight: "800", color: "#1a1a2e" },
  statLabel: { fontSize: 11, color: "#666", fontWeight: "600" },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a2e",
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seeAll: { color: "#ef5350", fontSize: 13, fontWeight: "700" },

  actionsRow: { flexDirection: "row", gap: 12 },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: { fontSize: 24, color: "#fff" },
  actionText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  doctorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: TEAL,
    alignItems: "center",
    justifyContent: "center",
  },
  doctorAvatarText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  doctorInfo: { flex: 1, marginLeft: 12 },
  doctorName: { fontWeight: "700", fontSize: 15, color: "#1a1a2e" },
  doctorSpec: { color: "#888", fontSize: 13, marginTop: 2 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 11, fontWeight: "600" },

  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
  },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { color: "#aaa", fontSize: 14 },
});
