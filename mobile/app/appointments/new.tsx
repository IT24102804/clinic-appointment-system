import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { createAppointment, getAvailableSlots } from "@/services/appointments";
import { listDoctors, Doctor } from "@/services/doctors";

const TEAL = "#0cb8aa";
type Step = "doctor" | "datetime" | "details" | "confirm";

function formatSlotTime(slot: string): string {
  const [h, m] = slot.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

function getNextSevenDays() {
  const days: { label: string; value: string; short: string }[] = [];
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    const month = d.toLocaleString("default", { month: "short" });
    days.push({ label: `${names[d.getDay()]}, ${month} ${d.getDate()}`, value: iso, short: names[d.getDay()] });
  }
  return days;
}

function generateTestObjectId() {
  const hex = "0123456789abcdef";
  let id = "";
  for (let i = 0; i < 24; i++) id += hex[Math.floor(Math.random() * 16)];
  return id;
}

export default function NewAppointmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ doctorId?: string }>();

  const [step, setStep] = useState<Step>("doctor");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [patientId, setPatientId] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const dateOptions = useMemo(() => getNextSevenDays(), []);

  useEffect(() => {
    (async () => {
      try {
        const data = await listDoctors();
        setDoctors(data || []);
        if (params.doctorId) {
          const found = (data || []).find((d: Doctor) => d._id === params.doctorId);
          if (found) { setSelectedDoctor(found); setStep("datetime"); }
        }
      } catch (e) { console.error(e); }
      finally { setDoctorsLoading(false); }
    })();
  }, []);

  const filteredDoctors = useMemo(() => {
    if (!doctorSearch.trim()) return doctors;
    const q = doctorSearch.toLowerCase();
    return doctors.filter(
      (d) => d.name.toLowerCase().includes(q) || d.specialization.toLowerCase().includes(q)
    );
  }, [doctors, doctorSearch]);

  const loadSlots = useCallback(async (date: string) => {
    if (!selectedDoctor) return;
    setSlotsLoading(true); setSlotsError(null); setSelectedSlot(null);
    try {
      const result = await getAvailableSlots(selectedDoctor._id, date);
      setAvailableSlots(result.availableSlots);
      if (result.availableSlots.length === 0)
        setSlotsError(`No slots on ${result.dayName}. Doctor may not be available.`);
    } catch (err: any) {
      setSlotsError(err.message || "Unable to load slots.");
      setAvailableSlots([]);
    } finally { setSlotsLoading(false); }
  }, [selectedDoctor]);

  function handleDateSelect(date: string) {
    setSelectedDate(date);
    void loadSlots(date);
  }

  async function handleSubmit() {
    if (!selectedDoctor || !selectedDate || !selectedSlot || !patientId.trim() || !reason.trim()) {
      Alert.alert("Missing fields", "Please complete all required fields.");
      return;
    }
    if (!/^[0-9a-fA-F]{24}$/.test(patientId.trim())) {
      Alert.alert("Invalid Patient ID", "Use the 'Generate Test ID' button if testing.");
      return;
    }
    const appointmentDate = new Date(`${selectedDate}T${selectedSlot}:00`).toISOString();
    setSubmitting(true);
    try {
      await createAppointment({ patientId: patientId.trim(), doctorId: selectedDoctor._id, appointmentDate, reason: reason.trim(), notes: notes.trim() || undefined });
      Alert.alert("Booked!", "Your appointment has been booked successfully.");
      router.replace("/(tabs)/appointments");
    } catch (err: any) {
      Alert.alert("Booking failed", err.message || "Unable to book.");
    } finally { setSubmitting(false); }
  }

  const stepIndex = ["doctor", "datetime", "details", "confirm"].indexOf(step);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (step === "doctor") router.back();
          else { const prev: Step[] = ["doctor", "datetime", "details", "confirm"]; setStep(prev[stepIndex - 1]); }
        }}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.appName}>MediLanka</Text>
          <Text style={styles.headerTitle}>Book Appointment</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        {["Doctor", "Date/Time", "Details", "Confirm"].map((label, i) => (
          <View key={label} style={styles.progressItem}>
            <View style={[styles.progressDot, i <= stepIndex && styles.progressDotActive]} />
            <Text style={[styles.progressLabel, i <= stepIndex && styles.progressLabelActive]}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Step 1: Doctor Selection */}
      {step === "doctor" && (
        <View style={{ flex: 1 }}>
          <View style={styles.searchRow}>
            <TextInput style={styles.searchInput} placeholder="🔍 Search doctor..." placeholderTextColor="#aaa" value={doctorSearch} onChangeText={setDoctorSearch} />
          </View>
          {doctorsLoading ? (
            <ActivityIndicator color={TEAL} style={{ marginTop: 40 }} size="large" />
          ) : filteredDoctors.length === 0 ? (
            <View style={styles.emptyState}><Text style={styles.emptyEmoji}>🩺</Text><Text style={styles.emptyText}>No doctors found</Text></View>
          ) : (
            <FlatList data={filteredDoctors} keyExtractor={(d) => d._id} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
              renderItem={({ item }) => {
                const isSelected = selectedDoctor?._id === item._id;
                return (
                  <TouchableOpacity style={[styles.doctorCard, isSelected && styles.doctorCardSelected]} onPress={() => { setSelectedDoctor(item); setStep("datetime"); }} activeOpacity={0.7}>
                    <View style={styles.doctorAvatar}><Text style={styles.doctorAvatarText}>{item.name.charAt(0).toUpperCase()}</Text></View>
                    <View style={styles.doctorInfo}>
                      <Text style={styles.doctorName}>Dr. {item.name}</Text>
                      <Text style={styles.doctorSpec}>{item.specialization}</Text>
                      <View style={styles.doctorMeta}>
                        <Text style={styles.doctorMetaText}>🏅 {item.experience} yrs</Text>
                        <Text style={styles.doctorMetaText}>💰 LKR {item.fee}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      )}

      {/* Step 2: Date & Time */}
      {step === "datetime" && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.stepContent}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
            {dateOptions.map((opt) => {
              const isActive = selectedDate === opt.value;
              return (
                <TouchableOpacity key={opt.value} onPress={() => handleDateSelect(opt.value)} style={[styles.dateChip, isActive && styles.dateChipActive]}>
                  <Text style={[styles.dateChipText, isActive && styles.dateChipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {selectedDate && (
            <>
              <Text style={styles.sectionTitle}>Available Slots</Text>
              {slotsLoading ? (
                <View style={styles.slotsLoading}><ActivityIndicator color={TEAL} /><Text style={styles.slotsLoadingText}>Checking availability...</Text></View>
              ) : slotsError ? (
                <View style={styles.errorCard}><Text style={styles.errorText}>{slotsError}</Text></View>
              ) : (
                <View style={styles.slotsGrid}>
                  {availableSlots.map((slot) => {
                    const isActive = selectedSlot === slot;
                    return (
                      <TouchableOpacity key={slot} onPress={() => setSelectedSlot(slot)} style={[styles.slotChip, isActive && styles.slotChipActive]}>
                        <Text style={[styles.slotChipText, isActive && styles.slotChipTextActive]}>{formatSlotTime(slot)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          )}

          <View style={styles.navRow}>
            <TouchableOpacity style={styles.navBtnSecondary} onPress={() => setStep("doctor")}><Text style={styles.navBtnSecondaryText}>← Back</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.navBtn, (!selectedDate || !selectedSlot) && styles.navBtnDisabled]} onPress={() => setStep("details")} disabled={!selectedDate || !selectedSlot}>
              <Text style={styles.navBtnText}>Continue →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Step 3: Details */}
      {step === "details" && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.stepContent}>
          <Text style={styles.sectionTitle}>Patient ID</Text>
          <TextInput style={styles.input} placeholder="24-character MongoDB ObjectId" value={patientId} onChangeText={setPatientId} autoCapitalize="none" placeholderTextColor="#bbb" />
          <TouchableOpacity style={styles.testIdBtn} onPress={() => setPatientId(generateTestObjectId())}>
            <Text style={styles.testIdBtnText}>🔑 Generate Test Patient ID</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Reason for Visit *</Text>
          <TextInput style={styles.input} placeholder="e.g. Routine checkup" value={reason} onChangeText={setReason} placeholderTextColor="#bbb" />

          <Text style={styles.sectionTitle}>Notes (optional)</Text>
          <TextInput style={[styles.input, { height: 80, textAlignVertical: "top" }]} placeholder="Additional notes..." value={notes} onChangeText={setNotes} multiline placeholderTextColor="#bbb" />

          <View style={styles.navRow}>
            <TouchableOpacity style={styles.navBtnSecondary} onPress={() => setStep("datetime")}><Text style={styles.navBtnSecondaryText}>← Back</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.navBtn, (!patientId.trim() || !reason.trim()) && styles.navBtnDisabled]} onPress={() => setStep("confirm")} disabled={!patientId.trim() || !reason.trim()}>
              <Text style={styles.navBtnText}>Review →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Step 4: Confirm */}
      {step === "confirm" && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.stepContent}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>📋 Booking Summary</Text>

            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Doctor</Text><Text style={styles.summaryValue}>Dr. {selectedDoctor?.name}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Specialization</Text><Text style={styles.summaryValue}>{selectedDoctor?.specialization}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Date</Text><Text style={styles.summaryValue}>{selectedDate}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Time</Text><Text style={styles.summaryValue}>{selectedSlot ? formatSlotTime(selectedSlot) : ""}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Session Fee</Text><Text style={[styles.summaryValue, { color: TEAL }]}>LKR {selectedDoctor?.fee}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Reason</Text><Text style={styles.summaryValue}>{reason}</Text></View>
            {notes ? <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Notes</Text><Text style={styles.summaryValue}>{notes}</Text></View> : null}
          </View>

          <TouchableOpacity style={[styles.confirmBtn, submitting && { opacity: 0.7 }]} onPress={() => void handleSubmit()} disabled={submitting} activeOpacity={0.8}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>✅ Confirm & Book</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBtnSecondary} onPress={() => setStep("details")}>
            <Text style={styles.navBtnSecondaryText}>← Edit Details</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  header: { backgroundColor: TEAL, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 55, paddingBottom: 16, paddingHorizontal: 16 },
  back: { color: "#fff", fontSize: 15, fontWeight: "600" },
  appName: { color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },

  progressRow: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  progressItem: { alignItems: "center", gap: 4 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#ddd" },
  progressDotActive: { backgroundColor: TEAL },
  progressLabel: { fontSize: 10, color: "#aaa", fontWeight: "600" },
  progressLabelActive: { color: TEAL },

  searchRow: { padding: 12, backgroundColor: "#fff" },
  searchInput: { backgroundColor: "#f0f0f0", borderRadius: 12, padding: 12, fontSize: 14, color: "#333" },
  stepContent: { padding: 16, gap: 14, paddingBottom: 40 },

  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a2e" },

  doctorCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  doctorCardSelected: { borderWidth: 2, borderColor: TEAL },
  doctorAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: TEAL, alignItems: "center", justifyContent: "center" },
  doctorAvatarText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  doctorInfo: { flex: 1, marginLeft: 12, gap: 2 },
  doctorName: { fontWeight: "700", fontSize: 15, color: "#1a1a2e" },
  doctorSpec: { color: "#888", fontSize: 13 },
  doctorMeta: { flexDirection: "row", gap: 12, marginTop: 4 },
  doctorMetaText: { fontSize: 12, color: "#666" },

  dateRow: { gap: 10, paddingVertical: 4 },
  dateChip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, backgroundColor: "#fff", borderWidth: 1, borderColor: "#eee" },
  dateChipActive: { backgroundColor: TEAL, borderColor: TEAL },
  dateChipText: { fontSize: 13, fontWeight: "700", color: "#333" },
  dateChipTextActive: { color: "#fff" },

  slotsLoading: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  slotsLoadingText: { fontSize: 14, color: "#888" },
  errorCard: { backgroundColor: "#fce4ec", borderRadius: 12, padding: 14 },
  errorText: { fontSize: 13, color: "#c62828", lineHeight: 20 },
  slotsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  slotChip: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, backgroundColor: "#fff", borderWidth: 1, borderColor: "#eee" },
  slotChipActive: { backgroundColor: TEAL, borderColor: TEAL },
  slotChipText: { fontSize: 14, fontWeight: "700", color: "#333" },
  slotChipTextActive: { color: "#fff" },

  input: { backgroundColor: "#fff", borderRadius: 12, padding: 14, fontSize: 15, color: "#1a1a2e", borderWidth: 1, borderColor: "#eee" },
  testIdBtn: { backgroundColor: "#e0f7f5", borderRadius: 12, padding: 12, alignItems: "center" },
  testIdBtnText: { color: TEAL, fontSize: 13, fontWeight: "700" },

  navRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  navBtn: { flex: 1, backgroundColor: TEAL, borderRadius: 14, padding: 14, alignItems: "center" },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  navBtnSecondary: { flex: 1, backgroundColor: "#f0f0f0", borderRadius: 14, padding: 14, alignItems: "center" },
  navBtnSecondaryText: { color: "#666", fontSize: 15, fontWeight: "700" },

  summaryCard: { backgroundColor: "#fff", borderRadius: 16, padding: 18, gap: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  summaryTitle: { fontSize: 16, fontWeight: "800", color: "#1a1a2e", marginBottom: 4 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 13, color: "#888" },
  summaryValue: { fontSize: 14, fontWeight: "700", color: "#1a1a2e", maxWidth: "60%", textAlign: "right" },

  confirmBtn: { backgroundColor: TEAL, borderRadius: 14, padding: 16, alignItems: "center", shadowColor: TEAL, shadowOpacity: 0.35, shadowRadius: 10, elevation: 4 },
  confirmBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },

  emptyState: { alignItems: "center", padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: "#aaa", fontSize: 16 },
});
