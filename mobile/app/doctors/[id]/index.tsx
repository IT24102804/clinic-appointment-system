import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Alert, ActivityIndicator, Platform, Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { getDoctor, updateDoctor, getPhotoUrl, computeLiveStatus } from "@/services/doctors";

const TEAL = "#0cb8aa";
const RED = "#ef5350";
const RED_DARK = "#c62828";

export default function DoctorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clearingEmergency, setClearingEmergency] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getDoctor(id);
        setDoctor(data);
      } catch (e: any) {
        alert("Error: " + e.message);
        router.replace("/doctors");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleClearEmergency = async () => {
    const confirmed = Platform.OS === "web"
      ? window.confirm(`Remove emergency contact for Dr. ${doctor?.name}? The doctor record will remain.`)
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            "Remove Emergency Contact",
            `Remove emergency contact for Dr. ${doctor?.name}?\n\nThe doctor record will NOT be deleted.`,
            [
              { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
              { text: "Remove Contact", style: "destructive", onPress: () => resolve(true) },
            ]
          );
        });

    if (!confirmed) return;
    setClearingEmergency(true);
    try {
      const formData = new FormData();
      formData.append("name", doctor.name);
      formData.append("specialization", doctor.specialization);
      formData.append("phone", doctor.phone);
      formData.append("email", doctor.email || "");
      formData.append("experience", String(doctor.experience || 0));
      formData.append("fee", String(doctor.fee || 0));
      formData.append("status", doctor.status || "active");
      formData.append("availability", JSON.stringify(doctor.availability || []));
      formData.append("emergencyContact", "");
      await updateDoctor(id, formData);
      setDoctor({ ...doctor, emergencyContact: "" });
    } catch (e: any) {
      alert("Failed: " + e.message);
    } finally {
      setClearingEmergency(false);
    }
  };

  const callEmergency = (phone: string) => {
    const tel = `tel:${phone}`;
    if (Platform.OS === "web") window.open(tel);
    else {
      Alert.alert("📞 Call Emergency Contact", `Call ${phone}?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Call Now", onPress: () => Linking.openURL(tel) },
      ]);
    }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={TEAL} /></View>;
  if (!doctor) return null;

  const photoUrl = getPhotoUrl(doctor.photo);
  const liveStatus = computeLiveStatus(doctor.availability);
  const hasEmergency = doctor.emergencyContact && doctor.emergencyContact.trim() !== "";

  const joinedDate = new Date(doctor.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/doctors")} activeOpacity={0.7}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.appName}>MediLanka</Text>
          <Text style={styles.headerTitle}>Doctor Profile</Text>
        </View>
        <TouchableOpacity onPress={() => router.push(`/doctors/${id}/edit`)} activeOpacity={0.7}>
          <Text style={styles.editBtn}>✏️ Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{doctor.name?.charAt(0)?.toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.name}>Dr. {doctor.name}</Text>
          <Text style={styles.spec}>{doctor.specialization}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: liveStatus === "active" ? "#e8f5e9" : "#fce4ec" },
          ]}>
            <View style={[styles.statusDot, { backgroundColor: liveStatus === "active" ? "#4caf50" : RED }]} />
            <Text style={[styles.statusText, { color: liveStatus === "active" ? "#2e7d32" : RED_DARK }]}>
              {liveStatus === "active" ? "🟢 Active Now" : "🔴 Inactive Now"}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>📋 Doctor Information</Text>
          <InfoRow emoji="📞" label="Phone" value={doctor.phone} />
          {doctor.email ? <InfoRow emoji="📧" label="Email" value={doctor.email} /> : null}
          {doctor.experience > 0 ? <InfoRow emoji="🏅" label="Experience" value={`${doctor.experience} years`} /> : null}
          {doctor.fee > 0 ? <InfoRow emoji="💰" label="Session Fee" value={`LKR ${doctor.fee}`} /> : null}
          <InfoRow emoji="📅" label="Joined" value={joinedDate} />
        </View>

        {hasEmergency ? (
          <View style={styles.emergencyCard}>
            <View style={styles.emergencyTitleRow}>
              <Text style={styles.emergencyTitle}>🚨 Emergency Contact</Text>
              <View style={styles.emergencyBadge}>
                <Text style={styles.emergencyBadgeText}>URGENT</Text>
              </View>
            </View>
            <Text style={styles.emergencyNote}>
              If the patient is in serious condition, contact this emergency line immediately.
            </Text>
            <Text style={styles.emergencyPhone}>{doctor.emergencyContact}</Text>
            <View style={styles.emergencyActions}>
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => callEmergency(doctor.emergencyContact)}
                activeOpacity={0.8}
              >
                <Text style={styles.callBtnText}>📞 Call Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={handleClearEmergency}
                disabled={clearingEmergency}
                activeOpacity={0.7}
              >
                {clearingEmergency ? (
                  <ActivityIndicator size="small" color={RED} />
                ) : (
                  <Text style={styles.removeBtnText}>✕ Remove</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.noEmergencyCard}>
            <Text style={styles.noEmergencyText}>⚠️ No emergency contact set</Text>
            <Text style={styles.noEmergencyHint}>Edit the doctor to add an emergency contact</Text>
          </View>
        )}

        {doctor.availability?.length > 0 && (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>📅 Availability Schedule</Text>
            {doctor.availability.map((slot: any) => {
              const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
              const todayName = days[new Date().getDay()];
              const isToday = slot.day === todayName;
              return (
                <View key={slot.day} style={[styles.slotRow, isToday && styles.slotRowToday]}>
                  <View style={[styles.dayTag, isToday && { backgroundColor: "#2e7d32" }]}>
                    <Text style={styles.dayTagText}>{slot.day}</Text>
                  </View>
                  <Text style={styles.slotTime}>{slot.startTime} → {slot.endTime}</Text>
                  {isToday && <Text style={styles.todayBadge}>Today</Text>}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function InfoRow({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoEmoji}>{emoji}</Text>
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
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
  profileCard: {
    backgroundColor: "#fff", margin: 16, borderRadius: 20, padding: 24, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: TEAL,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  avatarText: { color: "#fff", fontSize: 38, fontWeight: "700" },
  name: { fontSize: 20, fontWeight: "800", color: "#1a1a2e" },
  spec: { color: "#888", fontSize: 15, marginTop: 4, marginBottom: 12 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: "700" },
  infoCard: {
    backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a2e", marginBottom: 14 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  infoEmoji: { fontSize: 20, width: 28 },
  infoLabel: { fontSize: 11, color: "#888" },
  infoValue: { fontSize: 14, fontWeight: "600", color: "#1a1a2e" },
  emergencyCard: {
    marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16,
    backgroundColor: "#fff3f3", borderWidth: 1.5, borderColor: "#ef9a9a",
    shadowColor: RED, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  emergencyTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  emergencyTitle: { fontSize: 15, fontWeight: "800", color: RED_DARK, flex: 1 },
  emergencyBadge: { backgroundColor: RED, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  emergencyBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  emergencyNote: { fontSize: 12, color: "#b71c1c", lineHeight: 17, marginBottom: 10 },
  emergencyPhone: { fontSize: 20, fontWeight: "800", color: RED_DARK, textAlign: "center", marginBottom: 14 },
  emergencyActions: { flexDirection: "row", gap: 10 },
  callBtn: {
    flex: 2, backgroundColor: RED, borderRadius: 12, padding: 12,
    alignItems: "center", justifyContent: "center",
  },
  callBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  removeBtn: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 12,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#ef9a9a",
  },
  removeBtnText: { color: RED_DARK, fontWeight: "700", fontSize: 13 },
  noEmergencyCard: {
    marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16,
    backgroundColor: "#fff8e1", borderWidth: 1, borderColor: "#ffe082", alignItems: "center",
  },
  noEmergencyText: { fontSize: 14, fontWeight: "700", color: "#f57f17", marginBottom: 4 },
  noEmergencyHint: { fontSize: 12, color: "#f9a825", textAlign: "center" },
  slotRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  slotRowToday: { backgroundColor: "#f1f8e9", borderRadius: 10, padding: 6 },
  dayTag: {
    backgroundColor: TEAL, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4, width: 44, alignItems: "center",
  },
  dayTagText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  slotTime: { color: "#444", fontSize: 14, fontWeight: "500", flex: 1 },
  todayBadge: {
    backgroundColor: "#2e7d32", color: "#fff", fontSize: 10,
    fontWeight: "700", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
});