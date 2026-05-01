import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getAppointment,
  getAvailableSlots,
  rescheduleAppointment,
} from "@/services/appointments";
import { Appointment } from "@/types/appointment";

const TEAL = "#0cb8aa";

function formatSlotTime(slot: string): string {
  const [h, m] = slot.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

function getNextSevenDays() {
  const days: { label: string; value: string }[] = [];
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    const month = d.toLocaleString("default", { month: "short" });
    days.push({ label: `${names[d.getDay()]}, ${month} ${d.getDate()}`, value: iso });
  }
  return days;
}

export default function EditAppointmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [fetching, setFetching] = useState(true);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const dateOptions = useMemo(() => getNextSevenDays(), []);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAppointment(id);
        setAppointment(data);
        setReason(data.reason || "");
        setNotes(data.notes || "");
      } catch (e: any) {
        Alert.alert("Error", e.message);
        router.back();
      } finally {
        setFetching(false);
      }
    })();
  }, [id]);

  const doctorId =
    appointment && typeof appointment.doctorId === "object"
      ? appointment.doctorId._id
      : (appointment?.doctorId as string);

  const loadSlots = useCallback(
    async (date: string) => {
      if (!doctorId) return;
      setSlotsLoading(true);
      setSlotsError(null);
      setSelectedSlot(null);
      try {
        const result = await getAvailableSlots(doctorId, date);
        setAvailableSlots(result.availableSlots);
        if (result.availableSlots.length === 0)
          setSlotsError("No slots available for this day.");
      } catch (err: any) {
        setSlotsError(err.message || "Unable to load slots.");
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    },
    [doctorId]
  );

  function handleDateSelect(date: string) {
    setSelectedDate(date);
    void loadSlots(date);
  }

  async function handleSave() {
    if (!selectedDate || !selectedSlot || !reason.trim()) {
      Alert.alert("Missing fields", "Pick a new date/time and enter a reason.");
      return;
    }
    const newDate = new Date(`${selectedDate}T${selectedSlot}:00`).toISOString();
    setSaving(true);
    try {
      await rescheduleAppointment(id, {
        appointmentDate: newDate,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      });
      Alert.alert("Updated!", "Appointment has been rescheduled.");
      router.replace({ pathname: "/appointments/[id]", params: { id } });
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  }

  if (fetching) {
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
        <TouchableOpacity
          onPress={() =>
            router.replace({ pathname: "/appointments/[id]", params: { id } })
          }
        >
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.appName}>MediLanka</Text>
          <Text style={styles.headerTitle}>Reschedule</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Date selection */}
        <Text style={styles.sectionTitle}>📅 Select New Date</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateRow}
        >
          {dateOptions.map((opt) => {
            const isActive = selectedDate === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => handleDateSelect(opt.value)}
                style={[styles.dateChip, isActive && styles.dateChipActive]}
              >
                <Text
                  style={[
                    styles.dateChipText,
                    isActive && styles.dateChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Slots */}
        {selectedDate && (
          <>
            <Text style={styles.sectionTitle}>🕐 Select Time</Text>
            {slotsLoading ? (
              <View style={styles.slotsLoading}>
                <ActivityIndicator color={TEAL} />
                <Text style={styles.slotsLoadingText}>
                  Checking availability...
                </Text>
              </View>
            ) : slotsError ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{slotsError}</Text>
              </View>
            ) : (
              <View style={styles.slotsGrid}>
                {availableSlots.map((slot) => {
                  const isActive = selectedSlot === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      onPress={() => setSelectedSlot(slot)}
                      style={[
                        styles.slotChip,
                        isActive && styles.slotChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.slotChipText,
                          isActive && styles.slotChipTextActive,
                        ]}
                      >
                        {formatSlotTime(slot)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* Reason */}
        <Text style={styles.sectionTitle}>📝 Reason</Text>
        <TextInput
          style={styles.input}
          value={reason}
          onChangeText={setReason}
          placeholder="Reason for visit"
          placeholderTextColor="#bbb"
        />

        {/* Notes */}
        <Text style={styles.sectionTitle}>📄 Notes (optional)</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: "top" }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional notes..."
          multiline
          placeholderTextColor="#bbb"
        />

        {/* Save */}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            (!selectedDate || !selectedSlot || !reason.trim() || saving) && {
              opacity: 0.5,
            },
          ]}
          onPress={() => void handleSave()}
          disabled={!selectedDate || !selectedSlot || !reason.trim() || saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>💾 Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    backgroundColor: TEAL,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 55,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  back: { color: "#fff", fontSize: 15, fontWeight: "600" },
  appName: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a2e" },
  dateRow: { gap: 10, paddingVertical: 4 },
  dateChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
  },
  dateChipActive: { backgroundColor: TEAL, borderColor: TEAL },
  dateChipText: { fontSize: 13, fontWeight: "700", color: "#333" },
  dateChipTextActive: { color: "#fff" },
  slotsLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  slotsLoadingText: { fontSize: 14, color: "#888" },
  errorCard: { backgroundColor: "#fce4ec", borderRadius: 12, padding: 14 },
  errorText: { fontSize: 13, color: "#c62828", lineHeight: 20 },
  slotsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  slotChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
  },
  slotChipActive: { backgroundColor: TEAL, borderColor: TEAL },
  slotChipText: { fontSize: 14, fontWeight: "700", color: "#333" },
  slotChipTextActive: { color: "#fff" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#eee",
  },
  saveBtn: {
    backgroundColor: TEAL,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: TEAL,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
