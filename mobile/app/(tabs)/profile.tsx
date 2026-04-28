import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppLogo } from "@/components/ui/app-logo";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { PatientProfileCard } from "@/components/patient/patient-profile-card";
import { AppColors } from "@/constants/design";
import { getPatientProfile } from "@/services/patients";
import { getToken } from "@/services/secure-token";
import { PatientProfile } from "@/types/patient";

export default function ProfileScreen() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await getToken();
        if (!token) {
          setError("You are not signed in.");
          setProfile(null);
          return;
        }

        const data = await getPatientProfile(token);
        setProfile(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load profile.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <AppScreen scroll contentContainerStyle={styles.screen}>
      <View style={styles.logoRow}>
        <AppLogo />
      </View>

      <PageHeader eyebrow="Patients" title="My profile" subtitle="View the patient profile stored in the clinic system." />

      {loading ? <Text style={styles.muted}>Loading profile...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {profile ? (
        <View style={styles.stack}>
          <PatientProfileCard label="NIC" value={profile.NIC} />
          <PatientProfileCard label="Phone" value={profile.phone} />
          <PatientProfileCard
            label="Address"
            value={`${profile.address.addressLine1}, ${profile.address.city}`}
          />
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
  },
  logoRow: {
    alignItems: "center",
    marginTop: 4,
  },
  stack: {
    gap: 12,
  },
  muted: {
    color: AppColors.textMuted,
  },
  error: {
    color: AppColors.danger,
    fontWeight: "600",
  },
});
