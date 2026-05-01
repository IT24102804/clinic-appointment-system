import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { getDoctor, updateDoctor, getPhotoUrl } from "@/services/doctors";
import DoctorForm from "@/components/DoctorForm";

const TEAL = "#0cb8aa";

export default function EditDoctorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [doctor, setDoctor] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getDoctor(id);
        setDoctor(data);
      } catch (e: any) {
        Alert.alert("Error", e.message);
        router.back();
      } finally {
        setFetching(false);
      }
    })();
  }, [id]);

  const handleSubmit = async (formData: FormData) => {
    setSaving(true);
    try {
      await updateDoctor(id, formData);
      router.replace(`/doctors/${id}`);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={TEAL} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace(`/doctors/${id}`)}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: "700", letterSpacing: 1.5 }}>MediLanka</Text>
          <Text style={styles.title}>Edit Doctor</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>
      <DoctorForm
        initialData={{
          name: doctor?.name,
          specialization: doctor?.specialization,
          phone: doctor?.phone,
          email: doctor?.email,
          experience: String(doctor?.experience || ""),
          fee: String(doctor?.fee || ""),
          status: doctor?.status,
          availability: doctor?.availability || [],
          photoUrl: getPhotoUrl(doctor?.photo),
          emergencyContact: doctor?.emergencyContact || "",
        }}
        onSubmit={handleSubmit}
        submitLabel="💾 Save Changes"
        loading={saving}
      />
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
  back: { color: "#fff", fontSize: 16 },
  title: { color: "#fff", fontSize: 18, fontWeight: "700" },
});