import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { AppLogo } from "@/components/ui/app-logo";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { AppColors } from "@/constants/design";
import { createPatientProfile } from "@/services/patients";

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();

  const [nic, setNic] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!token) {
      setError("Missing session token. Please sign in again.");
      return;
    }

    try {
      setBusy(true);
      setError(null);
      await createPatientProfile(String(token), {
        NIC: nic,
        phone,
        addressLine1,
        city,
        dateOfBirth: "2000-01-01",
        gender: "Other",
      } as any);
      router.replace("/(tabs)" as any);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save your profile.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen scroll contentContainerStyle={styles.screen}>
      <View style={styles.logoRow}>
        <AppLogo />
      </View>

      <PageHeader
        eyebrow="Patients"
        title="Complete your profile"
        subtitle="We need a few details to create your patient profile before you can book appointments."
      />

      <View style={styles.form}>
        <Text style={styles.label}>NIC</Text>
        <AppInput value={nic} onChangeText={setNic} placeholder="200012345678" />

        <Text style={styles.label}>Phone</Text>
        <AppInput value={phone} onChangeText={setPhone} placeholder="07XXXXXXXX" keyboardType="phone-pad" />

        <Text style={styles.label}>Address line</Text>
        <AppInput value={addressLine1} onChangeText={setAddressLine1} placeholder="No. 10, Galle Road" />

        <Text style={styles.label}>City</Text>
        <AppInput value={city} onChangeText={setCity} placeholder="Colombo" />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AppButton label="Save profile" busy={busy} onPress={() => void submit()} />
      </View>
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
  form: {
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: AppColors.text,
    marginTop: 6,
  },
  error: {
    color: AppColors.danger,
    fontWeight: "600",
    marginTop: 4,
  },
});
