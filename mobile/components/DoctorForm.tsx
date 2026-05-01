import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";

const TEAL = "#0cb8aa";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Slot {
  day: string;
  startTime: string;
  endTime: string;
}

interface Props {
  initialData?: {
    name?: string;
    specialization?: string;
    phone?: string;
    email?: string;
    experience?: string;
    fee?: string;
    status?: string;
    availability?: Slot[];
    photoUrl?: string | null;
    emergencyContact?: string;
  };
  onSubmit: (formData: FormData) => Promise<void>;
  submitLabel: string;
  loading: boolean;
}

export default function DoctorForm({ initialData, onSubmit, submitLabel, loading }: Props) {
  const [name, setName] = useState(initialData?.name || "");
  const [specialization, setSpecialization] = useState(initialData?.specialization || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [experience, setExperience] = useState(String(initialData?.experience || ""));
  const [fee, setFee] = useState(String(initialData?.fee || ""));
  const [status, setStatus] = useState(initialData?.status || "active");
  const [emergencyContact, setEmergencyContact] = useState(initialData?.emergencyContact || "");
  const [availability, setAvailability] = useState<Slot[]>(
    initialData?.availability || []
  );
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(
    initialData?.photoUrl || null
  );

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Please allow photo access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const toggleDay = (day: string) => {
    const exists = availability.find((s) => s.day === day);
    if (exists) {
      setAvailability(availability.filter((s) => s.day !== day));
    } else {
      setAvailability([...availability, { day, startTime: "09:00", endTime: "17:00" }]);
    }
  };

  const updateSlot = (day: string, field: "startTime" | "endTime", value: string) => {
    setAvailability(
      availability.map((s) => (s.day === day ? { ...s, [field]: value } : s))
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert("Error", "Name is required"); return; }
    if (!specialization.trim()) { Alert.alert("Error", "Specialization is required"); return; }
    if (!phone.trim()) { Alert.alert("Error", "Phone is required"); return; }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("specialization", specialization.trim());
    formData.append("phone", phone.trim());
    formData.append("email", email.trim());
    formData.append("experience", experience || "0");
    formData.append("fee", fee || "0");
    formData.append("status", status);
    formData.append("availability", JSON.stringify(availability));
    formData.append("emergencyContact", emergencyContact.trim());

    if (photoUri) {
      const filename = photoUri.split("/").pop() || "photo.jpg";
      const ext = filename.split(".").pop() || "jpg";
      formData.append("photo", {
        uri: photoUri,
        name: filename,
        type: `image/${ext === "jpg" ? "jpeg" : ext}`,
      } as any);
    }

    await onSubmit(formData);
  };

  const displayPhoto = photoUri || existingPhotoUrl;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Photo picker */}
      <View style={styles.photoSection}>
        <TouchableOpacity onPress={pickPhoto} style={styles.photoWrapper}>
          {displayPhoto ? (
            <Image source={{ uri: displayPhoto }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoIcon}>📷</Text>
              <Text style={styles.photoHint}>Add Photo</Text>
            </View>
          )}
          <View style={styles.photoBadge}>
            <Text style={styles.photoBadgeText}>✏️</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Status toggle */}
      <View style={styles.statusRow}>
        <Text style={styles.label}>Status</Text>
        <View style={styles.statusToggle}>
          <Text style={{ color: status === "inactive" ? "#ef5350" : "#aaa", fontWeight: "600" }}>
            Inactive
          </Text>
          <Switch
            value={status === "active"}
            onValueChange={(v) => setStatus(v ? "active" : "inactive")}
            trackColor={{ false: "#fce4ec", true: "#e8f5e9" }}
            thumbColor={status === "active" ? TEAL : "#ef5350"}
          />
          <Text style={{ color: status === "active" ? "#4caf50" : "#aaa", fontWeight: "600" }}>
            Active
          </Text>
        </View>
      </View>

      <FormInput label="Full Name *" value={name} onChangeText={setName} placeholder="e.g. John Smith" />
      <FormInput label="Specialization *" value={specialization} onChangeText={setSpecialization} placeholder="e.g. Cardiologist" />
      <FormInput label="Phone *" value={phone} onChangeText={setPhone} placeholder="07X XXX XXXX" keyboardType="phone-pad" />
      <FormInput label="Email" value={email} onChangeText={setEmail} placeholder="doctor@clinic.com" keyboardType="email-address" />
      <FormInput label="Experience (years)" value={experience} onChangeText={setExperience} placeholder="5" keyboardType="numeric" />
      <FormInput label="Session Fee (LKR )" value={fee} onChangeText={setFee} placeholder="2500" keyboardType="numeric" />
      <FormInput label="Emergency Contact" value={emergencyContact} onChangeText={setEmergencyContact} placeholder="07X XXX XXXX" keyboardType="phone-pad" />

      {/* Availability */}
      <Text style={styles.sectionTitle}>📅 Availability</Text>
      <View style={styles.daysRow}>
        {DAYS.map((day) => {
          const active = availability.some((s) => s.day === day);
          return (
            <TouchableOpacity
              key={day}
              style={[styles.dayBtn, active && styles.dayBtnActive]}
              onPress={() => toggleDay(day)}
            >
              <Text style={[styles.dayText, active && styles.dayTextActive]}>{day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {availability.map((slot) => (
        <View key={slot.day} style={styles.slotRow}>
          <Text style={styles.slotDay}>{slot.day}</Text>
          <TextInput
            style={styles.timeInput}
            value={slot.startTime}
            onChangeText={(v) => updateSlot(slot.day, "startTime", v)}
            placeholder="09:00"
          />
          <Text style={styles.timeSep}>→</Text>
          <TextInput
            style={styles.timeInput}
            value={slot.endTime}
            onChangeText={(v) => updateSlot(slot.day, "endTime", v)}
            placeholder="17:00"
          />
        </View>
      ))}

      <TouchableOpacity
        style={[styles.submitBtn, loading && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>{submitLabel}</Text>
        )}
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#bbb"
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa", padding: 16 },
  photoSection: { alignItems: "center", marginVertical: 20 },
  photoWrapper: { position: "relative" },
  photo: { width: 100, height: 100, borderRadius: 50 },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e0f7f5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: TEAL,
    borderStyle: "dashed",
  },
  photoIcon: { fontSize: 28 },
  photoHint: { color: TEAL, fontSize: 11, marginTop: 4, fontWeight: "600" },
  photoBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: TEAL,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  photoBadgeText: { fontSize: 12 },
  statusRow: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusToggle: { flexDirection: "row", alignItems: "center", gap: 8 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "600", color: "#444", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#eee",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 12,
    marginTop: 8,
  },
  daysRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  dayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  dayBtnActive: { backgroundColor: TEAL },
  dayText: { color: "#666", fontWeight: "600", fontSize: 13 },
  dayTextActive: { color: "#fff" },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  slotDay: { width: 36, fontWeight: "700", color: TEAL, fontSize: 13 },
  timeInput: {
    flex: 1,
    backgroundColor: "#f5f7fa",
    borderRadius: 10,
    padding: 10,
    textAlign: "center",
    fontSize: 14,
    color: "#333",
    borderWidth: 1,
    borderColor: "#eee",
  },
  timeSep: { color: "#888", fontSize: 18 },
  submitBtn: {
    backgroundColor: TEAL,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
    shadowColor: TEAL,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  submitText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});